from typing import Optional
from pydantic import BaseModel, Field


class FinancialImpactResponseSchema(BaseModel):
    status: str = Field(..., description="SUFFICIENT_DATA or INSUFFICIENT_DATA")
    current_anomalous_cost: float = Field(..., description="Actual cost during anomaly")
    expected_cost: float = Field(..., description="Baseline expected cost")
    excess_cost: float = Field(..., description="Difference between actual and expected")
    projected_7_day_excess: float = Field(..., description="7 day linear projection of excess")
    projected_30_day_excess: float = Field(..., description="30 day linear projection of excess")
    potential_savings: float = Field(..., description="Estimated savings if action taken immediately")
