import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { AnomalySection } from './components/AnomalySection';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { fetchBilling, fetchHealth, fetchAnomalies, fetchAnomaliesSummary } from './services/api';
import { BillingRecord } from './types/billing';
import { HealthResponse } from './types/health';
import { AnomalyItem, AnomalySummaryResponse } from './types/anomaly';
// New components will be imported here as we build them
// import { RootCauseSection } from './components/RootCauseSection';
import { InvestigationGraphView } from './components/InvestigationGraphView';
import { FinancialImpactView } from './components/FinancialImpactView';

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
        fetchHealth().catch(() => {
          throw new Error('Backend connection failed. Please ensure the backend server is running.');
        }),
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
      setError('Failed to filter anomalies. Please check backend connection.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="layout-root">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        anomalyCount={anomaliesSummary?.total_anomalies || 0}
      />

      <div className="layout-main-wrapper">
        <Header 
          health={health} 
          activeTab={activeTab} 
          onRefresh={() => loadData()}
        />

        <main className="layout-main-content">
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
              <ExecutiveDashboard
                anomalies={anomalies}
                selectedAnomalyId={selectedAnomalyId}
                onSelectAnomaly={setSelectedAnomalyId}
              />
            </div>
          )}
          
          {activeTab === 'investigation' && (
             <div className="page-view">
               <div className="glass-card p-6">
                 <h2 className="text-xl font-bold mb-4">Investigation Graph</h2>
                 {selectedAnomalyId ? (
                   <InvestigationGraphView anomalyId={selectedAnomalyId} />
                 ) : (
                   <p className="text-secondary">Select an anomaly from the Anomalies tab to view its investigation graph.</p>
                 )}
               </div>
             </div>
          )}

          {activeTab === 'financial' && (
             <div className="page-view">
               <div className="glass-card p-6">
                 {selectedAnomalyId ? (
                   <FinancialImpactView anomalyId={selectedAnomalyId} />
                 ) : (
                   <p className="text-secondary">Select an anomaly from the Anomalies tab to view its detailed financial impact.</p>
                 )}
               </div>
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

          {activeTab === 'reports' && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl">Generated Reports</h2>
              </div>
              <p className="text-secondary">No reports generated yet.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl">Root-Cause Scoring Settings</h2>
              </div>
              <p className="text-secondary mb-4">
                Centralized deterministic evidence weights for Cost Contribution (35%), Usage Delta (25%), Temporal Proximity (25%), and Resource Concentration (15%).
              </p>
              <div className="badge badge-warning">Confidence High Threshold: ≥ 75% | Medium: ≥ 50%</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
