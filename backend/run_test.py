from app.services.explanation_service import explanation_service
from app.schemas.anomaly import AnomalyItemSchema, AnomalySeverity
from app.schemas.root_cause import RootCauseCandidateSchema
from app.schemas.graph import InvestigationGraphResponse, InvestigationGraphSummary
from datetime import datetime

anomaly = AnomalyItemSchema(
    anomaly_id="AN-1",
    timestamp=datetime.utcnow(),
    service="AmazonEC2",
    region="us-east-1",
    resource_id="i-123",
    team="test",
    expected_cost=10.0,
    actual_cost=20.0,
    absolute_delta=10.0,
    percentage_delta=100.0,
    severity=AnomalySeverity.HIGH,
    status="OPEN"
)

candidate = RootCauseCandidateSchema(
    rank=1,
    title="Test Candidate",
    category="RESOURCE",
    confidence=0.9,
    confidence_level="HIGH",
    description="Test",
    temporal_correlation="STRONG",
    cost_before=10,
    cost_after=20,
    cost_delta=10,
    usage_delta_percentage=100,
    evidence_score=90,
    evidence=["test"]
)

graph = InvestigationGraphResponse(
    anomaly=anomaly,
    nodes=[],
    edges=[],
    summary=InvestigationGraphSummary(
        strongest_signal="test",
        confidence=0.9,
        evidence_count=1,
        node_count=1,
        edge_count=1
    )
)

explanation_service.generate_explanation(anomaly, [candidate], graph)
