import { BillingResponse } from '../types/billing';
import { HealthResponse } from '../types/health';

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
