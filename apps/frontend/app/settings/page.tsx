'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpEncryption: 'TLS',
    smtpUsername: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: '',
    openaiKey: '',
    anthropicKey: '',
    geminiKey: ''
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpEncryption: settings.smtpEncryption,
          smtpUsername: settings.smtpUsername,
          smtpPassword: settings.smtpPassword,
          smtpFromEmail: settings.smtpFromEmail,
          smtpFromName: settings.smtpFromName,
        })
      });
      setSmtpSaved(true);
      setTimeout(() => setSmtpSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiKey: settings.openaiKey,
          anthropicKey: settings.anthropicKey,
          geminiKey: settings.geminiKey,
        })
      });
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>Loading settings...</div>;
  }

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Configuration Settings</h1>
        <p className="page-subtitle">Manage SMTP email notifications and AI model API keys.</p>
      </div>

      <div className="grid-2">
        {/* AI Models Configuration */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">AI API Keys</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveAi}>
              <div className="form-group">
                <label className="form-label">OpenAI API Key (GPT-4o)</label>
                <input type="password" name="openaiKey" className="form-input" placeholder="sk-..." value={settings.openaiKey || ''} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Anthropic API Key (Claude 3.5)</label>
                <input type="password" name="anthropicKey" className="form-input" placeholder="sk-ant-..." value={settings.anthropicKey || ''} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Google API Key (Gemini 1.5)</label>
                <input type="password" name="geminiKey" className="form-input" placeholder="AIza..." value={settings.geminiKey || ''} onChange={handleChange} />
              </div>
              
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">Save AI Settings</button>
                {aiSaved && <span className="badge badge-success">Saved Successfully</span>}
              </div>
            </form>
          </div>
        </div>

        {/* SMTP Configuration */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">SMTP Server Settings</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveSmtp}>
              <div className="form-group">
                <label className="form-label">SMTP Host</label>
                <input type="text" name="smtpHost" className="form-input" placeholder="e.g. smtp.gmail.com" value={settings.smtpHost || ''} onChange={handleChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Port</label>
                  <input type="text" name="smtpPort" className="form-input" placeholder="e.g. 587" value={settings.smtpPort || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Encryption</label>
                  <select name="smtpEncryption" className="form-input" value={settings.smtpEncryption || 'TLS'} onChange={handleChange}>
                    <option value="TLS">TLS</option>
                    <option value="SSL">SSL</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Username</label>
                <input type="text" name="smtpUsername" className="form-input" placeholder="SMTP Username" value={settings.smtpUsername || ''} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Password</label>
                <input type="password" name="smtpPassword" className="form-input" placeholder="SMTP Password" value={settings.smtpPassword || ''} onChange={handleChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">From Email</label>
                  <input type="email" name="smtpFromEmail" className="form-input" placeholder="notifications@yourdomain.com" value={settings.smtpFromEmail || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">From Name (optional)</label>
                  <input type="text" name="smtpFromName" className="form-input" placeholder="Venture27 Notifications" value={settings.smtpFromName || ''} onChange={handleChange} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                Many providers (incl. SMTP2GO) use an account handle for "Username" that isn't itself a real email address - set the actual sender address here separately, or notification emails will be rejected.
              </div>

              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">Save SMTP Settings</button>
                {smtpSaved && <span className="badge badge-success">Saved Successfully</span>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
