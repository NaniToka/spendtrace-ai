const API_BASE = '/api/v1';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchBillingSummary() {
  const res = await fetch(`${API_BASE}/billing/summary`);
  if (!res.ok) throw new Error(`Failed to fetch billing summary: ${res.statusText}`);
  return res.json();
}

export async function fetchBillingRecords(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/billing/records${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch billing records: ${res.statusText}`);
  return res.json();
}

export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error(`Failed to fetch deployment events: ${res.statusText}`);
  return res.json();
}
