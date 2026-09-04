import React from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export default function Navbar({ health }) {
  return (
    <header className="navbar glass-card">
      <div className="brand-wrapper">
        <div className="brand-logo">
          <Zap size={24} />
        </div>
        <div>
          <h1 className="brand-title">COSTRA</h1>
          <p className="brand-tagline">Don't just see the cloud bill. Understand why it changed.</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="badge badge-event">
          <Activity size={13} />
          <span>IEEE Genesis Hackathon</span>
        </div>
        <div className="badge badge-pulse">
          <div className="dot"></div>
          <span>{health?.status === 'healthy' ? 'API Live (v0.1.0)' : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}
