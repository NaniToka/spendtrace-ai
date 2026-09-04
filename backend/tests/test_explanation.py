import pytest
from datetime import datetime, timezone
from backend.app.schemas.anomaly import AnomalyItemSchema, AnomalySeverity
from backend.app.schemas.root_cause import RootCauseCandidateSchema, RootCauseCategory
from backend.app.schemas.graph import InvestigationGraphResponse, InvestigationGraphSummary, InvestigationEdge, InvestigationNode, NodeType
from backend.app.services.explanation_service import explanation_service


def get_dummy_anomaly():
    return AnomalyItemSchema(
        anomaly_id="anom-test",
        timestamp=datetime(2026, 8, 20, 0, 0, 0, tzinfo=timezone.utc),
        service="AmazonEC2",
        region="us-east-1",
        resource_id="i-123",
        team="data",
        project="ml",
        actual_cost=150.0,
        expected_cost=50.0,
        absolute_delta=100.0,
        percentage_delta=200.0,
        anomaly_score=15.0,
        severity=AnomalySeverity.HIGH,
        explanation="Deviation detected"
    )


def test_generate_fallback_explanation():
    anomaly = get_dummy_anomaly()
    candidates = [
        RootCauseCandidateSchema(
            anomaly_id="anom-test",
            rank=1,
            category=RootCauseCategory.DEPLOYMENT,
            title="Deploy v1",
            description="Deployed something",
            cost_before=50.0,
            cost_after=150.0,
            cost_delta=100.0,
            contribution_percentage=100.0,
            usage_delta_percentage=20.0,
            temporal_correlation="STRONG",
            evidence_score=0.9,
            confidence=0.85,
            confidence_level="HIGH",
            evidence=["Match"]
        )
    ]
    graph = InvestigationGraphResponse(
        anomaly=anomaly,
        nodes=[
            InvestigationNode(id="n1", type=NodeType.DEPLOYMENT, label="Deploy v1")
        ],
        edges=[
            InvestigationEdge(id="e1", source="n1", target="anomaly", relationship="STRONG_CORRELATION", strength=0.9, evidence=["Time match"])
        ],
        summary=InvestigationGraphSummary(
            strongest_signal="Match",
            confidence=0.9,
            evidence_count=1,
            node_count=1,
            edge_count=1
        )
    )
    
    # Ensure fallback is triggered by removing API key for test
    explanation_service.api_key = None
    response = explanation_service.generate_explanation(anomaly, candidates, graph)
    
    assert "[Local AI Fallback]" in response.what_happened
    assert "Deploy v1" in response.why_it_happened
    assert len(response.key_evidence) > 0
    assert "STRONG_CORRELATION" in response.key_evidence[0]
    
def test_generate_empty_explanation():
    anomaly = get_dummy_anomaly()
    graph = InvestigationGraphResponse(
        anomaly=anomaly,
        nodes=[],
        edges=[],
        summary=InvestigationGraphSummary(
            strongest_signal="N/A",
            confidence=0.0,
            evidence_count=0,
            node_count=0,
            edge_count=0
        )
    )
    
    response = explanation_service.generate_explanation(anomaly, [], graph)
    assert response.confidence == 0.1
    assert "No isolated strong correlations found" in response.key_evidence[0]
