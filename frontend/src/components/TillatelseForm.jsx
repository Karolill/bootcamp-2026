import React, { useState, useEffect } from 'react'

function getInitialState(editing) {
  if (editing) {
    return {
      personnummer: editing.personnummer || '',
      navn: editing.navn || '',
      kommunekode: editing.tillatelseNummer?.kommunekode || '',
      løpenummer: editing.tillatelseNummer?.løpenummer || '',
      fødselsår: editing.tillatelseNummer?.fødselsår || '',
      kjønn: editing.tillatelseNummer?.kjønn || 'M',
      fra: editing.gyldighetstid?.fra || '',
      til: editing.gyldighetstid?.til || '',
      stjåletEllerMistet: editing.stjåletEllerMistet || false,
      type: editing.type || 'fører',
    }
  }
  return {
    personnummer: '',
    navn: '',
    kommunekode: '',
    løpenummer: '',
    fødselsår: '',
    kjønn: 'M',
    fra: '',
    til: '',
    stjåletEllerMistet: false,
    type: 'fører',
  }
}

export default function TillatelseForm({ editing, onSave, onCancel }) {
  const [form, setForm] = useState(() => getInitialState(editing))
  const [fotoFile, setFotoFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(getInitialState(editing))
    setFotoFile(null)
    setError('')
  }, [editing])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleFileChange(e) {
    setFotoFile(e.target.files[0] || null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!/^\d{11}$/.test(form.personnummer)) {
      setError('Personnummer må være nøyaktig 11 siffer.')
      return
    }

    const fd = new FormData()
    fd.append('personnummer', form.personnummer)
    fd.append('navn', form.navn)
    fd.append('kommunekode', form.kommunekode)
    fd.append('løpenummer', form.løpenummer)
    fd.append('fødselsår', form.fødselsår)
    fd.append('kjønn', form.kjønn)
    fd.append('fra', form.fra)
    fd.append('til', form.til)
    fd.append('stjåletEllerMistet', String(form.stjåletEllerMistet))
    fd.append('type', form.type)
    if (fotoFile) fd.append('foto', fotoFile)

    setSaving(true)
    try {
      const url = editing ? `/api/tillatelser/${editing.id}` : '/api/tillatelser'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Feil ved lagring')
      }
      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">{editing ? 'Rediger tillatelse' : 'Ny tillatelse'}</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-section">
            <div className="form-section-title">Personopplysninger</div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="personnummer">Personnummer *</label>
                <input
                  id="personnummer"
                  name="personnummer"
                  type="text"
                  value={form.personnummer}
                  onChange={handleChange}
                  placeholder="11 siffer"
                  required
                  maxLength={11}
                />
              </div>
              <div className="form-group">
                <label htmlFor="navn">Navn *</label>
                <input
                  id="navn"
                  name="navn"
                  type="text"
                  value={form.navn}
                  onChange={handleChange}
                  placeholder="Fullt navn"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="foto">Foto (valgfritt)</label>
              <input
                id="foto"
                name="foto"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {editing && editing.foto && !fotoFile && (
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Nåværende foto: {editing.foto}
                </small>
              )}
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Tillatelsenummer</div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="kommunekode">Kommunekode</label>
                <input
                  id="kommunekode"
                  name="kommunekode"
                  type="text"
                  value={form.kommunekode}
                  onChange={handleChange}
                  placeholder="f.eks. 0301"
                />
              </div>
              <div className="form-group">
                <label htmlFor="løpenummer">Løpenummer</label>
                <input
                  id="løpenummer"
                  name="løpenummer"
                  type="text"
                  value={form.løpenummer}
                  onChange={handleChange}
                  placeholder="f.eks. 001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fødselsår">Fødselsår</label>
                <input
                  id="fødselsår"
                  name="fødselsår"
                  type="text"
                  value={form.fødselsår}
                  onChange={handleChange}
                  placeholder="f.eks. 1985"
                />
              </div>
              <div className="form-group">
                <label htmlFor="kjønn">Kjønn</label>
                <select
                  id="kjønn"
                  name="kjønn"
                  value={form.kjønn}
                  onChange={handleChange}
                >
                  <option value="M">M</option>
                  <option value="K">K</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Gyldighetstid</div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fra">Fra</label>
                <input
                  id="fra"
                  name="fra"
                  type="date"
                  value={form.fra}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="til">Til</label>
                <input
                  id="til"
                  name="til"
                  type="date"
                  value={form.til}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Type og status</div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="fører">Fører</option>
                  <option value="passasjer">Passasjer</option>
                </select>
              </div>
            </div>
            <div className="checkbox-group">
              <input
                id="stjåletEllerMistet"
                name="stjåletEllerMistet"
                type="checkbox"
                checked={form.stjåletEllerMistet}
                onChange={handleChange}
              />
              <label htmlFor="stjåletEllerMistet">Stjålet eller mistet</label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Lagrer...' : editing ? 'Oppdater' : 'Lagre'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
