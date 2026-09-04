from datetime import datetime, timezone
import pytest

from backend.app.schemas.anomaly import AnomalySeverity
from backend.app.schemas.billing import BillingItemSchema
from backend.app.services.anomaly_service import AnomalyDetectionService


def make_record(rec_id: str, day: int, cost: float, res_id: str = "nat-01", svc: str = "AmazonEC2", team: str = "data-platform") -> BillingItemSchema:
    return BillingItemSchema(
        record_id=rec_id,
        timestamp=datetime(2026, 8, day, 0, 0, 0, tzinfo=timezone.utc),
        service=svc,
        region="us-east-1",
        resource_id=f"arn:aws:ec2:us-east-1:123456789012:{res_id}",
        usage_type="NatGateway-Bytes",
        usage_quantity=100.0,
        unit_cost=0.045,
        total_cost=cost,
        team=team,
        project="pipeline-sync",
        environment="production",
        deployment_id=None,
    )


@pytest.fixture
def detector():
    return AnomalyDetectionService()


def test_normal_cost_produces_no_anomalies(detector):
    # Stable baseline spend of $10 every day
    records = [make_record(f"r{i}", day=i, cost=10.0 + (i % 2) * 0.2) for i in range(1, 6)]
    anomalies = detector.detect_anomalies(records=records)
    assert len(anomalies) == 0


def test_genuine_spike_detection(detector):
    # 3 days of ~$5 baseline, then a huge surge to $150
    records = [
        make_record("r1", day=1, cost=5.0),
        make_record("r2", day=2, cost=5.1),
        make_record("r3", day=3, cost=4.9),
        make_record("r4", day=4, cost=150.0),
    ]
    anomalies = detector.detect_anomalies(records=records)
    assert len(anomalies) == 1
    anom = anomalies[0]
    assert anom.severity in [AnomalySeverity.CRITICAL, AnomalySeverity.HIGH]
    assert anom.actual_cost == 150.0
    assert anom.expected_cost == pytest.approx(5.0, rel=1e-1)
    assert anom.absolute_delta > 140.0
    assert "AmazonEC2" in anom.explanation


def test_gradual_increase(detector):
    # Small incremental growth ($10.0, $10.5, $11.0, $11.5) should remain NORMAL
    records = [
        make_record("r1", day=1, cost=10.0),
        make_record("r2", day=2, cost=10.5),
        make_record("r3", day=3, cost=11.0),
        make_record("r4", day=4, cost=11.5),
    ]
    anomalies = detector.detect_anomalies(records=records)
    assert len(anomalies) == 0


def test_zero_variance_safe_handling(detector):
    # Identical baseline costs have standard deviation = 0.0
    records = [
        make_record("r1", day=1, cost=10.0),
        make_record("r2", day=2, cost=10.0),
        make_record("r3", day=3, cost=10.0),
        make_record("r4", day=4, cost=80.0),
    ]
    # Detector must not divide by zero and should correctly flag spike
    anomalies = detector.detect_anomalies(records=records)
    assert len(anomalies) == 1
    assert anomalies[0].anomaly_score > 0
    assert anomalies[0].severity in [AnomalySeverity.CRITICAL, AnomalySeverity.HIGH]


def test_insufficient_historical_data(detector):
    # Only 1 observation: cannot form rolling baseline
    records = [make_record("r1", day=1, cost=200.0)]
    anomalies = detector.detect_anomalies(records=records)
    assert len(anomalies) == 0


def test_negative_invalid_cost_handling(detector):
    # Corrupt or refund items (< 0) must be skipped safely
    records = [
        make_record("r1", day=1, cost=-50.0),
        make_record("r2", day=2, cost=10.0),
        make_record("r3", day=3, cost=10.0),
    ]
    anomalies = detector.detect_anomalies(records=records)
    assert len(anomalies) == 0


def test_severity_classification_levels(detector):
    # Test varying degrees of spikes
    # Baseline ~$10
    base = [
        make_record("r1", day=1, cost=10.0),
        make_record("r2", day=2, cost=10.0),
        make_record("r3", day=3, cost=10.0),
    ]
    
    # Critical: $150
    crit_records = base + [make_record("r4", day=4, cost=150.0)]
    crit_anom = detector.detect_anomalies(records=crit_records)
    assert len(crit_anom) == 1
    assert crit_anom[0].severity == AnomalySeverity.CRITICAL

    # Low / Medium
    med_records = base + [make_record("r4", day=4, cost=25.0)]
    med_anom = detector.detect_anomalies(records=med_records)
    assert len(med_anom) == 1
    assert med_anom[0].severity in [AnomalySeverity.LOW, AnomalySeverity.MEDIUM]


def test_filtering_and_summary(detector):
    # Multi-service scenario
    records = [
        make_record("r1", day=1, cost=5.0, svc="AmazonEC2", team="team-a"),
        make_record("r2", day=2, cost=5.0, svc="AmazonEC2", team="team-a"),
        make_record("r3", day=3, cost=5.0, svc="AmazonEC2", team="team-a"),
        make_record("r4", day=4, cost=120.0, svc="AmazonEC2", team="team-a"),
        make_record("r5", day=1, cost=20.0, svc="AmazonRDS", team="team-b"),
        make_record("r6", day=2, cost=20.0, svc="AmazonRDS", team="team-b"),
        make_record("r7", day=3, cost=20.0, svc="AmazonRDS", team="team-b"),
        make_record("r8", day=4, cost=22.0, svc="AmazonRDS", team="team-b"),
    ]
    # Filter by service
    ec2_anomalies = detector.detect_anomalies(records=records, service="AmazonEC2")
    assert len(ec2_anomalies) == 1
    assert ec2_anomalies[0].service == "AmazonEC2"

    rds_anomalies = detector.detect_anomalies(records=records, service="AmazonRDS")
    assert len(rds_anomalies) == 0

    # Summary
    summary = detector.get_summary()
    assert summary.total_anomalies >= 1
    assert summary.most_affected_service == "AmazonEC2"
