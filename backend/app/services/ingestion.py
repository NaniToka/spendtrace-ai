from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from backend.app.models.billing import BillingRecord, CostAggregationSummary
from backend.app.models.events import DeploymentEvent
from backend.app.services.data_generator import generate_synthetic_dataset


class IngestionService:
    def __init__(self):
        self._records: List[BillingRecord] = []
        self._events: List[DeploymentEvent] = []
        self._is_initialized: bool = False

    def initialize_with_synthetic_data(self, days: int = 30):
        """Seed the in-memory repository with realistic synthetic AWS CUR records."""
        records, events = generate_synthetic_dataset(days=days)
        self._records = records
        self._events = events
        self._is_initialized = True

    def ingest_records(self, records: List[BillingRecord]):
        """Ingest additional normalized billing records."""
        self._records.extend(records)
        self._records.sort(key=lambda r: r.timestamp)

    def ingest_events(self, events: List[DeploymentEvent]):
        """Ingest engineering / infrastructure deployment events."""
        self._events.extend(events)
        self._events.sort(key=lambda e: e.timestamp)

    def get_records(
        self,
        service: Optional[str] = None,
        region: Optional[str] = None,
        team: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[BillingRecord], int]:
        """Query and filter normalized billing records."""
        if not self._is_initialized:
            self.initialize_with_synthetic_data()

        filtered = self._records
        
        if service:
            filtered = [r for r in filtered if r.service_code.lower() == service.lower()]
        if region:
            filtered = [r for r in filtered if r.region.lower() == region.lower()]
        if team:
            filtered = [r for r in filtered if r.tags.team.lower() == team.lower()]
        if start_date:
            filtered = [r for r in filtered if r.timestamp >= start_date]
        if end_date:
            filtered = [r for r in filtered if r.timestamp <= end_date]

        total_count = len(filtered)
        paginated = filtered[offset : offset + limit]
        return paginated, total_count

    def get_events(
        self,
        service: Optional[str] = None,
        team: Optional[str] = None,
        limit: int = 50,
    ) -> List[DeploymentEvent]:
        """Retrieve deployment and infra events."""
        if not self._is_initialized:
            self.initialize_with_synthetic_data()

        filtered = self._events
        if service:
            filtered = [e for e in filtered if e.service_code.lower() == service.lower()]
        if team:
            filtered = [e for e in filtered if e.team.lower() == team.lower()]

        return filtered[:limit]

    def get_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> CostAggregationSummary:
        """Calculate aggregated cost summaries grouped by service, region, and team."""
        if not self._is_initialized:
            self.initialize_with_synthetic_data()

        filtered = self._records
        if start_date:
            filtered = [r for r in filtered if r.timestamp >= start_date]
        if end_date:
            filtered = [r for r in filtered if r.timestamp <= end_date]

        if not filtered:
            now = datetime.now()
            return CostAggregationSummary(
                total_spend=0.0,
                record_count=0,
                date_range_start=now,
                date_range_end=now,
                currency="USD",
                by_service={},
                by_region={},
                by_team={},
                daily_trend=[],
            )

        total_spend = sum(r.unblended_cost for r in filtered)
        by_service = defaultdict(float)
        by_region = defaultdict(float)
        by_team = defaultdict(float)
        daily_map = defaultdict(lambda: {"cost": 0.0, "services": defaultdict(float)})

        for r in filtered:
            by_service[r.service_name] += r.unblended_cost
            by_region[r.region] += r.unblended_cost
            by_team[r.tags.team] += r.unblended_cost
            
            day_str = r.timestamp.strftime("%Y-%m-%d")
            daily_map[day_str]["cost"] += r.unblended_cost
            daily_map[day_str]["services"][r.service_name] += r.unblended_cost

        daily_trend = []
        for day in sorted(daily_map.keys()):
            daily_trend.append({
                "date": day,
                "total_cost": round(daily_map[day]["cost"], 2),
                **{svc: round(val, 2) for svc, val in daily_map[day]["services"].items()}
            })

        return CostAggregationSummary(
            total_spend=round(total_spend, 2),
            record_count=len(filtered),
            date_range_start=filtered[0].timestamp,
            date_range_end=filtered[-1].timestamp,
            currency="USD",
            by_service={k: round(v, 2) for k, v in sorted(by_service.items(), key=lambda x: x[1], reverse=True)},
            by_region={k: round(v, 2) for k, v in sorted(by_region.items(), key=lambda x: x[1], reverse=True)},
            by_team={k: round(v, 2) for k, v in sorted(by_team.items(), key=lambda x: x[1], reverse=True)},
            daily_trend=daily_trend,
        )


ingestion_service = IngestionService()
