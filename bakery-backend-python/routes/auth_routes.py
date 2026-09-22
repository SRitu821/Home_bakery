from fastapi import APIRouter, Request
from controllers.auth_controller import register_user, login_user

router = APIRouter()


@router.post("/register")
async def register(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    return register_user(body)


@router.post("/login")
async def login(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    return login_user(body)
