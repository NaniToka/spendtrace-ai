import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const RootCauseSection: React.FC = () => {
  return (
    <div className="section-panel glass-card">
      <div className="section-panel-header">
        <div className="section-panel-title">
          <Sparkles size={18} color="var(--color-purple)" />
          <span>Root-Cause Correlation & AI Explainer</span>
        </div>
        <span className="badge badge-pending">Foundation Phase — Module Ready</span>
      </div>

      <p className="section-panel-desc">
        Correlates isolated billing anomalies with engineering deployment logs, pull requests, and infrastructure changes to explain <em>why</em> the cloud bill changed.
      </p>

      <div className="correlation-preview-card">
        <div className="correlation-preview-title">Designed Correlation Chain Example</div>
        <div className="correlation-chain">
          <div className="chain-node">
            <span className="chain-tag tag-spike">Billing Spike</span>
            <span className="chain-val">+$140.00/day</span>
          </div>
          <ArrowRight size={16} className="chain-arrow" />
          <div className="chain-node">
            <span className="chain-tag tag-service">Service & Resource</span>
            <span className="chain-val">AmazonEC2 / nat-0a1b2c3d4e5f</span>
          </div>
          <ArrowRight size={16} className="chain-arrow" />
          <div className="chain-node">
            <span className="chain-tag tag-team">Team Attribution</span>
            <span className="chain-val">data-platform (pipeline-sync)</span>
          </div>
          <ArrowRight size={16} className="chain-arrow" />
          <div className="chain-node">
            <span className="chain-tag tag-event">Root Cause Event</span>
            <span className="chain-val">Deployment dep-7f9b8c2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
