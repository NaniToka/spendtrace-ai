import React, { useState } from 'react';
import { CostSummary } from '../components/CostSummary';
import { AnomalySection } from '../components/AnomalySection';
import { RootCauseSection } from '../components/RootCauseSection';
import { BillingRecord } from '../types/billing';
import { AnomalyItem, AnomalySummaryResponse } from '../types/anomaly';
import { Database, ArrowUpRight } from 'lucide-react';

interface OverviewPageProps {
  records: BillingRecord[];
  totalCount: number;
  anomalies: AnomalyItem[];
  anomaliesSummary: AnomalySummaryResponse | null;
  loading: boolean;
  onFilterChange: (filters: Record<string, string>) => void;
  onAnomalyFilterChange: (filters: Record<string, string>) => void;
  selectedAnomalyId?: string;
  onSelectAnomaly?: (id: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  records,
  totalCount,
  anomalies,
  anomaliesSummary,
  loading,
  onFilterChange,
  onAnomalyFilterChange,
  selectedAnomalyId,
  onSelectAnomaly,
}) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const handleService = (val: string) => {
    setSelectedService(val);
    const filters: Record<string, string> = {};
    if (val) filters.service = val;
    if (selectedTeam) filters.team = selectedTeam;
    onFilterChange(filters);
  };

  const handleTeam = (val: string) => {
    setSelectedTeam(val);
    const filters: Record<string, string> = {};
    if (selectedService) filters.service = selectedService;
    if (val) filters.team = val;
    onFilterChange(filters);
  };

  return (
    <div className="overview-page">
      {/* 1. Cost Summary Cards */}
      <CostSummary records={records} totalCount={totalCount} />

      {/* 2. Anomaly Engine Section */}
      <div style={{ marginBottom: '20px' }}>
        <AnomalySection
          anomalies={anomalies}
          summary={anomaliesSummary}
          loading={loading}
          onFilterChange={onAnomalyFilterChange}
        />
      </div>

      {/* 3. Root Cause Intelligence Section */}
      <div style={{ marginBottom: '20px' }}>
        <RootCauseSection
          anomalies={anomalies}
          selectedAnomalyId={selectedAnomalyId}
          onSelectAnomaly={onSelectAnomaly}
        />
      </div>

      {/* 4. Ingested Billing Stream Table */}
      <div className="section-panel glass-card">
        <div className="section-panel-header">
          <div className="section-panel-title">
            <Database size={18} color="var(--color-primary)" />
            <span>Normalized AWS Billing Stream (Local Ingestion)</span>
          </div>
          <div className="filter-controls">
            <select
              value={selectedService}
              onChange={(e) => handleService(e.target.value)}
              className="filter-select"
            >
              <option value="">All Services</option>
              <option value="AmazonEC2">AmazonEC2</option>
              <option value="AmazonRDS">AmazonRDS</option>
            </select>

            <select
              value={selectedTeam}
              onChange={(e) => handleTeam(e.target.value)}
              className="filter-select"
            >
              <option value="">All Teams</option>
              <option value="core-api">core-api</option>
              <option value="data-platform">data-platform</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">Loading billing records...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Service</th>
                  <th>Region</th>
                  <th>Resource ID</th>
                  <th>Usage Type</th>
                  <th>Quantity</th>
                  <th>Team</th>
                  <th>Deployment Link</th>
                  <th style={{ textAlign: 'right' }}>Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((r) => {
                    const isSpike = r.total_cost > 100;
                    return (
                      <tr key={r.record_id} className={isSpike ? 'row-highlight-spike' : ''}>
                        <td className="mono">{r.timestamp.slice(0, 10)}</td>
                        <td>
                          <strong>{r.service}</strong>
                        </td>
                        <td className="mono text-cyan">{r.region}</td>
                        <td className="mono text-muted" title={r.resource_id}>
                          {r.resource_id.split('/').pop() || r.resource_id.split(':').pop()}
                        </td>
                        <td className="text-secondary">{r.usage_type}</td>
                        <td className="mono">{r.usage_quantity.toFixed(1)}</td>
                        <td>
                          <span className="badge badge-tag">{r.team}</span>
                        </td>
                        <td>
                          {r.deployment_id ? (
                            <span className="badge badge-spike">
                              <ArrowUpRight size={12} /> {r.deployment_id}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${r.total_cost.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                      No billing records found matching filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span>Displaying {records.length} normalized records</span>
          <span className="mono">Endpoint: /api/v1/billing</span>
        </div>
      </div>
    </div>
  );
};
