from typing import Optional
from backend.app.schemas.anomaly import AnomalyItemSchema
from backend.app.schemas.financial_impact import FinancialImpactResponseSchema

class FinancialImpactService:
    def calculate_impact(self, anomaly: Optional[AnomalyItemSchema]) -> FinancialImpactResponseSchema:
        if not anomaly or anomaly.absolute_delta <= 0:
            return FinancialImpactResponseSchema(
                status="INSUFFICIENT_DATA",
                current_anomalous_cost=0.0,
                expected_cost=0.0,
                excess_cost=0.0,
                projected_7_day_excess=0.0,
                projected_30_day_excess=0.0,
                potential_savings=0.0,
            )
            
        current = anomaly.actual_cost
        expected = anomaly.expected_cost
        excess = anomaly.absolute_delta
        
        proj_7 = excess * 7.0
        proj_30 = excess * 30.0
        
        # Savings estimate: We assume an immediate remediation stops the excess spend, 
        # saving the projected 30-day accumulation.
        savings = proj_30
        
        return FinancialImpactResponseSchema(
            status="SUFFICIENT_DATA",
            current_anomalous_cost=round(current, 2),
            expected_cost=round(expected, 2),
            excess_cost=round(excess, 2),
            projected_7_day_excess=round(proj_7, 2),
            projected_30_day_excess=round(proj_30, 2),
            potential_savings=round(savings, 2),
        )

financial_impact_service = FinancialImpactService()
