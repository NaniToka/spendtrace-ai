import React from 'react';
import { Sparkles, GitCommit, Server, Layers, Activity, TrendingUp, CheckCircle2 } from 'lucide-react';
import { RootCauseCandidate } from '../types/root_cause';

interface RootCauseSectionProps {
  candidates: RootCauseCandidate[];
}

export const RootCauseSection: React.FC<RootCauseSectionProps> = ({ candidates }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DEPLOYMENT':
      case 'EVENT':
        return <GitCommit size={16} className="text-purple-400" />;
      case 'RESOURCE':
        return <Server size={16} className="text-cyan-400" />;
      case 'USAGE':
        return <Activity size={16} className="text-emerald-400" />;
      case 'SERVICE':
        return <Layers size={16} className="text-primary-light" />;
      default:
        return <Sparkles size={16} className="text-warning" />;
    }
  };

  const getConfidenceBadge = (level: string, confidence: number) => {
    const pct = Math.round(confidence * 100);
    switch (level) {
      case 'HIGH':
        return <span className="badge badge-critical">{pct}% Confidence</span>;
      case 'MEDIUM':
        return <span className="badge badge-warning">{pct}% Confidence</span>;
      default:
        return <span className="badge badge-info">{pct}% Confidence</span>;
    }
  };

  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp size={20} className="text-primary" />
        <h2 className="text-lg font-bold">Ranked Root Causes</h2>
      </div>

      <div className="flex flex-col gap-4">
        {candidates.map((cand) => (
          <div key={cand.rank} className="bg-surface border border-subtle rounded-md p-5 relative overflow-hidden">
            {cand.rank === 1 && (
              <div className="absolute top-0 left-0 w-1 h-full bg-critical" />
            )}
            
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-primary text-white font-bold w-6 h-6 rounded-full text-xs">
                  {cand.rank}
                </span>
                <div className="bg-card p-1.5 rounded-md border border-subtle">
                  {getCategoryIcon(cand.category)}
                </div>
                <h3 className="font-bold text-primary">{cand.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {cand.temporal_correlation !== 'NONE' && (
                  <span className="badge badge-primary mono text-[10px]">
                    {cand.temporal_correlation}
                  </span>
                )}
                {getConfidenceBadge(cand.confidence_level, cand.confidence)}
              </div>
            </div>

            <p className="text-sm text-secondary mb-4 line-height-relaxed">
              {cand.description}
            </p>

            {cand.evidence.length > 0 && (
              <div className="bg-card p-3 rounded-md border border-subtle mb-4">
                <div className="text-xs uppercase tracking-wider text-muted font-bold mb-2">Primary Evidence</div>
                <div className="flex items-start gap-2 text-sm text-secondary">
                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{cand.evidence[0]}</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-6 text-xs text-secondary pt-3 border-t border-subtle">
              <div className="flex flex-col gap-1">
                <span className="text-muted">Cost Impact</span>
                <span className="font-mono text-primary font-medium">
                  ${cand.cost_before.toFixed(2)} → ${cand.cost_after.toFixed(2)}
                </span>
              </div>
              {cand.usage_delta_percentage > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted">Usage Surge</span>
                  <span className="font-mono text-success font-medium">
                    +{cand.usage_delta_percentage.toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-muted">Evidence Score</span>
                <span className="font-mono font-medium text-purple-400">
                  {cand.evidence_score.toFixed(1)} / 100
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
