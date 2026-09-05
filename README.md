# SpendTrace AI ⚡

> **"Don't just detect cloud cost spikes. Explain why they happened."**

SpendTrace AI is an AI-powered AWS Cloud Cost Anomaly Detection & Root-Cause Explainer. 

## What SpendTrace AI Does
SpendTrace AI bridges the gap between raw AWS billing telemetry and engineering context. It ingests AWS Cost & Usage Reports (CUR), detects statistical anomalies in real-time, correlates them with engineering events (deployments, git commits), and uses AI to generate a human-readable explanation of why the bill surged.

## Problem Being Solved
Cloud infrastructure bills are complex, fragmented, and delivered after the fact. When engineering teams deploy code or reconfigure services, AWS CUR reflect spikes days later. Engineers and FinOps teams are forced to manually correlate billing spikes with commit histories and deployments. This manual investigation is slow, error-prone, and costs organizations thousands of dollars in cloud waste.

## Key Differentiator
Traditional FinOps tools only *detect* anomalies and alert you that spending has increased. SpendTrace AI goes further by providing the **"Why"**—correlating cost anomalies with the exact deployment or infrastructure change that caused them, generating an executive-ready explanation and computing financial impact.

## Main Features
- **Statistical Anomaly Isolation**: Detect non-linear cost surges and isolate affected services, regions, and resources using a robust Z-Score engine.
- **Root-Cause Correlation Engine**: Connect spend anomalies to Git commits, Terraform PRs, and deployment events using temporal proximity and resource mapping.
- **AI Narrative Explainer**: Generate human-readable explanations of why the bill surged, who owns the service, and suggested remediations.
- **Financial Impact Simulator**: Project 7-day and 30-day excess costs to prioritize corrective actions.

## Architecture
SpendTrace AI uses a decoupled client-server architecture:
- **Frontend**: React SPA built with Vite and TypeScript, featuring a dark FinOps design system.
- **Backend**: FastAPI Python backend, processing synthetic/real CUR data, analyzing anomalies, and exposing REST APIs.
- **Data**: Ingests normalized billing records and deployment events.

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind-like custom CSS
- **Backend**: Python 3.12, FastAPI, Pydantic, Uvicorn, Pytest
- **Deployment**: Docker, Docker Compose, Nginx

## Environment Variables
Create a `.env` file based on `.env.example`:
- `VITE_API_BASE_URL`: (Frontend) Base URL for the backend API (e.g. `http://localhost:8000/api/v1`).
- `BACKEND_CORS_ORIGINS`: (Backend) Comma-separated list of allowed CORS origins.
- `OPENAI_API_KEY`: (Backend, Optional) OpenAI Key if using live AI generation (uses synthetic fallback if omitted).

## Local Setup

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost
- Backend API: http://localhost:8000

### Manual Setup
**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Overview
- `GET /api/v1/health`: System status and metadata
- `GET /api/v1/billing`: Retrieve normalized billing records
- `GET /api/v1/anomalies`: List detected cost anomalies
- `GET /api/v1/anomalies/{id}/root-causes`: Correlated engineering events
- `GET /api/v1/anomalies/{id}/investigation-graph`: Evidence graph nodes and edges
- `GET /api/v1/anomalies/{id}/explanation`: AI-generated narrative
- `GET /api/v1/anomalies/{id}/financial-impact`: Excess cost projections

## Demo Workflow
1. Navigate to the frontend dashboard.
2. The system loads synthetic AWS billing data automatically (no AWS credentials required).
3. The anomaly engine deterministically detects a deliberate EC2 NAT Gateway cost spike.
4. Click on the anomaly to enter the **Investigation View**.
5. Observe the Root Cause Ranking prioritizing the exact deployment responsible.
6. Review the Evidence Graph, AI Explanation, and Financial Impact simulator.

## Deployment Instructions
SpendTrace AI is fully containerized and production-ready.

1. Configure your `.env` variables for the production domain.
2. Build and push the Docker images using the provided `Dockerfile.backend` and `Dockerfile.frontend`.
3. Deploy to your preferred platform (e.g., AWS ECS, Render, Railway, DigitalOcean).
   - Ensure the backend exposes port `8000`.
   - Ensure the frontend exposes port `80` (served via Nginx).
