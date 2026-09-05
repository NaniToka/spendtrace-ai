import json
import httpx
import logging
import os
import time
from typing import List
from backend.app.schemas.anomaly import AnomalyItemSchema
from backend.app.schemas.root_cause import RootCauseCandidateSchema
from backend.app.schemas.graph import InvestigationGraphResponse
from backend.app.schemas.explanation import ExplanationResponseSchema
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class ExplanationService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or settings.OPENAI_API_KEY
        self.is_gemini = bool(os.getenv("GEMINI_API_KEY"))
        self.model = "gemini-1.5-flash" if self.is_gemini else "gpt-4o-mini"
        self.endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" 
            if self.is_gemini else "https://api.openai.com/v1/chat/completions"
        )
        
    def generate_explanation(
        self, 
        anomaly: AnomalyItemSchema, 
        candidates: List[RootCauseCandidateSchema], 
        graph: InvestigationGraphResponse
    ) -> ExplanationResponseSchema:
        
        if not candidates or not graph.edges:
            return self._generate_empty_explanation(anomaly)
            
        try:
            return self._call_llm(anomaly, candidates, graph)
        except Exception as e:
            error_details = str(e)
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                error_details += f" | Response: {e.response.text}"
            logger.error(f"LLM API failed: {error_details}. Falling back to deterministic generator.", exc_info=True)
            print(f"\n--- LLM API EXACT ERROR ---\n{error_details}\n---------------------------\n")
            return self._generate_fallback(anomaly, candidates, graph)
            
    def _generate_empty_explanation(self, anomaly: AnomalyItemSchema) -> ExplanationResponseSchema:
        return ExplanationResponseSchema(
            what_happened=f"On {anomaly.timestamp.strftime('%Y-%m-%d')}, a {anomaly.severity.value} cost spike of ${anomaly.absolute_delta:.2f} was detected in {anomaly.service or 'your AWS account'}.",
            why_it_happened="The root-cause engine could not isolate specific resources or correlated events responsible for this spike. This typically indicates broad account-wide usage increases without a single culprit.",
            key_evidence=["CONTEXT: No isolated strong correlations found in the investigation graph."],
            confidence=0.1,
            recommended_next_step="Manually review AWS Cost Explorer and CloudTrail for un-tagged resource usage."
        )
        
    def _call_llm(self, anomaly: AnomalyItemSchema, candidates: List[RootCauseCandidateSchema], graph: InvestigationGraphResponse) -> ExplanationResponseSchema:
        prompt = self._build_prompt(anomaly, candidates, graph)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system", 
                    "content": "You are a deterministic AWS FinOps explainer. Your job is to translate investigation graphs into a JSON response matching the requested schema. Never state correlation as confirmed causation. Clearly label evidence types (DIRECT_EVIDENCE, STRONG_CORRELATION, WEAK_CORRELATION, CONTEXT) based on the provided graph."
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        
        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(self.endpoint, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    
                    content = data["choices"][0]["message"]["content"]
                    result = json.loads(content)
                    
                    return ExplanationResponseSchema(
                        what_happened=result.get("what_happened", "Summary unavailable."),
                        why_it_happened=result.get("why_it_happened", "Explanation unavailable."),
                        key_evidence=result.get("key_evidence", []),
                        confidence=float(result.get("confidence", 0.0)),
                        recommended_next_step=result.get("recommended_next_step", "N/A")
                    )
            except Exception as e:
                error_details = str(e)
                if hasattr(e, 'response') and hasattr(e.response, 'text'):
                    error_details += f" | Response: {e.response.text}"
                logger.warning(f"LLM API attempt {attempt + 1} failed: {error_details}")
                if attempt == max_attempts - 1:
                    raise e
                time.sleep(1)
            
    def _build_prompt(self, anomaly: AnomalyItemSchema, candidates: List[RootCauseCandidateSchema], graph: InvestigationGraphResponse) -> str:
        edges_str = "\n".join([f"- {e.source} -> {e.target} [{e.relationship}] (Strength: {e.strength}) Evidence: {'; '.join(e.evidence)}" for e in graph.edges])
        
        return f"""
        Anomaly:
        - ID: {anomaly.anomaly_id}
        - Service: {anomaly.service}
        - Delta: +${anomaly.absolute_delta:.2f}

        Investigation Graph Edges:
        {edges_str}
        
        Respond with a JSON object containing:
        "what_happened": str,
        "why_it_happened": str,
        "key_evidence": List[str] (e.g. "STRONG_CORRELATION: ..."),
        "confidence": float (0.0 to 1.0),
        "recommended_next_step": str
        """
        
    def _generate_fallback(self, anomaly: AnomalyItemSchema, candidates: List[RootCauseCandidateSchema], graph: InvestigationGraphResponse) -> ExplanationResponseSchema:
        top_cand = candidates[0]
        
        service_name = graph.summary.primary_service or anomaly.service or "AWS Services"
        what = f"Estimated Explanation (AI unavailable) On {anomaly.timestamp.strftime('%Y-%m-%d')}, {service_name} spend increased by ${anomaly.absolute_delta:.2f}."
        
        why = f"The investigation graph reveals a structured correlation leading back to {top_cand.title}."
        if top_cand.category in ["DEPLOYMENT", "EVENT"]:
            why += f" Based on the temporal correlation, the {top_cand.category.lower()} is a highly probable driver of the usage surge."
        else:
            why += f" The anomaly is isolated specifically to changes originating in {top_cand.category.lower()} patterns without a known deployment event."
            
        evidence = []
        for edge in graph.edges:
            prefix = "CONTEXT"
            if "STRONG_CORRELATION" in edge.relationship:
                prefix = "STRONG_CORRELATION"
            elif "WEAK" in edge.relationship or "MODERATE" in edge.relationship:
                prefix = "WEAK_CORRELATION"
            elif "USAGE" in edge.relationship or "AFFECTED" in edge.relationship:
                prefix = "DIRECT_EVIDENCE"
                
            for ev in edge.evidence:
                evidence.append(f"[{prefix}] {ev}")
                
        if not evidence and top_cand.evidence:
            for ev in top_cand.evidence:
                evidence.append(f"[CONTEXT] {ev}")
                
        return ExplanationResponseSchema(
            what_happened=what,
            why_it_happened=why,
            key_evidence=evidence,
            confidence=top_cand.confidence,
            recommended_next_step=f"Review the configuration changes associated with {top_cand.title} or confirm if the usage increase was anticipated."
        )

explanation_service = ExplanationService()
