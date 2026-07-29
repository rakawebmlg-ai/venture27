'use client';

import { useEffect, useState } from 'react';

const STATUS_BADGE: Record<string, string> = {
  completed: 'success',
  failed: 'error',
  running: 'info',
  paused: 'warning',
  stopped: 'neutral',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const json = await res.json();
      setJobs(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['all', ...Array.from(new Set(jobs.map((j) => j.status)))];
  const filteredJobs = filterStatus === 'all' ? jobs : jobs.filter((j) => j.status === filterStatus);

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Generation History</h1>
        <p className="page-subtitle">Review past and in-progress generation jobs</p>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            {statusOptions.map((status) => (
              <button
                key={status}
                className={`tab-item ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All Jobs' : status.charAt(0).toUpperCase() + status.slice(1)}
                <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.6 }}>
                  ({status === 'all' ? jobs.length : jobs.filter((j) => j.status === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-title">Loading...</div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🕓</div>
          <div className="empty-state-title">No jobs found</div>
          <div className="empty-state-text">Generation jobs will show up here once you run one from Generate Content.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredJobs.map((job) => {
            const isTerminal = ['completed', 'failed', 'stopped'].includes(job.status);
            const pct = job.progress ?? 0;
            return (
              <div className="card" key={job.id}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Job #{job.id}
                    </span>
                    <span className={`badge badge-${STATUS_BADGE[job.status] || 'neutral'}`}>
                      <span className="badge-dot"></span>
                      {job.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {formatDate(job.createdAt)}
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

                {expandedJob === job.id && (
                  <div className="card-body">
                    <div className="generation-meta" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <div className="generation-meta-item">
                        <span className="generation-meta-label">Started</span>
                        <span className="generation-meta-value" style={{ fontSize: '13px' }}>{formatDate(job.createdAt)}</span>
                      </div>
                      <div className="generation-meta-item">
                        <span className="generation-meta-label">{isTerminal ? 'Finished' : 'Last Updated'}</span>
                        <span className="generation-meta-value" style={{ fontSize: '13px' }}>{formatDate(job.updatedAt)}</span>
                      </div>
                      <div className="generation-meta-item">
                        <span className="generation-meta-label">Generated</span>
                        <span className="generation-meta-value" style={{ color: 'var(--color-success)' }}>{job.generatedCount ?? 0}</span>
                      </div>
                      <div className="generation-meta-item">
                        <span className="generation-meta-label">Errors</span>
                        <span className="generation-meta-value" style={{ color: (job.errorCount ?? 0) > 0 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                          {job.errorCount ?? 0}
                        </span>
                      </div>
                      <div className="generation-meta-item">
                        <span className="generation-meta-label">Total Target</span>
                        <span className="generation-meta-value">{job.totalItems ?? 0}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Progress</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: job.status === 'failed' ? 'var(--color-error)' : 'var(--color-success)' }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{
                          width: `${pct}%`,
                          background: job.status === 'failed'
                            ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                            : 'linear-gradient(90deg, var(--color-blue-600), var(--color-blue-400))',
                        }}></div>
                      </div>
                    </div>

                    {job.errorLogs && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: 'var(--color-error-bg)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        color: 'var(--color-error)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {job.errorLogs}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
