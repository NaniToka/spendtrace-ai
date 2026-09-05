import React, { useState } from 'react';
import { InvestigationGraphResponse, InvestigationNode } from '../types/graph';
import { Layers, Server, Activity, GitCommit, Target, AlertTriangle, Network } from 'lucide-react';

interface InvestigationGraphViewProps {
  graph: InvestigationGraphResponse;
}

export const InvestigationGraphView: React.FC<InvestigationGraphViewProps> = ({ graph }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'ANOMALY': return <AlertTriangle size={18} className="text-critical" />;
      case 'SERVICE': return <Layers size={18} className="text-primary-light" />;
      case 'RESOURCE': return <Server size={18} className="text-cyan-400" />;
      case 'USAGE': return <Activity size={18} className="text-emerald-400" />;
      case 'DEPLOYMENT':
      case 'EVENT': return <GitCommit size={18} className="text-purple-400" />;
      default: return <Target size={18} className="text-secondary" />;
    }
  };

  const selectedNode = selectedNodeId ? graph.nodes.find(n => n.id === selectedNodeId) : null;
  const relatedEdges = selectedNode 
    ? graph.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  const anomalyNode = graph.nodes.find(n => n.type === 'ANOMALY');
  const serviceNodes = graph.nodes.filter(n => n.type === 'SERVICE');
  const resourceNodes = graph.nodes.filter(n => n.type === 'RESOURCE');
  const otherNodes = graph.nodes.filter(n => !['ANOMALY', 'SERVICE', 'RESOURCE'].includes(n.type));

  const renderNode = (node: InvestigationNode) => {
    const isSelected = selectedNodeId === node.id;
    return (
      <div 
        key={node.id} 
        className={`flex items-center gap-3 bg-surface border ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-subtle hover:border-cyan-500'} p-3 rounded-lg min-w-[180px] cursor-pointer transition-all shadow-sm`}
        onClick={() => setSelectedNodeId(node.id)}
      >
        <div className="flex items-center justify-center bg-card rounded-md w-9 h-9 border border-subtle shrink-0">
          {getIconForType(node.type)}
        </div>
        <div className="overflow-hidden">
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">{node.type}</div>
          <div className="text-sm font-medium text-primary truncate" title={node.label}>{node.label}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Network size={20} className="text-primary" />
        <h2 className="text-lg font-bold">Investigation Evidence Graph</h2>
      </div>

      <div className="bg-[#0b111d] border border-subtle rounded-lg p-6 mb-6 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
           {/* Simple Flow: Anomaly -> Service -> Resource -> Others */}
           {anomalyNode && (
             <div className="flex flex-col gap-3">
               {renderNode(anomalyNode)}
             </div>
           )}
           {anomalyNode && <div className="text-muted text-xl font-light">→</div>}
           
           <div className="flex flex-col gap-3">
             {serviceNodes.map(n => renderNode(n))}
           </div>
           {serviceNodes.length > 0 && <div className="text-muted text-xl font-light">→</div>}
           
           <div className="flex flex-col gap-3">
             {resourceNodes.map(n => renderNode(n))}
           </div>
           {resourceNodes.length > 0 && <div className="text-muted text-xl font-light">→</div>}
           
           <div className="flex flex-col gap-3">
             {otherNodes.map(n => renderNode(n))}
           </div>
        </div>
      </div>

      {selectedNode && (
        <div className="bg-surface border border-subtle rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-card border border-subtle p-2 rounded-md">{getIconForType(selectedNode.type)}</div>
             <div>
               <div className="text-sm text-secondary font-mono">{selectedNode.type}</div>
               <strong className="text-lg">{selectedNode.label}</strong>
             </div>
          </div>
          
          {Object.keys(selectedNode.metadata).length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-card rounded-md border border-subtle">
               {Object.entries(selectedNode.metadata).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-xs text-muted uppercase tracking-wider">{k}</span>
                    <span className="font-mono text-sm text-primary-light">{String(v)}</span>
                  </div>
               ))}
            </div>
          )}

          {relatedEdges.length > 0 && (
            <div className="pt-2">
              <div className="text-xs uppercase font-bold text-secondary mb-3">Edges & Evidence</div>
              <div className="flex flex-col gap-3">
                {relatedEdges.map(e => (
                  <div key={e.id} className="bg-card border border-subtle p-3 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-mono text-xs text-cyan-400">{e.relationship}</div>
                      <div className="text-xs badge badge-info">{(e.strength * 100).toFixed(0)}% Str</div>
                    </div>
                    {e.evidence && e.evidence.length > 0 && (
                      <ul className="text-xs text-secondary pl-4 list-disc space-y-1">
                        {e.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
