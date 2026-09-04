import math
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from backend.app.core.config import settings
from backend.app.schemas.anomaly import (
    AnomalyItemSchema,
    AnomalySeverity,
    AnomalySummaryResponseSchema,
)
from backend.app.schemas.billing import BillingItemSchema
from backend.app.services.billing_service import billing_service

SEVERITY_ORDER = {
    AnomalySeverity.CRITICAL: 4,
    AnomalySeverity.HIGH: 3,
    AnomalySeverity.MEDIUM: 2,
    AnomalySeverity.LOW: 1,
    AnomalySeverity.NORMAL: 0,
}


class AnomalyDetectionService:
    def __init__(self):
        self.thresholds = settings.ANOMALY

    def detect_anomalies(
        self,
        records: Optional[List[BillingItemSchema]] = None,
        service: Optional[str] = None,
        region: Optional[str] = None,
        team: Optional[str] = None,
        project: Optional[str] = None,
        severity: Optional[AnomalySeverity] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        include_normal: bool = False,
    ) -> List[AnomalyItemSchema]:
        """
        Runs time-series cost anomaly detection over aggregated billing records
        using robust baseline modeling with contamination protection.
        """
        if records is None:
            records = billing_service.get_records()

        if not records:
            return []

        # 1. Group records by resource key: (service, region, resource_id, team, project)
        grouped_series: Dict[Tuple[str, str, str, str, str], List[BillingItemSchema]] = defaultdict(list)
        for r in records:
            # Ignore negative or corrupt costs safely
            if r.total_cost < 0:
                continue
            key = (r.service, r.region, r.resource_id, r.team, r.project)
            grouped_series[key].append(r)

        detected: List[AnomalyItemSchema] = []

        # 2. Analyze each resource time-series independently
        for (svc, reg, res_id, tm, prj), series in grouped_series.items():
            # Sort observations chronologically
            series.sort(key=lambda item: item.timestamp)

            # Keep track of baseline historical points (filtering out contaminated spikes)
            clean_history_costs: List[float] = []

            for i, obs in enumerate(series):
                actual_cost = float(obs.total_cost)

                # If insufficient historical points, accumulate clean baseline and continue
                if len(clean_history_costs) < 2:
                    clean_history_costs.append(actual_cost)
                    continue

                # Take the most recent rolling window of clean baseline observations
                window_size = max(3, self.thresholds.ROLLING_WINDOW_SIZE)
                active_window = clean_history_costs[-window_size:]

                expected_cost = sum(active_window) / len(active_window)
                variance = sum((c - expected_cost) ** 2 for c in active_window) / len(active_window)
                raw_std = math.sqrt(variance)

                # Safe effective standard deviation proportional to baseline magnitude
                min_std = max(0.08 * expected_cost, self.thresholds.MIN_VARIANCE_EPSILON)
                effective_std = max(raw_std, min_std)

                absolute_delta = actual_cost - expected_cost
                if expected_cost > 0:
                    percentage_delta = (absolute_delta / expected_cost) * 100.0
                else:
                    percentage_delta = 100.0 if actual_cost > 0 else 0.0

                # Compute Z-score for upward cost spikes
                if absolute_delta > 0:
                    anomaly_score = absolute_delta / effective_std
                else:
                    anomaly_score = 0.0

                # Classify Severity
                sev = self._classify_severity(
                    z_score=anomaly_score,
                    absolute_delta=absolute_delta,
                    percentage_delta=percentage_delta,
                )

                if sev != AnomalySeverity.NORMAL:
                    short_res = res_id.split("/")[-1] if "/" in res_id else (res_id.split(":")[-1] if ":" in res_id else res_id)
                    explanation = (
                        f"{svc} spending on '{short_res}' was ${actual_cost:.2f}, "
                        f"which is {percentage_delta:+.1f}% (${absolute_delta:+.2f}) "
                        f"above the baseline of ${expected_cost:.2f} (Z-Score: {anomaly_score:.2f})."
                    )

                    anomaly_item = AnomalyItemSchema(
                        anomaly_id=f"anom-{obs.record_id}-{i}",
                        timestamp=obs.timestamp,
                        service=svc,
                        region=reg,
                        resource_id=res_id,
                        team=tm,
                        project=prj,
                        actual_cost=round(actual_cost, 2),
                        expected_cost=round(expected_cost, 2),
                        absolute_delta=round(absolute_delta, 2),
                        percentage_delta=round(percentage_delta, 1),
                        anomaly_score=round(anomaly_score, 2),
                        severity=sev,
                        explanation=explanation,
                    )
                    detected.append(anomaly_item)
                elif include_normal:
                    anomaly_item = AnomalyItemSchema(
                        anomaly_id=f"norm-{obs.record_id}-{i}",
                        timestamp=obs.timestamp,
                        service=svc,
                        region=reg,
                        resource_id=res_id,
                        team=tm,
                        project=prj,
                        actual_cost=round(actual_cost, 2),
                        expected_cost=round(expected_cost, 2),
                        absolute_delta=round(absolute_delta, 2),
                        percentage_delta=round(percentage_delta, 1),
                        anomaly_score=round(anomaly_score, 2),
                        severity=AnomalySeverity.NORMAL,
                        explanation="Cost is within expected statistical baseline.",
                    )
                    detected.append(anomaly_item)

                # Contamination protection: only add non-anomalous points to clean historical baseline
                if sev == AnomalySeverity.NORMAL:
                    clean_history_costs.append(actual_cost)

        # 3. Apply Query Filters
        if service:
            detected = [a for a in detected if a.service.lower() == service.lower()]
        if region:
            detected = [a for a in detected if a.region.lower() == region.lower()]
        if team:
            detected = [a for a in detected if a.team.lower() == team.lower()]
        if project:
            detected = [a for a in detected if a.project.lower() == project.lower()]
        if severity:
            detected = [a for a in detected if a.severity == severity]
        if start_date:
            detected = [a for a in detected if a.timestamp >= start_date]
        if end_date:
            detected = [a for a in detected if a.timestamp <= end_date]

        # 4. Sort by Severity descending, then timestamp descending
        detected.sort(key=lambda a: (SEVERITY_ORDER.get(a.severity, 0), a.timestamp), reverse=True)

        return detected

    def get_summary(
        self,
        service: Optional[str] = None,
        region: Optional[str] = None,
        team: Optional[str] = None,
    ) -> AnomalySummaryResponseSchema:
        """
        Aggregates anomaly counts, total anomalous excess spend, and top impacted service.
        """
        anomalies = self.detect_anomalies(service=service, region=region, team=team)

        critical_count = sum(1 for a in anomalies if a.severity == AnomalySeverity.CRITICAL)
        high_count = sum(1 for a in anomalies if a.severity == AnomalySeverity.HIGH)
        medium_count = sum(1 for a in anomalies if a.severity == AnomalySeverity.MEDIUM)
        low_count = sum(1 for a in anomalies if a.severity == AnomalySeverity.LOW)
        total_anomalous_spend = sum(max(0.0, a.absolute_delta) for a in anomalies)

        highest_anomaly = max(anomalies, key=lambda a: a.absolute_delta) if anomalies else None

        # Determine most affected service
        service_counts: Dict[str, int] = defaultdict(int)
        for a in anomalies:
            service_counts[a.service] += 1
        most_affected_service = max(service_counts.items(), key=lambda x: x[1])[0] if service_counts else None

        return AnomalySummaryResponseSchema(
            total_anomalies=len(anomalies),
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            total_anomalous_spend=round(total_anomalous_spend, 2),
            highest_anomaly=highest_anomaly,
            most_affected_service=most_affected_service,
        )

    def _classify_severity(
        self,
        z_score: float,
        absolute_delta: float,
        percentage_delta: float,
    ) -> AnomalySeverity:
        # Check minimum absolute/percentage thresholds to prevent noise
        if (
            absolute_delta < self.thresholds.MIN_ABSOLUTE_DELTA
            or percentage_delta < self.thresholds.MIN_PERCENTAGE_DELTA
            or z_score < self.thresholds.Z_SCORE_LOW
        ):
            return AnomalySeverity.NORMAL

        # Critical: heavy dollar surge (>= $50) and large statistical deviation
        if absolute_delta >= 50.0 and (z_score >= self.thresholds.Z_SCORE_CRITICAL or percentage_delta >= 100.0):
            return AnomalySeverity.CRITICAL

        # High: significant surge (>= $20)
        if absolute_delta >= 20.0 and (z_score >= self.thresholds.Z_SCORE_HIGH or percentage_delta >= 50.0):
            return AnomalySeverity.HIGH

        # Medium: moderate surge (>= $10)
        if absolute_delta >= 10.0 and (z_score >= self.thresholds.Z_SCORE_MEDIUM or percentage_delta >= 25.0):
            return AnomalySeverity.MEDIUM

        # Low: minor surge (>= $5)
        if absolute_delta >= self.thresholds.MIN_ABSOLUTE_DELTA and z_score >= self.thresholds.Z_SCORE_LOW:
            return AnomalySeverity.LOW

        return AnomalySeverity.NORMAL


anomaly_service = AnomalyDetectionService()
