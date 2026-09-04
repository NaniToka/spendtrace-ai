from typing import List, Optional
from fastapi import APIRouter, Query

from backend.app.models.events import DeploymentEvent
from backend.app.services.ingestion import ingestion_service

router = APIRouter()


@router.get("", response_model=List[DeploymentEvent])
def get_deployment_events(
    service: Optional[str] = Query(None, description="Filter by related service"),
    team: Optional[str] = Query(None, description="Filter by team"),
    limit: int = Query(50, ge=1, le=200),
):
    """Retrieve engineering deployments and infrastructure changes for spike correlation."""
    return ingestion_service.get_events(service=service, team=team, limit=limit)
