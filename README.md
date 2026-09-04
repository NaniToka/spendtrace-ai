# SpendTrace AI ⚡

> **"Don't just detect cloud cost spikes. Explain why they happened."**

AI-Powered AWS Cloud Cost Anomaly Detection & Root-Cause Explainer built for the **IEEE Genesis Hackathon**.

---

## 🎯 1. Problem Statement
Cloud infrastructure bills are complex, fragmented, and delivered after the fact. When engineering teams deploy code, reconfigure cloud services, or experience traffic surges, AWS Cost & Usage Reports (CUR) reflect spikes days later.

Engineers and FinOps teams are forced to manually correlate billing spikes with commit histories, deployment pipelines, infrastructure changes, and CloudTrail logs. This manual investigation is slow, error-prone, and costs organizations thousands of dollars in cloud waste.

---

## 💡 2. Product Vision
**SpendTrace AI** bridges the gap between raw AWS billing telemetry and engineering context:

$$\text{Normal AWS Spending} \longrightarrow \text{Deployment / Event} \longrightarrow \text{Usage Surge} \longrightarrow \text{Cost Spike} \longrightarrow \text{Anomaly Flagged} \longrightarrow \text{Root-Cause Explainer}$$

- **Ingest & Normalize**: Ingest AWS Cost & Usage Report (CUR) streams with resource-level granularity and team/project tags.
- **Statistical Anomaly Isolation**: Detect non-linear cost surges and isolate affected services, regions, and resources.
- **Root-Cause Correlation Engine**: Connect spend anomalies to Git commits, Terraform PRs, and deployment events.
- **AI Narrative Explainer**: Generate human-readable explanations of *why* the bill surged, who owns the service, and suggested remediations.

---

## 🏗️ 3. Current Architecture

```
spendtrace-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── anomalies.py     # GET /api/v1/anomalies & /summary
│   │   │       │   ├── billing.py       # GET /api/v1/billing (Normalized records)
│   │   │       │   └── health.py        # GET /api/v1/health (System status)
│   │   │       └── router.py            # API V1 Router
│   │   ├── core/
│   │   │   └── config.py                # Configurable anomaly statistical thresholds & CORS
│   │   ├── data/
│   │   │   └── synthetic_billing.json   # Local normalized synthetic AWS dataset
│   │   ├── schemas/                     # Pydantic request/response schemas
│   │   │   ├── anomaly.py               # AnomalyItem, Severity, Summary schemas
│   │   │   ├── billing.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── anomaly_service.py       # Rolling baseline & Z-Score anomaly engine
│   │   │   └── billing_service.py       # Billing loader & filtering service
│   │   └── main.py                      # FastAPI application entrypoint
│   ├── requirements.txt
│   └── tests/
│       ├── test_anomalies.py            # Focused unit tests for anomaly engine edge cases
│       └── test_api.py                  # API endpoints integration tests
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx               # Product branding & live backend status
│   │   │   ├── Sidebar.tsx              # Workspace navigation sidebar
│   │   │   ├── CostSummary.tsx          # Total spend & top service/team KPIs
│   │   │   ├── AnomalySection.tsx       # Live statistical cost anomaly view & table
│   │   │   └── RootCauseSection.tsx     # Root-cause correlation preview placeholder
│   │   ├── pages/
│   │   │   └── OverviewPage.tsx         # Dashboard overview with anomalies & billing table
│   │   ├── services/
│   │   │   └── api.ts                   # Type-safe API client (health, billing, anomalies)
│   │   ├── types/
│   │   │   ├── anomaly.ts               # Anomaly TypeScript interfaces
│   │   │   ├── billing.ts               # Billing TypeScript interfaces
│   │   │   └── health.ts                # Health TypeScript interfaces
│   │   ├── App.tsx                      # App layout shell
│   │   ├── main.tsx                     # React root
│   │   └── index.css                    # Dark modern FinOps design system
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🚀 4. Local Setup Guide

### Prerequisites
- Python 3.12+
- Node.js v18+ and npm

### Backend Setup (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health`
- Billing Endpoint: `http://localhost:8000/api/v1/billing`
- Anomalies Endpoint: `http://localhost:8000/api/v1/anomalies`
- Anomalies Summary: `http://localhost:8000/api/v1/anomalies/summary`

### Frontend Setup (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Dashboard: `http://localhost:5173`

### Run Automated Tests
```bash
PYTHONPATH=. ./backend/venv/bin/pytest backend/tests/
```

---

## 📊 5. Anomaly Detection Methodology

The anomaly detection engine in [`backend/app/services/anomaly_service.py`](file:///Users/tokanani/spendtrace-ai/backend/app/services/anomaly_service.py) operates on resource-level time series using:

1. **Rolling Baseline with Contamination Protection**:
   - Computes expected historical mean and standard deviation over a rolling observation window.
   - Automatically excludes contaminated spike points from the historical baseline to ensure multi-day surges are detected accurately.
2. **Safe Statistical Z-Score**:
   - Evaluates statistical surge: $Z = \frac{\text{Actual} - \text{Expected}}{\sigma_{\text{eff}}}$
   - Protects against zero/low-variance division with calibrated variance epsilon and scale bounds.
3. **Calibrated Multi-Tier Severity**:
   - `CRITICAL`: Absolute delta $\ge \$50$ with $Z \ge 4.0$ or percentage surge $\ge 100\%$
   - `HIGH`: Absolute delta $\ge \$20$ with $Z \ge 3.0$ or percentage surge $\ge 50\%$
   - `MEDIUM`: Absolute delta $\ge \$10$ with $Z \ge 2.0$ or percentage surge $\ge 25\%$
   - `LOW`: Absolute delta $\ge \$5$ with $Z \ge 1.5$
   - `NORMAL`: Below deviation thresholds

---

## 📈 6. Current Implementation Status

| Component | Status | Description |
|---|---|---|
| **Backend API** | ✅ Completed | FastAPI app with `/health`, `/billing`, `/anomalies`, `/anomalies/summary` |
| **Anomaly Engine** | ✅ Completed | Statistical rolling baseline, Z-Score, contamination protection |
| **Pydantic Schemas** | ✅ Completed | `AnomalyItemSchema`, `AnomalySummaryResponseSchema` |
| **Frontend UI** | ✅ Completed | Anomaly KPI badges, severity pills, interactive filterable table |
| **Test Suite** | ✅ Completed | 12 focused pytest tests covering edge cases and zero-variance safety |

---

## 🔮 7. Future Roadmap

- [ ] **Prompt 4: Deployment & Root-Cause Ranking Engine**
  - Ingest deployment timelines, git commit diffs, and infra changes.
  - Correlate temporal proximity, resource matching, and rank candidate causes.
- [ ] **Prompt 5: AI-Powered Root-Cause Explainer**
  - Integrate LLM to synthesize correlation evidence into actionable incident narratives.
  - Generate remediation recommendations and rollback plans.
- [ ] **Prompt 6: Cloud Cost Forecasting & Real CUR Upload**
  - Support user-uploaded CSV/CUR reports and spend trajectory projections.
