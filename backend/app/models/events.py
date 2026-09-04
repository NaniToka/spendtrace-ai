from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class EventType(str, Enum):
    DEPLOYMENT = "DEPLOYMENT"
    INFRA_CHANGE = "INFRA_CHANGE"
    CONFIG_CHANGE = "CONFIG_CHANGE"
    CRON_SCALE = "CRON_SCALE"
    INCIDENT = "INCIDENT"


class DeploymentEvent(BaseModel):
    event_id: str = Field(..., description="Unique event identifier")
    timestamp: datetime = Field(..., description="UTC timestamp when the event took place")
    event_type: EventType = Field(..., description="Classification of event")
    service_code: str = Field(..., description="Related AWS Service code (e.g. AWSLambda, AmazonRDS)")
    region: str = Field(..., description="AWS region where change was applied")
    resource_id: Optional[str] = Field(None, description="Impacted AWS resource ARN or ID")
    team: str = Field(..., description="Engineering team responsible")
    project: str = Field(..., description="Project or repository name")
    author: str = Field(..., description="Developer or system bot who executed the change")
    commit_sha: Optional[str] = Field(None, description="Git commit hash if code deployment")
    title: str = Field(..., description="Brief headline of the change")
    description: str = Field(..., description="Detailed description of what was changed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary event payload / diff")
