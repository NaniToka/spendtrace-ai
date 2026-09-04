from typing import List, Optional
from pydantic import BaseModel, Field


class ExplanationResponseSchema(BaseModel):
    what_happened: str = Field(..., description="Summary of the anomaly event.")
    why_it_happened: str = Field(..., description="Likely cause based on the investigation graph.")
    key_evidence: List[str] = Field(default_factory=list, description="List of labeled evidence points.")
    confidence: float = Field(..., description="0.0 to 1.0 confidence score.")
    recommended_next_step: str = Field(..., description="Actionable recommendation.")
