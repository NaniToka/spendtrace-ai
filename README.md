# COSTRA ⚡

> **"Don't just see the cloud bill. Understand why it changed."**

AI-Powered AWS Cloud Cost Anomaly Detection & Root-Cause Explainer built for the IEEE Genesis Hackathon.

---

## 🎯 Vision & Problem Statement
Engineering teams often notice cloud billing spikes days or weeks too late without knowing which deployment, PR, or misconfigured resource caused it. 

**COSTRA** ingests AWS Cost & Usage Report (CUR) streams and correlates:
$$\text{Billing Spike} \longrightarrow \text{AWS Service} \longrightarrow \text{Region} \longrightarrow \text{Resource} \longrightarrow \text{Team/Tag} \longrightarrow \text{Deployment/Event}$$

---

## 🏗️ Architecture & Project Structure

```
spendtrace-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── billing.py       # Normalized billing records & aggregation endpoints
│   │   │   │   ├── events.py        # Deployments & infra change events endpoint
│   │   │   │   └── health.py        # System health & version status
│   │   │   └── router.py            # API V1 Router
│   │   ├── core/
│   │   │   └── config.py            # App settings
│   │   ├── models/
│   │   │   ├── billing.py           # BillingRecord, ResourceTags, Aggregation models
│   │   │   ├── events.py            # DeploymentEvent, EventType
│   │   │   ├── anomaly.py           # CostAnomaly, AnomalySeverity, AnomalyStatus
│   │   │   └── root_cause.py        # RootCauseCandidate, CorrelationEvidence
│   │   ├── services/
│   │   │   ├── data_generator.py    # Multi-scenario synthetic AWS CUR generator
│   │   │   └── ingestion.py         # Ingestion layer, indexer, and memory store
│   │   └── main.py                  # FastAPI app entry with CORS & Lifespan
│   ├── requirements.txt
│   ├── run.py                       # CLI backend server launcher
│   └── tests/
│       └── test_api.py              # Automated Pytest suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # COSTRA brand identity & live health badge
│   │   │   ├── BillingOverview.jsx  # KPI metrics & daily spend trend curve
│   │   │   ├── TimelineView.jsx     # Deployment timeline & correlation breadcrumbs
│   │   │   └── DataInspection.jsx   # Interactive normalized CUR records table
│   │   ├── services/
│   │   │   └── api.js               # Backend API client
│   │   ├── App.jsx                  # Main dashboard shell
│   │   ├── index.css                # Modern Dark FinOps design system
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```
*API will run at `http://localhost:8000` (Interactive docs: `http://localhost:8000/docs`)*

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run at `http://localhost:5173`*

### 3. Run Automated Tests
```bash
PYTHONPATH=. ./backend/venv/bin/pytest backend/tests/
```

---

## 📊 Synthetic Dataset & Built-in Anomaly Scenarios

1. **Cross-Region NAT Gateway Data Transfer Surge**:
   - *Cause*: Unthrottled Parquet batch replication to `eu-west-1` without VPC endpoint.
   - *Impact*: 28x cost surge on `NatGateway-Bytes` attributed to `data-platform`.
2. **Recursive Lambda Loop**:
   - *Cause*: S3 ObjectCreated listener without prefix filtering on thumbnail generator.
   - *Impact*: 35x invocation spike attributed to `core-api`.
3. **Overprovisioned Benchmark RDS Instance**:
   - *Cause*: Load test replica `db.r5.4xlarge` created with failed auto-termination cron.
   - *Impact*: Uninterrupted $70/day idle cost attributed to `analytics`.
