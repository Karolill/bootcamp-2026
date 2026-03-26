import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Navigation from './components/Navigation.jsx'
import TillatelseList from './components/TillatelseList.jsx'
import TillatelseForm from './components/TillatelseForm.jsx'
import ImportPage from './components/ImportPage.jsx'

export default function App() {
  const [currentPage, setCurrentPage] = useState('list')
  const [editingTillatelse, setEditingTillatelse] = useState(null)

  function navigate(page, data) {
    setCurrentPage(page)
    setEditingTillatelse(data || null)
  }

  return (
    <>
      <Header />
      <Navigation currentPage={currentPage} navigate={navigate} />
      <div className="main-content">
        {currentPage === 'list' && (
          <TillatelseList
            navigate={navigate}
            onEdit={(tillatelse) => navigate('form', tillatelse)}
          />
        )}
        {currentPage === 'form' && (
          <TillatelseForm
            editing={editingTillatelse}
            onSave={() => navigate('list')}
            onCancel={() => navigate('list')}
          />
        )}
        {currentPage === 'import' && <ImportPage />}
      </div>
    </>
  )
}
