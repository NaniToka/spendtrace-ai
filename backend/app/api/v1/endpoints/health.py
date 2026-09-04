from datetime import datetime, timezone
from fastapi import APIRouter

from backend.app.core.config import settings
from backend.app.schemas.health import HealthResponseSchema

router = APIRouter()


@router.get("", response_model=HealthResponseSchema)
def health_check():
    """Returns application health, brand metadata, and version."""
    return HealthResponseSchema(
        status="healthy",
        project=settings.PROJECT_NAME,
        tagline=settings.TAGLINE,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc),
    )
