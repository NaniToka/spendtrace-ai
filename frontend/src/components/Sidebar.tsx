import React from 'react';
import { LayoutDashboard, AlertCircle, Sparkles, Database, Settings, Network, DollarSign, FileText, User, Zap } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  anomalyCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, anomalyCount = 0 }) => {
  const mainNavItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'anomalies', label: 'Anomalies', icon: <AlertCircle size={18} />, badge: anomalyCount > 0 ? anomalyCount : null },
    { id: 'rootcause', label: 'Root Cause', icon: <Sparkles size={18} /> },
    { id: 'investigation', label: 'Investigation Graph', icon: <Network size={18} /> },
    { id: 'financial', label: 'Financial Impact', icon: <DollarSign size={18} /> },
  ];

  const systemNavItems = [
    { id: 'billing', label: 'Billing Stream', icon: <Database size={18} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="layout-sidebar">
      <div className="brand-group">
        <div className="brand-badge-icon">
          <Zap size={20} />
        </div>
        <div className="brand-name">SpendTrace AI</div>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-label">Analytics</div>
        <div className="sidebar-menu mb-6">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-btn-content">
                {item.icon}
                <span>{item.label}</span>
              </span>
              {item.badge && <span className="nav-tag">{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-label">System</div>
        <div className="sidebar-menu">
          {systemNavItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-btn-content">
                {item.icon}
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="user-profile-section">
        <div className="user-avatar">
          <User size={16} />
        </div>
        <div className="user-details">
          <span className="user-name">Alex FinOps</span>
          <span className="user-role">Cloud Architect</span>
        </div>
      </div>
    </aside>
  );
};
