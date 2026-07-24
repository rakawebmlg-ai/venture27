'use client';

import { useState, useRef, useEffect } from 'react';

export default function GenerateContentPage() {
  const [jobId, setJobId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOverPrompt, setDragOverPrompt] = useState(false);
  const [aiModel, setAiModel] = useState('gpt-4o');
  const [enableSmtp, setEnableSmtp] = useState(true);
  const [promptContent, setPromptContent] = useState('');
  const [limit, setLimit] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | ''>('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [deletingPromptId, setDeletingPromptId] = useState<number | null>(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [resettingGroup, setResettingGroup] = useState<string | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/prompts');
      const json = await res.json();
      setSavedPrompts(json);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/master-data');
      const json = await res.json();
      setData(json);
      
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

  const resetRows = async (opts: { ids?: number[]; categoryId?: number; status?: string }) => {
    try {
      const res = await fetch('/api/master-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', ...opts })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to reset');
        return;
      }
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
    }
  };

  const resetItem = async (item: any) => {
    if (!confirm(`Reset "${item.service?.name}" - ${item.location?.city} back to pending? This clears its current content.`)) return;
    setResettingId(item.id);
    await resetRows({ ids: [item.id] });
    setResettingId(null);
    setPreviewItem(null);
  };

  const resetGroupErrors = async (groupName: string, items: any[]) => {
    const errorCount = items.filter((i) => i.status === 'error').length;
    if (errorCount === 0) return;
    if (!confirm(`Reset ${errorCount} failed item(s) in "${groupName}" back to pending so they can be retried?`)) return;
    setResettingGroup(groupName);
    await resetRows({ categoryId: items[0].categoryId, status: 'error' });
    setResettingGroup(null);
  };

  const resetGroupAll = async (groupName: string, items: any[]) => {
    const resettable = items.filter((i) => i.status === 'generated' || i.status === 'error').length;
    if (resettable === 0) return;
    if (!confirm(`Reset all ${resettable} generated/error item(s) in "${groupName}" back to pending? This clears their current content.`)) return;
    setResettingGroup(groupName);
    await resetRows({ categoryId: items[0].categoryId });
    setResettingGroup(null);
  };

  const categoryOptions = Object.values(
    data.reduce((acc, item) => {
      const id = item.categoryId;
      const name = item.category?.name || 'Uncategorized';
      if (!acc[id]) acc[id] = { id, name, pending: 0, total: 0 };
      acc[id].total++;
      if (item.status === 'pending') acc[id].pending++;
      return acc;
    }, {} as Record<number, { id: number; name: string; pending: number; total: number }>)
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Default to the first category with pending work once data loads; never
  // override a selection the user already made (even if it later hits 0 pending).
  useEffect(() => {
    if (selectedCategoryId !== '') return;
    const withPending = categoryOptions.find(c => c.pending > 0);
    if (withPending) setSelectedCategoryId(withPending.id);
  }, [data]);

  const pendingData = data.filter(d => d.status === 'pending' && d.categoryId === selectedCategoryId);
  const completedData = data.filter(d => d.status === 'generated');
  const categoryCompletedData = completedData.filter(d => d.categoryId === selectedCategoryId);

  const groupedData = data.reduce((acc, item) => {
    const cName = item.category?.name || 'Uncategorized';
    if (!acc[cName]) acc[cName] = [];
    acc[cName].push(item);
    return acc;
  }, {} as Record<string, typeof data>);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const savePrompt = async (name: string, content: string) => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to save prompt');
        return null;
      }
      await fetchPrompts();
      return result;
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
      return null;
    }
  };

  const handlePromptFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setPromptContent(content);
      // Uploading a .md/.txt file saves it under its filename, so it shows
      // up in "Saved Prompts" without a separate save step.
      const name = file.name.replace(/\.(md|txt)$/i, '');
      setSavingPrompt(true);
      const saved = await savePrompt(name, content);
      setSavingPrompt(false);
      if (saved) setSelectedPromptId(saved.id);
    };
    reader.readAsText(file);
  };

  const handleSavePromptClick = async () => {
    if (!promptContent.trim()) return alert('Write a prompt before saving');
    const currentName = savedPrompts.find((p) => p.id === selectedPromptId)?.name || '';
    const name = window.prompt('Save this prompt as:', currentName);
    if (!name || !name.trim()) return;
    setSavingPrompt(true);
    const saved = await savePrompt(name.trim(), promptContent);
    setSavingPrompt(false);
    if (saved) setSelectedPromptId(saved.id);
  };

  const handleSelectPrompt = (value: string) => {
    const id = value ? Number(value) : '';
    setSelectedPromptId(id);
    if (id === '') return;
    const p = savedPrompts.find((sp) => sp.id === id);
    if (p) setPromptContent(p.content);
  };

  const deletePrompt = async (id: number) => {
    if (!confirm('Delete this saved prompt?')) return;
    setDeletingPromptId(id);
    try {
      const res = await fetch(`/api/prompts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedPromptId === id) setSelectedPromptId('');
        await fetchPrompts();
      } else {
        const result = await res.json().catch(() => null);
        alert(result?.error || 'Failed to delete prompt');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
    } finally {
      setDeletingPromptId(null);
    }
  };

  const startGeneration = async () => {
    if (selectedCategoryId === '') return alert('Please select a category to generate');
    if (pendingData.length === 0) return alert('No pending data to generate in this category');

    const parsedLimit = limit.trim() ? parseInt(limit, 10) : undefined;
    if (limit.trim() && (!parsedLimit || parsedLimit <= 0)) {
      return alert('Limit must be a positive number');
    }

    const categoryId = selectedCategoryId;

    setIsGenerating(true);
    setIsPaused(false);
    setProgress(0);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          categoryId,
          promptTemplate: promptContent,
          aiModel,
          limit: parsedLimit
        })
      });
      const job = await res.json();
      if (!res.ok) {
        alert(job.error || 'Failed to start generation');
        setIsGenerating(false);
        return;
      }
      setJobId(job.id);
    } catch (e) {
      console.error(e);
      alert('Failed to start generation');
      setIsGenerating(false);
    }
  };

  const pauseGeneration = async () => {
    setIsPaused(true);
    if (!jobId) return;
    await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause', jobId })
    });
  };

  const resumeGeneration = async () => {
    setIsPaused(false);
    if (!jobId) return;
    await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume', jobId })
    });
  };

  const stopGeneration = async () => {
    setIsGenerating(false);
    setIsPaused(false);
    setProgress(0);
    if (!jobId) return;
    await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop', jobId })
    });
  };

  // Poll for Job Status
  useEffect(() => {
    if (isGenerating && jobId) {
      progressInterval.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/generate?jobId=${jobId}`);
          const job = await res.json();
          
          if (job) {
            setProgress(job.progress);
            if (job.status === 'completed') {
              setIsGenerating(false);
              setProgress(100);
              clearInterval(progressInterval.current!);
              fetchData(); // refresh table
            } else if (job.status === 'stopped') {
              setIsGenerating(false);
              clearInterval(progressInterval.current!);
            } else if (job.status === 'failed') {
              setIsGenerating(false);
              clearInterval(progressInterval.current!);
              alert(`Generation failed to start: ${job.errorLogs || 'Unknown error'}`);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isGenerating, jobId]);

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Generate Content</h1>
        <p className="page-subtitle">Upload your prompt template and choose an AI model to generate contents for master data.</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Settings Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Generation Settings</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Prompt Template</label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select
                  className="form-input"
                  style={{ flex: 1 }}
                  value={selectedPromptId}
                  onChange={(e) => handleSelectPrompt(e.target.value)}
                  disabled={isGenerating && !isPaused}
                >
                  <option value="">{savedPrompts.length > 0 ? 'Load a saved prompt...' : 'No saved prompts yet'}</option>
                  {savedPrompts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedPromptId !== '' && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-error)' }}
                    disabled={deletingPromptId === selectedPromptId}
                    onClick={() => deletePrompt(selectedPromptId as number)}
                  >
                    {deletingPromptId === selectedPromptId ? 'Deleting...' : 'Delete'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={savingPrompt || !promptContent.trim()}
                  onClick={handleSavePromptClick}
                >
                  {savingPrompt ? 'Saving...' : 'Save'}
                </button>
              </div>

              <label
                className={`upload-area ${dragOverPrompt ? 'dragover' : ''}`}
                style={{ padding: '10px', minHeight: 'auto', borderWidth: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}
                onDragOver={(e) => { e.preventDefault(); setDragOverPrompt(true); }}
                onDragLeave={() => setDragOverPrompt(false)}
                onDrop={(e) => { e.preventDefault(); setDragOverPrompt(false); if(e.dataTransfer.files[0]) handlePromptFile(e.dataTransfer.files[0]); }}
              >
                <input type="file" accept=".md,.txt" style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) handlePromptFile(e.target.files[0]); }} />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span className="upload-area-text" style={{ fontSize: '12px' }}>{savingPrompt ? 'Saving prompt.md...' : promptContent.trim() ? 'Drop another file to replace the prompt below (auto-saved)' : 'Drop prompt.md here or click to upload (auto-saved)'}</span>
              </label>
              <textarea
                className="form-input"
                style={{ minHeight: '160px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, resize: 'vertical' }}
                placeholder={'Write your prompt template here, or upload/load one above. Example:\nWrite a 300-word SEO article about {{service_name}} for {{city}}, {{province}}.'}
                value={promptContent}
                onChange={(e) => { setPromptContent(e.target.value); setSelectedPromptId(''); }}
                disabled={isGenerating && !isPaused}
              />
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.8 }}>
                Available variables: <code>{'{{city}}'}</code> <code>{'{{community}}'}</code> <code>{'{{county}}'}</code> <code>{'{{province}}'}</code> <code>{'{{service_name}}'}</code> / <code>{'{{Service Name}}'}</code> <code>{'{{category}}'}</code> <code>{'{{Meta Title}}'}</code> <code>{'{{Meta Description}}'}</code> <code>{'{{Heading}}'}</code> <code>{'{{Subheading}}'}</code> <code>{'{{No}}'}</code>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                disabled={isGenerating && !isPaused}
              >
                <option value="">Select a category...</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.pending === 0}>
                    {c.name} ({c.pending} pending / {c.total} total)
                  </option>
                ))}
              </select>
              {categoryOptions.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  No master data yet. Generate master data first on the Master Data page.
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select AI Model</label>
                <select 
                  className="form-input" 
                  value={aiModel} 
                  onChange={(e) => setAiModel(e.target.value)}
                  disabled={isGenerating && !isPaused}
                >
                  <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                  <option value="gemini-flash-latest">Gemini Flash (Google)</option>
                  <option value="gemini-pro-latest">Gemini Pro (Google)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Notifications</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={enableSmtp}
                      onChange={(e) => setEnableSmtp(e.target.checked)}
                      disabled={isGenerating && !isPaused}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Enable Email Report
                  </label>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Configure in <a href="/settings" style={{ color: 'var(--color-blue-400)' }}>Settings</a></div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Limit (rows to generate this run)</label>
              <input
                type="number"
                min={1}
                className="form-input"
                placeholder={`Leave empty to generate all ${pendingData.length} pending`}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                disabled={isGenerating && !isPaused}
              />
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Generate only the next N pending rows now. Run generation again later to continue with the rest.
              </div>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Run Generation (Background)</span>
            <span className="badge badge-info">{pendingData.length} pending</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '24px', color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              The generation process runs in the background. You can pause or resume the process at any time without losing your progress.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {!isGenerating || (isGenerating && progress >= 100) ? (
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={startGeneration}
                  disabled={!promptContent.trim() || pendingData.length === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {categoryCompletedData.length > 0 && pendingData.length > 0
                    ? `Continue Generation (${pendingData.length} remaining)`
                    : 'Start Generation'}
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button 
                      className="btn btn-primary btn-lg" 
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={resumeGeneration}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Resume
                    </button>
                  ) : (
                    <button 
                      className="btn btn-warning btn-lg" 
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={pauseGeneration}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      Pause
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-danger btn-lg" 
                    style={{ flex: 0.5, justifyContent: 'center' }}
                    onClick={stopGeneration}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    Stop
                  </button>
                </>
              )}
            </div>

            {(isGenerating || progress > 0) && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: isPaused ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 600 }}>
                    {isPaused ? 'Paused' : (progress >= 100 ? 'Completed' : 'Generating in background...')}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{progress}%</span>
                </div>
                {isGenerating && !isPaused && progress === 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    Writing full-length articles can take 20-60s per row - the bar moves once the first one finishes.
                  </div>
                )}
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${progress}%`,
                      background: isPaused ? 'var(--color-warning)' : 'var(--color-success)',
                      transition: 'width 0.5s ease'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Content Preview List</span>
          <span className="badge badge-success">{completedData.length} generated</span>
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
                <th>Service Name</th>
                <th>Meta Title</th>
                <th>Heading</th>
                <th>Content</th>
                <th>Image</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            {loading ? (
               <tbody><tr><td colSpan={11} style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr></tbody>
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
                      <td colSpan={11} style={{ padding: '12px 20px' }}>
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
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {items.some((i: any) => i.status === 'error') && (
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={resettingGroup === groupName}
                                onClick={(e) => { e.stopPropagation(); resetGroupErrors(groupName, items); }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                                {resettingGroup === groupName ? 'Resetting...' : `Reset Errors (${items.filter((i: any) => i.status === 'error').length})`}
                              </button>
                            )}
                            {items.some((i: any) => i.status === 'generated' || i.status === 'error') && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--color-error)' }}
                                disabled={resettingGroup === groupName}
                                onClick={(e) => { e.stopPropagation(); resetGroupAll(groupName, items); }}
                              >
                                {resettingGroup === groupName ? 'Resetting...' : 'Reset Category'}
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
                        <td>{item.location?.community || '-'}</td>
                        <td>{item.location?.county || '-'}</td>
                        <td>{item.location?.province}</td>
                        <td>{item.service?.name}</td>
                        <td><span title={item.service?.metaTitle || ''} style={{ display: 'inline-block', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.service?.metaTitle || '-'}</span></td>
                        <td><span title={item.service?.heading || ''} style={{ display: 'inline-block', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.service?.heading || '-'}</span></td>
                        <td>
                          {item.status === 'generated' ? (
                            <span className="badge badge-success"><span className="badge-dot"></span> Generated</span>
                          ) : item.status === 'error' ? (
                            <span className="badge badge-danger" title={item.errorMessage || ''} style={{ cursor: item.errorMessage ? 'help' : 'default' }}><span className="badge-dot"></span> Error</span>
                          ) : (
                            <span className="badge badge-warning"><span className="badge-dot"></span> Pending</span>
                          )}
                        </td>
                        <td>
                          {item.image ? (
                            <span className="badge badge-success"><span className="badge-dot"></span> Generated</span>
                          ) : (
                            <span className="badge badge-warning"><span className="badge-dot"></span> Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" disabled={!item.content && !item.errorMessage} onClick={() => setPreviewItem(item)}>
                              {item.status === 'error' ? 'View Error' : 'Preview Content'}
                            </button>
                            {(item.status === 'generated' || item.status === 'error') && (
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={resettingId === item.id}
                                onClick={() => resetItem(item)}
                              >
                                {resettingId === item.id ? 'Resetting...' : 'Reset'}
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
                  <td colSpan={11}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📂</div>
                      <div className="empty-state-title">No data found</div>
                      <div className="empty-state-text">
                        Generate master data first to see content combinations here.
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
        .group-header-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}} />

      {previewItem && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <span className="modal-title">{previewItem.service?.name} - {previewItem.location?.city}, {previewItem.location?.province}</span>
              <button className="modal-close" onClick={() => setPreviewItem(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {previewItem.status === 'error' && previewItem.errorMessage && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Generation Failed</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>{previewItem.errorMessage}</div>
                </div>
              )}
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
              {(previewItem.status === 'generated' || previewItem.status === 'error') && (
                <button
                  className="btn btn-ghost"
                  disabled={resettingId === previewItem.id}
                  onClick={() => resetItem(previewItem)}
                >
                  {resettingId === previewItem.id ? 'Resetting...' : 'Reset to Pending'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
