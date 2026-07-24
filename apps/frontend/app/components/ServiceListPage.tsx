'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { buildSlug } from '../lib/slug';
import { primaryLocationType, combineLocationName, LocationType } from '../lib/location';
import { renderPlaceholders } from '../lib/placeholders';

// Rows published before the slug column existed (or that hit a naming
// collision) may not have a stored one yet - fall back to computing it on
// the fly so the link/preview still works instead of showing nothing.
const slugFor = (item: any) => {
  if (item.slug) return item.slug;
  const located = primaryLocationType(item.location?.city, item.location?.community, item.location?.county);
  if (!located) return '#';
  const heading = renderPlaceholders(item.service?.heading, item.location) || item.service?.name || '';
  return buildSlug(located.type, located.value, item.service?.name || '', heading);
};

const FIELD_LABELS: Record<LocationType, string> = { city: 'City', community: 'Community', county: 'County' };

export default function ServiceListPage({ field }: { field: LocationType }) {
  const fieldLabel = FIELD_LABELS[field];
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [unpublishingId, setUnpublishingId] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/publish');
      const json = await res.json();
      // Only rows that actually have this field set belong under this
      // sub-section - a county-only row has nothing to show under "City".
      const published = json.filter((d: any) => d.published && d.location?.[field]);
      setData(published);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = Array.from(
    data.reduce((acc, item) => {
      const name = item.service?.name || 'Unnamed';
      acc.set(name, (acc.get(name) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const scopedData = selectedService ? data.filter((d) => (d.service?.name || 'Unnamed') === selectedService) : data;

  const filteredData = scopedData.filter((item) =>
    item.location?.[field]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedData = filteredData.reduce<Record<string, typeof filteredData>>((acc, item) => {
    const key = item.location?.[field] || `No ${fieldLabel}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const unpublishOne = async (item: any) => {
    if (!confirm(`Unpublish "${item.service?.name}" - ${combineLocationName(item.location?.city, item.location?.community, item.location?.county)}? It will move back to Import.`)) return;
    setUnpublishingId(item.id);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish', ids: [item.id] })
      });
      if (res.ok) {
        await fetchData();
        setPreviewItem(null);
      } else {
        const result = await res.json().catch(() => null);
        alert(result?.error || 'Failed to unpublish');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
    } finally {
      setUnpublishingId(null);
    }
  };

  const exportCSV = (groupName: string, items: typeof filteredData) => {
    const headers = ['No', 'Category', 'City', 'Community', 'County', 'Province', 'Service Name', 'Slug', 'Published At'];
    const rows = items.map((item, idx) => [
      idx + 1,
      `"${item.category?.name || ''}"`,
      `"${item.location?.city || ''}"`,
      `"${item.location?.community || ''}"`,
      `"${item.location?.county || ''}"`,
      `"${item.location?.province || ''}"`,
      `"${item.service?.name || ''}"`,
      `"${slugFor(item)}"`,
      item.publishedAt ? new Date(item.publishedAt).toISOString() : ''
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${groupName.replace(/\s+/g, '_')}_service_pages.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Service &middot; {fieldLabel}</h1>
        <p className="page-subtitle">Browse imported programmatic pages grouped by {fieldLabel}.</p>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <select
            className="form-input"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            style={{ width: '280px' }}
          >
            <option value="">All Services</option>
            {serviceOptions.map(([name, count]) => (
              <option key={name} value={name}>{name} ({count})</option>
            ))}
          </select>
        </div>
        <div className="action-bar-right">
          <div className="search-wrapper">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input
              type="text"
              className="form-input"
              placeholder={`Search by ${fieldLabel.toLowerCase()}, province, category...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{selectedService || 'All Services'}</span>
          <span className="badge badge-success">{filteredData.length} pages</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th>City</th>
                <th>Community</th>
                <th>County</th>
                <th>Province</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Published At</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            {loading ? (
              <tbody><tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr></tbody>
            ) : Object.keys(groupedData).length > 0 ? (
              Object.entries(groupedData).map(([groupName, items]) => {
                const isExpanded = expandedGroups[groupName] ?? true;
                return (
                  <tbody key={groupName}>
                    <tr
                      className="group-header-row"
                      onClick={() => toggleGroup(groupName)}
                      style={{ cursor: 'pointer', background: 'var(--color-bg-secondary)', transition: 'background 0.2s' }}
                    >
                      <td colSpan={9} style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                            <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{fieldLabel}</span>
                            <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{groupName}</strong>
                            <span className="badge badge-info" style={{ marginLeft: '4px' }}>{items.length} items</span>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); exportCSV(groupName, items); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Export CSV
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && items.map((item, idx) => (
                      <tr key={item.id} style={{ background: 'var(--color-bg-primary)' }}>
                        <td style={{ color: 'var(--color-text-muted)', paddingLeft: '40px' }}>{idx + 1}</td>
                        <td>{item.location?.city || '-'}</td>
                        <td>{item.location?.community || '-'}</td>
                        <td>{item.location?.county || '-'}</td>
                        <td>{item.location?.province}</td>
                        <td>{item.category?.name}</td>
                        <td>
                          <Link href={slugFor(item)} target="_blank" style={{ fontSize: '12px', color: 'var(--color-blue-300)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>
                            {slugFor(item)}
                          </Link>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <Link href={slugFor(item)} target="_blank" className="btn btn-ghost btn-sm">View Page</Link>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPreviewItem(item)}>Preview</button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-error)' }}
                              disabled={unpublishingId === item.id}
                              onClick={() => unpublishOne(item)}
                            >
                              {unpublishingId === item.id ? 'Unpublishing...' : 'Unpublish'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                );
              })
            ) : (
              <tbody>
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📂</div>
                      <div className="empty-state-title">No data found</div>
                      <div className="empty-state-text">
                        {searchQuery
                          ? `No results matching "${searchQuery}"`
                          : `Nothing published with a ${fieldLabel} set yet - import ready content on the Import page first.`}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .group-header-row:hover { background: rgba(255,255,255,0.02) !important; }
      ` }} />

      {previewItem && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <span className="modal-title">{previewItem.service?.name} - {combineLocationName(previewItem.location?.city, previewItem.location?.community, previewItem.location?.county)}, {previewItem.location?.province}</span>
              <button className="modal-close" onClick={() => setPreviewItem(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Slug</div>
                <Link href={slugFor(previewItem)} target="_blank" style={{ fontSize: '13px', color: 'var(--color-blue-300)', fontFamily: 'var(--font-mono)' }}>
                  {slugFor(previewItem)}
                </Link>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Meta Title</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{previewItem.service?.metaTitle || '-'}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Meta Description</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{previewItem.service?.metaDescription || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Content</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{previewItem.content || 'No content.'}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewItem(null)}>Close</button>
              <Link href={slugFor(previewItem)} target="_blank" className="btn btn-ghost">View Page</Link>
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--color-error)' }}
                disabled={unpublishingId === previewItem.id}
                onClick={() => unpublishOne(previewItem)}
              >
                {unpublishingId === previewItem.id ? 'Unpublishing...' : 'Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
