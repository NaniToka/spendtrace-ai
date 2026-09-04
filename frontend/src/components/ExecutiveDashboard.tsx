import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  GitCommit,
  Server,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AnomalyItem } from '../types/anomaly';
import { ExecutiveSummaryResponse } from '../types/executive_summary';
import { fetchExecutiveSummary } from '../services/api';
import { AIExplanationSection } from './AIExplanationSection';
import { FinancialImpactSection } from './FinancialImpactSection';
import { InvestigationTimeline } from './InvestigationTimeline';
import { RootCauseCandidate } from '../types/root_cause';

interface ExecutiveDashboardProps {
  anomalies: AnomalyItem[];
  selectedAnomalyId?: string;
  onSelectAnomaly?: (id: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  anomalies,
  selectedAnomalyId,
  onSelectAnomaly,
}) => {
  const [activeAnomalyId, setActiveAnomalyId] = useState<string>('');
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAnomalyId) {
      setActiveAnomalyId(selectedAnomalyId);
    } else if (anomalies.length > 0 && !activeAnomalyId) {
      setActiveAnomalyId(anomalies[0].anomaly_id);
    }
  }, [selectedAnomalyId, anomalies]);

  useEffect(() => {
    if (!activeAnomalyId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchExecutiveSummary(activeAnomalyId)
      .then((data) => {
        if (isMounted) {
          setSummaryData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load executive summary');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeAnomalyId]);

  const handleSelectChange = (id: string) => {
    setActiveAnomalyId(id);
    if (onSelectAnomaly) {
      onSelectAnomaly(id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DEPLOYMENT':
      case 'EVENT':
        return <GitCommit size={16} color="var(--color-purple)" />;
      case 'RESOURCE':
        return <Server size={16} color="var(--color-cyan)" />;
      case 'USAGE':
        return <Activity size={16} color="var(--color-emerald)" />;
      case 'SERVICE':
        return <Layers size={16} color="var(--color-primary)" />;
      default:
        return <Sparkles size={16} color="var(--color-amber)" />;
    }
  };

  const getConfidenceBadge = (level: string, confidence: number) => {
    const pct = Math.round(confidence * 100);
    switch (level) {
      case 'HIGH':
        return <span className="badge badge-critical">{pct}% Confidence (High)</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">{pct}% Confidence (Medium)</span>;
      default:
        return <span className="badge badge-low">{pct}% Confidence (Low)</span>;
    }
  };

  if (anomalies.length === 0) {
    return (
      <div className="section-panel glass-card">
        <div className="section-panel-header">
          <div className="section-panel-title">
            <ShieldCheck size={20} color="var(--color-primary)" />
            <span>Executive Investigation Dashboard</span>
          </div>
        </div>
        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
          No active cost anomalies detected to investigate.
        </p>
      </div>
    );
  }

  return (
    <div className="section-panel glass-card">
      <div className="section-panel-header">
        <div className="section-panel-title">
          <ShieldCheck size={20} color="var(--color-primary)" />
          <span>Executive Investigation Dashboard</span>
        </div>

        {/* Anomaly Selector */}
        <div className="filter-controls">
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
            Investigating Anomaly:
          </label>
          <select
            value={activeAnomalyId}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="filter-select mono"
          >
            {anomalies.map((a) => (
              <option key={a.anomaly_id} value={a.anomaly_id}>
                {a.timestamp.slice(0, 10)} — {a.service} (+${a.absolute_delta.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">Aggregating investigation intelligence...</div>
      ) : error ? (
        <div className="alert-banner">{error}</div>
      ) : summaryData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section A: Anomaly Header */}
          {summaryData.anomaly && (
            <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                  <AlertTriangle size={24} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {summaryData.anomaly.service} Anomaly
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="mono">{summaryData.anomaly.resource_id}</span>
                    &bull;
                    <span>{summaryData.anomaly.region}</span>
                    &bull;
                    <span style={{ color: 'var(--color-primary)' }}>{summaryData.anomaly.team} Team</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expected</div>
                  <div className="mono" style={{ fontSize: '1.1rem' }}>${summaryData.anomaly.expected_cost.toFixed(2)}</div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" style={{ marginBottom: '4px' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Actual Cost</div>
                  <div className="mono" style={{ fontSize: '1.3rem', color: '#ef4444', fontWeight: 'bold' }}>${summaryData.anomaly.actual_cost.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Section B: AI Explanation (What & Why) */}
          {summaryData.explanation && (
            <AIExplanationSection explanation={summaryData.explanation} />
          )}

          {/* Section C: Why? (Top Root Causes) */}
          {summaryData.top_root_causes.length > 0 && (
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--color-cyan)" />
                <span>Top Probable Root Causes</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {summaryData.top_root_causes.map((cand: RootCauseCandidate) => (
                  <div key={cand.rank} className="glass-card" style={{ padding: '16px', borderRadius: '8px', borderLeft: `3px solid ${cand.rank === 1 ? '#ef4444' : 'var(--color-secondary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="candidate-rank-badge">#{cand.rank}</span>
                        {getCategoryIcon(cand.category)}
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cand.title}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {cand.description}
                    </p>
                    <div style={{ marginBottom: '12px' }}>
                      {getConfidenceBadge(cand.confidence_level, cand.confidence)}
                    </div>
                    {/* Primary Evidence */}
                    {cand.evidence.length > 0 && (
                      <div style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          <CheckCircle2 size={12} color="var(--color-emerald)" />
                          <span>Primary Evidence:</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>{cand.evidence[0]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section D: Evidence Timeline */}
          {summaryData.graph && (
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitCommit size={18} color="var(--color-purple)" />
                <span>Evidence Timeline</span>
              </div>
              <InvestigationTimeline graph={summaryData.graph} />
            </div>
          )}

          {/* Section E: Financial Impact */}
          {summaryData.financial_impact && (
            <FinancialImpactSection impact={summaryData.financial_impact} />
          )}

        </div>
      ) : null}
    </div>
  );
};
