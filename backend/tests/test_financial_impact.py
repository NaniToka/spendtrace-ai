import pytest
from datetime import datetime, timezone
from backend.app.schemas.anomaly import AnomalyItemSchema, AnomalySeverity
from backend.app.services.financial_impact_service import financial_impact_service
from backend.app.schemas.financial_impact import FinancialImpactResponseSchema

def get_dummy_anomaly(actual=150.0, expected=50.0, delta=100.0) -> AnomalyItemSchema:
    return AnomalyItemSchema(
        anomaly_id="anom-123",
        timestamp=datetime(2026, 8, 20, 0, 0, 0, tzinfo=timezone.utc),
        service="AmazonEC2",
        region="us-east-1",
        resource_id="i-123",
        team="data",
        project="ml",
        actual_cost=actual,
        expected_cost=expected,
        absolute_delta=delta,
        percentage_delta=(delta / expected * 100.0) if expected > 0 else 0,
        anomaly_score=5.0,
        severity=AnomalySeverity.HIGH,
        explanation="Test explanation"
    )

def test_financial_impact_calculation():
    anomaly = get_dummy_anomaly(actual=150.0, expected=50.0, delta=100.0)
    result = financial_impact_service.calculate_impact(anomaly)
    
    assert result.status == "SUFFICIENT_DATA"
    assert result.current_anomalous_cost == 150.0
    assert result.expected_cost == 50.0
    assert result.excess_cost == 100.0
    assert result.projected_7_day_excess == 700.0
    assert result.projected_30_day_excess == 3000.0
    assert result.potential_savings == 3000.0

def test_financial_impact_insufficient_data():
    result = financial_impact_service.calculate_impact(None)
    assert result.status == "INSUFFICIENT_DATA"
    assert result.potential_savings == 0.0

def test_financial_impact_negative_delta():
    anomaly = get_dummy_anomaly(actual=40.0, expected=50.0, delta=-10.0)
    result = financial_impact_service.calculate_impact(anomaly)
    
    assert result.status == "INSUFFICIENT_DATA"
    assert result.excess_cost == 0.0

def test_financial_impact_zero_delta():
    anomaly = get_dummy_anomaly(actual=50.0, expected=50.0, delta=0.0)
    result = financial_impact_service.calculate_impact(anomaly)
    
    assert result.status == "INSUFFICIENT_DATA"
    assert result.excess_cost == 0.0
