import React, { useEffect, useState, useRef } from 'react';
import { fetchInvestigationGraph } from '../services/api';
import { InvestigationGraphResponse, InvestigationNode, InvestigationEdge } from '../types/graph';

interface Point { x: number; y: number; vx: number; vy: number }
interface NodeWithPosition extends InvestigationNode { pos: Point }

interface Props {
  anomalyId?: string;
  graph?: InvestigationGraphResponse;
}

const WIDTH = 800;
const HEIGHT = 600;

function getNodeColor(type: string): string {
  switch (type) {
    case 'ANOMALY': return 'var(--color-danger)';
    case 'SERVICE': return 'var(--color-primary)';
    case 'REGION': return 'var(--color-secondary)';
    case 'RESOURCE': return 'var(--color-primary)';
    case 'TEAM': 
    case 'PROJECT': return 'var(--color-success)';
    case 'DEPLOYMENT':
    case 'EVENT': return 'var(--color-warning)';
    default: return 'var(--color-text-secondary)';
  }
}

export const InvestigationGraphView: React.FC<Props> = ({ anomalyId, graph }) => {
  const [data, setData] = useState<InvestigationGraphResponse | null>(graph || null);
  const [loading, setLoading] = useState(!graph);
  const [error, setError] = useState<string | null>(null);
  
  const [nodes, setNodes] = useState<NodeWithPosition[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Animation frame reference
  const animationRef = useRef<number>();

  useEffect(() => {
    let active = true;
    
    const initData = (res: InvestigationGraphResponse) => {
      setData(res);
      const initNodes = res.nodes.map(n => ({
        ...n,
        pos: {
          x: WIDTH / 2 + (Math.random() - 0.5) * 400,
          y: HEIGHT / 2 + (Math.random() - 0.5) * 400,
          vx: 0,
          vy: 0
        }
      }));
      setNodes(initNodes);
      runSimulation(initNodes, res.edges);
    };

    if (graph) {
      initData(graph);
      setLoading(false);
      return;
    }

    if (!anomalyId) return;

    const loadGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchInvestigationGraph(anomalyId);
        if (!active) return;
        initData(res);
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to fetch graph data');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadGraph();
    return () => { active = false; if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [anomalyId, graph]);

  const runSimulation = (initNodes: NodeWithPosition[], edges: InvestigationEdge[]) => {
    let currentNodes = [...initNodes];
    let iteration = 0;
    const MAX_ITERATIONS = 200; // slightly more iterations to settle
    
    // Physics constants (Adjusted for wider spread)
    const REPULSION = 60000; // Much higher repulsion to prevent clumping
    const ATTRACTION = 0.03;  // Slightly weaker spring
    const DAMPING = 0.5;
    const CENTER_GRAVITY = 0.005; // Weaker center gravity so nodes can spread out
    const IDEAL_EDGE_LENGTH = 180; // Longer ideal edges

    const tick = () => {
      if (iteration >= MAX_ITERATIONS) return;
      
      const nextNodes = currentNodes.map(n => ({ ...n, pos: { ...n.pos } }));
      
      // Calculate repulsion between all nodes
      for (let i = 0; i < nextNodes.length; i++) {
        for (let j = i + 1; j < nextNodes.length; j++) {
          const dx = nextNodes[i].pos.x - nextNodes[j].pos.x;
          const dy = nextNodes[i].pos.y - nextNodes[j].pos.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0.01) {
            const force = REPULSION / distSq;
            const dist = Math.sqrt(distSq);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            nextNodes[i].pos.vx += fx;
            nextNodes[i].pos.vy += fy;
            nextNodes[j].pos.vx -= fx;
            nextNodes[j].pos.vy -= fy;
          }
        }
      }
      
      // Calculate edge attraction
      edges.forEach(edge => {
        const sourceNode = nextNodes.find(n => n.id === edge.source);
        const targetNode = nextNodes.find(n => n.id === edge.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.pos.x - sourceNode.pos.x;
          const dy = targetNode.pos.y - sourceNode.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const force = (dist - IDEAL_EDGE_LENGTH) * ATTRACTION;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            sourceNode.pos.vx += fx;
            sourceNode.pos.vy += fy;
            targetNode.pos.vx -= fx;
            targetNode.pos.vy -= fy;
          }
        }
      });
      
      // Calculate center gravity and apply velocity
      nextNodes.forEach(n => {
        const dx = (WIDTH / 2) - n.pos.x;
        const dy = (HEIGHT / 2) - n.pos.y;
        n.pos.vx += dx * CENTER_GRAVITY;
        n.pos.vy += dy * CENTER_GRAVITY;
        
        n.pos.vx *= DAMPING;
        n.pos.vy *= DAMPING;
        
        n.pos.x += n.pos.vx;
        n.pos.y += n.pos.vy;
        
        // Keep in bounds
        n.pos.x = Math.max(50, Math.min(WIDTH - 50, n.pos.x));
        n.pos.y = Math.max(50, Math.min(HEIGHT - 50, n.pos.y));
      });
      
      currentNodes = nextNodes;
      setNodes(currentNodes);
      iteration++;
      animationRef.current = requestAnimationFrame(tick);
    };
    
    animationRef.current = requestAnimationFrame(tick);
  };

  if (loading) return <div className="text-secondary p-8">Loading graph analysis...</div>;
  if (error) return <div className="text-danger p-8">{error}</div>;
  if (!data) return null;

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Find evidence related to selected node
  const relatedEdges = selectedNode 
    ? data.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  return (
    <div className="relative w-full h-[600px] border border-white/5 rounded-lg overflow-hidden bg-[#0a0f1c]">
      <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>
        
        {/* Draw Edges */}
        {data.edges.map(edge => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;
          
          const isSelected = selectedNodeId === source.id || selectedNodeId === target.id;
          const stroke = isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
          
          // Midpoint for label
          const mx = (source.pos.x + target.pos.x) / 2;
          const my = (source.pos.y + target.pos.y) / 2;
          
          // Strength indicates stroke width somewhat
          const sw = Math.max(1, edge.strength * 3);

          return (
            <g key={edge.id}>
              <line 
                x1={source.pos.x} y1={source.pos.y} 
                x2={target.pos.x} y2={target.pos.y} 
                stroke={stroke} strokeWidth={sw}
                markerEnd="url(#arrowhead)"
              />
              <rect 
                x={mx - 50} y={my - 10} 
                width={100} height={20} 
                fill="#070B14" rx="4"
              />
              <text 
                x={mx} y={my + 4} 
                fontSize="10" 
                fill={isSelected ? '#fff' : 'rgba(255,255,255,0.5)'}
                textAnchor="middle"
              >
                {edge.relationship}
              </text>
            </g>
          );
        })}
        
        {/* Draw Nodes */}
        {nodes.map(node => {
          const color = getNodeColor(node.type);
          const isSelected = selectedNodeId === node.id;
          
          return (
            <g 
              key={node.id} 
              transform={`translate(${node.pos.x},${node.pos.y})`}
              onClick={() => setSelectedNodeId(node.id)}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
            >
              <circle 
                r={16} 
                fill={color} 
                opacity={isSelected ? 1 : 0.8}
                stroke={isSelected ? '#fff' : 'transparent'}
                strokeWidth={2}
                className="drop-shadow-lg"
              />
              <text 
                y={28} 
                fontSize="12" 
                fill="#fff" 
                textAnchor="middle"
                className="font-medium drop-shadow"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Side Panel for selected node */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-80 bg-[#070B14]/90 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col overflow-y-auto">
          <button 
            onClick={() => setSelectedNodeId(null)}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
          >
            ✕
          </button>
          
          <div className="mb-6 mt-4">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ backgroundColor: getNodeColor(selectedNode.type) + '30', color: getNodeColor(selectedNode.type) }}>
              {selectedNode.type}
            </span>
            <h3 className="text-xl font-bold mt-3">{selectedNode.label}</h3>
          </div>
          
          <div className="space-y-6">
            {Object.keys(selectedNode.metadata).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wider">Properties</h4>
                <div className="space-y-2">
                  {Object.entries(selectedNode.metadata).map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-xs text-white/40 font-mono">{k}</span>
                      <span className="text-sm">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {relatedEdges.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wider">Related Evidence</h4>
                <div className="space-y-4">
                  {relatedEdges.map(edge => {
                    const isSource = edge.source === selectedNode.id;
                    const otherNode = nodes.find(n => n.id === (isSource ? edge.target : edge.source));
                    if (!otherNode) return null;
                    return (
                      <div key={edge.id} className="bg-white/5 rounded p-3 border border-white/5">
                        <div className="text-xs text-primary mb-2">
                          {isSource ? `→ ${edge.relationship} →` : `← ${edge.relationship} ←`} {otherNode.label}
                        </div>
                        <ul className="text-sm space-y-1 pl-4 list-disc text-white/80">
                          {edge.evidence.map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
