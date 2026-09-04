from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from backend.app.core.config import settings
from backend.app.schemas.anomaly import AnomalyItemSchema
from backend.app.schemas.billing import BillingItemSchema
from backend.app.schemas.root_cause import (
    InvestigationSummarySchema,
    RootCauseCandidateSchema,
    RootCauseCategory,
    RootCauseResponseSchema,
)
from backend.app.services.anomaly_service import anomaly_service
from backend.app.services.billing_service import billing_service
from backend.app.services.event_service import event_service


def _res_matches(res_a: Optional[str], res_b: Optional[str]) -> bool:
    if not res_a or not res_b:
        return False
    if res_a == res_b:
        return True
    short_a = res_a.split("/")[-1].split(":")[-1]
    short_b = res_b.split("/")[-1].split(":")[-1]
    return short_a == short_b or res_a.endswith(short_b) or res_b.endswith(short_a)


class RootCauseAnalysisService:
    def __init__(self):
        self.weights = settings.ROOT_CAUSE

    def investigate_anomaly_by_id(self, anomaly_id: str) -> Optional[RootCauseResponseSchema]:
        """Looks up an anomaly by ID and runs full root cause correlation analysis."""
        anomalies = anomaly_service.detect_anomalies()
        target_anomaly = next((a for a in anomalies if a.anomaly_id == anomaly_id), None)
        if not target_anomaly:
            return None

        return self.analyze_anomaly(target_anomaly)

    def analyze_anomaly(
        self,
        anomaly: AnomalyItemSchema,
        records: Optional[List[BillingItemSchema]] = None,
    ) -> RootCauseResponseSchema:
        """
        Performs multi-dimensional contribution analysis and deterministic evidence scoring
        to identify and rank root-cause candidates for a given anomaly.
        """
        if records is None:
            records = billing_service.get_records()

        # 1. Separate baseline records from anomaly date observations
        anomaly_date_str = anomaly.timestamp.strftime("%Y-%m-%d")
        day_records = [r for r in records if r.timestamp.strftime("%Y-%m-%d") == anomaly_date_str]
        baseline_records = [r for r in records if r.timestamp < anomaly.timestamp]

        # 2. Multi-Dimensional Contribution Analysis
        service_contributions = self._calc_dimension_contributions(day_records, baseline_records, dim_fn=lambda r: r.service)
        region_contributions = self._calc_dimension_contributions(day_records, baseline_records, dim_fn=lambda r: r.region)
        resource_contributions = self._calc_dimension_contributions(day_records, baseline_records, dim_fn=lambda r: r.resource_id)
        team_contributions = self._calc_dimension_contributions(day_records, baseline_records, dim_fn=lambda r: r.team)
        project_contributions = self._calc_dimension_contributions(day_records, baseline_records, dim_fn=lambda r: r.project)

        # 3. Usage Delta Analysis for the affected resource
        target_resource_records = [r for r in day_records if _res_matches(r.resource_id, anomaly.resource_id)]
        target_baseline_records = [r for r in baseline_records if _res_matches(r.resource_id, anomaly.resource_id)]

        usage_actual = sum(r.usage_quantity for r in target_resource_records)
        base_days = len(set(r.timestamp.strftime("%Y-%m-%d") for r in target_baseline_records)) or 1
        usage_baseline = sum(r.usage_quantity for r in target_baseline_records) / base_days if target_baseline_records else 0.0
        
        if usage_baseline > 0:
            usage_delta_pct = ((usage_actual - usage_baseline) / usage_baseline) * 100.0
        else:
            usage_delta_pct = 100.0 if usage_actual > 0 else 0.0

        usage_type = target_resource_records[0].usage_type if target_resource_records else "Usage"

        # 4. Temporal Correlation with Events / Deployments
        events = event_service.get_events()
        correlated_events = self._correlate_events(anomaly, events)

        # 5. Build Root Cause Candidates
        candidates: List[RootCauseCandidateSchema] = []

        # Candidate A: Correlated Deployment / Change Event (if present)
        for ev, temp_corr, proximity_score in correlated_events:
            ev_evidence = [
                f"Deployment '{ev.event_id}' by {ev.author} occurred in proximity ({ev.timestamp.replace('T', ' ').replace('Z', ' UTC')}).",
                f"Commit {ev.commit_sha or 'N/A'}: '{ev.title}'.",
                f"Targets service {ev.service} and team {ev.team}.",
            ]
            if _res_matches(ev.resource_id, anomaly.resource_id):
                ev_evidence.append(f"Direct resource match on {anomaly.resource_id.split('/')[-1]}.")

            score, confidence, level = self._calculate_evidence_score(
                cost_contrib_pct=min(100.0, max(0.0, anomaly.percentage_delta / 10.0)),
                usage_delta_pct=usage_delta_pct,
                temporal_score=proximity_score,
                concentration_pct=100.0,
                is_direct_event=True,
            )

            candidates.append(
                RootCauseCandidateSchema(
                    anomaly_id=anomaly.anomaly_id,
                    rank=0,  # will be assigned after sorting
                    category=RootCauseCategory.DEPLOYMENT if ev.event_type == "DEPLOYMENT" else RootCauseCategory.EVENT,
                    title=f"Deployment '{ev.event_id}': {ev.title}",
                    description=f"{ev.description} (Author: {ev.author}). Strong temporal correlation observed with the onset of the spend surge.",
                    service=ev.service,
                    region=ev.region,
                    resource_id=ev.resource_id or anomaly.resource_id,
                    team=ev.team,
                    project=ev.project,
                    deployment_id=ev.event_id,
                    cost_before=anomaly.expected_cost,
                    cost_after=anomaly.actual_cost,
                    cost_delta=anomaly.absolute_delta,
                    contribution_percentage=100.0,
                    usage_delta_percentage=round(usage_delta_pct, 1),
                    temporal_correlation=temp_corr,
                    evidence_score=score,
                    confidence=confidence,
                    confidence_level=level,
                    evidence=ev_evidence,
                )
            )

        # Candidate B: Resource Concentration Candidate
        top_res = resource_contributions[0] if resource_contributions else None
        if top_res:
            res_short = top_res["dimension"].split("/")[-1]
            res_evidence = [
                f"{top_res['contribution_percentage']:.1f}% of anomalous cost delta originated from resource '{res_short}'.",
                f"Daily spend escalated from ${top_res['cost_before']:.2f} to ${top_res['cost_after']:.2f} (+${top_res['cost_delta']:.2f}).",
                f"Resource is owned by team '{anomaly.team}' under project '{anomaly.project}'.",
            ]
            r_score, r_conf, r_level = self._calculate_evidence_score(
                cost_contrib_pct=top_res["contribution_percentage"],
                usage_delta_pct=usage_delta_pct,
                temporal_score=0.7 if correlated_events else 0.4,
                concentration_pct=top_res["contribution_percentage"],
                is_direct_event=False,
            )
            candidates.append(
                RootCauseCandidateSchema(
                    anomaly_id=anomaly.anomaly_id,
                    rank=0,
                    category=RootCauseCategory.RESOURCE,
                    title=f"Resource Spend Surge: {res_short}",
                    description=f"Isolated high spend concentration on {top_res['dimension']} accounting for {top_res['contribution_percentage']:.1f}% of overall variance.",
                    service=anomaly.service,
                    region=anomaly.region,
                    resource_id=top_res["dimension"],
                    team=anomaly.team,
                    project=anomaly.project,
                    deployment_id=correlated_events[0][0].event_id if correlated_events else None,
                    cost_before=top_res["cost_before"],
                    cost_after=top_res["cost_after"],
                    cost_delta=top_res["cost_delta"],
                    contribution_percentage=top_res["contribution_percentage"],
                    usage_delta_percentage=round(usage_delta_pct, 1),
                    temporal_correlation=correlated_events[0][1] if correlated_events else "NONE",
                    evidence_score=r_score,
                    confidence=r_conf,
                    confidence_level=r_level,
                    evidence=res_evidence,
                )
            )

        # Candidate C: Usage Surge Candidate
        if usage_delta_pct > 20.0 or anomaly.percentage_delta > 50.0:
            usage_evidence = [
                f"Physical usage metric '{usage_type}' surged by +{usage_delta_pct:.1f}% (from {usage_baseline:.1f} to {usage_actual:.1f} units).",
                f"Corresponds to unexpected continuous utilization without unit cost rate inflation.",
            ]
            u_score, u_conf, u_level = self._calculate_evidence_score(
                cost_contrib_pct=min(100.0, max(0.0, anomaly.percentage_delta / 10.0)),
                usage_delta_pct=usage_delta_pct,
                temporal_score=0.6 if correlated_events else 0.3,
                concentration_pct=80.0,
                is_direct_event=False,
            )
            candidates.append(
                RootCauseCandidateSchema(
                    anomaly_id=anomaly.anomaly_id,
                    rank=0,
                    category=RootCauseCategory.USAGE,
                    title=f"Unusual Usage Surge: {usage_type} (+{usage_delta_pct:.1f}%)",
                    description=f"Physical telemetry indicates a substantial +{usage_delta_pct:.1f}% consumption jump in {usage_type} driving the financial spike.",
                    service=anomaly.service,
                    region=anomaly.region,
                    resource_id=anomaly.resource_id,
                    team=anomaly.team,
                    project=anomaly.project,
                    deployment_id=None,
                    cost_before=anomaly.expected_cost,
                    cost_after=anomaly.actual_cost,
                    cost_delta=anomaly.absolute_delta,
                    contribution_percentage=100.0,
                    usage_delta_percentage=round(usage_delta_pct, 1),
                    temporal_correlation=correlated_events[0][1] if correlated_events else "NONE",
                    evidence_score=u_score,
                    confidence=u_conf,
                    confidence_level=u_level,
                    evidence=usage_evidence,
                )
            )

        # Candidate D: Service Contribution Candidate
        top_svc = service_contributions[0] if service_contributions else None
        if top_svc and top_svc["cost_delta"] > 0:
            svc_evidence = [
                f"{top_svc['dimension']} drove {top_svc['contribution_percentage']:.1f}% of total cloud spend increase on this date.",
                f"Service baseline moved from ${top_svc['cost_before']:.2f} to ${top_svc['cost_after']:.2f} (+${top_svc['cost_delta']:.2f}).",
            ]
            s_score, s_conf, s_level = self._calculate_evidence_score(
                cost_contrib_pct=top_svc["contribution_percentage"],
                usage_delta_pct=usage_delta_pct,
                temporal_score=0.5 if correlated_events else 0.2,
                concentration_pct=top_svc["contribution_percentage"],
                is_direct_event=False,
            )
            candidates.append(
                RootCauseCandidateSchema(
                    anomaly_id=anomaly.anomaly_id,
                    rank=0,
                    category=RootCauseCategory.SERVICE,
                    title=f"Service Concentration: {top_svc['dimension']}",
                    description=f"{top_svc['dimension']} represents the predominant cost driver across the AWS account during the anomaly period.",
                    service=top_svc["dimension"],
                    region=anomaly.region,
                    resource_id=None,
                    team=anomaly.team,
                    project=anomaly.project,
                    deployment_id=None,
                    cost_before=top_svc["cost_before"],
                    cost_after=top_svc["cost_after"],
                    cost_delta=top_svc["cost_delta"],
                    contribution_percentage=top_svc["contribution_percentage"],
                    usage_delta_percentage=round(usage_delta_pct, 1),
                    temporal_correlation="MODERATE" if correlated_events else "NONE",
                    evidence_score=s_score,
                    confidence=s_conf,
                    confidence_level=s_level,
                    evidence=svc_evidence,
                )
            )

        # Candidate E: Team & Project Attribution Candidate
        top_tm = team_contributions[0] if team_contributions else None
        if top_tm and top_tm["cost_delta"] > 0:
            team_evidence = [
                f"Team '{top_tm['dimension']}' was responsible for {top_tm['contribution_percentage']:.1f}% of the anomalous delta.",
                f"Project: '{anomaly.project}'.",
            ]
            t_score, t_conf, t_level = self._calculate_evidence_score(
                cost_contrib_pct=top_tm["contribution_percentage"],
                usage_delta_pct=usage_delta_pct,
                temporal_score=0.5 if correlated_events else 0.2,
                concentration_pct=top_tm["contribution_percentage"],
                is_direct_event=False,
            )
            candidates.append(
                RootCauseCandidateSchema(
                    anomaly_id=anomaly.anomaly_id,
                    rank=0,
                    category=RootCauseCategory.TEAM,
                    title=f"Team Attribution: {top_tm['dimension']} ({anomaly.project})",
                    description=f"Cost surge strongly localized to resources tagged with team '{top_tm['dimension']}' under project '{anomaly.project}'.",
                    service=anomaly.service,
                    region=anomaly.region,
                    resource_id=None,
                    team=top_tm["dimension"],
                    project=anomaly.project,
                    deployment_id=correlated_events[0][0].event_id if correlated_events else None,
                    cost_before=top_tm["cost_before"],
                    cost_after=top_tm["cost_after"],
                    cost_delta=top_tm["cost_delta"],
                    contribution_percentage=top_tm["contribution_percentage"],
                    usage_delta_percentage=round(usage_delta_pct, 1),
                    temporal_correlation="MODERATE" if correlated_events else "NONE",
                    evidence_score=t_score,
                    confidence=t_conf,
                    confidence_level=t_level,
                    evidence=team_evidence,
                )
            )

        # 6. Sort Candidates by Evidence Score & Confidence descending, then assign rank
        candidates.sort(key=lambda c: (c.evidence_score, c.confidence), reverse=True)
        for idx, cand in enumerate(candidates, start=1):
            cand.rank = idx

        # 7. Generate Investigation Summary
        top_cand = candidates[0] if candidates else None
        strongest_signal = (
            f"Strong temporal correlation with {top_cand.title} (+{usage_delta_pct:.1f}% usage increase in {anomaly.service})."
            if top_cand else f"Cost surge detected in {anomaly.service}."
        )

        summary = InvestigationSummarySchema(
            primary_service=service_contributions[0]["dimension"] if service_contributions else anomaly.service,
            primary_region=region_contributions[0]["dimension"] if region_contributions else anomaly.region,
            primary_resource=resource_contributions[0]["dimension"] if resource_contributions else anomaly.resource_id,
            primary_team=team_contributions[0]["dimension"] if team_contributions else anomaly.team,
            primary_project=project_contributions[0]["dimension"] if project_contributions else anomaly.project,
            strongest_signal=strongest_signal,
            total_excess_spend=anomaly.absolute_delta,
            correlated_events_count=len(correlated_events),
        )

        return RootCauseResponseSchema(
            anomaly=anomaly,
            candidates=candidates,
            investigation_summary=summary,
        )

    def _calc_dimension_contributions(
        self,
        day_records: List[BillingItemSchema],
        baseline_records: List[BillingItemSchema],
        dim_fn,
    ) -> List[Dict[str, Any]]:
        """Calculates cost delta and percentage contribution for any arbitrary dimension."""
        day_map = defaultdict(float)
        for r in day_records:
            day_map[dim_fn(r)] += float(r.total_cost)

        base_map = defaultdict(float)
        base_days_count = len(set(r.timestamp.strftime("%Y-%m-%d") for r in baseline_records)) or 1
        for r in baseline_records:
            base_map[dim_fn(r)] += float(r.total_cost) / base_days_count

        all_dims = set(day_map.keys()).union(base_map.keys())
        contributions = []

        total_day_cost = sum(day_map.values())
        total_base_cost = sum(base_map.values())
        total_delta = max(0.01, total_day_cost - total_base_cost)

        for dim in all_dims:
            c_after = day_map.get(dim, 0.0)
            c_before = base_map.get(dim, 0.0)
            delta = c_after - c_before
            contrib_pct = max(0.0, min(100.0, (delta / total_delta) * 100.0)) if delta > 0 else 0.0

            contributions.append({
                "dimension": dim,
                "cost_before": round(c_before, 2),
                "cost_after": round(c_after, 2),
                "cost_delta": round(delta, 2),
                "contribution_percentage": round(contrib_pct, 1),
            })

        contributions.sort(key=lambda x: x["cost_delta"], reverse=True)
        return contributions

    def _correlate_events(
        self,
        anomaly: AnomalyItemSchema,
        events: List[Any],
    ) -> List[Tuple[Any, str, float]]:
        """
        Finds deployment/infra events temporally close to the anomaly timestamp
        and computes proximity scores.
        """
        matched = []
        anomaly_dt = anomaly.timestamp

        for ev in events:
            # Parse event timestamp
            try:
                ev_dt = datetime.fromisoformat(ev.timestamp.replace("Z", "+00:00"))
            except Exception:
                continue

            # Check time delta in hours
            diff_hours = abs((anomaly_dt - ev_dt).total_seconds()) / 3600.0

            # Proximity scoring
            if diff_hours <= 24.0:
                is_res_match = _res_matches(ev.resource_id, anomaly.resource_id)
                is_svc_team_match = (ev.service.lower() == anomaly.service.lower() and ev.team.lower() == anomaly.team.lower())

                if is_res_match or (is_svc_team_match and diff_hours <= 12.0):
                    matched.append((ev, "STRONG", 1.0))
                elif is_svc_team_match or diff_hours <= 24.0:
                    matched.append((ev, "MODERATE", 0.7))
                else:
                    matched.append((ev, "WEAK", 0.3))
            elif diff_hours <= 48.0:
                if ev.service.lower() == anomaly.service.lower() or ev.team.lower() == anomaly.team.lower():
                    matched.append((ev, "MODERATE", 0.5))

        matched.sort(key=lambda x: x[2], reverse=True)
        return matched

    def _calculate_evidence_score(
        self,
        cost_contrib_pct: float,
        usage_delta_pct: float,
        temporal_score: float,
        concentration_pct: float,
        is_direct_event: bool = False,
    ) -> Tuple[float, float, str]:
        """
        Computes a deterministic evidence score and confidence rating using central weights.
        """
        w = self.weights

        # Normalized inputs 0.0 - 1.0
        c_score = min(1.0, max(0.0, cost_contrib_pct / 100.0))
        u_score = min(1.0, max(0.0, usage_delta_pct / 200.0))  # 200%+ usage is max signal
        t_score = min(1.0, max(0.0, temporal_score))
        k_score = min(1.0, max(0.0, concentration_pct / 100.0))

        # Composite score
        raw_score = (
            (w.COST_CONTRIBUTION_WEIGHT * c_score)
            + (w.USAGE_DELTA_WEIGHT * u_score)
            + (w.TEMPORAL_PROXIMITY_WEIGHT * t_score)
            + (w.CONCENTRATION_WEIGHT * k_score)
        )

        # Direct event bonus for verified deployment link
        if is_direct_event and temporal_score >= 0.7:
            raw_score = min(1.0, raw_score + 0.15)

        confidence = round(raw_score, 2)
        score_100 = round(raw_score * 100.0, 1)

        if confidence >= w.CONFIDENCE_HIGH:
            level = "HIGH"
        elif confidence >= w.CONFIDENCE_MEDIUM:
            level = "MEDIUM"
        else:
            level = "LOW"

        return score_100, confidence, level


root_cause_service = RootCauseAnalysisService()
