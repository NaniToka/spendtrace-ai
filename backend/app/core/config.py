import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "COSTRA"
    TAGLINE: str = "Don't just see the cloud bill. Understand why it changed."
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]
    DATA_DAYS_BACK: int = 30


settings = Settings()
