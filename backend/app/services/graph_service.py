from typing import Optional
from backend.app.schemas.anomaly import AnomalyItemSchema
from backend.app.schemas.root_cause import RootCauseCategory
from backend.app.schemas.graph import (
    InvestigationNode,
    InvestigationEdge,
    InvestigationGraphSummary,
    InvestigationGraphResponse,
    NodeType
)
from backend.app.services.root_cause_service import root_cause_service


class InvestigationGraphService:
    def build_investigation_graph(self, anomaly_id: str) -> Optional[InvestigationGraphResponse]:
        # 1. Run root-cause correlation analysis
        rc_response = root_cause_service.investigate_anomaly_by_id(anomaly_id)
        if not rc_response:
            return None
            
        anomaly = rc_response.anomaly
        candidates = rc_response.candidates
        summary = rc_response.investigation_summary
        
        nodes = []
        edges = []
        
        # Helper to avoid duplicate nodes
        added_nodes = set()
        def add_node(n: InvestigationNode):
            if n.id not in added_nodes:
                nodes.append(n)
                added_nodes.add(n.id)
                
        # Base Anomaly Node
        anomaly_node = InvestigationNode(
            id=f"anomaly_{anomaly.anomaly_id}",
            type=NodeType.ANOMALY,
            label=f"Cost Spike (+${anomaly.absolute_delta:.2f})",
            metadata={"severity": anomaly.severity.value, "timestamp": anomaly.timestamp.isoformat()}
        )
        add_node(anomaly_node)
        
        # Parse Candidates to build graph
        primary_event = None
        strongest_confidence = 0.0
        
        for cand in candidates:
            if cand.confidence > strongest_confidence:
                strongest_confidence = cand.confidence
                
            node_id = f"cand_{cand.category.value}_{cand.rank}"
            
            # Map RootCauseCategory to NodeType
            n_type = getattr(NodeType, cand.category.value, NodeType.EVENT)
            
            # Construct node based on category
            if cand.category == RootCauseCategory.SERVICE:
                label = cand.service or anomaly.service
                rel_type = "AFFECTED_SERVICE"
            elif cand.category == RootCauseCategory.REGION:
                label = cand.region or anomaly.region
                rel_type = "LOCATED_IN"
            elif cand.category == RootCauseCategory.RESOURCE:
                label = (cand.resource_id or anomaly.resource_id or "Unknown Resource").split("/")[-1].split(":")[-1]
                rel_type = "USES_RESOURCE"
            elif cand.category == RootCauseCategory.TEAM:
                label = cand.team or anomaly.team
                rel_type = "OWNED_BY"
            elif cand.category == RootCauseCategory.PROJECT:
                label = cand.project or anomaly.project
                rel_type = "PART_OF_PROJECT"
            elif cand.category == RootCauseCategory.USAGE:
                label = f"Usage Surge (+{cand.usage_delta_percentage:.1f}%)"
                rel_type = "USAGE_DRIVEN"
            elif cand.category in [RootCauseCategory.DEPLOYMENT, RootCauseCategory.EVENT]:
                label = cand.title
                if cand.rank == 1:
                    primary_event = label
                
                # Determine relationship strength text
                if cand.temporal_correlation == "STRONG":
                    rel_type = "STRONG_CORRELATION"
                elif cand.temporal_correlation == "MODERATE":
                    rel_type = "MODERATE_CORRELATION"
                else:
                    rel_type = "WEAK_CORRELATION"
            else:
                label = cand.title
                rel_type = "ASSOCIATED_WITH"
                
            # Create Node
            node = InvestigationNode(
                id=node_id,
                type=n_type,
                label=label,
                metadata={
                    "confidence": cand.confidence,
                    "rank": cand.rank,
                    "delta": cand.cost_delta
                }
            )
            add_node(node)
            
            # Create Edge from Node to Anomaly (or vice versa depending on flow)
            # Flow: Deployment -> Usage -> Resource -> Service -> Anomaly
            # For simplicity in this graph, we center around the Anomaly, but direct the edges causally where possible.
            # E.g. Service -> Anomaly, Resource -> Service, etc.
            
            # Default: Node -> Anomaly
            source_id = node_id
            target_id = anomaly_node.id
            
            # Link evidence
            edge = InvestigationEdge(
                id=f"edge_{source_id}_{target_id}",
                source=source_id,
                target=target_id,
                relationship=rel_type,
                strength=cand.confidence,
                evidence=cand.evidence
            )
            edges.append(edge)
            
        # Post-process edges to create a chain if possible (e.g. Event -> Resource -> Service -> Anomaly)
        # For this prototype, we'll keep the star schema (everything points to anomaly) but the frontend will lay it out hierarchically.

        graph_summary = InvestigationGraphSummary(
            primary_service=summary.primary_service,
            primary_resource=summary.primary_resource,
            primary_region=summary.primary_region,
            primary_event=primary_event,
            strongest_signal=summary.strongest_signal,
            confidence=strongest_confidence,
            evidence_count=sum(len(e.evidence) for e in edges),
            node_count=len(nodes),
            edge_count=len(edges)
        )
        
        return InvestigationGraphResponse(
            anomaly=anomaly,
            nodes=nodes,
            edges=edges,
            summary=graph_summary
        )

graph_service = InvestigationGraphService()
