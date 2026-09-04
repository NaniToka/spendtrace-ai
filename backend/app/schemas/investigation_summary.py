from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.anomaly import AnomalyItemSchema
from backend.app.schemas.root_cause import RootCauseCandidateSchema
from backend.app.schemas.explanation import ExplanationResponseSchema
from backend.app.schemas.financial_impact import FinancialImpactResponseSchema
from backend.app.schemas.graph import InvestigationGraphResponse

class ExecutiveInvestigationSummarySchema(BaseModel):
    status: str = Field(..., description="Investigation completion status, e.g. COMPLETE, PARTIAL_DATA, NOT_FOUND")
    anomaly: Optional[AnomalyItemSchema] = Field(None, description="The core anomaly being investigated")
    top_root_causes: List[RootCauseCandidateSchema] = Field(default_factory=list, description="Top 3 ranked root causes")
    explanation: Optional[ExplanationResponseSchema] = Field(None, description="AI or Fallback explanation of the anomaly")
    financial_impact: Optional[FinancialImpactResponseSchema] = Field(None, description="Financial projections and savings")
    graph: Optional[InvestigationGraphResponse] = Field(None, description="The complete causal investigation graph")
