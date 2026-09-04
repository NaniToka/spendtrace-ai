from datetime import datetime
from pydantic import BaseModel


class HealthResponseSchema(BaseModel):
    status: str
    project: str
    tagline: str
    version: str
    timestamp: datetime
