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
    assert "version" in data


def test_billing_endpoint():
    response = client.get("/api/v1/billing")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "records" in data
    assert data["total_count"] > 0
    
    first_record = data["records"][0]
    required_fields = [
        "record_id",
        "timestamp",
        "service",
        "region",
        "resource_id",
        "usage_type",
        "usage_quantity",
        "unit_cost",
        "total_cost",
        "team",
        "project",
        "environment",
    ]
    for field in required_fields:
        assert field in first_record


def test_billing_anomaly_scenario_present():
    response = client.get("/api/v1/billing")
    data = response.json()
    records = data["records"]
    
    # Check that normal baseline and spike records exist
    normal_nat = [r for r in records if r["resource_id"].endswith("nat-0a1b2c3d4e5f") and r["total_cost"] < 10.0]
    spike_nat = [r for r in records if r["resource_id"].endswith("nat-0a1b2c3d4e5f") and r["total_cost"] > 100.0]
    
    assert len(normal_nat) > 0
    assert len(spike_nat) > 0
    assert spike_nat[0]["deployment_id"] == "dep-7f9b8c2"
