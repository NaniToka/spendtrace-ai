from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.router import api_router
from backend.app.core.config import settings
from backend.app.services.ingestion import ingestion_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed synthetic data on startup
    ingestion_service.initialize_with_synthetic_data(days=settings.DATA_DAYS_BACK)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.TAGLINE}\n\nAI-Powered AWS Cloud Cost Anomaly Detection & Root-Cause Explainer",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }
