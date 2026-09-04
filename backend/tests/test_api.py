from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "SpendTrace AI"
    assert "Explain why they happened" in data["tagline"]


def test_billing_endpoint():
    response = client.get("/api/v1/billing")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "records" in data
    assert data["total_count"] > 0


def test_anomalies_endpoint():
    response = client.get("/api/v1/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "anomalies" in data
    assert data["total_count"] >= 2  # The Aug 29 and Aug 30 NAT gateway spikes
    
    first_anom = data["anomalies"][0]
    assert first_anom["service"] == "AmazonEC2"
    assert "natgateway" in first_anom["resource_id"]
    assert first_anom["severity"] in ["CRITICAL", "HIGH"]
    assert first_anom["actual_cost"] > 140.0
    assert first_anom["expected_cost"] < 10.0
    assert first_anom["percentage_delta"] > 1000.0


def test_anomalies_summary_endpoint():
    response = client.get("/api/v1/anomalies/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_anomalies"] >= 2
    assert (summary["critical_count"] + summary["high_count"]) >= 2
    assert summary["total_anomalous_spend"] > 200.0
    assert summary["most_affected_service"] == "AmazonEC2"
    assert summary["highest_anomaly"] is not None
