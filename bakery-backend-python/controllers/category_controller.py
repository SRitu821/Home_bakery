import logging
from typing import Any, Dict
from fastapi.responses import JSONResponse
import psycopg.errors
import db

logger = logging.getLogger("category_controller")


def get_categories() -> JSONResponse:
    try:
        result = db.query("SELECT id, name FROM categories ORDER BY name")
        return JSONResponse(status_code=200, content=result.rows)
    except Exception as err:
        logger.error(f"getCategories error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong"})


def create_category(body: Dict[str, Any]) -> JSONResponse:
    name = body.get("name")
    if not name:
        return JSONResponse(status_code=400, content={"error": "Category name is required"})

    try:
        result = db.query(
            "INSERT INTO categories (name) VALUES ($1) RETURNING *",
            [name.strip()],
        )
        return JSONResponse(status_code=201, content=result.rows[0])
    except psycopg.errors.UniqueViolation:
        return JSONResponse(status_code=409, content={"error": "Category already exists"})
    except Exception as err:
        logger.error(f"createCategory error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong"})
