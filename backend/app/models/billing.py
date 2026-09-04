from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ResourceTags(BaseModel):
    team: str = Field(..., description="Owning team/pod (e.g. data-platform, core-api, checkout)")
    environment: str = Field(..., description="Deployment environment (e.g. production, staging, dev)")
    project: str = Field(..., description="Project or component name")
    owner: Optional[str] = Field(None, description="Direct owner or tech lead email/handle")
    cost_center: Optional[str] = Field(None, description="Internal financial cost center code")
    raw_tags: Dict[str, str] = Field(default_factory=dict, description="Additional custom AWS resource tags")


class ResourceMetadata(BaseModel):
    resource_id: str = Field(..., description="AWS Resource ID (e.g. arn:aws:ec2:..., i-012345, rds:prod-db)")
    resource_name: str = Field(..., description="Human-readable resource identifier")
    service_code: str = Field(..., description="AWS Service shortcode (e.g. AmazonEC2, AmazonRDS, AWSLambda)")
    service_name: str = Field(..., description="Friendly AWS Service name")
    region: str = Field(..., description="AWS Region (e.g. us-east-1, us-west-2, eu-central-1)")
    tags: ResourceTags


class BillingRecord(BaseModel):
    record_id: str = Field(..., description="Unique ID for this billing line item")
    timestamp: datetime = Field(..., description="Start of the hourly or daily billing interval (UTC)")
    service_code: str = Field(..., description="AWS Service Code (e.g. AmazonEC2, AmazonS3, AWSLambda, AmazonRDS)")
    service_name: str = Field(..., description="AWS Service display name")
    region: str = Field(..., description="AWS Region identifier")
    resource_id: str = Field(..., description="ARN or specific resource identifier")
    resource_name: str = Field(..., description="Human-readable resource name")
    usage_type: str = Field(..., description="AWS Usage Type (e.g. BoxUsage:m5.xlarge, DataTransfer-Out-Bytes, Invocations)")
    usage_amount: float = Field(..., ge=0.0, description="Quantity of units consumed")
    unit: str = Field(..., description="Unit of measure (e.g. Hrs, GB, Requests, Count)")
    unblended_cost: float = Field(..., ge=0.0, description="Cost in USD without discounts or blended rates")
    currency: str = Field(default="USD", description="Billing currency")
    tags: ResourceTags = Field(..., description="Resource tags parsed from CUR line items")


class CostAggregationSummary(BaseModel):
    total_spend: float
    record_count: int
    date_range_start: datetime
    date_range_end: datetime
    currency: str = "USD"
    by_service: Dict[str, float]
    by_region: Dict[str, float]
    by_team: Dict[str, float]
    daily_trend: List[Dict[str, float | str]]
