'use client';

import { useState } from 'react';
import { generationJobs, generationLogs } from '../lib/mockData';

export default function HistoryPage() {
  const [expandedJob, setExpandedJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredJobs = filterStatus === 'all'
    ? generationJobs
    : generationJobs.filter((j) => j.status === filterStatus);

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Generation History</h1>
        <p className="page-subtitle">Review past generation jobs, logs, and error details</p>
      </div>

      {/* Filter Bar */}
      <div className="action-bar">
        <div className="action-bar-left">
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            {['all', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                className={`tab-item ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All Jobs' : status.charAt(0).toUpperCase() + status.slice(1)}
                <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.6 }}>
                  ({status === 'all' ? generationJobs.length : generationJobs.filter((j) => j.status === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="action-bar-right">
          <button className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Logs
          </button>
        </div>
      </div>

      {/* Job Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredJobs.map((job) => (
          <div className="card" key={job.id}>
            <div
              className="card-header"
              style={{ cursor: 'pointer' }}
              onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {job.id}
                </span>
                <span className={`badge badge-${job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning'}`}>
                  <span className="badge-dot"></span>
                  {job.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {job.started_at}
                </span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{
                    transform: expandedJob === job.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {/* Expanded Detail */}
            {expandedJob === job.id && (
              <>
                <div className="card-body">
                  {/* Summary Grid */}
                  <div className="generation-meta" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Started</span>
                      <span className="generation-meta-value" style={{ fontSize: '13px' }}>{job.started_at}</span>
                    </div>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Completed</span>
                      <span className="generation-meta-value" style={{ fontSize: '13px' }}>{job.completed_at || '—'}</span>
                    </div>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Pages Generated</span>
                      <span className="generation-meta-value">{job.generated.toLocaleString()}</span>
                    </div>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Total Target</span>
                      <span className="generation-meta-value">{job.total_pages.toLocaleString()}</span>
                    </div>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Errors</span>
                      <span className="generation-meta-value" style={{ color: job.errors > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                        {job.errors}
                      </span>
                    </div>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Services</span>
                      <span className="generation-meta-value">{job.services_count}</span>
                    </div>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Scope</span>
                      <span className="generation-meta-value" style={{ fontSize: '13px' }}>{job.locations_scope}</span>
                    </div>
                    <div className="generation-meta-item">
                      <span className="generation-meta-label">Email Sent</span>
                      <span className="generation-meta-value">{job.email_notification ? '✅ Yes' : '❌ No'}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Progress</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: job.status === 'completed' ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {Math.round((job.generated / job.total_pages) * 100)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{
                        width: `${(job.generated / job.total_pages) * 100}%`,
                        background: job.status === 'completed'
                          ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                          : 'linear-gradient(90deg, #dc2626, #ef4444)',
                      }}></div>
                    </div>
                  </div>

                  {/* Error message if failed */}
                  {job.error_message && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: 'var(--color-error-bg)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      color: 'var(--color-error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      {job.error_message}
                    </div>
                  )}

                  {/* Logs Section */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      Execution Logs
                    </div>
                    <div style={{
                      background: 'var(--color-bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      padding: '8px',
                      maxHeight: '250px',
                      overflowY: 'auto',
                    }}>
                      {generationLogs.map((log, idx) => (
                        <div className="log-entry" key={idx}>
                          <span className="log-entry-time">{log.time}</span>
                          <span className={`log-entry-level ${log.level}`}>
                            [{log.level.toUpperCase()}]
                          </span>
                          <span>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
