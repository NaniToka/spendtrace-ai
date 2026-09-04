import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { AnomalySection } from './components/AnomalySection';
import { RootCauseSection } from './components/RootCauseSection';
import { fetchBilling, fetchHealth } from './services/api';
import { BillingRecord } from './types/billing';
import { HealthResponse } from './types/health';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (filters: Record<string, string> = {}) => {
    try {
      setLoading(true);
      const [healthData, billingData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchBilling(filters).catch(() => ({ total_count: 0, records: [] })),
      ]);

      setHealth(healthData);
      setRecords(billingData.records);
      setTotalCount(billingData.total_count);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
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
              loading={loading}
              onFilterChange={loadData}
            />
          )}

          {activeTab === 'anomalies' && (
            <div className="page-view">
              <AnomalySection />
            </div>
          )}

          {activeTab === 'rootcause' && (
            <div className="page-view">
              <RootCauseSection />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="page-view">
              <OverviewPage
                records={records}
                totalCount={totalCount}
                loading={loading}
                onFilterChange={loadData}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="section-panel glass-card">
              <div className="section-panel-header">
                <div className="section-panel-title">System Settings</div>
              </div>
              <p className="section-panel-desc">
                AWS Credentials, CUR Ingestion Pipelines, Webhook Alerts, and Model Configurations.
              </p>
              <div className="badge badge-pending">Planned for Future Phases</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
