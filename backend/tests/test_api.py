import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.data_generator import generate_synthetic_dataset

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "COSTRA"
    assert "Understand why it changed" in data["tagline"]


def test_synthetic_data_generator():
    records, events = generate_synthetic_dataset(days=10)
    assert len(records) > 0
    assert len(events) >= 3
    # Check that records have all required correlation attributes
    for r in records[:5]:
        assert r.record_id is not None
        assert r.service_code is not None
        assert r.region is not None
        assert r.resource_id is not None
        assert r.tags.team is not None
        assert r.tags.project is not None
        assert r.unblended_cost >= 0


def test_get_billing_records_endpoint():
    response = client.get("/api/v1/billing/records?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert len(data["records"]) == 10
    assert data["records"][0]["currency"] == "USD"


def test_get_billing_summary_endpoint():
    response = client.get("/api/v1/billing/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_spend"] > 0
    assert "by_service" in data
    assert "by_region" in data
    assert "by_team" in data
    assert len(data["daily_trend"]) > 0


def test_get_events_endpoint():
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 3
    assert any(e["event_type"] == "DEPLOYMENT" for e in events)
    assert any(e["team"] == "data-platform" for e in events)
