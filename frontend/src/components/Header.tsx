import React from 'react';
import { Zap } from 'lucide-react';
import { HealthResponse } from '../types/health';

interface HeaderProps {
  health: HealthResponse | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  return (
    <header className="header-bar glass-card">
      <div className="brand-group">
        <div className="brand-badge-icon">
          <Zap size={22} />
        </div>
        <div>
          <div className="brand-name">SpendTrace AI</div>
          <div className="brand-sub">Don't just detect cloud cost spikes. Explain why they happened.</div>
        </div>
      </div>

      <div className="header-meta">
        <span className="badge badge-accent">IEEE Genesis Hackathon</span>
        <span className={`badge ${health?.status === 'healthy' ? 'badge-online' : 'badge-offline'}`}>
          <span className="pulse-dot"></span>
          {health?.status === 'healthy' ? `Backend Live (v${health.version})` : 'Connecting...'}
        </span>
      </div>
    </header>
  );
};
