from typing import Optional
from backend.app.schemas.investigation_summary import ExecutiveInvestigationSummarySchema
from backend.app.services.anomaly_service import anomaly_service
from backend.app.services.root_cause_service import root_cause_service
from backend.app.services.graph_service import graph_service
from backend.app.services.explanation_service import explanation_service
from backend.app.services.financial_impact_service import financial_impact_service


class ExecutiveSummaryService:
    def generate_summary(self, anomaly_id: str) -> ExecutiveInvestigationSummarySchema:
        # 1. Get Anomaly
        anomalies = anomaly_service.detect_anomalies()
        anomaly = next((a for a in anomalies if a.anomaly_id == anomaly_id), None)
        
        if not anomaly:
            return ExecutiveInvestigationSummarySchema(
                status="NOT_FOUND",
            )
            
        # 2. Get Root Causes
        try:
            rc_response = root_cause_service.analyze_anomaly(anomaly)
            candidates = rc_response.candidates[:3] if rc_response else []
        except Exception:
            candidates = []

        # 3. Get Investigation Graph
        try:
            graph_response = graph_service.build_investigation_graph(anomaly.anomaly_id)
        except Exception:
            graph_response = None
            
        # 4. Get Explanation
        try:
            explanation = explanation_service.generate_explanation(anomaly, candidates, graph_response)
        except Exception:
            explanation = None
            
        # 5. Get Financial Impact
        try:
            financial_impact = financial_impact_service.calculate_impact(anomaly)
        except Exception:
            financial_impact = None
            
        status = "COMPLETE" if candidates and graph_response and explanation and financial_impact else "PARTIAL_DATA"
            
        return ExecutiveInvestigationSummarySchema(
            status=status,
            anomaly=anomaly,
            top_root_causes=candidates,
            explanation=explanation,
            financial_impact=financial_impact,
            graph=graph_response
        )

executive_summary_service = ExecutiveSummaryService()
