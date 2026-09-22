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

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("app")

app = FastAPI(
    title="Home Bakery Backend",
    description="A robust, production-ready RESTful backend ordering system built with Python, FastAPI, and PostgreSQL.",
    version="1.0.0",
)


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
