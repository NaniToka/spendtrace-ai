import pytest
from backend.app.services.executive_summary_service import executive_summary_service

def test_executive_summary_not_found():
    result = executive_summary_service.generate_summary("invalid-anomaly-id")
    assert result.status == "NOT_FOUND"
    assert result.anomaly is None
    assert result.top_root_causes == []
    assert result.explanation is None
    assert result.financial_impact is None
    assert result.graph is None

def test_executive_summary_success():
    # We will test against the first anomaly from our synthetic dataset
    from backend.app.services.anomaly_service import anomaly_service
    anomalies = anomaly_service.detect_anomalies()
    if not anomalies:
        pytest.skip("No synthetic anomalies available for testing")
        
    anomaly = anomalies[0]
    result = executive_summary_service.generate_summary(anomaly.anomaly_id)
    
    assert result.status in ["COMPLETE", "PARTIAL_DATA"]
    assert result.anomaly is not None
    assert result.anomaly.anomaly_id == anomaly.anomaly_id
    
    # Check that root causes, explanation, graph and financial impact are populated
    # (Because it's a real synthetic anomaly, it should ideally have COMPLETE status)
    assert len(result.top_root_causes) > 0
    assert result.explanation is not None
    assert result.financial_impact is not None
    assert result.graph is not None
