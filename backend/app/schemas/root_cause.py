from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.anomaly import AnomalyItemSchema


class RootCauseCategory(str, Enum):
    SERVICE = "SERVICE"
    REGION = "REGION"
    RESOURCE = "RESOURCE"
    TEAM = "TEAM"
    PROJECT = "PROJECT"
    USAGE = "USAGE"
    DEPLOYMENT = "DEPLOYMENT"
    EVENT = "EVENT"


class DeploymentEventSchema(BaseModel):
    event_id: str = Field(..., description="Unique event ID")
    timestamp: str = Field(..., description="UTC ISO-8601 timestamp")
    event_type: str = Field(..., description="DEPLOYMENT, INFRA_CHANGE, etc.")
    service: str
    region: str
    resource_id: Optional[str] = None
    team: str
    project: str
    author: str
    commit_sha: Optional[str] = None
    title: str
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RootCauseCandidateSchema(BaseModel):
    anomaly_id: str = Field(..., description="Referenced anomaly identifier")
    rank: int = Field(..., description="Rank priority (1 being strongest candidate)")
    category: RootCauseCategory = Field(..., description="Dimension category of root cause")
    title: str = Field(..., description="Short headline of the finding")
    description: str = Field(..., description="Detailed explanation of the contribution")
    service: Optional[str] = None
    region: Optional[str] = None
    resource_id: Optional[str] = None
    team: Optional[str] = None
    project: Optional[str] = None
    deployment_id: Optional[str] = None
    cost_before: float = Field(..., description="Historical baseline cost in USD")
    cost_after: float = Field(..., description="Cost during anomaly in USD")
    cost_delta: float = Field(..., description="Dollar change in USD")
    contribution_percentage: float = Field(..., description="Share of the total anomaly spend delta (0-100%)")
    usage_delta_percentage: float = Field(..., description="Percentage shift in physical usage units")
    temporal_correlation: str = Field(..., description="STRONG, MODERATE, WEAK, or NONE")
    evidence_score: float = Field(..., description="Normalized composite evidence score (0-100)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence rating between 0.0 and 1.0")
    confidence_level: str = Field(..., description="HIGH, MEDIUM, or LOW")
    evidence: List[str] = Field(default_factory=list, description="List of concrete measurable evidence items")


class InvestigationSummarySchema(BaseModel):
    primary_service: str
    primary_region: str
    primary_resource: str
    primary_team: str
    primary_project: str
    strongest_signal: str
    total_excess_spend: float
    correlated_events_count: int


class RootCauseResponseSchema(BaseModel):
    anomaly: AnomalyItemSchema
    candidates: List[RootCauseCandidateSchema]
    investigation_summary: InvestigationSummarySchema
