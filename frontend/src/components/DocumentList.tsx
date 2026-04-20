import { useEffect, useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'

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
    if (!confirm('¿Eliminar este documento?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  if (loading) {
    return <div className="card text-center py-8">Cargando documentos...</div>
  }

  if (docs.length === 0) {
    return (
      <div className="card text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
        <p className="text-lg font-medium">Sin documentos catalogados</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Sube una portada para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{docs.length} documentos</h2>
      </div>
      {docs.map(doc => (
        <div key={doc.id} className="card flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium">{doc.titulo || 'Sin título'}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {doc.autores || 'Sin autor'} · {doc.anio || '—'} · {doc.tipo_doc || '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {doc.validado ? (
              <span className="badge badge-enriched">✓ Validado</span>
            ) : (
              <span className="badge badge-ocr">Pendiente</span>
            )}
            <button onClick={() => handleDelete(doc.id)} className="p-1 rounded hover:bg-red-900/30">
              <Trash2 className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}