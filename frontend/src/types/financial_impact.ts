export interface FinancialImpactResponse {
  status: 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';
  current_anomalous_cost: number;
  expected_cost: number;
  excess_cost: number;
  projected_7_day_excess: number;
  projected_30_day_excess: number;
  potential_savings: number;
}
