from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "SpendTrace AI"
    TAGLINE: str = "Don't just detect cloud cost spikes. Explain why they happened."
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]


settings = Settings()
