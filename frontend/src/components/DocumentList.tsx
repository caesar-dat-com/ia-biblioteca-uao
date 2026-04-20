import { useEffect, useState } from 'react'
import { FileText, Trash2, CheckCircle2, Clock } from 'lucide-react'

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

export function DocumentList() {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este documento?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="animate-spin-slow w-8 h-8 mx-auto mb-3 rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-muted)' }}>Cargando documentos...</p>
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="card text-center py-16 animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--surface-light)' }}
        >
          <FileText className="w-8 h-8" style={{ color: 'var(--text-dim)' }} />
        </div>
        <p className="text-lg font-medium">Sin documentos catalogados</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Sube una portada para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{docs.length} documentos</h2>
      </div>
      {docs.map((doc, i) => (
        <div
          key={doc.id}
          className="card flex items-center justify-between animate-fade-in-up"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{doc.titulo || 'Sin titulo'}</h3>
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
              {doc.autores || 'Sin autor'} · {doc.anio || '—'} · {doc.tipo_doc || '—'}
            </p>
          </div>
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
              onClick={() => handleDelete(doc.id)}
              className="p-1.5 rounded-lg transition-all hover:bg-red-900/30"
            >
              <Trash2 className="w-4 h-4" style={{ color: 'var(--error)' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}