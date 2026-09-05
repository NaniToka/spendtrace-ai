import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, AlertCircle, TrendingUp, Layers, Users, ArrowRight } from 'lucide-react';
import { BillingRecord } from '../types/billing';
import { AnomalyItem, AnomalySummaryResponse } from '../types/anomaly';

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
  anomalies,
  anomaliesSummary,
  loading,
}) => {
  const { totalCost, topService, topTeam, serviceData, trendData } = useMemo(() => {
    let tCost = 0;
    const sMap: Record<string, number> = {};
    const tMap: Record<string, number> = {};
    const dailyMap: Record<string, { date: string; actual: number; expected: number }> = {};

    records.forEach((r) => {
      tCost += r.total_cost;
      sMap[r.service] = (sMap[r.service] || 0) + r.total_cost;
      tMap[r.team] = (tMap[r.team] || 0) + r.total_cost;

      const date = r.timestamp.slice(5, 10); // MM-DD
      if (!dailyMap[date]) dailyMap[date] = { date, actual: 0, expected: 0 };
      dailyMap[date].actual += r.total_cost;
      dailyMap[date].expected += r.total_cost;
    });

    anomalies.forEach((a) => {
      const date = a.timestamp.slice(5, 10);
      if (dailyMap[date]) {
        dailyMap[date].expected -= a.absolute_delta;
      }
    });

    const sData = Object.entries(sMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const topS = sData[0] || { name: 'N/A', value: 0 };
    const topT = Object.entries(tMap).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    const tData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return { totalCost: tCost, topService: topS, topTeam: topT, serviceData: sData, trendData: tData };
  }, [records, anomalies]);

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-info';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="overview-page">
      {/* 5 Premium KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span>Total Normalized Cost</span>
            <DollarSign size={18} className="text-muted" />
          </div>
          <div className="kpi-value">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="kpi-sub text-secondary">
            Last 7 days actual spend
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span>Total Anomalies</span>
            <AlertCircle size={18} className="text-muted" />
          </div>
          <div className="kpi-value">{anomaliesSummary?.total_anomalies || 0}</div>
          <div className="kpi-sub text-critical">
            {anomaliesSummary?.critical_count || 0} critical priority
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span>Excess Spend</span>
            <TrendingUp size={18} className="text-muted" />
          </div>
          <div className="kpi-value">${(anomaliesSummary?.total_anomalous_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="kpi-sub text-warning">
            Unplanned cost variance
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span>Top Cost Service</span>
            <Layers size={18} className="text-muted" />
          </div>
          <div className="kpi-value truncate">{topService.name}</div>
          <div className="kpi-sub text-cyan">
            ${topService.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span>Top Attributed Team</span>
            <Users size={18} className="text-muted" />
          </div>
          <div className="kpi-value truncate">{topTeam[0]}</div>
          <div className="kpi-sub text-primary">
            ${topTeam[1].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
          </div>
        </div>
      </div>

      {/* Main Analytics Area */}
      <div className="charts-grid">
        <div className="glass-card chart-card">
          <div className="chart-header">Actual vs Expected Cost (7 Days)</div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="expected" stroke="#06B6D4" fillOpacity={1} fill="url(#colorExpected)" name="Expected" />
                <Area type="monotone" dataKey="actual" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorActual)" name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">Cost by Service</div>
          <div style={{ height: 300, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {serviceData.slice(0, 5).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="text-secondary text-sm">Total</span>
              <span className="text-xl font-bold">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Anomalies */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Anomalies</h2>
          <button className="btn btn-outline text-sm">View All <ArrowRight size={14} /></button>
        </div>
        
        {loading ? (
          <div className="text-secondary p-4 text-center">Loading anomalies...</div>
        ) : (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Anomaly ID</th>
                  <th>Severity</th>
                  <th>Service</th>
                  <th>Detected Time</th>
                  <th>Excess Spend</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 5).map((anomaly) => (
                  <tr key={anomaly.anomaly_id}>
                    <td className="mono text-muted text-xs">...{anomaly.anomaly_id.slice(-8)}</td>
                    <td>
                      <span className={`badge ${getSeverityBadge(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td className="font-medium text-primary">{anomaly.service}</td>
                    <td className="text-secondary">{new Date(anomaly.timestamp).toLocaleString()}</td>
                    <td className="cell-primary">${anomaly.absolute_delta.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className="badge badge-info">Investigating</span>
                    </td>
                  </tr>
                ))}
                {anomalies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-secondary">No anomalies detected in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
