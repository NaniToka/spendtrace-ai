from datetime import datetime, timezone
import pytest

from backend.app.schemas.anomaly import AnomalyItemSchema, AnomalySeverity
from backend.app.schemas.billing import BillingItemSchema
from backend.app.schemas.root_cause import DeploymentEventSchema, RootCauseCategory
from backend.app.services.root_cause_service import RootCauseAnalysisService


def make_billing_record(
    rec_id: str,
    day: int,
    cost: float,
    usage: float,
    svc: str = "AmazonEC2",
    reg: str = "us-east-1",
    res_id: str = "nat-01",
    team: str = "data-platform",
    proj: str = "pipeline-sync",
) -> BillingItemSchema:
    return BillingItemSchema(
        record_id=rec_id,
        timestamp=datetime(2026, 8, day, 0, 0, 0, tzinfo=timezone.utc),
        service=svc,
        region=reg,
        resource_id=f"arn:aws:ec2:{reg}:123456789012:{res_id}",
        usage_type="NatGateway-Bytes" if "nat" in res_id else "BoxUsage",
        usage_quantity=usage,
        unit_cost=0.045,
        total_cost=cost,
        team=team,
        project=proj,
        environment="production",
        deployment_id=None,
    )


@pytest.fixture
def rc_service():
    return RootCauseAnalysisService()


@pytest.fixture
def sample_anomaly():
    return AnomalyItemSchema(
        anomaly_id="anom-test-01",
        timestamp=datetime(2026, 8, 29, 0, 0, 0, tzinfo=timezone.utc),
        service="AmazonEC2",
        region="us-east-1",
        resource_id="arn:aws:ec2:us-east-1:123456789012:natgateway/nat-0a1b2c3d4e5f",
        team="data-platform",
        project="pipeline-sync",
        actual_cost=142.50,
        expected_cost=4.20,
        absolute_delta=138.30,
        percentage_delta=3292.9,
        anomaly_score=164.64,
        severity=AnomalySeverity.CRITICAL,
        explanation="EC2 spending surge.",
    )


def test_service_and_resource_contribution_ranking(rc_service, sample_anomaly):
    # Multi-service scenario on anomaly date
    records = [
        # Baseline days 26, 27, 28
        make_billing_record("b1", 26, 4.20, 93.3, svc="AmazonEC2", res_id="nat-0a1b2c3d4e5f"),
        make_billing_record("b2", 27, 4.20, 93.3, svc="AmazonEC2", res_id="nat-0a1b2c3d4e5f"),
        make_billing_record("b3", 28, 4.20, 93.3, svc="AmazonEC2", res_id="nat-0a1b2c3d4e5f"),
        make_billing_record("b4", 26, 40.0, 24.0, svc="AmazonRDS", res_id="db-01"),
        make_billing_record("b5", 27, 40.0, 24.0, svc="AmazonRDS", res_id="db-01"),
        make_billing_record("b6", 28, 40.0, 24.0, svc="AmazonRDS", res_id="db-01"),
        # Anomaly day 29: EC2 spikes by $138, RDS stays flat
        make_billing_record("a1", 29, 142.50, 3166.7, svc="AmazonEC2", res_id="nat-0a1b2c3d4e5f"),
        make_billing_record("a2", 29, 41.00, 24.0, svc="AmazonRDS", res_id="db-01"),
    ]

    result = rc_service.analyze_anomaly(sample_anomaly, records=records)
    assert len(result.candidates) > 0

    # Primary resource and service in summary
    assert result.investigation_summary.primary_service == "AmazonEC2"
    assert "nat-0a1b2c3d4e5f" in result.investigation_summary.primary_resource

    # Check candidates exist for resource, usage, service
    categories = [c.category for c in result.candidates]
    assert RootCauseCategory.RESOURCE in categories
    assert RootCauseCategory.USAGE in categories
    assert RootCauseCategory.SERVICE in categories


def test_usage_change_detection(rc_service, sample_anomaly):
    records = [
        make_billing_record("b1", 28, 4.20, 100.0, res_id="nat-0a1b2c3d4e5f"),
        make_billing_record("a1", 29, 142.50, 3200.0, res_id="nat-0a1b2c3d4e5f"),
    ]
    result = rc_service.analyze_anomaly(sample_anomaly, records=records)
    usage_cand = next((c for c in result.candidates if c.category == RootCauseCategory.USAGE), None)
    assert usage_cand is not None
    assert usage_cand.usage_delta_percentage > 1000.0
    assert any("+3100" in e or "surged" in e for e in usage_cand.evidence)


def test_deployment_temporal_correlation(rc_service, sample_anomaly):
    # Analyze default anomaly where dep-7f9b8c2 occurred at 2026-08-29 02:15:00 UTC
    result = rc_service.analyze_anomaly(sample_anomaly)
    dep_cand = next((c for c in result.candidates if c.category == RootCauseCategory.DEPLOYMENT), None)
    assert dep_cand is not None
    assert dep_cand.deployment_id == "dep-7f9b8c2"
    assert dep_cand.temporal_correlation in ["STRONG", "MODERATE"]
    assert dep_cand.confidence >= 0.75
    assert dep_cand.confidence_level == "HIGH"
    assert any("dep-7f9b8c2" in e for e in dep_cand.evidence)


def test_candidate_ranking_and_confidence(rc_service, sample_anomaly):
    result = rc_service.analyze_anomaly(sample_anomaly)
    candidates = result.candidates
    assert len(candidates) >= 3

    # Ranks must be strictly ascending 1, 2, 3...
    ranks = [c.rank for c in candidates]
    assert ranks == list(range(1, len(candidates) + 1))

    # Evidence scores must be non-increasing with rank
    scores = [c.evidence_score for c in candidates]
    assert scores == sorted(scores, reverse=True)


def test_anomaly_with_no_correlated_event(rc_service):
    # Anomaly on an untracked resource with no matching deployment
    orphan_anomaly = AnomalyItemSchema(
        anomaly_id="anom-orphan",
        timestamp=datetime(2026, 8, 20, 0, 0, 0, tzinfo=timezone.utc),
        service="AmazonS3",
        region="eu-west-1",
        resource_id="arn:aws:s3:::orphan-bucket-test",
        team="unassigned",
        project="legacy-backup",
        actual_cost=95.0,
        expected_cost=10.0,
        absolute_delta=85.0,
        percentage_delta=850.0,
        anomaly_score=15.0,
        severity=AnomalySeverity.HIGH,
        explanation="S3 cost surge.",
    )
    records = [
        make_billing_record("b1", 18, 10.0, 50.0, svc="AmazonS3", reg="eu-west-1", res_id="orphan-bucket-test", team="unassigned", proj="legacy-backup"),
        make_billing_record("b2", 19, 10.0, 50.0, svc="AmazonS3", reg="eu-west-1", res_id="orphan-bucket-test", team="unassigned", proj="legacy-backup"),
        make_billing_record("a1", 20, 95.0, 480.0, svc="AmazonS3", reg="eu-west-1", res_id="orphan-bucket-test", team="unassigned", proj="legacy-backup"),
    ]
    result = rc_service.analyze_anomaly(orphan_anomaly, records=records)
    # Should still succeed and produce Resource / Usage / Service candidates without throwing
    assert len(result.candidates) >= 2
    assert result.investigation_summary.correlated_events_count == 0
    # Top candidate should be Resource or Usage
    assert result.candidates[0].category in [RootCauseCategory.RESOURCE, RootCauseCategory.USAGE]
