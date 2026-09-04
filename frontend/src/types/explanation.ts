export interface ExplanationResponse {
  what_happened: string;
  why_it_happened: string;
  key_evidence: string[];
  confidence: number;
  recommended_next_step: string;
}
