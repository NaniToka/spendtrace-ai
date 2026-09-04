from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class AnomalySeverity(str, Enum):
    NORMAL = "NORMAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AnomalyItemSchema(BaseModel):
    anomaly_id: str = Field(..., description="Unique anomaly identifier")
    timestamp: datetime = Field(..., description="Observation timestamp in UTC")
    service: str = Field(..., description="AWS Service code (e.g. AmazonEC2)")
    region: str = Field(..., description="AWS Region (e.g. us-east-1)")
    resource_id: str = Field(..., description="AWS Resource ID / ARN")
    team: str = Field(..., description="Attributed engineering team")
    project: str = Field(..., description="Attributed project name")
    actual_cost: float = Field(..., description="Observed cost in USD")
    expected_cost: float = Field(..., description="Rolling baseline expected cost in USD")
    absolute_delta: float = Field(..., description="Cost difference in USD (actual - expected)")
    percentage_delta: float = Field(..., description="Percentage increase over expected baseline")
    anomaly_score: float = Field(..., description="Statistical Z-Score or deviation metric")
    severity: AnomalySeverity = Field(..., description="Severity classification")
    explanation: str = Field(..., description="Explainable description of the detected deviation")


class AnomalyListResponseSchema(BaseModel):
    total_count: int
    anomalies: List[AnomalyItemSchema]


class AnomalySummaryResponseSchema(BaseModel):
    total_anomalies: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    total_anomalous_spend: float
    highest_anomaly: Optional[AnomalyItemSchema] = None
    most_affected_service: Optional[str] = None
