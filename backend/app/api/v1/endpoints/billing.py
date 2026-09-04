from typing import Optional
from fastapi import APIRouter, Query

from backend.app.schemas.billing import BillingResponseSchema
from backend.app.services.billing_service import billing_service

router = APIRouter()


@router.get("", response_model=BillingResponseSchema)
def get_billing_data(
    service: Optional[str] = Query(None, description="Filter by AWS service (e.g. AmazonEC2, AmazonRDS)"),
    region: Optional[str] = Query(None, description="Filter by AWS region (e.g. us-east-1)"),
    team: Optional[str] = Query(None, description="Filter by team tag (e.g. data-platform)"),
    environment: Optional[str] = Query(None, description="Filter by environment (e.g. production)"),
):
    """
    Returns normalized AWS Cost and Usage billing records from the synthetic dataset.
    """
    records = billing_service.get_records(
        service=service,
        region=region,
        team=team,
        environment=environment,
    )
    return BillingResponseSchema(
        total_count=len(records),
        records=records,
    )
