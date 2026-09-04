from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.anomaly import (
    AnomalyListResponseSchema,
    AnomalySeverity,
    AnomalySummaryResponseSchema,
)
from backend.app.schemas.root_cause import RootCauseResponseSchema
from backend.app.services.anomaly_service import anomaly_service
from backend.app.services.root_cause_service import root_cause_service

router = APIRouter()


@router.get("", response_model=AnomalyListResponseSchema)
def get_anomalies(
    service: Optional[str] = Query(None, description="Filter by AWS service (e.g. AmazonEC2)"),
    region: Optional[str] = Query(None, description="Filter by AWS region (e.g. us-east-1)"),
    team: Optional[str] = Query(None, description="Filter by team tag (e.g. data-platform)"),
    project: Optional[str] = Query(None, description="Filter by project tag (e.g. pipeline-sync)"),
    severity: Optional[AnomalySeverity] = Query(None, description="Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    start_date: Optional[datetime] = Query(None, description="Filter from UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter to UTC timestamp"),
):
    """
    Returns detected cost anomalies ranked by severity and timestamp.
    """
    anomalies = anomaly_service.detect_anomalies(
        service=service,
        region=region,
        team=team,
        project=project,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
    )
    return AnomalyListResponseSchema(
        total_count=len(anomalies),
        anomalies=anomalies,
    )


@router.get("/summary", response_model=AnomalySummaryResponseSchema)
def get_anomalies_summary(
    service: Optional[str] = Query(None, description="Filter summary by AWS service"),
    region: Optional[str] = Query(None, description="Filter summary by AWS region"),
    team: Optional[str] = Query(None, description="Filter summary by team"),
):
    """
    Returns high-level anomaly statistics, severity distribution, total excess spend, and top impacted service.
    """
    return anomaly_service.get_summary(
        service=service,
        region=region,
        team=team,
    )


@router.get("/{anomaly_id}/root-causes", response_model=RootCauseResponseSchema)
def get_anomaly_root_causes(anomaly_id: str):
    """
    Investigates and returns ranked root-cause candidates for a given cost anomaly.
    """
    result = root_cause_service.investigate_anomaly_by_id(anomaly_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Anomaly with ID '{anomaly_id}' not found.")
    return result
