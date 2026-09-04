import json
from pathlib import Path
from typing import List, Optional

from backend.app.schemas.root_cause import DeploymentEventSchema


class EventService:
    def __init__(self):
        self._data_file = Path(__file__).resolve().parent.parent / "data" / "synthetic_events.json"
        self._cache: Optional[List[DeploymentEventSchema]] = None

    def get_events(
        self,
        service: Optional[str] = None,
        region: Optional[str] = None,
        team: Optional[str] = None,
        project: Optional[str] = None,
        resource_id: Optional[str] = None,
    ) -> List[DeploymentEventSchema]:
        """Loads and filters deployment and infrastructure change events."""
        if self._cache is None:
            self._load_data()

        events = self._cache or []

        if service:
            events = [e for e in events if e.service.lower() == service.lower()]
        if region:
            events = [e for e in events if e.region.lower() == region.lower()]
        if team:
            events = [e for e in events if e.team.lower() == team.lower()]
        if project:
            events = [e for e in events if e.project.lower() == project.lower()]
        if resource_id:
            events = [e for e in events if e.resource_id and (e.resource_id == resource_id or e.resource_id.split('/')[-1] == resource_id.split('/')[-1])]

        return events

    def _load_data(self):
        if not self._data_file.exists():
            self._cache = []
            return

        with open(self._data_file, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            self._cache = [DeploymentEventSchema(**item) for item in raw_data]


event_service = EventService()
