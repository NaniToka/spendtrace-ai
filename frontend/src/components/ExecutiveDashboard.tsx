import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, AlertTriangle, ArrowRight, Activity, GitCommit, Search, CheckCircle2, DollarSign
} from 'lucide-react';
import { AnomalyItem } from '../types/anomaly';
import { ExecutiveSummaryResponse } from '../types/executive_summary';
import { fetchExecutiveSummary } from '../services/api';
import { AIExplanationSection } from './AIExplanationSection';
import { FinancialImpactSection } from './FinancialImpactSection';
import { RootCauseSection } from './RootCauseSection';
import { InvestigationGraphView } from './InvestigationGraphView';

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

  if (anomalies.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <ShieldCheck size={32} className="mx-auto text-primary mb-4" />
        <h2 className="text-xl font-bold">No Active Anomalies</h2>
        <p className="text-secondary mt-2">There are currently no cost anomalies requiring investigation.</p>
      </div>
    );
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-info';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="investigation-workspace flex-col gap-6">
      
      {/* Investigation Selector & Visual Workflow */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Search className="text-primary" size={24} />
            <h2 className="text-xl font-bold">Investigation Workspace</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary">Active Incident:</span>
            <select
              value={activeAnomalyId}
              onChange={(e) => {
                setActiveAnomalyId(e.target.value);
                if (onSelectAnomaly) onSelectAnomaly(e.target.value);
              }}
              className="bg-card border border-subtle text-primary p-2 rounded-sm text-sm outline-none"
            >
              {anomalies.map((a) => (
                <option key={a.anomaly_id} value={a.anomaly_id}>
                  {a.service} (+${a.absolute_delta.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Vertical Workflow */}
        <div className="investigation-workflow">
          <div className="workflow-step completed">
            <div className="workflow-icon"><AlertTriangle size={16} /></div>
            <span className="workflow-label">Anomaly Detected</span>
          </div>
          <div className="workflow-step completed">
            <div className="workflow-icon"><Activity size={16} /></div>
            <span className="workflow-label">Root Cause Analysis</span>
          </div>
          <div className="workflow-step completed">
            <div className="workflow-icon"><GitCommit size={16} /></div>
            <span className="workflow-label">Evidence Graph</span>
          </div>
          <div className="workflow-step active">
            <div className="workflow-icon"><CheckCircle2 size={16} /></div>
            <span className="workflow-label">AI Explanation</span>
          </div>
          <div className="workflow-step">
            <div className="workflow-icon"><DollarSign size={16} /></div>
            <span className="workflow-label">Financial Impact</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 flex justify-center items-center text-secondary">
          Aggregating investigation intelligence...
        </div>
      ) : error ? (
        <div className="alert-banner">{error}</div>
      ) : summaryData && summaryData.anomaly ? (
        <div className="flex-col gap-6">
          
          {/* Anomaly Summary Header */}
          <div className="glass-card p-6 flex justify-between items-center border-l-4" style={{ borderLeftColor: summaryData.anomaly.severity === 'CRITICAL' ? 'var(--color-critical)' : 'var(--color-warning)' }}>
            <div className="flex items-center gap-4">
              <div className="bg-surface p-3 rounded-md border border-subtle">
                <AlertTriangle size={28} className={summaryData.anomaly.severity === 'CRITICAL' ? 'text-critical' : 'text-warning'} />
              </div>
              <div className="flex-col gap-1">
                <div className="text-xl font-bold flex items-center gap-3">
                  {summaryData.anomaly.service} Incident
                  <span className={`badge ${getSeverityBadgeClass(summaryData.anomaly.severity)}`}>
                    {summaryData.anomaly.severity} Priority
                  </span>
                </div>
                <div className="text-sm text-secondary flex items-center gap-2">
                  <span className="font-mono">{summaryData.anomaly.resource_id}</span> • 
                  <span>{summaryData.anomaly.region}</span> • 
                  <span className="text-cyan">{summaryData.anomaly.team}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div className="flex-col">
                <span className="text-sm text-secondary">Expected Cost</span>
                <span className="font-mono text-lg font-medium">${summaryData.anomaly.expected_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight size={20} className="text-muted" />
              </div>
              <div className="flex-col">
                <span className="text-sm text-critical">Actual Cost</span>
                <span className="font-mono text-2xl font-bold text-critical">${summaryData.anomaly.actual_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex-col pl-4 border-l border-subtle">
                <span className="text-sm text-warning">Excess Spend</span>
                <span className="font-mono text-xl font-bold text-warning">+${summaryData.anomaly.absolute_delta.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-warning">+{summaryData.anomaly.percentage_delta.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* AI Explanation & Report */}
          {summaryData.explanation && (
            <AIExplanationSection explanation={summaryData.explanation} />
          )}

          {/* Grid Layout for Root Cause & Impact */}
          <div className="grid grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            
            {/* Left: Root Cause & Investigation Graph */}
            <div className="flex-col gap-6">
              <RootCauseSection candidates={summaryData.top_root_causes} />
              {summaryData.graph && (
                <InvestigationGraphView graph={summaryData.graph} />
              )}
            </div>

            {/* Right: Financial Impact & Timeline */}
            <div className="flex-col gap-6">
              {summaryData.financial_impact && (
                <FinancialImpactSection impact={summaryData.financial_impact} />
              )}
            </div>
            
          </div>
          
        </div>
      ) : null}

    </div>
  );
};
