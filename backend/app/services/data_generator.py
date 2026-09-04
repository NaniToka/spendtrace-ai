import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

from backend.app.models.billing import BillingRecord, ResourceTags
from backend.app.models.events import DeploymentEvent, EventType


def generate_synthetic_dataset(
    days: int = 30, base_date: datetime | None = None
) -> Tuple[List[BillingRecord], List[DeploymentEvent]]:
    """
    Generates a realistic 30-day AWS billing dataset modeled after AWS Cost & Usage Report (CUR)
    along with correlated engineering deployments and infra change events.
    """
    if base_date is None:
        base_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    start_date = base_date - timedelta(days=days)
    records: List[BillingRecord] = []
    events: List[DeploymentEvent] = []

    # 1. Base Services Configuration
    baseline_services = [
        {
            "service_code": "AmazonEC2",
            "service_name": "Amazon Elastic Compute Cloud",
            "region": "us-east-1",
            "resource_id": "arn:aws:ec2:us-east-1:123456789012:instance/i-09f182c47a",
            "resource_name": "core-api-worker-fleet",
            "usage_type": "BoxUsage:c6i.2xlarge",
            "unit": "Hrs",
            "daily_usage": 24.0,
            "daily_cost": 42.50,
            "variance": 0.05,
            "team": "core-api",
            "environment": "production",
            "project": "api-gateway",
        },
        {
            "service_code": "AmazonRDS",
            "service_name": "Amazon Relational Database Service",
            "region": "us-east-1",
            "resource_id": "arn:aws:rds:us-east-1:123456789012:db:aurora-main-cluster",
            "resource_name": "aurora-postgres-primary",
            "usage_type": "Aurora:ServerlessV2Usage",
            "unit": "ACU-Hr",
            "daily_usage": 96.0,
            "daily_cost": 38.40,
            "variance": 0.08,
            "team": "core-api",
            "environment": "production",
            "project": "user-database",
        },
        {
            "service_code": "AmazonS3",
            "service_name": "Amazon Simple Storage Service",
            "region": "us-east-1",
            "resource_id": "arn:aws:s3:::prod-customer-assets-archive",
            "resource_name": "prod-customer-assets-archive",
            "usage_type": "StandardStorage",
            "unit": "GB-Mo",
            "daily_usage": 4500.0,
            "daily_cost": 15.20,
            "variance": 0.02,
            "team": "media-platform",
            "environment": "production",
            "project": "asset-store",
        },
        {
            "service_code": "AmazonDynamoDB",
            "service_name": "Amazon DynamoDB",
            "region": "us-west-2",
            "resource_id": "arn:aws:dynamodb:us-west-2:123456789012:table/session-store",
            "resource_name": "session-store-v2",
            "usage_type": "PayPerRequestThroughput",
            "unit": "Requests",
            "daily_usage": 850000.0,
            "daily_cost": 12.75,
            "variance": 0.10,
            "team": "auth-identity",
            "environment": "production",
            "project": "session-manager",
        },
        {
            "service_code": "AmazonCloudFront",
            "service_name": "Amazon CloudFront",
            "region": "global",
            "resource_id": "arn:aws:cloudfront::123456789012:distribution/E27ABCXYZ99",
            "resource_name": "cdn-web-static",
            "usage_type": "DataTransfer-Out-Bytes",
            "unit": "GB",
            "daily_usage": 320.0,
            "daily_cost": 27.20,
            "variance": 0.15,
            "team": "frontend-web",
            "environment": "production",
            "project": "web-cdn",
        },
    ]

    # Generate baseline data day-by-day
    for day_offset in range(days):
        current_day = start_date + timedelta(days=day_offset)
        
        for item in baseline_services:
            # Add slight realistic noise
            noise = (random.random() - 0.5) * 2 * item["variance"]
            cost = max(0.1, round(item["daily_cost"] * (1 + noise), 2))
            usage = max(0.1, round(item["daily_usage"] * (1 + noise), 2))
            
            record = BillingRecord(
                record_id=f"rec-{uuid.uuid4().hex[:10]}",
                timestamp=current_day,
                service_code=item["service_code"],
                service_name=item["service_name"],
                region=item["region"],
                resource_id=item["resource_id"],
                resource_name=item["resource_name"],
                usage_type=item["usage_type"],
                usage_amount=usage,
                unit=item["unit"],
                unblended_cost=cost,
                currency="USD",
                tags=ResourceTags(
                    team=item["team"],
                    environment=item["environment"],
                    project=item["project"],
                    owner=f"{item['team']}@costra.cloud",
                    cost_center="CC-ENG-101",
                    raw_tags={"managed_by": "terraform", "tier": "tier-1"},
                ),
            )
            records.append(record)

    # 2. Add Anomaly Scenario 1: Data Transfer / NAT Gateway Spike (5 days ago)
    nat_spike_start_day = 25  # Day 25 out of 30
    nat_event_date = start_date + timedelta(days=nat_spike_start_day, hours=2, minutes=15)
    
    events.append(
        DeploymentEvent(
            event_id="evt-nat-cross-region-sync",
            timestamp=nat_event_date,
            event_type=EventType.DEPLOYMENT,
            service_code="AmazonEC2",
            region="us-east-1",
            resource_id="arn:aws:ec2:us-east-1:123456789012:natgateway/nat-0a1b2c3d4e5f",
            team="data-platform",
            project="pipeline-sync",
            author="alex.dev@costra.cloud",
            commit_sha="7f9b8c2",
            title="Deploy cross-region batch replica to eu-west-1",
            description="Enabled hourly raw database replication dump to secondary compliance bucket across regions without VPC peering endpoint.",
            metadata={"diff": "+ target_region: eu-west-1", "endpoint_type": "public_nat"},
        )
    )

    for day_offset in range(days):
        current_day = start_date + timedelta(days=day_offset)
        if day_offset < nat_spike_start_day:
            # Normal baseline
            cost = round(random.uniform(3.5, 4.5), 2)
            usage = round(random.uniform(70.0, 90.0), 2)
        else:
            # 28x Anomaly Spike
            cost = round(random.uniform(120.0, 145.0), 2)
            usage = round(random.uniform(2400.0, 2900.0), 2)
            
        records.append(
            BillingRecord(
                record_id=f"rec-nat-{day_offset}",
                timestamp=current_day,
                service_code="AmazonEC2",
                service_name="Amazon Elastic Compute Cloud",
                region="us-east-1",
                resource_id="arn:aws:ec2:us-east-1:123456789012:natgateway/nat-0a1b2c3d4e5f",
                resource_name="vpc-prod-nat-gateway",
                usage_type="NatGateway-Bytes",
                usage_amount=usage,
                unit="GB",
                unblended_cost=cost,
                currency="USD",
                tags=ResourceTags(
                    team="data-platform",
                    environment="production",
                    project="pipeline-sync",
                    owner="alex.dev@costra.cloud",
                    cost_center="CC-DATA-202",
                    raw_tags={"service": "nat-gateway", "vpc": "vpc-0831a"},
                ),
            )
        )

    # 3. Add Anomaly Scenario 2: Runaway Lambda Loop (3 days ago)
    lambda_spike_start_day = 27  # Day 27 out of 30
    lambda_event_date = start_date + timedelta(days=lambda_spike_start_day, hours=9, minutes=40)
    
    events.append(
        DeploymentEvent(
            event_id="evt-lambda-s3-trigger",
            timestamp=lambda_event_date,
            event_type=EventType.DEPLOYMENT,
            service_code="AWSLambda",
            region="us-west-2",
            resource_id="arn:aws:lambda:us-west-2:123456789012:function:thumbnail-processor",
            team="core-api",
            project="media-service",
            author="sarah.k@costra.cloud",
            commit_sha="3a1e9d0",
            title="Update thumbnail optimizer trigger bucket",
            description="Re-configured S3 ObjectCreated event listener on media bucket without excluding the generated output prefix, triggering recursive invocation loop.",
            metadata={"prefix_filter": "None", "trigger": "s3:ObjectCreated:*"},
        )
    )

    for day_offset in range(days):
        current_day = start_date + timedelta(days=day_offset)
        if day_offset < lambda_spike_start_day:
            cost = round(random.uniform(1.8, 2.6), 2)
            usage = round(random.uniform(35000, 50000), 0)
        else:
            # 35x Spike
            cost = round(random.uniform(78.0, 92.0), 2)
            usage = round(random.uniform(1800000, 2200000), 0)

        records.append(
            BillingRecord(
                record_id=f"rec-lambda-{day_offset}",
                timestamp=current_day,
                service_code="AWSLambda",
                service_name="AWS Lambda",
                region="us-west-2",
                resource_id="arn:aws:lambda:us-west-2:123456789012:function:thumbnail-processor",
                resource_name="thumbnail-processor",
                usage_type="AWS-Lambda-GB-Second",
                usage_amount=usage,
                unit="Second",
                unblended_cost=cost,
                currency="USD",
                tags=ResourceTags(
                    team="core-api",
                    environment="production",
                    project="media-service",
                    owner="sarah.k@costra.cloud",
                    cost_center="CC-ENG-101",
                    raw_tags={"runtime": "nodejs20.x", "memory": "2048MB"},
                ),
            )
        )

    # 4. Add Anomaly Scenario 3: Overprovisioned Benchmark RDS (7 days ago)
    rds_spike_start_day = 23
    rds_event_date = start_date + timedelta(days=rds_spike_start_day, hours=14, minutes=10)
    
    events.append(
        DeploymentEvent(
            event_id="evt-rds-benchmark-scale",
            timestamp=rds_event_date,
            event_type=EventType.INFRA_CHANGE,
            service_code="AmazonRDS",
            region="us-east-1",
            resource_id="arn:aws:rds:us-east-1:123456789012:db:analytics-loadtest-temp",
            team="analytics",
            project="benchmark-q3",
            author="devops-bot",
            commit_sha=None,
            title="Provision load testing replica db.r5.4xlarge",
            description="Scaled up analytics load testing database for Q3 stress test. Auto-terminate scheduled task failed to trigger.",
            metadata={"instance_class": "db.r5.4xlarge", "auto_terminate": "failed"},
        )
    )

    for day_offset in range(days):
        current_day = start_date + timedelta(days=day_offset)
        if day_offset >= rds_spike_start_day:
            cost = round(random.uniform(68.0, 74.0), 2)
            usage = 24.0
            records.append(
                BillingRecord(
                    record_id=f"rec-rds-bench-{day_offset}",
                    timestamp=current_day,
                    service_code="AmazonRDS",
                    service_name="Amazon Relational Database Service",
                    region="us-east-1",
                    resource_id="arn:aws:rds:us-east-1:123456789012:db:analytics-loadtest-temp",
                    resource_name="analytics-loadtest-temp",
                    usage_type="InstanceUsage:db.r5.4xlarge",
                    usage_amount=usage,
                    unit="Hrs",
                    unblended_cost=cost,
                    currency="USD",
                    tags=ResourceTags(
                        team="analytics",
                        environment="staging",
                        project="benchmark-q3",
                        owner="analytics-lead@costra.cloud",
                        cost_center="CC-ANALYTICS-301",
                        raw_tags={"purpose": "q3-loadtest", "tier": "benchmark"},
                    ),
                )
            )

    # Sort records chronologically
    records.sort(key=lambda r: r.timestamp)
    events.sort(key=lambda e: e.timestamp)

    return records, events
