import json
from pathlib import Path
from typing import List, Optional

from backend.app.schemas.billing import BillingItemSchema


class BillingService:
    def __init__(self):
        self._data_file = Path(__file__).resolve().parent.parent / "data" / "synthetic_billing.json"
        self._cache: Optional[List[BillingItemSchema]] = None

    def get_records(
        self,
        service: Optional[str] = None,
        region: Optional[str] = None,
        team: Optional[str] = None,
        environment: Optional[str] = None,
    ) -> List[BillingItemSchema]:
        """Load and filter normalized synthetic AWS billing items."""
        if self._cache is None:
            self._load_data()

        records = self._cache or []

        if service:
            records = [r for r in records if r.service.lower() == service.lower()]
        if region:
            records = [r for r in records if r.region.lower() == region.lower()]
        if team:
            records = [r for r in records if r.team.lower() == team.lower()]
        if environment:
            records = [r for r in records if r.environment.lower() == environment.lower()]

        return records

    def _load_data(self):
        if not self._data_file.exists():
            self._cache = []
            return

        with open(self._data_file, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            self._cache = [BillingItemSchema(**item) for item in raw_data]


billing_service = BillingService()
