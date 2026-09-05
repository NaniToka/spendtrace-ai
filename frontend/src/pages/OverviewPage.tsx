import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
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
  const { totalCost, serviceData, trendData } = useMemo(() => {
    let tCost = 0;
    const sMap: Record<string, number> = {};
    const dailyMap: Record<string, { date: string; actual: number; expected: number }> = {};

    records.forEach((r) => {
      tCost += r.total_cost;
      sMap[r.service] = (sMap[r.service] || 0) + r.total_cost;

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

    const tData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return { totalCost: tCost, serviceData: sData, trendData: tData };
  }, [records, anomalies]);

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="overview-page flex-col gap-6 w-full animate-fade-in-up">
      {/* Hero Welcome Section */}
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Good morning, Alex.</h1>
        <p className="text-secondary text-lg">
          Your cloud infrastructure is currently operating with <strong className="text-critical">{anomaliesSummary?.critical_count || 0} critical anomalies</strong> detected in the last 7 days.
        </p>
      </div>

      {/* Redesigned KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card kpi-card glow-primary">
          <div className="kpi-header">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Excess Spend Impact</span>
            <TrendingUp size={18} className="text-primary" />
          </div>
          <div className="text-4xl font-extrabold my-2 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            ${(anomaliesSummary?.total_anomalous_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-sub text-warning font-mono">
            Unplanned cost variance
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="text-xs uppercase tracking-widest text-secondary font-bold">Total Normalized Cost</span>
            <DollarSign size={18} className="text-secondary" />
          </div>
          <div className="text-4xl font-extrabold my-2">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-sub text-secondary font-mono">
            Last 7 days actual spend
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="text-xs uppercase tracking-widest text-white/50 font-bold">Total Anomalies</span>
            <AlertCircle size={18} className="text-white/50" />
          </div>
          <div className="text-4xl font-extrabold my-2">
            {anomaliesSummary?.total_anomalies || 0}
          </div>
          <div className="kpi-sub text-critical font-mono flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-critical" style={{ animation: 'pulse 2s infinite' }}></div>
            {anomaliesSummary?.critical_count || 0} critical priority
          </div>
        </div>
      </div>

      {/* Main Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card chart-card lg:col-span-2">
          <div className="chart-header flex justify-between items-center">
            <span className="font-bold text-lg">Actual vs Expected Cost</span>
            <span className="text-xs font-mono text-secondary px-3 py-1 bg-white/5 rounded-full border border-white/10">7 Days</span>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(11, 17, 29, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="expected" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorExpected)" name="Expected" />
                <Area type="monotone" dataKey="actual" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" name="Actual" style={{ filter: 'url(#glow)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card chart-card flex flex-col">
          <div className="chart-header">
            <span className="font-bold text-lg">Cost by Service</span>
          </div>
          <div style={{ height: 220, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {serviceData.slice(0, 5).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(11, 17, 29, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-secondary text-xs uppercase tracking-wider font-bold">Total</span>
              <span className="text-xl font-bold text-white">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          {/* Custom Legend */}
          <div className="flex flex-col gap-2 mt-4 px-2">
            {serviceData.slice(0, 4).map((entry, idx) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-secondary">{entry.name}</span>
                </div>
                <span className="font-mono text-white/80">${entry.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Feed Table (Recent Anomalies) */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-critical" style={{ animation: 'pulse 2s infinite' }}></div>
            <h2 className="text-lg font-bold">Live Anomaly Feed</h2>
          </div>
          <button className="text-sm text-secondary hover:text-white transition-colors flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>
        
        {loading ? (
          <div className="text-secondary p-8 text-center flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading feed...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Service</th>
                  <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Detected</th>
                  <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {anomalies.slice(0, 5).map((anomaly) => {
                  const isCritical = anomaly.severity.toUpperCase() === 'CRITICAL';
                  return (
                    <tr key={anomaly.anomaly_id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-critical' : 'bg-warning'}`} style={{ animation: isCritical ? 'pulse 2s infinite' : 'pulse-amber 3s infinite' }}></div>
                          <span className="text-xs font-mono text-white/50">{anomaly.anomaly_id.slice(-8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-primary group-hover:text-primary-light transition-colors">{anomaly.service}</div>
                        <div className="text-xs text-secondary">{anomaly.region}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary font-mono">
                        {new Date(anomaly.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-white bg-white/5 px-3 py-1 rounded inline-block border border-white/10">
                          +${anomaly.absolute_delta.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {anomalies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-secondary">System stable. No anomalies detected.</td>
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
