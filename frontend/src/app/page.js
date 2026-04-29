'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [userFile, setUserFile] = useState(null);
  const [exchangeFile, setExchangeFile] = useState(null);
  const [timeTolerance, setTimeTolerance] = useState(5);
  const [quantityTolerance, setQuantityTolerance] = useState(0.01);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const userFileInputRef = useRef(null);
  const exchangeFileInputRef = useRef(null);

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const handleReconcile = async () => {
    if (!userFile || !exchangeFile) {
      setError('Please upload both User and Exchange CSV files.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('userFile', userFile);
    formData.append('exchangeFile', exchangeFile);
    formData.append('timeToleranceMins', timeTolerance);
    formData.append('quantityTolerancePercent', quantityTolerance);

    try {
      const response = await fetch('http://localhost:3000/reconcile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to reconcile');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.runId) return;
    // Just trigger a download via a hidden link
    window.location.href = `http://localhost:3000/report/${result.runId}`;
  };

  return (
    <main className="glass-panel">
      <h1>Reconciliation Engine</h1>
      <p className="subtitle">Sync your cryptocurrency transaction datasets securely</p>

      <div className="upload-grid">
        <div 
          className={`upload-zone ${userFile ? 'has-file' : ''}`}
          onClick={() => userFileInputRef.current.click()}
        >
          <input 
            type="file" 
            accept=".csv"
            ref={userFileInputRef}
            onChange={(e) => handleFileChange(e, setUserFile)}
          />
          <div className="upload-icon">👤</div>
          <div className="file-name">
            {userFile ? userFile.name : 'Upload User CSV'}
          </div>
        </div>

        <div 
          className={`upload-zone ${exchangeFile ? 'has-file' : ''}`}
          onClick={() => exchangeFileInputRef.current.click()}
        >
          <input 
            type="file" 
            accept=".csv"
            ref={exchangeFileInputRef}
            onChange={(e) => handleFileChange(e, setExchangeFile)}
          />
          <div className="upload-icon">🏦</div>
          <div className="file-name">
            {exchangeFile ? exchangeFile.name : 'Upload Exchange CSV'}
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="input-field">
          <label>Time Tolerance (Mins)</label>
          <input 
            type="number" 
            value={timeTolerance} 
            onChange={(e) => setTimeTolerance(e.target.value)}
            min="0"
          />
        </div>
        <div className="input-field">
          <label>Quantity Tolerance (%)</label>
          <input 
            type="number" 
            value={quantityTolerance} 
            onChange={(e) => setQuantityTolerance(e.target.value)}
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {error && <p style={{ color: '#F44336', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

      <button 
        className="btn-primary" 
        onClick={handleReconcile}
        disabled={loading}
      >
        {loading ? <div className="loader"></div> : 'Run Reconciliation'}
      </button>

      {result && (
        <div className="results-panel">
          <div className="metrics-grid">
            <div className="metric-card matched">
              <span className="metric-value">{result.summary?.matched || 0}</span>
              <span className="metric-label">Matched</span>
            </div>
            <div className="metric-card conflicting">
              <span className="metric-value">{result.summary?.conflicting || 0}</span>
              <span className="metric-label">Conflicting</span>
            </div>
            <div className="metric-card unmatched">
              <span className="metric-value">{result.summary?.unmatchedUser || 0}</span>
              <span className="metric-label">Unmatched (User)</span>
            </div>
            <div className="metric-card unmatched">
              <span className="metric-value">{result.summary?.unmatchedExchange || 0}</span>
              <span className="metric-label">Unmatched (Exch)</span>
            </div>
          </div>
          
          <button className="btn-secondary" onClick={handleDownload}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download CSV Report
          </button>
        </div>
      )}
    </main>
  );
}
