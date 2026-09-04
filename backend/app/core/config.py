from pydantic import BaseModel


class AnomalyThresholds(BaseModel):
    ROLLING_WINDOW_SIZE: int = 3
    MIN_VARIANCE_EPSILON: float = 0.5
    MIN_ABSOLUTE_DELTA: float = 5.0  # Minimum dollar delta to flag as an anomaly
    MIN_PERCENTAGE_DELTA: float = 25.0  # Minimum percentage delta to flag
    
    # Z-Score thresholds for classification
    Z_SCORE_LOW: float = 1.5
    Z_SCORE_MEDIUM: float = 2.0
    Z_SCORE_HIGH: float = 3.0
    Z_SCORE_CRITICAL: float = 4.0


class RootCauseScoringWeights(BaseModel):
    COST_CONTRIBUTION_WEIGHT: float = 0.35
    USAGE_DELTA_WEIGHT: float = 0.25
    TEMPORAL_PROXIMITY_WEIGHT: float = 0.25
    CONCENTRATION_WEIGHT: float = 0.15

    # Confidence classification thresholds
    CONFIDENCE_HIGH: float = 0.75
    CONFIDENCE_MEDIUM: float = 0.50


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
    ANOMALY: AnomalyThresholds = AnomalyThresholds()
    ROOT_CAUSE: RootCauseScoringWeights = RootCauseScoringWeights()
    OPENAI_API_KEY: str | None = None


settings = Settings()
