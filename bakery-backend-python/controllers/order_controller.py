import logging
from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse
import db

logger = logging.getLogger("order_controller")

VALID_STATUSES = ["PENDING", "CONFIRMED", "BAKING", "DELIVERED", "CANCELLED"]


def place_order(user_id: int) -> JSONResponse:
    client = db.get_client()

    try:
        # 1. Get user's cart
        cart_res = client.query("SELECT id FROM cart WHERE user_id = $1", [user_id])
        if len(cart_res.rows) == 0:
            client.rollback()
            return JSONResponse(status_code=400, content={"error": "Cart not found. Please add items first."})

        cart_id = cart_res.rows[0]["id"]

        # 2. Fetch cart items and lock product rows for update
        items_res = client.query(
            """SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock
               FROM cart_items ci
               JOIN products p ON ci.product_id = p.id
               WHERE ci.cart_id = $1
               FOR UPDATE OF p""",
            [cart_id],
        )

        items = items_res.rows
        if len(items) == 0:
            client.rollback()
            return JSONResponse(status_code=400, content={"error": "Cannot place order: your cart is empty"})

        # 3. Verify stock for all items
        for item in items:
            if item["stock"] < item["quantity"]:
                client.rollback()
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": f"Insufficient stock for \"{item['name']}\". Available: {item['stock']}, requested: {item['quantity']}"
                    },
                )

        # 4. Calculate total amount
        total_amount = sum(float(item["price"]) * item["quantity"] for item in items)

        # 5. Create order record
        order_res = client.query(
            """INSERT INTO orders (user_id, total_amount, status)
               VALUES ($1, $2, 'PENDING')
               RETURNING id, user_id, total_amount, status, created_at""",
            [user_id, round(total_amount, 2)],
        )
        new_order = order_res.rows[0]

        # 6. Insert order items & reduce stock
        for item in items:
            client.query(
                """INSERT INTO order_items (order_id, product_id, quantity, price)
                   VALUES ($1, $2, $3, $4)""",
                [new_order["id"], item["product_id"], item["quantity"], float(item["price"])],
            )
            client.query(
                """UPDATE products
                   SET stock = stock - $1
                   WHERE id = $2""",
                [item["quantity"], item["product_id"]],
            )

        # 7. Clear cart items
        client.query("DELETE FROM cart_items WHERE cart_id = $1", [cart_id])

        # 8. Commit
        client.commit()

        return JSONResponse(
            status_code=201,
            content={
                "message": "Order placed successfully",
                "order": new_order,
                "items": [
                    {
                        "product_id": item["product_id"],
                        "name": item["name"],
                        "price": float(item["price"]),
                        "quantity": item["quantity"],
                        "subtotal": round(float(item["price"]) * item["quantity"], 2),
                    }
                    for item in items
                ],
            },
        )
    except Exception as err:
        client.rollback()
        logger.error(f"placeOrder transaction error: {err}")
        return JSONResponse(status_code=500, content={"error": "Failed to place order. Transaction was rolled back."})
    finally:
        client.release()


def get_orders(user_id: int, role: str, target_user_id: Optional[str] = None) -> JSONResponse:
    is_admin = role == "ADMIN"

    try:
        if is_admin and target_user_id:
            res = db.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [target_user_id])
        elif is_admin:
            res = db.query("SELECT * FROM orders ORDER BY created_at DESC")
        else:
            res = db.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [user_id])

        return JSONResponse(status_code=200, content=res.rows)
    except Exception as err:
        logger.error(f"getOrders error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong fetching orders"})


def get_order_by_id(user_id: int, role: str, order_id_str: str) -> JSONResponse:
    try:
        order_id = int(order_id_str)
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Order id must be a number"})

    is_admin = role == "ADMIN"

    try:
        if not is_admin:
            order_res = db.query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [order_id, user_id])
        else:
            order_res = db.query("SELECT * FROM orders WHERE id = $1", [order_id])

        if len(order_res.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Order not found"})

        order = order_res.rows[0]

        items_res = db.query(
            """SELECT oi.id, oi.product_id, p.name, oi.quantity, oi.price,
                      ROUND((oi.quantity * oi.price), 2) AS subtotal
               FROM order_items oi
               JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = $1
               ORDER BY oi.id""",
            [order_id],
        )

        return JSONResponse(status_code=200, content={"order": order, "items": items_res.rows})
    except Exception as err:
        logger.error(f"getOrderById error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong fetching order"})


def update_order_status(order_id_str: str, body: Dict[str, Any]) -> JSONResponse:
    try:
        order_id = int(order_id_str)
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Order id must be a number"})

    status = body.get("status")
    if not status or str(status).upper() not in VALID_STATUSES:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"},
        )

    try:
        result = db.query(
            "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
            [str(status).upper(), order_id],
        )

        if len(result.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Order not found"})

        return JSONResponse(
            status_code=200,
            content={"message": "Order status updated successfully", "order": result.rows[0]},
        )
    except Exception as err:
        logger.error(f"updateOrderStatus error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong updating order status"})
