import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { FinancialImpactResponse } from '../types/financial_impact';

interface FinancialImpactSectionProps {
  impact: FinancialImpactResponse;
}

export const FinancialImpactSection: React.FC<FinancialImpactSectionProps> = ({ impact }) => {
  if (impact.status === 'INSUFFICIENT_DATA') {
    return (
      <div className="section-panel glass-card" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle size={20} color="var(--color-secondary)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Financial Impact</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Insufficient data to calculate a reliable financial projection for this anomaly.
        </p>
      </div>
    );
  }

  // Visual comparison math
  const maxBar = Math.max(impact.current_anomalous_cost, impact.expected_cost);
  const expectedWidth = Math.max((impact.expected_cost / maxBar) * 100, 2);
  const actualWidth = Math.max((impact.current_anomalous_cost / maxBar) * 100, 2);

  return (
    <div className="section-panel glass-card" style={{ borderLeft: '4px solid var(--color-cyan)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <DollarSign size={22} color="var(--color-cyan)" />
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Financial Impact & Action Simulator</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <TrendingUp size={16} color="#ef4444" />
            <span style={{ fontSize: '0.85rem' }}>Daily Excess Cost</span>
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>
            ${impact.excess_cost.toLocaleString()}
          </div>
        </div>
        
        <div className="stat-card glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <TrendingUp size={16} color="var(--color-amber)" />
            <span style={{ fontSize: '0.85rem' }}>7-Day Projection</span>
          </div>
          <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-amber)' }}>
            ${impact.projected_7_day_excess.toLocaleString()}
          </div>
        </div>

        <div className="stat-card glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <TrendingUp size={16} color="var(--color-purple)" />
            <span style={{ fontSize: '0.85rem' }}>30-Day Projection</span>
          </div>
          <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-purple)' }}>
            ${impact.projected_30_day_excess.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Expected vs Actual (Daily)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '80px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expected</div>
            <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${expectedWidth}%`, height: '100%', backgroundColor: 'var(--color-secondary)' }}></div>
            </div>
            <div className="mono" style={{ width: '80px', textAlign: 'right', fontSize: '0.85rem' }}>${impact.expected_cost.toLocaleString()}</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '80px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Actual</div>
            <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${actualWidth}%`, height: '100%', backgroundColor: '#ef4444' }}></div>
            </div>
            <div className="mono" style={{ width: '80px', textAlign: 'right', fontSize: '0.85rem', color: '#ef4444' }}>${impact.current_anomalous_cost.toLocaleString()}</div>
          </div>
          
        </div>
      </div>

      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-emerald)', marginBottom: '4px' }}>
            <TrendingDown size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Estimated Savings (Action Simulator)</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            If corrective action is taken immediately, preventing a 30-day accumulation.
          </div>
        </div>
        <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-emerald)' }}>
          ${impact.potential_savings.toLocaleString()}
        </div>
      </div>
      
    </div>
  );
};
