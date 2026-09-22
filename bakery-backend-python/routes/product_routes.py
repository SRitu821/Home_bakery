from fastapi import APIRouter, Request, Depends, Query
from typing import Optional
from controllers.product_controller import (
    get_products,
    get_popular_products,
    get_product_by_id,
    create_product,
    update_product,
    delete_product,
)
from middleware.auth_middleware import require_role

router = APIRouter()


@router.get("")
@router.get("/")
async def list_products(
    category: Optional[str] = Query(None),
    minPrice: Optional[str] = Query(None),
    maxPrice: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    return get_products(category=category, min_price=minPrice, max_price=maxPrice, search=search)


@router.get("/popular")
async def popular_products():
    return get_popular_products()


@router.get("/{product_id}")
async def single_product(product_id: str):
    return get_product_by_id(product_id)


@router.post("", dependencies=[Depends(require_role("ADMIN"))])
@router.post("/", dependencies=[Depends(require_role("ADMIN"))])
async def add_product(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    return create_product(body)


@router.put("/{product_id}", dependencies=[Depends(require_role("ADMIN"))])
async def modify_product(product_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    return update_product(product_id, body)


@router.delete("/{product_id}", dependencies=[Depends(require_role("ADMIN"))])
async def remove_product(product_id: str):
    return delete_product(product_id)
