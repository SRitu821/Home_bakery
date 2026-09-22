import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import bcrypt
import jwt
from fastapi import HTTPException
from fastapi.responses import JSONResponse
import psycopg.errors
import db

logger = logging.getLogger("auth_controller")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretbakeryjwtkey_change_in_production")


def create_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def register_user(body: Dict[str, Any]) -> JSONResponse:
    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    role = body.get("role", "CUSTOMER")

    if not name or not email or not password:
        return JSONResponse(status_code=400, content={"error": "name, email, and password are required"})

    if not isinstance(password, str) or len(password) < 6:
        return JSONResponse(status_code=400, content={"error": "Password must be at least 6 characters long"})

    assigned_role = str(role).upper()
    if assigned_role not in ["CUSTOMER", "ADMIN"]:
        return JSONResponse(status_code=400, content={"error": "Role must be either CUSTOMER or ADMIN"})

    client = db.get_client()
    try:
        # Hash password
        salt = bcrypt.gensalt(10)
        password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

        # Insert user
        user_res = client.query(
            """INSERT INTO users (name, email, password_hash, role)
               VALUES ($1, $2, $3, $4)
               RETURNING id, name, email, role, created_at""",
            [name.strip(), email.strip().lower(), password_hash, assigned_role],
        )
        new_user = user_res.rows[0]

        # Create corresponding empty cart for the user
        client.query("INSERT INTO cart (user_id) VALUES ($1)", [new_user["id"]])

        client.commit()

        token = create_token(new_user["id"], new_user["email"], new_user["role"])

        return JSONResponse(
            status_code=201,
            content={
                "message": "User registered successfully",
                "user": new_user,
                "token": token,
            },
        )
    except psycopg.errors.UniqueViolation:
        client.rollback()
        return JSONResponse(status_code=409, content={"error": "Email already registered"})
    except Exception as err:
        client.rollback()
        logger.error(f"Registration error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong during registration"})
    finally:
        client.release()


def login_user(body: Dict[str, Any]) -> JSONResponse:
    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return JSONResponse(status_code=400, content={"error": "email and password are required"})

    try:
        res = db.query(
            "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
            [str(email).strip().lower()],
        )

        if len(res.rows) == 0:
            return JSONResponse(status_code=401, content={"error": "Invalid email or password"})

        user = res.rows[0]
        stored_hash = user["password_hash"].encode("utf-8")

        if not bcrypt.checkpw(str(password).encode("utf-8"), stored_hash):
            return JSONResponse(status_code=401, content={"error": "Invalid email or password"})

        token = create_token(user["id"], user["email"], user["role"])

        return JSONResponse(
            status_code=200,
            content={
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"],
                },
            },
        )
    except Exception as err:
        logger.error(f"Login error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong during login"})
