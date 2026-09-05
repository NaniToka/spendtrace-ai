import React from 'react';
import { Calendar, RefreshCw, Bell } from 'lucide-react';
import { HealthResponse } from '../types/health';

interface HeaderProps {
  health: HealthResponse | null;
  activeTab: string;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, activeTab, onRefresh }) => {
  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return { title: 'Overview Dashboard', desc: 'High-level cost anomalies and expected spend' };
      case 'anomalies': return { title: 'Recent Anomalies', desc: 'Detected unexpected cost variations' };
      case 'rootcause': return { title: 'Root Cause Analysis', desc: 'AI-driven explanation of anomalous spend' };
      case 'investigation': return { title: 'Investigation Graph', desc: 'Visual evidence hierarchy' };
      case 'financial': return { title: 'Financial Impact', desc: 'Excess cost and budget projections' };
      case 'billing': return { title: 'Billing Stream', desc: 'Raw cost data ingestion' };
      case 'reports': return { title: 'Reports', desc: 'Generated cost anomaly reports' };
      case 'settings': return { title: 'Settings', desc: 'Configure detection and models' };
      default: return { title: 'SpendTrace AI', desc: 'Cloud Cost Intelligence' };
    }
  };

  const { title, desc } = getPageTitle();

  return (
    <header className="header-bar">
      <div className="header-title-group">
        <h1 className="header-title">{title}</h1>
        <div className="header-desc">{desc}</div>
      </div>

      <div className="header-actions">
        <div className="date-selector">
          <Calendar size={16} />
          <span>Last 7 Days</span>
        </div>
        
        <button className="btn-icon" onClick={onRefresh} title="Refresh Data">
          <RefreshCw size={18} />
        </button>
        
        <button className="btn-icon" title="Notifications">
          <Bell size={18} />
        </button>

        <span className={`badge ${health?.status === 'healthy' ? 'badge-success' : 'badge-critical'}`}>
          {health?.status === 'healthy' ? `Backend Live (v${health.version})` : 'Connecting...'}
        </span>
      </div>
    </header>
  );
};
