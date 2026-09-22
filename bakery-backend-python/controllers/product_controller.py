import logging
from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse
import psycopg.errors
import db
from config.cache import cache

logger = logging.getLogger("product_controller")


def get_products(
    category: Optional[str] = None,
    min_price: Optional[str] = None,
    max_price: Optional[str] = None,
    search: Optional[str] = None,
) -> JSONResponse:
    query_str = """
        SELECT p.id, p.name, p.price, p.stock, p.description,
               c.id AS category_id, c.name AS category
        FROM products p
        JOIN categories c ON p.category_id = c.id
    """
    conditions = []
    params = []

    if category:
        params.append(f"%{category.strip()}%")
        conditions.append(f"c.name ILIKE ${len(params)}")

    if min_price is not None and min_price != "":
        try:
            min_val = float(min_price)
            if min_val < 0:
                return JSONResponse(status_code=400, content={"error": "minPrice must be a valid positive number"})
            params.append(min_val)
            conditions.append(f"p.price >= ${len(params)}")
        except ValueError:
            return JSONResponse(status_code=400, content={"error": "minPrice must be a valid positive number"})

    if max_price is not None and max_price != "":
        try:
            max_val = float(max_price)
            if max_val < 0:
                return JSONResponse(status_code=400, content={"error": "maxPrice must be a valid positive number"})
            params.append(max_val)
            conditions.append(f"p.price <= ${len(params)}")
        except ValueError:
            return JSONResponse(status_code=400, content={"error": "maxPrice must be a valid positive number"})

    if search:
        params.append(f"%{search.strip()}%")
        conditions.append(f"(p.name ILIKE ${len(params)} OR p.description ILIKE ${len(params)})")

    if conditions:
        query_str += f" WHERE {' AND '.join(conditions)}"

    query_str += " ORDER BY p.id"

    try:
        result = db.query(query_str, params)
        return JSONResponse(status_code=200, content=result.rows)
    except Exception as err:
        logger.error(f"getProducts error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong"})


def get_popular_products() -> JSONResponse:
    cache_key = "popular_products"
    try:
        cached = cache.get(cache_key)
        if cached is not None:
            return JSONResponse(
                status_code=200,
                headers={"X-Cache": "HIT"},
                content={"source": "cache", "data": cached},
            )

        # Cache MISS
        result = db.query("""
            SELECT p.id, p.name, p.price, p.stock, p.description,
                   c.name AS category,
                   COALESCE(SUM(oi.quantity), 0)::int AS units_sold
            FROM products p
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id, c.name
            ORDER BY units_sold DESC, p.id ASC
            LIMIT 10
        """)
        products = result.rows
        cache.set(cache_key, products, 600)

        return JSONResponse(
            status_code=200,
            headers={"X-Cache": "MISS"},
            content={"source": "database", "data": products},
        )
    except Exception as err:
        logger.error(f"getPopularProducts error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong fetching popular products"})


def get_product_by_id(product_id_str: str) -> JSONResponse:
    try:
        prod_id = int(product_id_str)
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Product id must be a number"})

    try:
        result = db.query(
            """SELECT p.id, p.name, p.price, p.stock, p.description,
                      c.id AS category_id, c.name AS category
               FROM products p
               JOIN categories c ON p.category_id = c.id
               WHERE p.id = $1""",
            [prod_id],
        )
        if len(result.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Product not found"})
        return JSONResponse(status_code=200, content=result.rows[0])
    except Exception as err:
        logger.error(f"getProductById error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong"})


def create_product(body: Dict[str, Any]) -> JSONResponse:
    name = body.get("name")
    category_id = body.get("category_id")
    price = body.get("price")
    stock = body.get("stock", 0)
    description = body.get("description")

    if not name or category_id is None or price is None:
        return JSONResponse(status_code=400, content={"error": "name, category_id and price are required"})

    try:
        price_num = float(price)
        stock_num = int(stock)
        if price_num < 0 or stock_num < 0:
            return JSONResponse(status_code=400, content={"error": "Price and stock must not be negative"})
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Price and stock must not be negative"})

    try:
        result = db.query(
            """INSERT INTO products (name, category_id, price, stock, description)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING *""",
            [str(name).strip(), int(category_id), price_num, stock_num, description or None],
        )

        # Invalidate cache
        cache.delete("popular_products")

        return JSONResponse(status_code=201, content=result.rows[0])
    except psycopg.errors.ForeignKeyViolation:
        return JSONResponse(status_code=400, content={"error": "Invalid category_id"})
    except psycopg.errors.CheckViolation:
        return JSONResponse(status_code=400, content={"error": "Price and stock must not be negative"})
    except Exception as err:
        logger.error(f"createProduct error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong"})


def update_product(product_id_str: str, body: Dict[str, Any]) -> JSONResponse:
    try:
        prod_id = int(product_id_str)
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Product id must be a number"})

    name = body.get("name")
    category_id = body.get("category_id")
    price = body.get("price")
    stock = body.get("stock", 0)
    description = body.get("description")

    if not name or category_id is None or price is None:
        return JSONResponse(status_code=400, content={"error": "name, category_id and price are required"})

    try:
        price_num = float(price)
        stock_num = int(stock)
        if price_num < 0 or stock_num < 0:
            return JSONResponse(status_code=400, content={"error": "Price and stock must not be negative"})
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Price and stock must not be negative"})

    try:
        result = db.query(
            """UPDATE products
               SET name = $1, category_id = $2, price = $3, stock = $4, description = $5
               WHERE id = $6
               RETURNING *""",
            [str(name).strip(), int(category_id), price_num, stock_num, description or None, prod_id],
        )

        if len(result.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Product not found"})

        cache.delete("popular_products")

        return JSONResponse(status_code=200, content=result.rows[0])
    except psycopg.errors.ForeignKeyViolation:
        return JSONResponse(status_code=400, content={"error": "Invalid category_id"})
    except psycopg.errors.CheckViolation:
        return JSONResponse(status_code=400, content={"error": "Price and stock must not be negative"})
    except Exception as err:
        logger.error(f"updateProduct error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong"})


def delete_product(product_id_str: str) -> JSONResponse:
    try:
        prod_id = int(product_id_str)
    except (ValueError, TypeError):
        return JSONResponse(status_code=400, content={"error": "Product id must be a number"})

    try:
        result = db.query("DELETE FROM products WHERE id = $1 RETURNING id", [prod_id])

        if len(result.rows) == 0:
            return JSONResponse(status_code=404, content={"error": "Product not found"})

        cache.delete("popular_products")

        return JSONResponse(status_code=200, content={"message": "Product deleted successfully", "id": prod_id})
    except psycopg.errors.ForeignKeyViolation:
        return JSONResponse(
            status_code=409,
            content={"error": "Cannot delete product because it is referenced in past orders or active carts"},
        )
    except Exception as err:
        logger.error(f"deleteProduct error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong"})
