import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { FinancialImpactResponse } from '../types/financial_impact';

interface FinancialImpactSectionProps {
  impact: FinancialImpactResponse;
}

export const FinancialImpactSection: React.FC<FinancialImpactSectionProps> = ({ impact }) => {
  if (impact.status === 'INSUFFICIENT_DATA') {
    return (
      <div className="glass-card p-6 border-l-4 border-l-secondary">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={20} className="text-secondary" />
          <h3 className="font-bold">Financial Impact</h3>
        </div>
        <p className="text-secondary text-sm">
          Insufficient data to calculate a reliable financial projection for this anomaly.
        </p>
      </div>
    );
  }

  const maxBar = Math.max(impact.current_anomalous_cost, impact.expected_cost);
  const expectedWidth = Math.max((impact.expected_cost / maxBar) * 100, 2);
  const actualWidth = Math.max((impact.current_anomalous_cost / maxBar) * 100, 2);

  return (
    <div className="glass-card p-6 border-t-2 border-t-cyan-400">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign size={20} className="text-cyan-400" />
        <h2 className="text-lg font-bold">Financial Impact & Projections</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-critical/10 border border-critical/20 rounded-md p-4">
          <div className="flex items-center gap-2 text-critical mb-2">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Daily Excess</span>
          </div>
          <div className="font-mono text-2xl font-bold text-critical">
            ${impact.excess_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-surface border border-subtle rounded-md p-4">
          <div className="flex items-center gap-2 text-warning mb-2">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">7-Day Proj.</span>
          </div>
          <div className="font-mono text-xl font-bold text-warning">
            ${impact.projected_7_day_excess.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-subtle p-4 rounded-md mb-6">
        <div className="text-sm font-bold mb-4">Expected vs Actual (Daily)</div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-16 text-xs text-secondary">Expected</div>
            <div className="flex-1 bg-card h-2.5 rounded-full overflow-hidden">
              <div style={{ width: `${expectedWidth}%` }} className="h-full bg-cyan-400"></div>
            </div>
            <div className="w-20 font-mono text-right text-xs">
              ${impact.expected_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 text-xs text-critical font-medium">Actual</div>
            <div className="flex-1 bg-card h-2.5 rounded-full overflow-hidden">
              <div style={{ width: `${actualWidth}%` }} className="h-full bg-critical"></div>
            </div>
            <div className="w-20 font-mono text-right text-xs text-critical font-bold">
              ${impact.current_anomalous_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-success/10 border border-success/30 p-4 rounded-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-success mb-1">
            <TrendingDown size={18} />
            <span className="font-bold text-sm">Est. 30-Day Savings</span>
          </div>
          <div className="text-xs text-success/80">If remediated immediately</div>
        </div>
        <div className="font-mono text-xl font-bold text-success">
          ${impact.potential_savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};
