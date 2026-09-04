import { AnomalyItem } from './anomaly';

export type NodeType = 
  | 'ANOMALY'
  | 'SERVICE'
  | 'REGION'
  | 'RESOURCE'
  | 'USAGE'
  | 'TEAM'
  | 'PROJECT'
  | 'DEPLOYMENT'
  | 'EVENT';

export interface InvestigationNode {
  id: string;
  type: NodeType;
  label: string;
  metadata: Record<string, any>;
}

export interface InvestigationEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  strength: number;
  evidence: string[];
}

export interface InvestigationGraphSummary {
  primary_service?: string;
  primary_resource?: string;
  primary_region?: string;
  primary_event?: string;
  strongest_signal: string;
  confidence: number;
  evidence_count: number;
  node_count: number;
  edge_count: number;
}

export interface InvestigationGraphResponse {
  anomaly: AnomalyItem;
  nodes: InvestigationNode[];
  edges: InvestigationEdge[];
  summary: InvestigationGraphSummary;
}
