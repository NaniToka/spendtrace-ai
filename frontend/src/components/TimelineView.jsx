import React from 'react';
import { GitCommit, Terminal, Calendar, ArrowRight, CheckCircle2, User, Server } from 'lucide-react';

export default function TimelineView({ events }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
      <div className="section-header">
        <div className="section-title">
          <GitCommit size={18} color="var(--accent-secondary)" />
          <span>Correlated Deployment & Infrastructure Events</span>
        </div>
        <span className="badge badge-event">{events.length} Timeline Events Ingested</span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        COSTRA cross-correlates CUR billing spikes with engineering deployments, git commits, and Terraform changes to identify root causes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {events.map((evt) => (
          <div
            key={evt.event_id}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-event" style={{ textTransform: 'uppercase' }}>
                  {evt.event_type}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{evt.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                <span>{new Date(evt.timestamp).toUTCString()}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {evt.description}
            </p>

            {/* Correlation Chain Breadcrumbs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                flexWrap: 'wrap',
                background: 'rgba(0,0,0,0.25)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Server size={12} /> {evt.service_code}
              </span>
              <ArrowRight size={11} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>{evt.region}</span>
              <ArrowRight size={11} color="var(--text-muted)" />
              <span className="mono" style={{ color: 'var(--accent-amber)' }}>{evt.resource_id ? evt.resource_id.split('/').pop() : 'N/A'}</span>
              <ArrowRight size={11} color="var(--text-muted)" />
              <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} /> {evt.team} ({evt.author})
              </span>
              {evt.commit_sha && (
                <>
                  <ArrowRight size={11} color="var(--text-muted)" />
                  <span className="badge badge-event mono">commit: {evt.commit_sha}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
