import React from 'react';
import { ExplanationResponse } from '../types/explanation';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface AIExplanationSectionProps {
  explanation: ExplanationResponse;
}

export const AIExplanationSection: React.FC<AIExplanationSectionProps> = ({ explanation }) => {
  const getEvidenceIcon = (evidenceText: string) => {
    if (evidenceText.startsWith('[STRONG_CORRELATION]')) return <ShieldCheck className="text-success" size={16} />;
    if (evidenceText.startsWith('[WEAK_CORRELATION]')) return <AlertTriangle className="text-warning" size={16} />;
    if (evidenceText.startsWith('[DIRECT_EVIDENCE]')) return <CheckCircle2 className="text-primary" size={16} />;
    return <Info className="text-secondary" size={16} />;
  };

  const parseEvidenceText = (text: string) => {
    const match = text.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return (
        <span>
          <strong className="text-primary">{match[1].replace('_', ' ')}:</strong> {match[2]}
        </span>
      );
    }
    return <span>{text}</span>;
  };

  return (
    <div className="glass-card ai-report p-6 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="text-primary" size={24} />
          <div>
            <h2 className="text-xl font-bold">AI Investigation Report</h2>
            <p className="text-sm text-secondary">Synthesized analysis of cost, usage, and deployment signals</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-col items-end">
            <span className="text-xs text-secondary uppercase tracking-wider">Confidence Score</span>
            <strong className="text-primary text-lg">{(explanation.confidence * 100).toFixed(0)}%</strong>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="report-section">
          <h3 className="report-section-title">What Happened</h3>
          <div className="report-content">
            {explanation.what_happened}
          </div>
        </div>

        <div className="report-section">
          <h3 className="report-section-title">Why It Likely Happened</h3>
          <div className="report-content">
            {explanation.why_it_happened}
          </div>
        </div>
      </div>

      <div className="report-section border-t border-subtle pt-6">
        <h3 className="report-section-title">Key Evidence</h3>
        <ul className="flex flex-col gap-3">
          {explanation.key_evidence.map((evidence, idx) => (
            <li key={idx} className="flex items-start gap-3 bg-surface p-3 rounded-md border border-subtle text-sm text-secondary">
              <div className="mt-0.5">{getEvidenceIcon(evidence)}</div>
              <div>{parseEvidenceText(evidence)}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 p-4 bg-surface border border-success rounded-md flex items-start gap-4">
        <CheckCircle2 size={24} className="text-success mt-1" />
        <div>
          <h3 className="text-success font-bold mb-1">Recommended Action</h3>
          <p className="text-sm text-primary">{explanation.recommended_next_step}</p>
        </div>
      </div>
    </div>
  );
};
