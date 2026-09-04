import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const AnomalySection: React.FC = () => {
  return (
    <div className="section-panel glass-card">
      <div className="section-panel-header">
        <div className="section-panel-title">
          <AlertTriangle size={18} color="var(--color-rose)" />
          <span>Cost Anomaly Detection Engine</span>
        </div>
        <span className="badge badge-pending">Foundation Phase — Module Ready</span>
      </div>

      <p className="section-panel-desc">
        The anomaly detection module will process the normalized billing stream to isolate unexpected spend spikes, estimate financial blast radius, and trigger root-cause analysis.
      </p>

      <div className="placeholder-pipeline-grid">
        <div className="pipeline-step">
          <div className="pipeline-step-num">1</div>
          <div className="pipeline-step-title">Baseline Spend Modeling</div>
          <div className="pipeline-step-desc">Computes rolling daily and hourly expected variance across services and resources.</div>
        </div>

        <div className="pipeline-step">
          <div className="pipeline-step-num">2</div>
          <div className="pipeline-step-title">Z-Score & Spike Isolation</div>
          <div className="pipeline-step-desc">Flags statistical deviations (&gt;3σ) on usage quantities and unblended costs.</div>
        </div>

        <div className="pipeline-step">
          <div className="pipeline-step-num">3</div>
          <div className="pipeline-step-title">Impact Severity Ranking</div>
          <div className="pipeline-step-desc">Calculates excess USD burn rate and categorizes severity (Low / Medium / Critical).</div>
        </div>
      </div>
    </div>
  );
};
