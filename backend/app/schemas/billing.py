from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class BillingItemSchema(BaseModel):
    record_id: str = Field(..., description="Unique line item ID")
    timestamp: datetime = Field(..., description="Date/timestamp in UTC")
    service: str = Field(..., description="AWS Service name (e.g. AmazonEC2, AmazonRDS)")
    region: str = Field(..., description="AWS Region (e.g. us-east-1)")
    resource_id: str = Field(..., description="AWS Resource ID / ARN")
    usage_type: str = Field(..., description="AWS Usage Type")
    usage_quantity: float = Field(..., description="Usage amount")
    unit_cost: float = Field(..., description="Unit cost rate in USD")
    total_cost: float = Field(..., description="Total billed cost in USD")
    team: str = Field(..., description="Attributed engineering team tag")
    project: str = Field(..., description="Attributed project tag")
    environment: str = Field(..., description="Deployment environment (production/staging/dev)")
    deployment_id: Optional[str] = Field(None, description="Linked deployment or event ID if applicable")


class BillingResponseSchema(BaseModel):
    total_count: int
    records: List[BillingItemSchema]
