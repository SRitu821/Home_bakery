from fastapi import APIRouter, Request, Depends, Query
from typing import Optional
from middleware.auth_middleware import authenticate, require_role
from controllers.order_controller import (
    place_order,
    get_orders,
    get_order_by_id,
    update_order_status,
)

router = APIRouter(dependencies=[Depends(authenticate)])


@router.post("")
@router.post("/")
async def create_order(request: Request):
    user = request.state.user
    return place_order(user["id"])


@router.get("")
@router.get("/")
async def list_orders(request: Request, user_id: Optional[str] = Query(None)):
    user = request.state.user
    return get_orders(user["id"], user["role"], user_id)


@router.get("/{order_id}")
async def single_order(order_id: str, request: Request):
    user = request.state.user
    return get_order_by_id(user["id"], user["role"], order_id)


@router.put("/{order_id}/status", dependencies=[Depends(require_role("ADMIN"))])
async def change_order_status(order_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    return update_order_status(order_id, body)
