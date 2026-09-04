from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.anomaly import AnomalyItemSchema


class NodeType(str, Enum):
    ANOMALY = "ANOMALY"
    SERVICE = "SERVICE"
    REGION = "REGION"
    RESOURCE = "RESOURCE"
    USAGE = "USAGE"
    TEAM = "TEAM"
    PROJECT = "PROJECT"
    DEPLOYMENT = "DEPLOYMENT"
    EVENT = "EVENT"


class InvestigationNode(BaseModel):
    id: str
    type: NodeType
    label: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class InvestigationEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    strength: float = Field(..., description="0.0 to 1.0 confidence or strength of correlation")
    evidence: List[str] = Field(default_factory=list)


class InvestigationGraphSummary(BaseModel):
    primary_service: Optional[str] = None
    primary_resource: Optional[str] = None
    primary_region: Optional[str] = None
    primary_event: Optional[str] = None
    strongest_signal: str
    confidence: float
    evidence_count: int
    node_count: int
    edge_count: int


class InvestigationGraphResponse(BaseModel):
    anomaly: AnomalyItemSchema
    nodes: List[InvestigationNode]
    edges: List[InvestigationEdge]
    summary: InvestigationGraphSummary
