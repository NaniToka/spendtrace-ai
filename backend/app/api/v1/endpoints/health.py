from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.core.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    project: str
    tagline: str
    version: str
    timestamp: datetime


@router.get("", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        project=settings.PROJECT_NAME,
        tagline=settings.TAGLINE,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc),
    )
