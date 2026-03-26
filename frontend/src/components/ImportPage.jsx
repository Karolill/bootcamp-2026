import React, { useState } from 'react'

export default function ImportPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    setFile(e.target.files[0] || null)
    setResult(null)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Velg en fil før du importerer.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import feilet')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Importer tillatelser</h1>
      <div className="card">
        <p style={{ marginBottom: '1.5rem', color: '#555' }}>
          Last opp en CSV- eller Excel-fil (.csv, .xlsx) med kolonner:
          personnummer, navn, kommunekode, løpenummer, fødselsår, kjønn, fra, til, type, stjåletEllerMistet
        </p>

        {result && (
          <div className="alert alert-success">
            ✓ Importert {result.count} tillatelse{result.count !== 1 ? 'r' : ''} vellykket.
            {result.errors && result.errors.length > 0 && (
              <ul style={{ marginTop: '0.5rem' }}>
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
        )}

        {error && <div className="alert alert-error">✗ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="import-box">
            <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Velg fil (.csv eller .xlsx)</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
            />
            {file && (
              <p style={{ marginTop: '0.5rem', color: '#555', fontSize: '0.9rem' }}>
                Valgt fil: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !file}
          >
            {loading ? 'Importerer...' : 'Importer'}
          </button>
        </form>
      </div>
    </div>
  )
}
