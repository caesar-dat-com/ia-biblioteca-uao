import { useState } from 'react'
import { UploadZone } from './components/UploadZone'
import { ResultsPanel } from './components/ResultsPanel'
import { DocumentList } from './components/DocumentList'
import { DocumentDetail } from './components/DocumentDetail'
import { Header } from './components/Header'
import { MetricsPanel } from './components/MetricsPanel'

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
  ocr_text?: string
  ocr_confidence?: number
  ocr_engine?: string
  enriched_from?: string[]
  confidence?: Record<string, number>
  [key: string]: unknown
}

type Tab = 'upload' | 'documents' | 'metrics'
type View = { tab: Tab } | { tab: 'detail'; docId: string }

function App() {
  const [view, setView] = useState<View>({ tab: 'upload' })
  const [result, setResult] = useState<DocumentFields | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUploadComplete = (data: DocumentFields) => {
    setResult(data)
    setError(null)
  }

  const handleValidate = async (docId: string, corrections: Record<string, string>) => {
    try {
      const res = await fetch(`/api/documents/${docId}/validate?action=approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corrections),
      })
      const data = await res.json()
      if (data.status === 'validated') {
        setResult(null)
        setView({ tab: 'documents' })
      }
    } catch {
      setError('Error al validar documento')
    }
  }

  const handleSelectDoc = (docId: string) => {
    setView({ tab: 'detail', docId })
  }

  const handleBackToList = () => {
    setView({ tab: 'documents' })
  }

  const currentTab = view.tab

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Tab bar — outside main, full-width strip */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(7,10,18,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2">
          <div className="tabs-wrapper animate-fade-in w-fit">
            <button
              onClick={() => setView({ tab: 'upload' })}
              className={`tab ${currentTab === 'upload' ? 'tab-active' : 'tab-inactive'}`}
            >
              📸 Nueva Catalogación
            </button>
            <button
              onClick={() => setView({ tab: 'documents' })}
              className={`tab ${currentTab === 'documents' || currentTab === 'detail' ? 'tab-active' : 'tab-inactive'}`}
            >
              📋 Documentos
            </button>
            <button
              onClick={() => setView({ tab: 'metrics' })}
              className={`tab ${currentTab === 'metrics' ? 'tab-active' : 'tab-inactive'}`}
            >
              📊 Métricas
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Error banner */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl animate-fade-in-up flex items-center gap-3"
            style={{
              background: 'var(--error-bg)',
              border: '1px solid #F8717130',
              color: 'var(--error)',
            }}
          >
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="section-enter" key={currentTab + (view.tab === 'detail' ? '-detail' : '')}>
          {currentTab === 'upload' && (
            <div className="space-y-8">
              {/* Page title */}
              {!result && (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                    Nueva catalogación
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Sube la portada de cualquier documento para extraer sus 16 campos automáticamente.
                  </p>
                </div>
              )}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <UploadZone
                  onResult={handleUploadComplete}
                  onLoading={setLoading}
                  onError={setError}
                  loading={loading}
                />
              </div>
              {result && (
                <ResultsPanel
                  data={result}
                  onValidate={handleValidate}
                />
              )}
            </div>
          )}

          {currentTab === 'documents' && (
            <div className="space-y-6">
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                  Documentos catalogados
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Haz clic en un documento para ver el detalle completo y validarlo.
                </p>
              </div>
              <DocumentList onSelectDoc={handleSelectDoc} />
            </div>
          )}

          {currentTab === 'detail' && view.tab === 'detail' && (
            <DocumentDetail
              docId={(view as { tab: 'detail'; docId: string }).docId}
              onBack={handleBackToList}
            />
          )}

          {currentTab === 'metrics' && (
            <div className="space-y-6">
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                  Métricas del sistema
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Estadísticas en tiempo real del pipeline IA.
                </p>
              </div>
              <MetricsPanel />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-4 text-xs"
        style={{ color: 'var(--text-dim)', borderTop: '1px solid var(--border)' }}
      >
        CatalogIA · IA 535212 · UAO 2026
      </footer>
    </div>
  )
}

export default App