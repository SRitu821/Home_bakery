import os
import jwt
from fastapi import Request, HTTPException, Depends
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "supersecretbakeryjwtkey_change_in_production")


def authenticate(request: Request) -> dict:
    """Extracts and verifies JWT token from Authorization: Bearer <token> header."""
    auth_header = request.headers.get("authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Access token required")

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        request.state.user = decoded
        return decoded
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(*roles: str):
    """Dependency that ensures the authenticated user has one of the allowed roles."""
    def role_checker(user: dict = Depends(authenticate)) -> dict:
        if not user or user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Access forbidden: insufficient permissions")
        return user

    return role_checker
