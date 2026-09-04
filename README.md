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
│   │   │       │   ├── billing.py       # GET /api/v1/billing (Normalized records)
│   │   │       │   └── health.py        # GET /api/v1/health (System status)
│   │   │       └── router.py            # API V1 Router
│   │   ├── core/
│   │   │   └── config.py                # App configuration & CORS settings
│   │   ├── data/
│   │   │   └── synthetic_billing.json   # Local normalized synthetic AWS dataset
│   │   ├── models/                      # Domain definitions
│   │   ├── schemas/                     # Pydantic request/response schemas
│   │   │   ├── billing.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   └── billing_service.py       # Billing loader & filtering service
│   │   └── main.py                      # FastAPI application entrypoint
│   ├── requirements.txt
│   └── tests/
│       └── test_api.py                  # Automated Pytest suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx               # Product branding & live backend status
│   │   │   ├── Sidebar.tsx              # Workspace navigation sidebar
│   │   │   ├── CostSummary.tsx          # Total spend & top service/team KPIs
│   │   │   ├── AnomalySection.tsx       # Anomaly engine feature placeholder
│   │   │   └── RootCauseSection.tsx     # Root-cause correlation preview placeholder
│   │   ├── pages/
│   │   │   └── OverviewPage.tsx         # Dashboard overview & billing table
│   │   ├── services/
│   │   │   └── api.ts                   # Type-safe API client
│   │   ├── types/
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

## 📊 5. Synthetic Dataset & Anomaly Scenario

The synthetic dataset in [`backend/app/data/synthetic_billing.json`](file:///Users/tokanani/spendtrace-ai/backend/app/data/synthetic_billing.json) models normalized AWS billing dimensions:
- `timestamp`: UTC date/hour
- `service`: AWS service (`AmazonEC2`, `AmazonRDS`)
- `region`: AWS region (`us-east-1`)
- `resource_id`: AWS ARN (`arn:aws:ec2:us-east-1:123456789012:natgateway/nat-0a1b2c3d4e5f`)
- `usage_type`: `NatGateway-Bytes`, `BoxUsage:c6i.2xlarge`, `Aurora:ServerlessV2Usage`
- `usage_quantity`, `unit_cost`, `total_cost`
- `team`, `project`, `environment`
- `deployment_id`: Linked deployment identifier (`dep-7f9b8c2`)

### Designed Scenario:
1. **Baseline Phase** (Aug 25 – Aug 28):
   - NAT Gateway normal data transfer cost is stable at **~$4.20/day** (93 GB/day).
2. **Deployment Event** (Aug 29):
   - Engineering deployment `dep-7f9b8c2` by `data-platform` enables cross-region database replication over public NAT.
3. **Anomaly Surge** (Aug 29 – Aug 30):
   - NAT Gateway data transfer spikes **34x to ~$145.00/day** (3,200 GB/day), creating a distinct cost anomaly linked directly to deployment `dep-7f9b8c2`.

---

## 📈 6. Current Implementation Status

| Component | Status | Description |
|---|---|---|
| **Backend API** | ✅ Completed | FastAPI app with `/api/v1/health` and `/api/v1/billing` |
| **Pydantic Schemas** | ✅ Completed | Type-safe schemas with validation and documentation |
| **Local Data Store** | ✅ Completed | Local JSON dataset with controlled anomaly scenario |
| **Frontend Shell** | ✅ Completed | React + TypeScript + Vite with sidebar and header |
| **Cost Summary Cards** | ✅ Completed | Live calculation of spend, top service, and top team |
| **Placeholders** | ✅ Completed | Clean, structured UI shells for Anomaly & Root Cause |
| **Test Suite** | ✅ Completed | Pytest validation with 100% pass rate |

---

## 🔮 7. Future Roadmap

- [ ] **Prompt 3: Statistical Anomaly Detection Engine**
  - Implement rolling baseline variance calculations and Z-Score spike detection.
  - Compute excess USD spend impact and anomaly severity tags.
- [ ] **Prompt 4: Deployment & Log Correlation**
  - Ingest deployment timelines and git commit diffs.
  - Correlate temporal proximity and resource/tag matches.
- [ ] **Prompt 5: AI-Powered Root-Cause Explainer**
  - Integrate LLM to synthesize correlation evidence into actionable incident narratives.
  - Generate remediation recommendations and rollback plans.
- [ ] **Prompt 6: Cloud Cost Forecasting & Real CUR Upload**
  - Support user-uploaded CSV/CUR reports and spend trajectory projections.
