import { AnomalyItem } from './anomaly';
import { RootCauseCandidate } from './root_cause';
import { ExplanationResponse } from './explanation';
import { FinancialImpactResponse } from './financial_impact';
import { InvestigationGraphResponse } from './graph';

export interface ExecutiveSummaryResponse {
  status: string;
  anomaly?: AnomalyItem;
  top_root_causes: RootCauseCandidate[];
  explanation?: ExplanationResponse;
  financial_impact?: FinancialImpactResponse;
  graph?: InvestigationGraphResponse;
}
