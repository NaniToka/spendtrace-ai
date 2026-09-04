from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.anomaly import (
    AnomalyListResponseSchema,
    AnomalySeverity,
    AnomalySummaryResponseSchema,
)
from backend.app.schemas.root_cause import RootCauseResponseSchema
from backend.app.schemas.graph import InvestigationGraphResponse
from backend.app.schemas.explanation import ExplanationResponseSchema
from backend.app.schemas.financial_impact import FinancialImpactResponseSchema
from backend.app.schemas.investigation_summary import ExecutiveInvestigationSummarySchema
from backend.app.services.anomaly_service import anomaly_service
from backend.app.services.root_cause_service import root_cause_service
from backend.app.services.graph_service import graph_service
from backend.app.services.explanation_service import explanation_service
from backend.app.services.financial_impact_service import financial_impact_service
from backend.app.services.executive_summary_service import executive_summary_service

router = APIRouter()


@router.get("", response_model=AnomalyListResponseSchema)
def get_anomalies(
    service: Optional[str] = Query(None, description="Filter by AWS service (e.g. AmazonEC2)"),
    region: Optional[str] = Query(None, description="Filter by AWS region (e.g. us-east-1)"),
    team: Optional[str] = Query(None, description="Filter by team tag (e.g. data-platform)"),
    project: Optional[str] = Query(None, description="Filter by project tag (e.g. pipeline-sync)"),
    severity: Optional[AnomalySeverity] = Query(None, description="Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    start_date: Optional[datetime] = Query(None, description="Filter from UTC timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter to UTC timestamp"),
):
    """
    Returns detected cost anomalies ranked by severity and timestamp.
    """
    anomalies = anomaly_service.detect_anomalies(
        service=service,
        region=region,
        team=team,
        project=project,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
    )
    return AnomalyListResponseSchema(
        total_count=len(anomalies),
        anomalies=anomalies,
    )


@router.get("/summary", response_model=AnomalySummaryResponseSchema)
def get_anomalies_summary(
    service: Optional[str] = Query(None, description="Filter summary by AWS service"),
    region: Optional[str] = Query(None, description="Filter summary by AWS region"),
    team: Optional[str] = Query(None, description="Filter summary by team"),
):
    """
    Returns high-level anomaly statistics, severity distribution, total excess spend, and top impacted service.
    """
    return anomaly_service.get_summary(
        service=service,
        region=region,
        team=team,
    )


@router.get("/{anomaly_id}/root-causes", response_model=RootCauseResponseSchema)
def get_anomaly_root_causes(anomaly_id: str):
    """
    Investigates and returns ranked root-cause candidates for a given cost anomaly.
    """
    result = root_cause_service.investigate_anomaly_by_id(anomaly_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Anomaly with ID '{anomaly_id}' not found.")
    return result

@router.get("/{anomaly_id}/investigation-graph", response_model=InvestigationGraphResponse)
def get_anomaly_investigation_graph(anomaly_id: str):
    """
    Returns a causal evidence graph for a given cost anomaly.
    """
    result = graph_service.build_investigation_graph(anomaly_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Anomaly with ID '{anomaly_id}' not found.")
    return result

@router.get("/{anomaly_id}/explanation", response_model=ExplanationResponseSchema)
def get_anomaly_explanation(anomaly_id: str):
    """
    Returns a structured AI explanation for a given cost anomaly based on root causes and graph.
    """
    # We must fetch the upstream dependencies first
    anomalies = anomaly_service.detect_anomalies()
    anomaly = next((a for a in anomalies if a.anomaly_id == anomaly_id), None)
    if not anomaly:
        raise HTTPException(status_code=404, detail=f"Anomaly with ID '{anomaly_id}' not found.")
        
    rc_result = root_cause_service.investigate_anomaly_by_id(anomaly_id)
    candidates = rc_result.candidates if rc_result else []
    
    graph_result = graph_service.build_investigation_graph(anomaly_id)
    if not graph_result:
        # Fallback to an empty graph if not available
        from backend.app.schemas.graph import InvestigationGraphResponse, InvestigationGraphSummary
        graph_result = InvestigationGraphResponse(
            anomaly=anomaly, nodes=[], edges=[], summary=InvestigationGraphSummary(
                strongest_signal="N/A", confidence=0.0, evidence_count=0, node_count=0, edge_count=0
            )
        )
        
    explanation = explanation_service.generate_explanation(anomaly, candidates, graph_result)
    return explanation

@router.get("/{anomaly_id}/financial-impact", response_model=FinancialImpactResponseSchema)
def get_anomaly_financial_impact(anomaly_id: str):
    """
    Returns the financial impact projection and estimated savings for a given anomaly.
    """
    anomalies = anomaly_service.detect_anomalies()
    anomaly = next((a for a in anomalies if a.anomaly_id == anomaly_id), None)
    
    # We allow the service to handle the missing/None anomaly to return INSUFFICIENT_DATA
    # but since it's a 404 in REST context, we can raise it or return the schema. 
    # Returning the schema with INSUFFICIENT_DATA status is safer for UI rendering.
    if not anomaly:
        return financial_impact_service.calculate_impact(None)
        
    return financial_impact_service.calculate_impact(anomaly)

@router.get("/{anomaly_id}/investigation-summary", response_model=ExecutiveInvestigationSummarySchema)
def get_executive_investigation_summary(anomaly_id: str):
    """
    Returns a unified executive dashboard summary for a given anomaly, combining
    root causes, graphs, explanations, and financial impact.
    """
    return executive_summary_service.generate_summary(anomaly_id)
