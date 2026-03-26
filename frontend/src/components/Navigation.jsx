import React from 'react'

export default function Navigation({ currentPage, navigate }) {
  return (
    <nav className="nav">
      <button
        className={`nav-btn ${currentPage === 'list' ? 'active' : ''}`}
        onClick={() => navigate('list')}
      >
        Register
      </button>
      <button
        className={`nav-btn ${currentPage === 'form' ? 'active' : ''}`}
        onClick={() => navigate('form')}
      >
        Ny tillatelse
      </button>
      <button
        className={`nav-btn ${currentPage === 'import' ? 'active' : ''}`}
        onClick={() => navigate('import')}
      >
        Importer
      </button>
    </nav>
  )
}
