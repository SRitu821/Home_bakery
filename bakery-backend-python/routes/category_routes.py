from fastapi import APIRouter, Request, Depends
from controllers.category_controller import get_categories, create_category
from middleware.auth_middleware import require_role

router = APIRouter()


@router.get("")
@router.get("/")
async def list_categories():
    return get_categories()


@router.post("", dependencies=[Depends(require_role("ADMIN"))])
@router.post("/", dependencies=[Depends(require_role("ADMIN"))])
async def add_category(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    return create_category(body)
