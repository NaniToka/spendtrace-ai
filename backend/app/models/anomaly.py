from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class AnomalySeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AnomalyStatus(str, Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    CONFIRMED = "CONFIRMED"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class CostAnomaly(BaseModel):
    anomaly_id: str = Field(..., description="Unique anomaly identifier")
    detected_at: datetime = Field(..., description="Timestamp when anomaly was flagged")
    start_time: datetime = Field(..., description="Estimated start timestamp of the abnormal spend pattern")
    end_time: Optional[datetime] = Field(None, description="End timestamp if spend returned to baseline")
    service_code: str = Field(..., description="Affected AWS Service")
    region: str = Field(..., description="Affected Region")
    resource_id: Optional[str] = Field(None, description="Specific resource if localized")
    team: str = Field(..., description="Attributed team or department")
    
    baseline_cost: float = Field(..., ge=0.0, description="Expected regular cost in USD for this interval")
    actual_cost: float = Field(..., ge=0.0, description="Observed cost in USD during anomaly")
    impact_amount: float = Field(..., description="Excess unexpected spend in USD (actual - baseline)")
    percentage_increase: float = Field(..., description="Percentage delta relative to baseline")
    
    severity: AnomalySeverity = Field(..., description="Calculated severity based on cost volume & spike ratio")
    status: AnomalyStatus = Field(default=AnomalyStatus.DETECTED)
    summary: str = Field(..., description="High-level anomaly headline")
