import React, { useEffect, useState, useCallback } from 'react'

export default function TillatelseList({ navigate, onEdit }) {
  const [tillatelser, setTillatelser] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTillatelser = useCallback(async (searchTerm) => {
    setLoading(true)
    setError('')
    try {
      const url = searchTerm
        ? `/api/tillatelser?search=${encodeURIComponent(searchTerm)}`
        : '/api/tillatelser'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Feil ved henting av data')
      const data = await res.json()
      setTillatelser(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTillatelser(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchTillatelser])

  async function handleDelete(id) {
    if (!window.confirm('Er du sikker på at du vil slette denne tillatelsen?')) return
    try {
      const res = await fetch(`/api/tillatelser/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Feil ved sletting')
      fetchTillatelser(search)
    } catch (err) {
      setError(err.message)
    }
  }

  function formatTillatelseNummer(tn) {
    if (!tn) return ''
    return `${tn.kommunekode || ''}-${tn.løpenummer || ''}-${tn.fødselsår || ''}-${tn.kjønn || ''}`
  }

  return (
    <div>
      <h1 className="page-title">Tillatelsesregister</h1>
      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Søk etter navn, personnummer eller tillatelsenummer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => navigate('form')}>
            + Ny tillatelse
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p>Laster...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Navn</th>
                  <th>Personnummer</th>
                  <th>Tillatelsenummer</th>
                  <th>Type</th>
                  <th>Gyldig fra–til</th>
                  <th>Stjålet/Mistet</th>
                  <th>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {tillatelser.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      Ingen tillatelser funnet
                    </td>
                  </tr>
                ) : (
                  tillatelser.map(t => (
                    <tr key={t.id}>
                      <td>
                        {t.foto ? (
                          <img
                            src={`/api/tillatelser/${t.id}/foto`}
                            alt="Foto"
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2 }}
                          />
                        ) : (
                          <span style={{ color: '#aaa', fontSize: '0.8rem' }}>–</span>
                        )}
                      </td>
                      <td>{t.navn}</td>
                      <td>{t.personnummer}</td>
                      <td>{formatTillatelseNummer(t.tillatelseNummer)}</td>
                      <td>{t.type}</td>
                      <td>
                        {t.gyldighetstid?.fra || '–'} – {t.gyldighetstid?.til || '–'}
                      </td>
                      <td>
                        {t.stjåletEllerMistet ? (
                          <span className="badge badge-stolen">Ja</span>
                        ) : (
                          <span className="badge badge-ok">Nei</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onEdit(t)}
                          >
                            Rediger
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(t.id)}
                          >
                            Slett
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
