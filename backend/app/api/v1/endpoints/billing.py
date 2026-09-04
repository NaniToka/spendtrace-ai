from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from backend.app.models.billing import BillingRecord, CostAggregationSummary
from backend.app.services.ingestion import ingestion_service

router = APIRouter()


class PaginatedBillingResponse(BaseModel):
    total_count: int
    limit: int
    offset: int
    records: List[BillingRecord]


@router.get("/records", response_model=PaginatedBillingResponse)
def get_billing_records(
    service: Optional[str] = Query(None, description="Filter by AWS service code (e.g. AmazonEC2)"),
    region: Optional[str] = Query(None, description="Filter by AWS region (e.g. us-east-1)"),
    team: Optional[str] = Query(None, description="Filter by team tag (e.g. data-platform)"),
    start_date: Optional[datetime] = Query(None, description="Filter from UTC date (ISO-8601)"),
    end_date: Optional[datetime] = Query(None, description="Filter to UTC date (ISO-8601)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Retrieve normalized AWS billing records with filtering and pagination."""
    records, total_count = ingestion_service.get_records(
        service=service,
        region=region,
        team=team,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return PaginatedBillingResponse(
        total_count=total_count,
        limit=limit,
        offset=offset,
        records=records,
    )


@router.get("/summary", response_model=CostAggregationSummary)
def get_billing_summary(
    start_date: Optional[datetime] = Query(None, description="Filter summary from UTC date"),
    end_date: Optional[datetime] = Query(None, description="Filter summary to UTC date"),
):
    """Retrieve aggregate spending metrics, breakdown by service/region/team, and daily trend."""
    return ingestion_service.get_summary(start_date=start_date, end_date=end_date)
