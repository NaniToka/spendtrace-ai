import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  GitCommit,
  Server,
  Layers,
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { AnomalyItem } from '../types/anomaly';
import { RootCauseResponse } from '../types/root_cause';
import { fetchRootCauses } from '../services/api';
import { AIExplanationSection } from './AIExplanationSection';

interface RootCauseSectionProps {
  anomalies: AnomalyItem[];
  selectedAnomalyId?: string;
  onSelectAnomaly?: (id: string) => void;
}

export const RootCauseSection: React.FC<RootCauseSectionProps> = ({
  anomalies,
  selectedAnomalyId,
  onSelectAnomaly,
}) => {
  const [activeAnomalyId, setActiveAnomalyId] = useState<string>('');
  const [rootCauseData, setRootCauseData] = useState<RootCauseResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Default to the first anomaly if none selected
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

    fetchRootCauses(activeAnomalyId)
      .then((data) => {
        if (isMounted) {
          setRootCauseData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load root cause investigation');
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

  if (anomalies.length === 0) {
    return (
      <div className="section-panel glass-card">
        <div className="section-panel-header">
          <div className="section-panel-title">
            <Sparkles size={20} color="var(--color-purple)" />
            <span>Root-Cause Intelligence Engine</span>
          </div>
        </div>
        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
          No active cost anomalies detected to investigate.
        </p>
      </div>
    );
  }

  const primaryCandidate = rootCauseData?.candidates?.[0];
  const summary = rootCauseData?.investigation_summary;

  return (
    <div className="section-panel glass-card">
      <div className="section-panel-header">
        <div className="section-panel-title">
          <Sparkles size={20} color="var(--color-purple)" />
          <span>Root-Cause Intelligence Engine</span>
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
        <div className="loading-container">Correlating billing dimensions and deployment events...</div>
      ) : error ? (
        <div className="alert-banner">{error}</div>
      ) : rootCauseData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Explanation Banner */}
          {rootCauseData.ai_explanation && (
            <AIExplanationSection explanation={rootCauseData.ai_explanation} />
          )}

          {/* Top Banner: Primary Suspected Cause & Signal */}
          <div className="primary-suspect-card">
            <div className="primary-suspect-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-accent">PRIMARY SUSPECTED CAUSE</span>
                {primaryCandidate && getConfidenceBadge(primaryCandidate.confidence_level, primaryCandidate.confidence)}
              </div>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Anomaly ID: {rootCauseData.anomaly.anomaly_id}
              </span>
            </div>

            <div className="primary-suspect-title">
              {primaryCandidate ? primaryCandidate.title : 'Multi-Factor Spend Surge'}
            </div>

            <p className="primary-suspect-desc">
              {summary?.strongest_signal}
            </p>

            {/* Dimensional Signal Badges */}
            {summary && (
              <div className="summary-tags-row">
                <div className="summary-tag">
                  <span className="tag-label">Primary Service:</span>
                  <span className="tag-val text-cyan">{summary.primary_service}</span>
                </div>
                <div className="summary-tag">
                  <span className="tag-label">Region:</span>
                  <span className="tag-val">{summary.primary_region}</span>
                </div>
                <div className="summary-tag">
                  <span className="tag-label">Resource:</span>
                  <span className="tag-val mono text-muted">{summary.primary_resource.split('/').pop()}</span>
                </div>
                <div className="summary-tag">
                  <span className="tag-label">Attributed Team:</span>
                  <span className="tag-val" style={{ color: 'var(--color-primary)' }}>{summary.primary_team}</span>
                </div>
                <div className="summary-tag">
                  <span className="tag-label">Correlated Events:</span>
                  <span className="tag-val mono" style={{ color: summary.correlated_events_count > 0 ? 'var(--color-purple)' : 'inherit' }}>
                    {summary.correlated_events_count}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ranked Root Cause Candidates List */}
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--color-cyan)" />
              <span>Ranked Probable Root-Cause Candidates</span>
            </div>

            <div className="candidates-list">
              {rootCauseData.candidates.map((cand) => (
                <div key={`${cand.rank}-${cand.category}`} className="candidate-card glass-card">
                  <div className="candidate-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="candidate-rank-badge">#{cand.rank}</span>
                      <span className="candidate-cat-icon">{getCategoryIcon(cand.category)}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cand.title}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {cand.temporal_correlation !== 'NONE' && (
                        <span className="badge badge-accent mono" style={{ fontSize: '0.7rem' }}>
                          Temporal: {cand.temporal_correlation}
                        </span>
                      )}
                      {getConfidenceBadge(cand.confidence_level, cand.confidence)}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '10px 0', lineHeight: 1.45 }}>
                    {cand.description}
                  </p>

                  {/* Measurable Evidence List */}
                  <div className="evidence-container">
                    <div className="evidence-title">Measurable Correlation Evidence:</div>
                    <ul className="evidence-list">
                      {cand.evidence.map((item, idx) => (
                        <li key={idx} className="evidence-item">
                          <CheckCircle2 size={13} color="var(--color-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Candidate Metrics Footer */}
                  <div className="candidate-metrics-footer">
                    <div>
                      <span className="footer-metric-label">Cost Baseline:</span>{' '}
                      <span className="mono">${cand.cost_before.toFixed(2)} $\rightarrow$ ${cand.cost_after.toFixed(2)} (+${cand.cost_delta.toFixed(2)})</span>
                    </div>
                    {cand.usage_delta_percentage > 0 && (
                      <div>
                        <span className="footer-metric-label">Usage Surge:</span>{' '}
                        <span className="mono" style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>+{cand.usage_delta_percentage.toFixed(1)}%</span>
                      </div>
                    )}
                    <div>
                      <span className="footer-metric-label">Evidence Score:</span>{' '}
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--color-purple)' }}>{cand.evidence_score.toFixed(1)} / 100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
