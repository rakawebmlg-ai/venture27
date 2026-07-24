'use client';

import { useState, useEffect } from 'react';
import { combineLocationName } from '../lib/location';

export default function ImportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [importingId, setImportingId] = useState<number | null>(null);
  const [importingCategory, setImportingCategory] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/publish');
      const json = await res.json();
      const ready = json.filter((d: any) => !d.published);
      setData(ready);

      const groups = new Set(ready.map((d: any) => d.category?.name || 'Uncategorized'));
      const expanded: Record<string, boolean> = {};
      groups.forEach((g: any) => { expanded[g] = true; });
      setExpandedGroups(expanded);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) =>
    item.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.community?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.county?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.service?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedData = filteredData.reduce((acc, item) => {
    const cName = item.category?.name || 'Uncategorized';
    if (!acc[cName]) acc[cName] = [];
    acc[cName].push(item);
    return acc;
  }, {} as Record<string, typeof filteredData>);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

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

  const importCategory = async (cName: string, items: typeof filteredData) => {
    if (!confirm(`Import all ${items.length} ready item(s) in "${cName}" to Service?`)) return;
    setImportingCategory(cName);
    await importRows({ categoryId: items[0].categoryId });
    setImportingCategory(null);
  };

  const importAll = async () => {
    if (data.length === 0) return;
    if (!confirm(`Import all ${data.length} ready item(s) to Service?`)) return;
    setImportingAll(true);
    await importRows({ ids: data.map((d) => d.id) });
    setImportingAll(false);
  };

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Import</h1>
        <p className="page-subtitle">Generated content waiting to be imported into the Service list.</p>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <button
            className="btn btn-primary"
            onClick={importAll}
            disabled={data.length === 0 || importingAll}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            {importingAll ? 'Importing...' : `Import All Ready (${data.length})`}
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
              placeholder="Search by city, community, county, province, service, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '320px' }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Ready to Import</span>
          <span className="badge badge-warning">{data.length} entries</span>
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
                <th>Service Name</th>
                <th>Meta Title</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            {loading ? (
              <tbody><tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr></tbody>
            ) : Object.keys(groupedData).length > 0 ? (
              Object.entries(groupedData).map(([groupName, items]) => {
                const isExpanded = expandedGroups[groupName];
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
                            <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>CATEGORY</span>
                            <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{groupName}</strong>
                            <span className="badge badge-info" style={{ marginLeft: '4px' }}>{items.length} items</span>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={importingCategory === groupName}
                            onClick={(e) => { e.stopPropagation(); importCategory(groupName, items); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                            {importingCategory === groupName ? 'Importing...' : 'Import Category'}
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
                        <td>{item.service?.name}</td>
                        <td><span title={item.service?.metaTitle || ''} style={{ display: 'inline-block', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.service?.metaTitle || '-'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPreviewItem(item)}>Preview</button>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={importingId === item.id}
                              onClick={() => importOne(item)}
                            >
                              {importingId === item.id ? 'Importing...' : 'Import'}
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
                          : 'Generate content first on the Generate Content page - it will show up here once ready.'}
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
              <button
                className="btn btn-primary"
                disabled={importingId === previewItem.id}
                onClick={() => importOne(previewItem)}
              >
                {importingId === previewItem.id ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
