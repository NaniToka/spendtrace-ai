import { AnomalyItem } from './anomaly';

export type RootCauseCategory =
  | 'SERVICE'
  | 'REGION'
  | 'RESOURCE'
  | 'TEAM'
  | 'PROJECT'
  | 'USAGE'
  | 'DEPLOYMENT'
  | 'EVENT';

export interface RootCauseCandidate {
  anomaly_id: string;
  rank: number;
  category: RootCauseCategory;
  title: string;
  description: string;
  service?: string;
  region?: string;
  resource_id?: string;
  team?: string;
  project?: string;
  deployment_id?: string;
  cost_before: number;
  cost_after: number;
  cost_delta: number;
  contribution_percentage: number;
  usage_delta_percentage: number;
  temporal_correlation: 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE' | string;
  evidence_score: number;
  confidence: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string[];
}

export interface InvestigationSummary {
  primary_service: string;
  primary_region: string;
  primary_resource: string;
  primary_team: string;
  primary_project: string;
  strongest_signal: string;
  total_excess_spend: number;
  correlated_events_count: number;
}

export interface RootCauseResponse {
  anomaly: AnomalyItem;
  candidates: RootCauseCandidate[];
  investigation_summary: InvestigationSummary;
}
