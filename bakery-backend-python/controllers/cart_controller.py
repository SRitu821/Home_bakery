import logging
from typing import Any, Dict
from fastapi.responses import JSONResponse
import db

logger = logging.getLogger("cart_controller")


def get_or_create_cart_id(user_id: int, db_client=None) -> int:
    client = db_client or db
    res = client.query("SELECT id FROM cart WHERE user_id = $1", [user_id])
    if len(res.rows) == 0:
        res = client.query(
            "INSERT INTO cart (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id RETURNING id",
            [user_id],
        )
    return res.rows[0]["id"]


def get_cart(user_id: int) -> JSONResponse:
    try:
        cart_id = get_or_create_cart_id(user_id)

        items_res = db.query(
            """SELECT ci.id AS item_id, ci.product_id, ci.quantity,
                      p.name, p.price, p.stock,
                      ROUND((ci.quantity * p.price), 2) AS subtotal
               FROM cart_items ci
               JOIN products p ON ci.product_id = p.id
               WHERE ci.cart_id = $1
               ORDER BY ci.id""",
            [cart_id],
        )

        items = items_res.rows
        total_amount = sum(float(item["subtotal"]) for item in items)

        return JSONResponse(
            status_code=200,
            content={
                "cart_id": cart_id,
                "items": items,
                "total_amount": round(total_amount, 2),
            },
        )
    except Exception as err:
        logger.error(f"getCart error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong fetching your cart"})


def add_to_cart(user_id: int, body: Dict[str, Any]) -> JSONResponse:
    product_id = body.get("product_id")
    quantity = body.get("quantity", 1)

    try:
        parsed_product_id = int(product_id)
        parsed_quantity = int(quantity)
        if parsed_quantity <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return JSONResponse(
            status_code=400,
            content={"error": "product_id and a positive quantity integer are required"},
        )

    try:
        product_res = db.query(
            "SELECT id, name, price, stock FROM products WHERE id = $1",
            [parsed_product_id],
        )
        if len(product_res.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Product not found"})

        product = product_res.rows[0]
        if product["stock"] < parsed_quantity:
            return JSONResponse(
                status_code=400,
                content={"error": f"Not enough stock available (Current stock: {product['stock']})"},
            )

        cart_id = get_or_create_cart_id(user_id)

        insert_res = db.query(
            """INSERT INTO cart_items (cart_id, product_id, quantity)
               VALUES ($1, $2, $3)
               ON CONFLICT (cart_id, product_id)
               DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
               RETURNING *""",
            [cart_id, parsed_product_id, parsed_quantity],
        )

        return JSONResponse(
            status_code=201,
            content={
                "message": "Item added to cart",
                "item": insert_res.rows[0],
            },
        )
    except Exception as err:
        logger.error(f"addToCart error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong adding item to cart"})


def update_cart_item(user_id: int, item_id_str: str, body: Dict[str, Any]) -> JSONResponse:
    quantity = body.get("quantity")

    try:
        parsed_item_id = int(item_id_str)
        parsed_quantity = int(quantity)
        if parsed_quantity <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return JSONResponse(
            status_code=400,
            content={"error": "Valid item id and a positive quantity integer are required"},
        )

    try:
        update_res = db.query(
            """UPDATE cart_items ci
               SET quantity = $1
               FROM cart c, products p
               WHERE ci.id = $2
                 AND ci.cart_id = c.id
                 AND c.user_id = $3
                 AND ci.product_id = p.id
               RETURNING ci.id, ci.cart_id, ci.product_id, ci.quantity, p.stock""",
            [parsed_quantity, parsed_item_id, user_id],
        )

        if len(update_res.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Cart item not found"})

        updated_item = update_res.rows[0]
        if updated_item["stock"] < parsed_quantity:
            return JSONResponse(
                status_code=400,
                content={
                    "error": f"Requested quantity exceeds available stock (Current stock: {updated_item['stock']})"
                },
            )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Cart item updated",
                "item": {
                    "id": updated_item["id"],
                    "cart_id": updated_item["cart_id"],
                    "product_id": updated_item["product_id"],
                    "quantity": updated_item["quantity"],
                },
            },
        )
    except Exception as err:
        logger.error(f"updateCartItem error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong updating cart item"})


def remove_cart_item(user_id: int, item_id_str: str) -> JSONResponse:
    try:
        parsed_item_id = int(item_id_str)
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Cart item id must be a number"})

    try:
        delete_res = db.query(
            """DELETE FROM cart_items ci
               USING cart c
               WHERE ci.id = $1
                 AND ci.cart_id = c.id
                 AND c.user_id = $2
               RETURNING ci.id""",
            [parsed_item_id, user_id],
        )

        if len(delete_res.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Cart item not found"})

        return JSONResponse(status_code=200, content={"message": "Item removed from cart", "item_id": parsed_item_id})
    except Exception as err:
        logger.error(f"removeCartItem error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong removing cart item"})
