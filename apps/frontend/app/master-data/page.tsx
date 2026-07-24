'use client';

import { useState, useEffect } from 'react';

export default function MasterDataPage() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [dragOverLoc, setDragOverLoc] = useState(false);
  const [dragOverSvc, setDragOverSvc] = useState(false);
  const [locUploaded, setLocUploaded] = useState(false);
  const [svcUploaded, setSvcUploaded] = useState(false);
  const [locCsvContent, setLocCsvContent] = useState('');
  const [svcCsvContent, setSvcCsvContent] = useState('');
  const [category, setCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/master-data');
      const json = await res.json();
      setData(json);
      
      // Expand all categories by default
      const groups = new Set(json.map((d: any) => d.category?.name || 'Uncategorized'));
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
    item.location?.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.service?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedData = filteredData.reduce((acc, item) => {
    const cName = item.category?.name || 'Uncategorized';
    if (!acc[cName]) acc[cName] = [];
    acc[cName].push(item);
    return acc;
  }, {} as Record<string, typeof filteredData>);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleLocFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setLocCsvContent(e.target?.result as string);
      setLocUploaded(true);
    };
    reader.readAsText(file);
  };

  const handleSvcFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSvcCsvContent(e.target?.result as string);
      setSvcUploaded(true);
    };
    reader.readAsText(file);
  };

  const executeCombine = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || 'Uncategorized',
          locationsCsv: locCsvContent,
          servicesCsv: svcCsvContent
        })
      });
      const result = await res.json();
      if (res.ok) {
        await fetchData();
        setShowGenerateModal(false);
        setLocUploaded(false);
        setSvcUploaded(false);
        setCategory('');
        setLocCsvContent('');
        setSvcCsvContent('');

        if (result.count === 0) {
          const reasons = [];
          if (result.skippedLocationRows > 0) reasons.push(`${result.skippedLocationRows} location row(s) missing City/Province`);
          if (result.skippedServiceRows > 0) reasons.push(`${result.skippedServiceRows} service row(s) missing Service Name`);
          if (result.skippedExistingCombos > 0) reasons.push(`${result.skippedExistingCombos} combination(s) already existed`);
          alert(
            reasons.length > 0
              ? `No new master data was created.\n${reasons.join('\n')}`
              : 'No new master data was created. Check that your CSV headers match the required columns (City, Province, Service Name).'
          );
        } else {
          alert(`Generated ${result.count} new master data combination(s).`);
        }
      } else {
        alert(result.error || 'Failed to generate master data');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportCSV = (cName: string, items: typeof filteredData) => {
    const headers = ['No', 'Category', 'City/Community', 'Province', 'Service Name', 'Meta Title', 'Meta Description', 'Heading', 'Subheading', 'Content Status', 'Image Status'];
    const rows = items.map((item, idx) => [
      idx + 1,
      `"${item.category?.name || ''}"`,
      `"${item.location?.city || ''}"`,
      `"${item.location?.province || ''}"`,
      `"${item.service?.name || ''}"`,
      `"${item.service?.metaTitle || ''}"`,
      `"${item.service?.metaDescription || ''}"`,
      `"${item.service?.heading || ''}"`,
      `"${item.service?.subheading || ''}"`,
      item.content ? 'Filled' : 'Empty',
      item.image ? 'Filled' : 'Empty'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${cName.replace(/\s+/g, '_')}_master_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Generate Master Data</h1>
        <p className="page-subtitle">Upload Location and Service CSVs in a single action to generate your master data combinations.</p>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-bar-left">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowGenerateModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            Generate Master Data
          </button>
        </div>
        <div className="action-bar-right">
          <div className="search-wrapper">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search master data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
        </div>
      </div>

      {/* Generated Data Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Generated Master Data</span>
          <span className="badge badge-info">{data.length} entries</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th>City/Community</th>
                <th>Province</th>
                <th>Service Name</th>
                <th>Meta Title</th>
                <th>Heading</th>
                <th>Content</th>
                <th>Image</th>
              </tr>
            </thead>
            {loading ? (
               <tbody><tr><td colSpan={8} style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr></tbody>
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
                      <td colSpan={8} style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg 
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }}
                            >
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                            <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>CATEGORY</span>
                            <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{groupName}</strong>
                            <span className="badge badge-info" style={{ marginLeft: '4px' }}>{items.length} items</span>
                          </div>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={(e) => { e.stopPropagation(); exportCSV(groupName, items); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Export CSV
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && items.map((item, idx) => (
                      <tr key={item.id} style={{ background: 'var(--color-bg-primary)' }}>
                        <td style={{ color: 'var(--color-text-muted)', paddingLeft: '40px' }}>{idx + 1}</td>
                        <td>{item.location?.city}</td>
                        <td>{item.location?.province}</td>
                        <td>{item.service?.name}</td>
                        <td><span title={item.service?.metaTitle || ''} style={{ display: 'inline-block', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.service?.metaTitle || '-'}</span></td>
                        <td><span title={item.service?.heading || ''} style={{ display: 'inline-block', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.service?.heading || '-'}</span></td>
                        <td>
                          {item.content ? (
                            <span className="badge badge-success">Filled</span>
                          ) : (
                            <span className="badge badge-warning">Empty</span>
                          )}
                        </td>
                        <td>
                          {item.image ? (
                            <span className="badge badge-success">Filled</span>
                          ) : (
                            <span className="badge badge-warning">Empty</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                );
              })
            ) : (
              <tbody>
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📂</div>
                      <div className="empty-state-title">No data found</div>
                      <div className="empty-state-text">
                        {searchQuery
                          ? `No results matching "${searchQuery}"`
                          : `Click "Generate Master Data" to create combinations.`}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .upload-compact { padding: 20px; min-height: auto; margin-top: 8px; border-width: 1px; }
        .group-header-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}} />

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => !isGenerating && setShowGenerateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span className="modal-title">Generate Master Data</span>
              <button className="modal-close" onClick={() => !isGenerating && setShowGenerateModal(false)} disabled={isGenerating}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. SEO, Paid Ads" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                {/* Location Upload */}
                <div>
                  <label className="form-label">1. Locations (CSV)</label>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Req: City, Province</p>
                  
                  {locUploaded ? (
                    <div style={{ padding: '16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      ✅ locations.csv loaded
                    </div>
                  ) : (
                    <label
                      className={`upload-area upload-compact ${dragOverLoc ? 'dragover' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOverLoc(true); }}
                      onDragLeave={() => setDragOverLoc(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOverLoc(false); if(e.dataTransfer.files[0]) handleLocFile(e.dataTransfer.files[0]); }}
                      style={{ cursor: 'pointer', display: 'block' }}
                    >
                      <input type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) handleLocFile(e.target.files[0]); }} />
                      <div className="upload-area-icon" style={{ fontSize: '24px', marginBottom: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <div className="upload-area-text" style={{ fontSize: '12px' }}>Click to upload</div>
                    </label>
                  )}
                </div>

                {/* Service Upload */}
                <div>
                  <label className="form-label">2. Core Services (CSV)</label>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Req: Service Name, Meta...</p>
                  
                  {svcUploaded ? (
                    <div style={{ padding: '16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      ✅ services.csv loaded
                    </div>
                  ) : (
                    <label
                      className={`upload-area upload-compact ${dragOverSvc ? 'dragover' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOverSvc(true); }}
                      onDragLeave={() => setDragOverSvc(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOverSvc(false); if(e.dataTransfer.files[0]) handleSvcFile(e.dataTransfer.files[0]); }}
                      style={{ cursor: 'pointer', display: 'block' }}
                    >
                      <input type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) handleSvcFile(e.target.files[0]); }} />
                      <div className="upload-area-icon" style={{ fontSize: '24px', marginBottom: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <div className="upload-area-text" style={{ fontSize: '12px' }}>Click to upload</div>
                    </label>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={executeCombine}
                disabled={!locUploaded || !svcUploaded || !category || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Generating...
                  </>
                ) : 'Generate Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
