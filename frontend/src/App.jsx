import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import BillingOverview from './components/BillingOverview';
import TimelineView from './components/TimelineView';
import DataInspection from './components/DataInspection';
import { fetchHealth, fetchBillingSummary, fetchBillingRecords, fetchEvents } from './services/api';
import { LayoutDashboard, GitBranch, Database, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async (filters = {}) => {
    try {
      setLoading(true);
      const [healthData, summaryData, billingData, eventsData] = await Promise.all([
        fetchHealth().catch(e => ({ status: 'offline', error: e.message })),
        fetchBillingSummary().catch(() => null),
        fetchBillingRecords({ limit: 25, ...filters }).catch(() => ({ records: [], total_count: 0 })),
        fetchEvents().catch(() => []),
      ]);

      setHealth(healthData);
      setSummary(summaryData);
      setRecords(billingData.records || []);
      setTotalCount(billingData.total_count || 0);
      setEvents(eventsData || []);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (filters) => {
    loadData(filters);
  };

  return (
    <div className="app-container">
      <Navbar health={health} />

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div className="tab-list">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutDashboard size={15} /> Overview & Anomalies
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={15} /> Deployment Timeline
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={15} /> Normalized CUR Stream
            </span>
          </button>
        </div>

        <div className="badge badge-event" style={{ gap: '8px', padding: '6px 14px' }}>
          <Sparkles size={14} color="var(--accent-cyan)" />
          <span>Extensible Root-Cause Correlation Engine</span>
        </div>
      </div>

      {loading && !summary ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="badge badge-pulse" style={{ marginBottom: '16px' }}>
            <div className="dot"></div> Connecting to COSTRA FastAPI Backend...
          </div>
          <p>Normalizing synthetic AWS Cost & Usage Reports...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '40px', color: 'var(--accent-rose)' }}>
          <h3>Unable to connect to backend</h3>
          <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <>
              <BillingOverview summary={summary} />
              <TimelineView events={events.slice(0, 2)} />
              <DataInspection records={records.slice(0, 10)} totalCount={totalCount} onFilterChange={handleFilterChange} />
            </>
          )}

          {activeTab === 'timeline' && (
            <TimelineView events={events} />
          )}

          {activeTab === 'records' && (
            <DataInspection records={records} totalCount={totalCount} onFilterChange={handleFilterChange} />
          )}
        </>
      )}
    </div>
  );
}
