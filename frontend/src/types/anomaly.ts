export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';

export interface AnomalyItem {
  anomaly_id: string;
  timestamp: string;
  service: string;
  region: string;
  resource_id: string;
  team: string;
  project: string;
  actual_cost: number;
  expected_cost: number;
  absolute_delta: number;
  percentage_delta: number;
  anomaly_score: number;
  severity: AnomalySeverity;
  explanation: string;
}

export interface AnomalyListResponse {
  total_count: number;
  anomalies: AnomalyItem[];
}

export interface AnomalySummaryResponse {
  total_anomalies: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_anomalous_spend: number;
  highest_anomaly: AnomalyItem | null;
  most_affected_service: string | null;
}
