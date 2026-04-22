import { useEffect, useState } from 'react'
import { FileText, Trash2, CheckCircle2, Clock, BookOpen } from 'lucide-react'

interface Doc {
  id: string
  titulo: string | null
  autores: string | null
  tipo_doc: string | null
  anio: number | null
  idioma: string | null
  validado: boolean
  fecha_creacion: string
}

interface DocumentListProps {
  onSelectDoc: (docId: string) => void
}

export function DocumentList({ onSelectDoc }: DocumentListProps) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/documents?limit=50')
      .then(res => res.json())
      .then(data => {
        setDocs(data.documents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este documento?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  if (loading) {
    return (
      <div className="card text-center py-16">
        <div
          className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-t-transparent animate-spin-slow"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>Cargando documentos...</p>
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="card text-center py-20 animate-fade-in-up">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'rgba(42, 125, 110, 0.1)',
            border: '1px solid rgba(42, 125, 110, 0.2)',
          }}
        >
          <BookOpen className="w-9 h-9" style={{ color: 'var(--primary)' }} />
        </div>
        <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Sin documentos catalogados
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Sube una portada para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 section-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {docs.length} documento{docs.length !== 1 ? 's' : ''}
        </h2>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Últimos 50 registros
        </span>
      </div>

      {/* List */}
      {docs.map((doc, i) => (
        <div
          key={doc.id}
          className="doc-item animate-fade-in-up cursor-pointer"
          style={{ animationDelay: `${i * 0.04}s` }}
          onClick={() => onSelectDoc(doc.id)}
        >
          {/* Doc icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-3"
            style={{
              background: doc.validado
                ? 'rgba(52, 211, 153, 0.1)'
                : 'rgba(139, 148, 158, 0.1)',
              border: `1px solid ${doc.validado ? 'rgba(52, 211, 153, 0.2)' : 'rgba(139, 148, 158, 0.15)'}`,
            }}
          >
            <FileText
              className="w-4.5 h-4.5"
              style={{ color: doc.validado ? 'var(--success)' : 'var(--text-dim)' }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
              {doc.titulo || 'Sin título'}
            </h3>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {doc.autores || 'Sin autor'} · {doc.anio || '—'} · {doc.tipo_doc || '—'}
            </p>
          </div>

          {/* Badge + actions */}
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {doc.validado ? (
              <span className="badge badge-enriched flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Validado
              </span>
            ) : (
              <span className="badge badge-pending flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pendiente
              </span>
            )}
            <button
              onClick={(e) => handleDelete(e, doc.id)}
              className="p-1.5 rounded-lg transition-all hover:bg-red-900/30"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" style={{ color: 'var(--error)' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}