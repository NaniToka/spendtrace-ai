import React, { useState } from 'react';
import { InvestigationGraphResponse, InvestigationNode } from '../types/graph';
import { Layers, Server, Activity, GitCommit, Target, AlertTriangle } from 'lucide-react';

interface InvestigationGraphViewProps {
  graph: InvestigationGraphResponse;
}

export const InvestigationGraphView: React.FC<InvestigationGraphViewProps> = ({ graph }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Simple layout logic for the linear/branching prototype graph
  const getIconForType = (type: string) => {
    switch (type) {
      case 'ANOMALY': return <AlertTriangle size={18} color="var(--color-purple)" />;
      case 'SERVICE': return <Layers size={18} color="var(--color-primary)" />;
      case 'RESOURCE': return <Server size={18} color="var(--color-cyan)" />;
      case 'USAGE': return <Activity size={18} color="var(--color-emerald)" />;
      case 'DEPLOYMENT':
      case 'EVENT': return <GitCommit size={18} color="var(--color-purple)" />;
      default: return <Target size={18} color="var(--text-secondary)" />;
    }
  };

  const selectedNode = selectedNodeId ? graph.nodes.find(n => n.id === selectedNodeId) : null;
  const relatedEdges = selectedNode 
    ? graph.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  // Group nodes logically
  const anomalyNode = graph.nodes.find(n => n.type === 'ANOMALY');
  const serviceNodes = graph.nodes.filter(n => n.type === 'SERVICE');
  const resourceNodes = graph.nodes.filter(n => n.type === 'RESOURCE');
  const otherNodes = graph.nodes.filter(n => !['ANOMALY', 'SERVICE', 'RESOURCE'].includes(n.type));

  const renderNode = (node: InvestigationNode) => {
    const isSelected = selectedNodeId === node.id;
    return (
      <div 
        key={node.id} 
        className={`graph-node ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedNodeId(node.id)}
      >
        <div className="node-icon">{getIconForType(node.type)}</div>
        <div className="node-content">
          <div className="node-type">{node.type}</div>
          <div className="node-label" title={node.label}>{node.label.length > 25 ? node.label.substring(0, 25) + '...' : node.label}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="investigation-graph-container">
      <div className="graph-visual-area">
        <div className="graph-flow">
           {/* Simple Flow: Anomaly -> Service -> Resource -> Others */}
           {anomalyNode && (
             <div className="graph-column">
               {renderNode(anomalyNode)}
             </div>
           )}
           <div className="graph-arrow">→</div>
           
           <div className="graph-column">
             {serviceNodes.map(n => renderNode(n))}
           </div>
           {serviceNodes.length > 0 && <div className="graph-arrow">→</div>}
           
           <div className="graph-column">
             {resourceNodes.map(n => renderNode(n))}
           </div>
           {resourceNodes.length > 0 && <div className="graph-arrow">→</div>}
           
           <div className="graph-column">
             {otherNodes.map(n => renderNode(n))}
           </div>
        </div>
      </div>

      {selectedNode && (
        <div className="node-details-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
             {getIconForType(selectedNode.type)}
             <strong style={{ fontSize: '1rem', color: '#fff' }}>{selectedNode.label}</strong>
          </div>
          
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Type: <span className="mono">{selectedNode.type}</span> | ID: <span className="mono">{selectedNode.id}</span>
          </div>
          
          {Object.keys(selectedNode.metadata).length > 0 && (
            <div className="node-metadata">
               {Object.entries(selectedNode.metadata).map(([k, v]) => (
                  <div key={k} className="metadata-row">
                    <span className="metadata-key">{k}:</span>
                    <span className="metadata-value mono">{String(v)}</span>
                  </div>
               ))}
            </div>
          )}

          {relatedEdges.length > 0 && (
            <div className="node-edges" style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Relationships</div>
              {relatedEdges.map(e => (
                <div key={e.id} className="edge-item">
                  <div className="edge-relationship">{e.relationship} (Confidence: {(e.strength * 100).toFixed(0)}%)</div>
                  {e.evidence && e.evidence.length > 0 && (
                    <ul className="edge-evidence">
                      {e.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
