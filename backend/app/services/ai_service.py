import json
import httpx
from typing import List, Optional
from backend.app.schemas.anomaly import AnomalyItemSchema
from backend.app.schemas.root_cause import RootCauseCandidateSchema, InvestigationSummarySchema, AIExplanationSchema
from backend.app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = "gpt-4o-mini"
    
    def generate_explanation(self, anomaly: AnomalyItemSchema, candidates: List[RootCauseCandidateSchema], summary: InvestigationSummarySchema) -> AIExplanationSchema:
        if not candidates:
            return AIExplanationSchema(
                summary="No root cause candidates found.",
                narrative="The anomaly engine detected a cost spike, but the root cause engine could not correlate it to any known services, regions, or deployment events. Further manual investigation is required.",
                remediation_steps=["Review AWS Cost Explorer manually for un-tagged resources.", "Check CloudTrail for unusual API activity."]
            )
            
        if self.api_key:
            try:
                return self._call_openai(anomaly, candidates, summary)
            except Exception as e:
                logger.error(f"OpenAI API failed: {e}. Falling back to mock generator.")
                return self._generate_mock_explanation(anomaly, candidates, summary)
        else:
            return self._generate_mock_explanation(anomaly, candidates, summary)
            
    def _call_openai(self, anomaly: AnomalyItemSchema, candidates: List[RootCauseCandidateSchema], summary: InvestigationSummarySchema) -> AIExplanationSchema:
        prompt = self._build_prompt(anomaly, candidates, summary)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are an expert AWS FinOps AI assistant. Your goal is to explain cloud cost anomalies and root causes clearly and concisely. Respond in valid JSON matching the specified schema."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            result = json.loads(content)
            
            return AIExplanationSchema(
                summary=result.get("summary", "Summary unavailable."),
                narrative=result.get("narrative", "Narrative unavailable."),
                remediation_steps=result.get("remediation_steps", [])
            )
            
    def _build_prompt(self, anomaly: AnomalyItemSchema, candidates: List[RootCauseCandidateSchema], summary: InvestigationSummarySchema) -> str:
        top_candidate = candidates[0]
        
        return f"""
Analyze the following AWS cost anomaly and its root cause investigation results.

Anomaly Details:
- ID: {anomaly.anomaly_id}
- Service: {anomaly.service or 'N/A'}
- Date: {anomaly.timestamp.strftime('%Y-%m-%d')}
- Actual Cost: ${anomaly.actual_cost:.2f}
- Expected Cost: ${anomaly.expected_cost:.2f}
- Delta: +${anomaly.absolute_delta:.2f} ({anomaly.percentage_delta:.1f}%)

Investigation Summary:
- Primary Service: {summary.primary_service}
- Primary Region: {summary.primary_region}
- Primary Team: {summary.primary_team}
- Strongest Signal: {summary.strongest_signal}

Top Root Cause Candidate:
- Category: {top_candidate.category.value}
- Title: {top_candidate.title}
- Description: {top_candidate.description}
- Confidence: {top_candidate.confidence_level}
- Evidence: {', '.join(top_candidate.evidence)}

Provide your response strictly as a JSON object with the following keys:
- "summary": A short 1-2 sentence executive summary.
- "narrative": A detailed markdown-formatted narrative explaining the cost spike and correlating evidence. Use bolding and lists where appropriate.
- "remediation_steps": A list of strings, each a suggested actionable remediation step.
"""

    def _generate_mock_explanation(self, anomaly: AnomalyItemSchema, candidates: List[RootCauseCandidateSchema], summary: InvestigationSummarySchema) -> AIExplanationSchema:
        top_candidate = candidates[0]
        
        # Build a deterministic, highly realistic mock response
        service_name = summary.primary_service or anomaly.service or "AWS Resource"
        delta = anomaly.absolute_delta
        pct = anomaly.percentage_delta
        
        narrative = f"### What Happened\n"
        narrative += f"On **{anomaly.timestamp.strftime('%Y-%m-%d')}**, {service_name} spend surged by **${delta:.2f} ({pct:.1f}%)** above the historical baseline of ${anomaly.expected_cost:.2f}. "
        
        if top_candidate.category == "DEPLOYMENT" or top_candidate.category == "EVENT":
            narrative += f"This spike is highly correlated with a recent deployment event. Specifically: **{top_candidate.title}**.\n\n"
            narrative += f"### Evidence & Correlation\n"
            narrative += f"{top_candidate.description} The temporal proximity of this event to the cost spike strongly suggests it is the primary driver of the excess spend.\n\n"
        elif top_candidate.category == "USAGE":
            narrative += f"This spike is primarily driven by a raw usage volume surge. \n\n"
            narrative += f"### Evidence & Correlation\n"
            narrative += f"We observed a **{top_candidate.usage_delta_percentage:.1f}%** increase in provisioned resources or API calls for {service_name}. {top_candidate.description}\n\n"
        else:
            narrative += f"The anomaly engine isolated the root cause to specific components in **{summary.primary_region}** owned by the **{summary.primary_team}** team.\n\n"
            narrative += f"### Evidence & Correlation\n"
            narrative += f"{top_candidate.description}\n\n"
            
        if top_candidate.evidence:
            narrative += "Key indicators:\n"
            for ev in top_candidate.evidence:
                narrative += f"- {ev}\n"

        remediations = [
            f"Review the recent configuration changes made by the {summary.primary_team} team.",
            f"Verify if the usage surge in {service_name} was expected due to increased traffic.",
            "If unexpected, consider rolling back the most recent deployment."
        ]
        
        return AIExplanationSchema(
            summary=f"{service_name} costs spiked by ${delta:.2f} due to {summary.strongest_signal.lower()}.",
            narrative=narrative,
            remediation_steps=remediations
        )

ai_service = AIService()
