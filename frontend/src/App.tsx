import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { AnomalySection } from './components/AnomalySection';
import { RootCauseSection } from './components/RootCauseSection';
import { fetchBilling, fetchHealth, fetchAnomalies, fetchAnomaliesSummary } from './services/api';
import { BillingRecord } from './types/billing';
import { HealthResponse } from './types/health';
import { AnomalyItem, AnomalySummaryResponse } from './types/anomaly';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [anomaliesSummary, setAnomaliesSummary] = useState<AnomalySummaryResponse | null>(null);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (billingFilters: Record<string, string> = {}) => {
    try {
      setLoading(true);
      const [healthData, billingData, anomalyData, summaryData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchBilling(billingFilters).catch(() => ({ total_count: 0, records: [] })),
        fetchAnomalies().catch(() => ({ total_count: 0, anomalies: [] })),
        fetchAnomaliesSummary().catch(() => null),
      ]);

      setHealth(healthData);
      setRecords(billingData.records);
      setTotalCount(billingData.total_count);
      setAnomalies(anomalyData.anomalies);
      setAnomaliesSummary(summaryData);
      if (anomalyData.anomalies.length > 0 && !selectedAnomalyId) {
        setSelectedAnomalyId(anomalyData.anomalies[0].anomaly_id);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnomalyFilter = async (filters: Record<string, string>) => {
    try {
      const data = await fetchAnomalies(filters);
      setAnomalies(data.anomalies);
      if (data.anomalies.length > 0) {
        setSelectedAnomalyId(data.anomalies[0].anomaly_id);
      }
    } catch (err: any) {
      console.error('Failed to filter anomalies:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="layout-root">
      <Header health={health} />

      <div className="layout-body">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="layout-main">
          {error && (
            <div className="alert-banner">
              <strong>Connection Warning:</strong> {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewPage
              records={records}
              totalCount={totalCount}
              anomalies={anomalies}
              anomaliesSummary={anomaliesSummary}
              loading={loading}
              onFilterChange={loadData}
              onAnomalyFilterChange={handleAnomalyFilter}
              selectedAnomalyId={selectedAnomalyId}
              onSelectAnomaly={setSelectedAnomalyId}
            />
          )}

          {activeTab === 'anomalies' && (
            <div className="page-view">
              <AnomalySection
                anomalies={anomalies}
                summary={anomaliesSummary}
                loading={loading}
                onFilterChange={handleAnomalyFilter}
              />
            </div>
          )}

          {activeTab === 'rootcause' && (
            <div className="page-view">
              <RootCauseSection
                anomalies={anomalies}
                selectedAnomalyId={selectedAnomalyId}
                onSelectAnomaly={setSelectedAnomalyId}
              />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="page-view">
              <OverviewPage
                records={records}
                totalCount={totalCount}
                anomalies={anomalies}
                anomaliesSummary={anomaliesSummary}
                loading={loading}
                onFilterChange={loadData}
                onAnomalyFilterChange={handleAnomalyFilter}
                selectedAnomalyId={selectedAnomalyId}
                onSelectAnomaly={setSelectedAnomalyId}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="section-panel glass-card">
              <div className="section-panel-header">
                <div className="section-panel-title">Root-Cause Scoring Settings</div>
              </div>
              <p className="section-panel-desc">
                Centralized deterministic evidence weights for Cost Contribution (35%), Usage Delta (25%), Temporal Proximity (25%), and Resource Concentration (15%).
              </p>
              <div className="badge badge-pending">Confidence High Threshold: $\ge 75\%$ | Medium: $\ge 50\%$</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
