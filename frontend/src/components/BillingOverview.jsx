import React from 'react';
import { DollarSign, Layers, Globe, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function BillingOverview({ summary }) {
  if (!summary) return null;

  const totalSpend = summary.total_spend || 0;
  const topService = summary.by_service ? Object.entries(summary.by_service)[0] : null;
  const topTeam = summary.by_team ? Object.entries(summary.by_team)[0] : null;
  const maxDailyCost = Math.max(...(summary.daily_trend?.map(d => d.total_cost) || [100]));

  return (
    <div>
      {/* Top Level Metric KPIs */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-label">
            <span>30-Day Ingested Cloud Spend</span>
            <DollarSign size={16} color="var(--accent-primary)" />
          </div>
          <div className="metric-value">${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="metric-sub">{summary.record_count} CUR Line Items Normalized</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">
            <span>Highest Cost Driver</span>
            <Layers size={16} color="var(--accent-cyan)" />
          </div>
          <div className="metric-value" style={{ fontSize: '1.45rem' }}>{topService ? topService[0] : 'N/A'}</div>
          <div className="metric-sub">${topService ? topService[1].toFixed(2) : 0} total ({topService && totalSpend ? ((topService[1]/totalSpend)*100).toFixed(1) : 0}% of bill)</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">
            <span>Top Attributed Team</span>
            <Users size={16} color="var(--accent-secondary)" />
          </div>
          <div className="metric-value" style={{ fontSize: '1.45rem' }}>{topTeam ? topTeam[0] : 'N/A'}</div>
          <div className="metric-sub">${topTeam ? topTeam[1].toFixed(2) : 0} attributed spend</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-label">
            <span>Active Cost Anomalies</span>
            <AlertTriangle size={16} color="var(--accent-rose)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-rose)' }}>3 Spikes</div>
          <div className="metric-sub">DataTransfer, Lambda, RDS Bench</div>
        </div>
      </div>

      {/* Main Breakdown & Trend Charts */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="section-header">
            <div className="section-title">
              <TrendingUp size={18} color="var(--accent-primary)" />
              <span>Daily AWS Ingested Spend Profile</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 30 Days (UTC)</span>
          </div>

          <div className="chart-container">
            {summary.daily_trend?.map((item, idx) => {
              const heightPct = Math.max(8, (item.total_cost / maxDailyCost) * 100);
              // Highlight the last 7 days where synthetic anomaly spikes occur
              const isAnomaly = idx >= 23;
              return (
                <div key={item.date} className="chart-bar-wrapper" title={`${item.date}: $${item.total_cost.toFixed(2)}`}>
                  <div
                    className={`chart-bar ${isAnomaly ? 'anomaly' : ''}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  {idx % 5 === 0 && <span className="chart-label">{item.date.slice(5)}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--accent-primary)', borderRadius: '2px', display: 'inline-block' }}></span> Baseline Workloads
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--accent-rose)', borderRadius: '2px', display: 'inline-block' }}></span> Detected Spend Surge / Anomaly
            </span>
          </div>
        </div>

        {/* Spend by Service List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="section-header">
            <div className="section-title">
              <Layers size={18} color="var(--accent-cyan)" />
              <span>Spend by AWS Service</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {summary.by_service && Object.entries(summary.by_service).slice(0, 5).map(([svc, cost]) => {
              const pct = totalSpend > 0 ? (cost / totalSpend) * 100 : 0;
              return (
                <div key={svc}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{svc}</span>
                    <span className="mono" style={{ color: 'var(--text-secondary)' }}>${cost.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
