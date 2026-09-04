import pytest
from datetime import datetime, timezone
from backend.app.schemas.anomaly import AnomalyItemSchema, AnomalySeverity
from backend.app.schemas.root_cause import RootCauseResponseSchema, RootCauseCandidateSchema, RootCauseCategory, InvestigationSummarySchema
from backend.app.schemas.graph import NodeType, InvestigationNode, InvestigationEdge, InvestigationGraphResponse
from backend.app.services.graph_service import graph_service
from backend.app.services.root_cause_service import RootCauseAnalysisService

class DummyRootCauseService(RootCauseAnalysisService):
    def investigate_anomaly_by_id(self, anomaly_id: str):
        if anomaly_id == "anom-404":
            return None
            
        anomaly = AnomalyItemSchema(
            anomaly_id=anomaly_id,
            timestamp=datetime(2026, 8, 20, 0, 0, 0, tzinfo=timezone.utc),
            service="AmazonEC2",
            region="us-east-1",
            resource_id="i-12345",
            team="data-platform",
            project="ml-pipeline",
            actual_cost=150.0,
            expected_cost=50.0,
            absolute_delta=100.0,
            percentage_delta=200.0,
            anomaly_score=15.0,
            severity=AnomalySeverity.HIGH,
            explanation="Spike"
        )
        
        candidates = [
            RootCauseCandidateSchema(
                anomaly_id=anomaly_id,
                rank=1,
                category=RootCauseCategory.DEPLOYMENT,
                title="Deployment: v2.0",
                description="Deployed something",
                service="AmazonEC2",
                cost_before=50.0,
                cost_after=150.0,
                cost_delta=100.0,
                contribution_percentage=100.0,
                usage_delta_percentage=20.0,
                temporal_correlation="STRONG",
                evidence_score=0.9,
                confidence=0.85,
                confidence_level="HIGH",
                evidence=["Time match"]
            ),
            RootCauseCandidateSchema(
                anomaly_id=anomaly_id,
                rank=2,
                category=RootCauseCategory.SERVICE,
                title="EC2 cost surge",
                description="EC2 costs",
                service="AmazonEC2",
                cost_before=50.0,
                cost_after=150.0,
                cost_delta=100.0,
                contribution_percentage=100.0,
                usage_delta_percentage=0.0,
                temporal_correlation="NONE",
                evidence_score=0.5,
                confidence=0.4,
                confidence_level="LOW",
                evidence=[]
            )
        ]
        
        summary = InvestigationSummarySchema(
            primary_service="AmazonEC2",
            primary_region="us-east-1",
            primary_resource="i-12345",
            primary_team="data-platform",
            primary_project="ml-pipeline",
            strongest_signal="Deployment match",
            total_excess_spend=100.0,
            correlated_events_count=1
        )
        
        return RootCauseResponseSchema(
            anomaly=anomaly,
            candidates=candidates,
            investigation_summary=summary
        )

# Mock the dependency
import backend.app.services.graph_service as gs
gs.root_cause_service = DummyRootCauseService()

def test_build_investigation_graph():
    response = graph_service.build_investigation_graph("anom-123")
    assert response is not None
    assert response.summary.node_count == 3  # anomaly, deployment, service
    assert response.summary.edge_count == 2
    assert response.summary.confidence == 0.85
    assert response.summary.primary_event == "Deployment: v2.0"
    
    # Check anomaly node
    anomaly_node = next((n for n in response.nodes if n.type == NodeType.ANOMALY), None)
    assert anomaly_node is not None
    assert anomaly_node.id == "anomaly_anom-123"
    
    # Check edges
    edges = response.edges
    assert len(edges) == 2
    deployment_edge = next((e for e in edges if e.relationship == "STRONG_CORRELATION"), None)
    assert deployment_edge is not None
    assert deployment_edge.target == anomaly_node.id
    
def test_build_investigation_graph_not_found():
    response = graph_service.build_investigation_graph("anom-404")
    assert response is None
