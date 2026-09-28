import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from routes import (
    auth_routes,
    category_routes,
    product_routes,
    cart_routes,
    order_routes,
    analytics_routes,
)
from controllers.product_controller import get_popular_products

import os
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("app")

app = FastAPI(
    title="Home Bakery Backend",
    description="A robust, production-ready RESTful backend ordering system built with Python, FastAPI, and PostgreSQL.",
    version="1.0.0",
)

# Enable CORS for frontend clients (Vercel, localhost, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_db_init():
    try:
        from db.connection import query
        schema_path = os.path.join(os.path.dirname(__file__), "db", "schema.sql")
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            query(schema_sql)
            logger.info("[DB] Database schema initialized or verified.")

        # Verify product count
        count_res = query("SELECT count(*) as count FROM products")
        if count_res and len(count_res) > 0:
            total_products = int(count_res[0].get("count", 0))
            logger.info(f"[DB] Active products count in database: {total_products}")
            if total_products == 0:
                seed_sql = """
                    INSERT INTO products (name, category_id, price, stock, description)
                    SELECT
                        'Product #' || g,
                        c.id,
                        (60 + (g % 890))::numeric(10,2),
                        (10 + (g % 40)),
                        'Artisanal handcrafted bakery selection item #' || g
                    FROM generate_series(1, 250) AS g
                    CROSS JOIN LATERAL (
                        SELECT id FROM categories ORDER BY id OFFSET (g % (SELECT GREATEST(count(*), 1) FROM categories)) LIMIT 1
                    ) c;
                """
                query(seed_sql)
                logger.info("[DB] Successfully seeded 250 products into database.")
    except Exception as e:
        logger.warning(f"[DB] Auto-init schema note: {e}")


# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}


# Mount routers
app.include_router(auth_routes.router, prefix="")
app.include_router(auth_routes.router, prefix="/auth")
app.include_router(category_routes.router, prefix="/categories")
app.include_router(product_routes.router, prefix="/products")
app.add_api_route("/popular", get_popular_products, methods=["GET"])
app.include_router(cart_routes.router, prefix="/cart")
app.include_router(order_routes.router, prefix="/orders")
app.include_router(analytics_routes.router, prefix="/analytics")


# Custom 404 handler matching Express: Route METHOD PATH not found
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=404,
        content={"error": f"Route {request.method} {request.url.path} not found"},
    )


# Exception handler for HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == 404:
        return JSONResponse(
            status_code=404,
            content={"error": f"Route {request.method} {request.url.path} not found"},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail if isinstance(exc.detail, str) else exc.detail},
    )


# Exception handler for request validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid request payload", "details": exc.errors()},
    )


# Centralized error handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )
