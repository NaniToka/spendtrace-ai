import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AnomalyItem, AnomalySummaryResponse } from '../types/anomaly';

interface AnomalySectionProps {
  anomalies: AnomalyItem[];
  summary: AnomalySummaryResponse | null;
  loading: boolean;
  onFilterChange: (filters: Record<string, string>) => void;
}

export const AnomalySection: React.FC<AnomalySectionProps> = ({
  anomalies,
  summary,
  loading,
  onFilterChange,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const handleFilter = (sev: string, svc: string, tm: string) => {
    setSelectedSeverity(sev);
    setSelectedService(svc);
    setSelectedTeam(tm);

    const filters: Record<string, string> = {};
    if (sev) filters.severity = sev;
    if (svc) filters.service = svc;
    if (tm) filters.team = tm;
    onFilterChange(filters);
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'badge-critical';
      case 'HIGH':
        return 'badge-high';
      case 'MEDIUM':
        return 'badge-medium';
      case 'LOW':
        return 'badge-low';
      default:
        return 'badge-tag';
    }
  };

  return (
    <div className="section-panel glass-card">
      <div className="section-panel-header">
        <div className="section-panel-title">
          <AlertTriangle size={20} color="var(--color-rose)" />
          <span>Statistical Cost Anomaly Detection Engine</span>
        </div>
        <div className="filter-controls">
          <select
            value={selectedSeverity}
            onChange={(e) => handleFilter(e.target.value, selectedService, selectedTeam)}
            className="filter-select"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={selectedService}
            onChange={(e) => handleFilter(selectedSeverity, e.target.value, selectedTeam)}
            className="filter-select"
          >
            <option value="">All Services</option>
            <option value="AmazonEC2">AmazonEC2</option>
            <option value="AmazonRDS">AmazonRDS</option>
          </select>

          <select
            value={selectedTeam}
            onChange={(e) => handleFilter(selectedSeverity, selectedService, e.target.value)}
            className="filter-select"
          >
            <option value="">All Teams</option>
            <option value="data-platform">data-platform</option>
            <option value="core-api">core-api</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Badges */}
      {summary && (
        <div className="anomaly-stats-bar">
          <div className="stat-pill">
            <span className="stat-label">Total Anomalies:</span>
            <span className="stat-num">{summary.total_anomalies}</span>
          </div>
          <div className="stat-pill pill-critical">
            <span className="stat-label">Critical:</span>
            <span className="stat-num">{summary.critical_count}</span>
          </div>
          <div className="stat-pill pill-high">
            <span className="stat-label">High:</span>
            <span className="stat-num">{summary.high_count}</span>
          </div>
          <div className="stat-pill pill-medium">
            <span className="stat-label">Medium:</span>
            <span className="stat-num">{summary.medium_count}</span>
          </div>
          <div className="stat-pill pill-spend">
            <span className="stat-label">Excess Spend:</span>
            <span className="stat-num mono">${summary.total_anomalous_spend.toFixed(2)}</span>
          </div>
          {summary.most_affected_service && (
            <div className="stat-pill pill-service">
              <span className="stat-label">Top Impacted:</span>
              <span className="stat-num">{summary.most_affected_service}</span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-container">Running statistical anomaly detection...</div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date (UTC)</th>
                <th>Severity</th>
                <th>Service & Resource</th>
                <th>Region / Team</th>
                <th style={{ textAlign: 'right' }}>Actual</th>
                <th style={{ textAlign: 'right' }}>Expected</th>
                <th style={{ textAlign: 'right' }}>Delta</th>
                <th>Z-Score</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.length > 0 ? (
                anomalies.map((a) => {
                  const shortRes = a.resource_id.split('/').pop() || a.resource_id.split(':').pop();
                  return (
                    <tr key={a.anomaly_id} className="row-highlight-spike">
                      <td className="mono">{a.timestamp.slice(0, 10)}</td>
                      <td>
                        <span className={`badge ${getSeverityBadgeClass(a.severity)}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td>
                        <div><strong>{a.service}</strong></div>
                        <div className="mono text-muted" style={{ fontSize: '0.72rem' }} title={a.resource_id}>
                          {shortRes}
                        </div>
                      </td>
                      <td>
                        <span className="mono text-cyan">{a.region}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.team}</div>
                      </td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-rose)' }}>
                        ${a.actual_cost.toFixed(2)}
                      </td>
                      <td className="mono text-muted" style={{ textAlign: 'right' }}>
                        ${a.expected_cost.toFixed(2)}
                      </td>
                      <td className="mono" style={{ textAlign: 'right', color: 'var(--color-rose)', fontWeight: 600 }}>
                        +${a.absolute_delta.toFixed(2)}
                        <div style={{ fontSize: '0.72rem' }}>+{a.percentage_delta.toFixed(1)}%</div>
                      </td>
                      <td className="mono" style={{ color: 'var(--color-amber)', fontWeight: 600 }}>
                        {a.anomaly_score.toFixed(2)}σ
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                        {a.explanation}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No cost anomalies detected matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-footer">
        <span>Detected {anomalies.length} anomaly incidents across historical observations</span>
        <span className="mono">Endpoint: /api/v1/anomalies</span>
      </div>
    </div>
  );
};
