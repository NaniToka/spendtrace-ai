from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.models.events import DeploymentEvent


class CorrelationEvidence(BaseModel):
    evidence_type: str = Field(..., description="E.g., TEMPORAL_PROXIMITY, RESOURCE_MATCH, TAG_MATCH, LOG_BURST")
    description: str = Field(..., description="Human-readable explanation of this specific evidence piece")
    confidence_contribution: float = Field(..., ge=0.0, le=1.0, description="Score contribution 0.0-1.0")


class RootCauseCandidate(BaseModel):
    candidate_id: str = Field(..., description="Candidate root-cause identifier")
    anomaly_id: str = Field(..., description="Referenced anomaly ID")
    event: Optional[DeploymentEvent] = Field(None, description="Linked deployment or configuration event")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Overall confidence ranking (0.0 to 1.0)")
    title: str = Field(..., description="Concise root cause summary")
    explanation: str = Field(..., description="Detailed narrative explaining how this cause produced the spike")
    evidence_list: List[CorrelationEvidence] = Field(default_factory=list)
    suggested_remediation: Optional[str] = Field(None, description="Actionable fix or rollback step")
