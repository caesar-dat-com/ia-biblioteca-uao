import { useState } from 'react'
import { UploadZone } from './components/UploadZone'
import { ResultsPanel } from './components/ResultsPanel'
import { DocumentList } from './components/DocumentList'
import { Header } from './components/Header'

export interface DocumentFields {
  id: string
  titulo: string | null
  subtitulo: string | null
  autores: string | null
  anio: number | null
  mes_dia: string | null
  editorial: string | null
  lugar: string | null
  tipo_doc: string | null
  edicion_vol: string | null
  palabras_clave: string | null
  resumen: string | null
  idioma: string | null
  paginas: string | null
  formato: string | null
  licencia: string | null
  ubicacion: string | null
  _ocr_text?: string
  _ocr_confidence?: number
  _ocr_engine?: string
  _enrichment_sources?: Record<string, boolean>
  [key: string]: unknown
}

type Tab = 'upload' | 'documents'

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('upload')
  const [result, setResult] = useState<DocumentFields | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUploadComplete = (data: DocumentFields) => {
    setResult(data)
    setError(null)
  }

  const handleValidate = async (docId: string, corrections: Record<string, string>) => {
    try {
      const res = await fetch(`/api/catalog/validate/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corrections),
      })
      const data = await res.json()
      if (data.status === 'validated') {
        setResult(null)
        setCurrentTab('documents')
      }
    } catch {
      setError('Error al validar documento')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 animate-fade-in">
          <button
            onClick={() => setCurrentTab('upload')}
            className={`tab ${currentTab === 'upload' ? 'active' : ''}`}
          >
            📸 Nueva Catalogacion
          </button>
          <button
            onClick={() => setCurrentTab('documents')}
            className={`tab ${currentTab === 'documents' ? 'active' : ''}`}
          >
            📋 Documentos
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl animate-fade-in-up" style={{ background: '#F8717115', border: '1px solid #F8717130', color: '#F87171' }}>
            {error}
          </div>
        )}

        {currentTab === 'upload' && (
          <div className="space-y-6">
            <UploadZone
              onResult={handleUploadComplete}
              onLoading={setLoading}
              onError={setError}
              loading={loading}
            />
            {result && (
              <ResultsPanel
                data={result}
                onValidate={handleValidate}
              />
            )}
          </div>
        )}

        {currentTab === 'documents' && (
          <DocumentList />
        )}
      </div>
    </div>
  )
}

export default App