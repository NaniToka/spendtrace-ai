import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

  // Generate 30-day projection data for the chart
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    return {
      day: `Day ${day}`,
      projectedExcess: impact.excess_cost * day
    };
  });

  return (
    <div className="glass-card p-6 border-t-2 border-t-cyan-400 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-cyan-400" />
          <h2 className="text-xl font-bold">Financial Impact & Projections</h2>
        </div>
        <div className="bg-critical/10 text-critical text-sm font-bold px-3 py-1 rounded border border-critical/20">
          +${impact.excess_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} / day
        </div>
      </div>
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-subtle rounded-md p-4">
          <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Expected vs Actual</div>
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="text-sm text-secondary">Expected</div>
              <div className="font-mono text-lg">${impact.expected_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-critical">Actual</div>
              <div className="font-mono text-lg text-critical font-bold">${impact.current_anomalous_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-subtle rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-warning mb-2">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">7-Day Projection</span>
          </div>
          <div className="font-mono text-2xl font-bold text-warning">
            ${impact.projected_7_day_excess.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-surface border border-subtle rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-critical mb-2">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">30-Day Projection</span>
          </div>
          <div className="font-mono text-2xl font-bold text-critical">
            ${impact.projected_30_day_excess.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 bg-surface border border-subtle rounded-md p-4 mb-6 min-h-[250px]">
        <div className="flex items-center gap-2 mb-4 text-secondary">
          <BarChart3 size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">Cumulative Projected Excess Spend</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExcess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-critical)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-critical)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                width={80}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#070B14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--color-critical)', fontWeight: 'bold' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Projected Excess']}
                labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="projectedExcess" 
                stroke="var(--color-critical)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorExcess)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Potential Savings Footer */}
      <div className="bg-success/10 border border-success/30 p-4 rounded-md flex items-center justify-between mt-auto">
        <div>
          <div className="flex items-center gap-2 text-success mb-1">
            <TrendingDown size={18} />
            <span className="font-bold text-sm">Potential Savings (30 Days)</span>
          </div>
          <div className="text-xs text-success/80">If root cause is remediated immediately</div>
        </div>
        <div className="font-mono text-2xl font-bold text-success">
          ${impact.potential_savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};
