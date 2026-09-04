import { BillingResponse } from '../types/billing';
import { HealthResponse } from '../types/health';
import { AnomalyListResponse, AnomalySummaryResponse } from '../types/anomaly';
import { RootCauseResponse } from '../types/root_cause';
import { InvestigationGraphResponse } from '../types/graph';
import { ExplanationResponse } from '../types/explanation';

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchBilling(params?: Record<string, string>): Promise<BillingResponse> {
  const query = params ? new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/billing${query ? `?${query}` : ''}`);
  if (!res.ok) {
    throw new Error(`Billing fetch failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchAnomalies(params?: Record<string, string>): Promise<AnomalyListResponse> {
  const query = params ? new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/anomalies${query ? `?${query}` : ''}`);
  if (!res.ok) {
    throw new Error(`Anomalies fetch failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchAnomaliesSummary(params?: Record<string, string>): Promise<AnomalySummaryResponse> {
  const query = params ? new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/anomalies/summary${query ? `?${query}` : ''}`);
  if (!res.ok) {
    throw new Error(`Anomalies summary fetch failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchRootCauses(anomalyId: string): Promise<RootCauseResponse> {
  const res = await fetch(`${API_BASE}/anomalies/${encodeURIComponent(anomalyId)}/root-causes`);
  if (!res.ok) {
    throw new Error(`Failed to fetch root causes for ${anomalyId}: ${res.status}`);
  }
  return res.json();
}

export async function fetchInvestigationGraph(anomalyId: string): Promise<InvestigationGraphResponse> {
  const res = await fetch(`${API_BASE}/anomalies/${encodeURIComponent(anomalyId)}/investigation-graph`);
  if (!res.ok) {
    throw new Error(`Failed to fetch investigation graph for ${anomalyId}: ${res.status}`);
  }
  return res.json();
}

export async function fetchExplanation(anomalyId: string): Promise<ExplanationResponse> {
  const res = await fetch(`${API_BASE}/anomalies/${encodeURIComponent(anomalyId)}/explanation`);
  if (!res.ok) {
    throw new Error(`Failed to fetch explanation for ${anomalyId}: ${res.status}`);
  }
  return res.json();
}
