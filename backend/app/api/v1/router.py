from fastapi import APIRouter

from backend.app.api.v1.endpoints import billing, events, health

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(billing.router, prefix="/billing", tags=["Billing"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
