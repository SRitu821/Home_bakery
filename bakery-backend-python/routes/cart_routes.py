from fastapi import APIRouter, Request, Depends
from middleware.auth_middleware import authenticate
from controllers.cart_controller import get_cart, add_to_cart, update_cart_item, remove_cart_item

router = APIRouter(dependencies=[Depends(authenticate)])


@router.get("")
@router.get("/")
async def view_cart(request: Request):
    user = request.state.user
    return get_cart(user["id"])


@router.post("")
@router.post("/")
async def add_item(request: Request):
    user = request.state.user
    try:
        body = await request.json()
    except Exception:
        body = {}
    return add_to_cart(user["id"], body)


@router.put("/items/{item_id}")
async def update_item(item_id: str, request: Request):
    user = request.state.user
    try:
        body = await request.json()
    except Exception:
        body = {}
    return update_cart_item(user["id"], item_id, body)


@router.delete("/items/{item_id}")
async def delete_item(item_id: str, request: Request):
    user = request.state.user
    return remove_cart_item(user["id"], item_id)
