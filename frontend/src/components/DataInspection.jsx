import React, { useState } from 'react';
import { Database, Filter, ArrowUpDown } from 'lucide-react';

export default function DataInspection({ records, totalCount, onFilterChange }) {
  const [selectedService, setSelectedService] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const handleServiceChange = (e) => {
    const val = e.target.value;
    setSelectedService(val);
    onFilterChange({ service: val || undefined, team: selectedTeam || undefined });
  };

  const handleTeamChange = (e) => {
    const val = e.target.value;
    setSelectedTeam(val);
    onFilterChange({ service: selectedService || undefined, team: val || undefined });
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="section-header">
        <div className="section-title">
          <Database size={18} color="var(--accent-primary)" />
          <span>Normalized Billing Stream (AWS CUR Ingestion)</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedService}
            onChange={handleServiceChange}
            style={{
              background: 'rgba(0,0,0,0.4)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
            }}
          >
            <option value="">All Services</option>
            <option value="AmazonEC2">AmazonEC2</option>
            <option value="AWSLambda">AWSLambda</option>
            <option value="AmazonRDS">AmazonRDS</option>
            <option value="AmazonS3">AmazonS3</option>
            <option value="AmazonDynamoDB">AmazonDynamoDB</option>
          </select>

          <select
            value={selectedTeam}
            onChange={handleTeamChange}
            style={{
              background: 'rgba(0,0,0,0.4)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
            }}
          >
            <option value="">All Teams</option>
            <option value="core-api">core-api</option>
            <option value="data-platform">data-platform</option>
            <option value="analytics">analytics</option>
            <option value="media-platform">media-platform</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Service</th>
              <th>Region</th>
              <th>Resource Name / ID</th>
              <th>Usage Type</th>
              <th>Team Tag</th>
              <th style={{ textAlign: 'right' }}>Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {records && records.length > 0 ? (
              records.map((r) => (
                <tr key={r.record_id}>
                  <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {r.timestamp ? r.timestamp.slice(0, 10) : ''}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.service_name}</span>
                  </td>
                  <td>
                    <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{r.region}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.resource_name}</div>
                    <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {r.resource_id ? r.resource_id.split(':').pop() : ''}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {r.usage_type}
                  </td>
                  <td>
                    <span className="badge badge-event">{r.tags?.team}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }} className="mono">
                    ${r.unblended_cost.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No billing records match the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>Showing {records ? records.length : 0} of {totalCount || 0} normalized line items</span>
        <span className="mono">Endpoint: /api/v1/billing/records</span>
      </div>
    </div>
  );
}
