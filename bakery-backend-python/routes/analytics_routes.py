from fastapi import APIRouter, Depends
from middleware.auth_middleware import authenticate, require_role
from controllers.analytics_controller import (
    get_top_selling,
    get_monthly_revenue,
    get_overview,
)

router = APIRouter(dependencies=[Depends(authenticate), Depends(require_role("ADMIN"))])


@router.get("/top-selling")
async def top_selling():
    return get_top_selling()


@router.get("/monthly-revenue")
async def monthly_revenue():
    return get_monthly_revenue()


@router.get("/overview")
async def overview():
    return get_overview()
