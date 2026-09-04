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


def test_anomalies_summary_endpoint():
    response = client.get("/api/v1/anomalies/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_anomalies"] >= 2
    assert (summary["critical_count"] + summary["high_count"]) >= 2
    assert summary["total_anomalous_spend"] > 200.0
    assert summary["most_affected_service"] == "AmazonEC2"


def test_anomaly_root_causes_endpoint():
    # 1. Get an anomaly ID
    anomalies_res = client.get("/api/v1/anomalies")
    anomalies = anomalies_res.json()["anomalies"]
    assert len(anomalies) > 0
    anomaly_id = anomalies[0]["anomaly_id"]

    # 2. Query root-causes
    rc_res = client.get(f"/api/v1/anomalies/{anomaly_id}/root-causes")
    assert rc_res.status_code == 200
    data = rc_res.json()
    assert "anomaly" in data
    assert "candidates" in data
    assert "investigation_summary" in data

    candidates = data["candidates"]
    assert len(candidates) >= 2
    assert candidates[0]["rank"] == 1
    assert candidates[0]["confidence"] > 0.5
    assert len(candidates[0]["evidence"]) > 0

    # 3. Non-existent anomaly returns 404
    bad_res = client.get("/api/v1/anomalies/non-existent-id/root-causes")
    assert bad_res.status_code == 404
