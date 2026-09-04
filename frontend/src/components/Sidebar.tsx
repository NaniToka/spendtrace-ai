import React from 'react';
import { LayoutDashboard, AlertCircle, Sparkles, Database, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'anomalies', label: 'Anomalies', icon: <AlertCircle size={18} />, badge: 'Placeholder' },
    { id: 'rootcause', label: 'Root Cause', icon: <Sparkles size={18} />, badge: 'Placeholder' },
    { id: 'billing', label: 'Billing Stream', icon: <Database size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="sidebar-nav glass-card">
      <div className="sidebar-label">WORKSPACE</div>
      <div className="sidebar-menu">
        {navItems.map((item) => (
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
    </aside>
  );
};
