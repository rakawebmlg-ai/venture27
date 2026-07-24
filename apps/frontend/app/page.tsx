'use client';

import { useState, useEffect } from 'react';

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    stats: {
      locations: 0,
      coreServices: 0,
      masterDataGenerated: 0,
      contentGenerated: 0
    },
    lastJob: null
  });

  useEffect(() => {
    fetch('/api/overview')
      .then(res => res.json())
      .then(json => {
        if (!json.error) {
          setData(json);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const { stats, lastJob } = data;

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Monitor your data and generation status at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.locations.toLocaleString()}</div>
          <div className="stat-card-label">Total Locations</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/></svg>
            </div>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.coreServices.toLocaleString()}</div>
          <div className="stat-card-label">Core Services</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
            </div>
            {stats.masterDataGenerated > 0 && <span className="stat-card-change up">Active</span>}
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.masterDataGenerated.toLocaleString()}</div>
          <div className="stat-card-label">Master Data Combinations</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>
            </div>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.contentGenerated.toLocaleString()}</div>
          <div className="stat-card-label">Content Generated</div>
        </div>
      </div>

      {/* Two Column: Last Generation + Quick Actions */}
      <div className="grid-2">
        {/* Last Generation */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Last Publish Job</span>
            {lastJob ? (
              <span className={`badge ${lastJob.status === 'completed' ? 'badge-success' : lastJob.status === 'running' ? 'badge-info' : 'badge-warning'}`}>
                <span className="badge-dot"></span> {lastJob.status.toUpperCase()}
              </span>
            ) : (
              <span className="badge badge-neutral">NONE</span>
            )}
          </div>
          <div className="card-body">
            {lastJob ? (
              <div className="generation-meta" style={{ borderTop: 'none', paddingTop: 0 }}>
                <div className="generation-meta-item">
                  <span className="generation-meta-label">Job ID</span>
                  <span className="generation-meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{lastJob.id}</span>
                </div>
                <div className="generation-meta-item">
                  <span className="generation-meta-label">Started</span>
                  <span className="generation-meta-value" style={{ fontSize: '13px' }}>
                    {new Date(lastJob.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="generation-meta-item">
                  <span className="generation-meta-label">Progress</span>
                  <span className="generation-meta-value" style={{ fontSize: '13px' }}>{lastJob.progress}%</span>
                </div>
                <div className="generation-meta-item">
                  <span className="generation-meta-label">Total Items targeted</span>
                  <span className="generation-meta-value">{lastJob.totalItems.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No jobs have been run yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick Actions</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/master-data" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Data & Generate Master
            </a>
            <a href="/generate-content" className="btn btn-primary btn-lg" style={{ justifyContent: 'flex-start' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>
              Generate Content
            </a>
            <a href="/result-guide" className="btn btn-ghost btn-lg" style={{ justifyContent: 'flex-start' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              View Result Guide
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
