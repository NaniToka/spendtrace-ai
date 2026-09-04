import React from 'react';
import { DollarSign, Layers, Users, FileSpreadsheet } from 'lucide-react';
import { BillingRecord } from '../types/billing';

interface CostSummaryProps {
  records: BillingRecord[];
  totalCount: number;
}

export const CostSummary: React.FC<CostSummaryProps> = ({ records, totalCount }) => {
  const totalCost = records.reduce((acc, r) => acc + r.total_cost, 0);
  
  // Calculate top service
  const serviceMap = records.reduce((acc, r) => {
    acc[r.service] = (acc[r.service] || 0) + r.total_cost;
    return acc;
  }, {} as Record<string, number>);
  const topServiceEntry = Object.entries(serviceMap).sort((a, b) => b[1] - a[1])[0];

  // Calculate top team
  const teamMap = records.reduce((acc, r) => {
    acc[r.team] = (acc[r.team] || 0) + r.total_cost;
    return acc;
  }, {} as Record<string, number>);
  const topTeamEntry = Object.entries(teamMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="cost-summary-grid">
      <div className="summary-card glass-card">
        <div className="summary-card-header">
          <span>Total Normalized Cost</span>
          <DollarSign size={16} color="var(--color-primary)" />
        </div>
        <div className="summary-card-value">${totalCost.toFixed(2)}</div>
        <div className="summary-card-sub">From synthetic AWS CUR line items</div>
      </div>

      <div className="summary-card glass-card">
        <div className="summary-card-header">
          <span>Top Cost Service</span>
          <Layers size={16} color="var(--color-cyan)" />
        </div>
        <div className="summary-card-value" style={{ fontSize: '1.4rem' }}>
          {topServiceEntry ? topServiceEntry[0] : 'N/A'}
        </div>
        <div className="summary-card-sub">
          ${topServiceEntry ? topServiceEntry[1].toFixed(2) : '0.00'} total spend
        </div>
      </div>

      <div className="summary-card glass-card">
        <div className="summary-card-header">
          <span>Top Attributed Team</span>
          <Users size={16} color="var(--color-purple)" />
        </div>
        <div className="summary-card-value" style={{ fontSize: '1.4rem' }}>
          {topTeamEntry ? topTeamEntry[0] : 'N/A'}
        </div>
        <div className="summary-card-sub">
          ${topTeamEntry ? topTeamEntry[1].toFixed(2) : '0.00'} team attribution
        </div>
      </div>

      <div className="summary-card glass-card">
        <div className="summary-card-header">
          <span>Ingested Records</span>
          <FileSpreadsheet size={16} color="var(--color-emerald)" />
        </div>
        <div className="summary-card-value">{totalCount}</div>
        <div className="summary-card-sub">Ready for anomaly scoring</div>
      </div>
    </div>
  );
};
