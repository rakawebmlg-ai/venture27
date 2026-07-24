'use client';

import { useState, useEffect } from 'react';

export default function PublishContentPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReady, setExpandedReady] = useState<Record<string, boolean>>({});
  const [expandedPublished, setExpandedPublished] = useState<Record<string, boolean>>({});
  const [importingId, setImportingId] = useState<number | null>(null);
  const [importingCategory, setImportingCategory] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const [unpublishingId, setUnpublishingId] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/publish');
      const json = await res.json();
      setData(json);

      const expandAll = (items: any[]) => {
        const groups = new Set(items.map((d: any) => d.category?.name || 'Uncategorized'));
        const expanded: Record<string, boolean> = {};
        groups.forEach((g: any) => { expanded[g] = true; });
        return expanded;
      };
      setExpandedReady(expandAll(json.filter((d: any) => !d.published)));
      setExpandedPublished(expandAll(json.filter((d: any) => d.published)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const matchesSearch = (item: any) =>
    item.location?.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.service?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const readyData = data.filter((d) => !d.published && matchesSearch(d));
  const publishedData = data.filter((d) => d.published && matchesSearch(d));

  const groupByCategory = (items: any[]) =>
    items.reduce((acc, item) => {
      const cName = item.category?.name || 'Uncategorized';
      if (!acc[cName]) acc[cName] = [];
      acc[cName].push(item);
      return acc;
    }, {} as Record<string, any[]>);

  const readyGrouped = groupByCategory(readyData);
  const publishedGrouped = groupByCategory(publishedData);

  const importRows = async (opts: { ids?: number[]; categoryId?: number }) => {
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', ...opts })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to import');
        return;
      }
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
    }
  };

  const importOne = async (item: any) => {
    setImportingId(item.id);
    await importRows({ ids: [item.id] });
    setImportingId(null);
    setPreviewItem(null);
  };

  const importCategory = async (cName: string, items: any[]) => {
    if (!confirm(`Import all ${items.length} ready item(s) in "${cName}" as published?`)) return;
    setImportingCategory(cName);
    await importRows({ categoryId: items[0].categoryId });
    setImportingCategory(null);
  };

  const importAll = async () => {
    if (readyData.length === 0) return;
    if (!confirm(`Import all ${readyData.length} ready item(s) as published?`)) return;
    setImportingAll(true);
    await importRows({ ids: readyData.map((d) => d.id) });
    setImportingAll(false);
  };

  const unpublishOne = async (item: any) => {
    if (!confirm(`Unpublish "${item.service?.name}" - ${item.location?.city}? It will move back to "Ready to Import".`)) return;
    setUnpublishingId(item.id);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish', ids: [item.id] })
      });
      if (res.ok) {
        await fetchData();
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

  const exportCSV = (cName: string, items: any[]) => {
    const headers = ['No', 'Category', 'City/Community', 'Province', 'Service Name', 'Meta Title', 'Published At'];
    const rows = items.map((item, idx) => [
      idx + 1,
      `"${item.category?.name || ''}"`,
      `"${item.location?.city || ''}"`,
      `"${item.location?.province || ''}"`,
      `"${item.service?.name || ''}"`,
      `"${item.service?.metaTitle || ''}"`,
      item.publishedAt ? new Date(item.publishedAt).toISOString() : ''
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${cName.replace(/\s+/g, '_')}_published.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderGroupedTable = (
    grouped: Record<string, any[]>,
    expanded: Record<string, boolean>,
    toggle: (name: string) => void,
    mode: 'ready' | 'published'
  ) => (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}>No</th>
          <th>City/Community/County</th>
          <th>Province</th>
          <th>Service Name</th>
          <th>Meta Title</th>
          {mode === 'published' && <th>Published At</th>}
          <th style={{ textAlign: 'right' }}>Action</th>
        </tr>
      </thead>
      {loading ? (
        <tbody><tr><td colSpan={mode === 'published' ? 7 : 6} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr></tbody>
      ) : Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([groupName, items]: [string, any[]]) => {
          const isExpanded = expanded[groupName];
          return (
            <tbody key={groupName}>
              <tr
                className="group-header-row"
                onClick={() => toggle(groupName)}
                style={{ cursor: 'pointer', background: 'var(--color-bg-secondary)', transition: 'background 0.2s' }}
              >
                <td colSpan={mode === 'published' ? 7 : 6} style={{ padding: '12px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>CATEGORY</span>
                      <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{groupName}</strong>
                      <span className="badge badge-info" style={{ marginLeft: '4px' }}>{items.length} items</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {mode === 'ready' ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={importingCategory === groupName}
                          onClick={(e) => { e.stopPropagation(); importCategory(groupName, items); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                          {importingCategory === groupName ? 'Importing...' : 'Import Category'}
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); exportCSV(groupName, items); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          Export CSV
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>

              {isExpanded && items.map((item, idx) => (
                <tr key={item.id} style={{ background: 'var(--color-bg-primary)' }}>
                  <td style={{ color: 'var(--color-text-muted)', paddingLeft: '40px' }}>{idx + 1}</td>
                  <td>{item.location?.city}</td>
                  <td>{item.location?.province}</td>
                  <td>{item.service?.name}</td>
                  <td><span title={item.service?.metaTitle || ''} style={{ display: 'inline-block', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.service?.metaTitle || '-'}</span></td>
                  {mode === 'published' && (
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : '-'}
                    </td>
                  )}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPreviewItem(item)}>Preview</button>
                      {mode === 'ready' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={importingId === item.id}
                          onClick={() => importOne(item)}
                        >
                          {importingId === item.id ? 'Importing...' : 'Import'}
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-error)' }}
                          disabled={unpublishingId === item.id}
                          onClick={() => unpublishOne(item)}
                        >
                          {unpublishingId === item.id ? 'Unpublishing...' : 'Unpublish'}
                        </button>
                      )}
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
            <td colSpan={mode === 'published' ? 7 : 6}>
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <div className="empty-state-title">No data found</div>
                <div className="empty-state-text">
                  {searchQuery
                    ? `No results matching "${searchQuery}"`
                    : mode === 'ready'
                      ? 'Generate content first on the Generate Content page - it will show up here once ready.'
                      : 'Nothing published yet.'}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      )}
    </table>
  );

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Publish Content</h1>
        <p className="page-subtitle">Review generated articles by City/Community/County, Province, Category and Service Name, then import them to publish.</p>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <button
            className="btn btn-primary"
            onClick={importAll}
            disabled={readyData.length === 0 || importingAll}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            {importingAll ? 'Importing...' : `Import All Ready (${readyData.length})`}
          </button>
        </div>
        <div className="action-bar-right">
          <div className="search-wrapper">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by city, province, service, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '320px' }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <span className="card-title">Ready to Import</span>
          <span className="badge badge-warning">{readyData.length} entries</span>
        </div>
        <div className="data-table-wrapper">
          {renderGroupedTable(readyGrouped, expandedReady, (name) => setExpandedReady((p) => ({ ...p, [name]: !p[name] })), 'ready')}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Published Content</span>
          <span className="badge badge-success">{publishedData.length} entries</span>
        </div>
        <div className="data-table-wrapper">
          {renderGroupedTable(publishedGrouped, expandedPublished, (name) => setExpandedPublished((p) => ({ ...p, [name]: !p[name] })), 'published')}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .group-header-row:hover { background: rgba(255,255,255,0.02) !important; }
      ` }} />

      {previewItem && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <span className="modal-title">{previewItem.service?.name} - {previewItem.location?.city}, {previewItem.location?.province}</span>
              <button className="modal-close" onClick={() => setPreviewItem(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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
              {!previewItem.published && (
                <button
                  className="btn btn-primary"
                  disabled={importingId === previewItem.id}
                  onClick={() => importOne(previewItem)}
                >
                  {importingId === previewItem.id ? 'Importing...' : 'Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
