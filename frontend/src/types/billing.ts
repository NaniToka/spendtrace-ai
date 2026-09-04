export interface BillingRecord {
  record_id: string;
  timestamp: string;
  service: string;
  region: string;
  resource_id: string;
  usage_type: string;
  usage_quantity: number;
  unit_cost: number;
  total_cost: number;
  team: string;
  project: string;
  environment: string;
  deployment_id: string | null;
}

export interface BillingResponse {
  total_count: number;
  records: BillingRecord[];
}
