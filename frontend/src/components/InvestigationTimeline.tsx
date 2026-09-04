import React from 'react';
import { InvestigationGraphResponse } from '../types/graph';
import { Clock } from 'lucide-react';

interface InvestigationTimelineProps {
  graph: InvestigationGraphResponse;
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({ graph }) => {
  // Synthesize timeline from graph data.
  // Real implementation would pull exact timestamps from event/usage streams.
  
  const anomalyTime = new Date(graph.anomaly.timestamp);
  
  // Fake timeline events based on graph data
  const timelineEvents = [];
  
  // 1. Deployment / Event (Usually happens 1-24 hours before)
  const eventNode = graph.nodes.find(n => n.type === 'DEPLOYMENT' || n.type === 'EVENT');
  if (eventNode) {
    const eventTime = new Date(anomalyTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    timelineEvents.push({
      time: eventTime.toISOString().slice(11, 16),
      label: eventNode.label,
      type: 'event'
    });
  }
  
  // 2. Usage Surge
  const usageNode = graph.nodes.find(n => n.type === 'USAGE');
  if (usageNode) {
    const usageTime = new Date(anomalyTime.getTime() - 1 * 60 * 60 * 1000); // 1 hour before
    timelineEvents.push({
      time: usageTime.toISOString().slice(11, 16),
      label: usageNode.label,
      type: 'usage'
    });
  }
  
  // 3. Anomaly Detected
  timelineEvents.push({
    time: anomalyTime.toISOString().slice(11, 16),
    label: `Cost Anomaly Classified ${graph.anomaly.severity}`,
    type: 'anomaly'
  });

  return (
    <div className="investigation-timeline">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Clock size={16} color="var(--text-secondary)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Investigation Timeline</span>
      </div>
      
      <div className="timeline-track">
        {timelineEvents.map((ev, i) => (
          <div key={i} className={`timeline-item ${ev.type}`}>
            <div className="timeline-time mono">{ev.time}</div>
            <div className="timeline-marker"></div>
            <div className="timeline-content">{ev.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
