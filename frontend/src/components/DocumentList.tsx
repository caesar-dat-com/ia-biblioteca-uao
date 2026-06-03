import { useEffect, useState, useCallback } from 'react'
import { FileText, Trash2, CheckCircle2, Clock, BookOpen, Download, Search, X } from 'lucide-react'

interface Doc {
  id: string
  titulo: string | null
  autores: string | null
  tipo_doc: string | null
  anio: number | null
  idioma: string | null
  status: string
  source_image: string | null
  created_at: string
}

interface DocumentListProps {
  onSelectDoc: (docId: string) => void
}

function getImageUrl(source_image: string | null): string | null {
  if (!source_image) return null
  const filename = source_image.split('/').pop()
  return filename ? `/api/images/${filename}` : null
}

const TIPOS = ['Libro', 'Artículo', 'Tesis', 'Norma', 'Manual', 'Otro']

export function DocumentList({ onSelectDoc }: DocumentListProps) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tipoDoc, setTipoDoc] = useState('')
  const [anio, setAnio] = useState('')

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (q) params.set('q', q)
    if (tipoDoc) params.set('tipo_doc', tipoDoc)
    if (anio && !isNaN(Number(anio))) params.set('anio', anio)
    try {
      const res = await fetch(`/api/documents/?${params}`)
      const data = await res.json()
      setDocs(data.documents || [])
      setTotal(data.total || 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [q, tipoDoc, anio])

  useEffect(() => {
    const t = setTimeout(fetchDocs, 300)
    return () => clearTimeout(t)
  }, [fetchDocs])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este documento?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
    setTotal(prev => prev - 1)
  }

  const handleExport = () => {
    window.location.href = '/api/documents/export'
  }

  const clearFilters = () => {
    setQ('')
    setTipoDoc('')
    setAnio('')
  }

  const hasFilters = q || tipoDoc || anio

  if (loading && docs.length === 0) {
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

  return (
    <div className="space-y-4 section-enter">
      {/* Filters + Export bar */}
      <div className="card" style={{ padding: '0.85rem 1rem' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Buscar por título, autor, editorial..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.2rem',
                paddingRight: '0.75rem',
                paddingTop: '0.45rem',
                paddingBottom: '0.45rem',
                background: 'var(--surface-light)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Tipo doc */}
          <select
            value={tipoDoc}
            onChange={e => setTipoDoc(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              background: 'var(--surface-light)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: tipoDoc ? 'var(--text)' : 'var(--text-dim)',
              fontSize: '0.85rem',
              minWidth: 130,
            }}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Año */}
          <input
            type="number"
            placeholder="Año"
            value={anio}
            onChange={e => setAnio(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              background: 'var(--surface-light)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: '0.85rem',
              width: 90,
            }}
          />

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-1.5"
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}

          {/* Export */}
          <button
            onClick={handleExport}
            className="btn-primary flex items-center gap-1.5"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          {docs.length} de {total} documento{total !== 1 ? 's' : ''}
          {hasFilters && <span style={{ color: 'var(--primary-light)', marginLeft: 6 }}>· filtrado</span>}
        </h2>
      </div>

      {/* Empty state */}
      {docs.length === 0 && !loading && (
        <div className="card text-center py-20 animate-fade-in-up">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(42, 125, 110, 0.1)', border: '1px solid rgba(42, 125, 110, 0.2)' }}
          >
            <BookOpen className="w-9 h-9" style={{ color: 'var(--primary)' }} />
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {hasFilters ? 'Sin resultados' : 'Sin documentos catalogados'}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {hasFilters ? 'Prueba con otros filtros' : 'Sube una portada para comenzar'}
          </p>
        </div>
      )}

      {/* List */}
      {docs.map((doc, i) => {
        const validated = doc.status === 'validated'
        const imageUrl = getImageUrl(doc.source_image)

        return (
          <div
            key={doc.id}
            className="doc-item animate-fade-in-up cursor-pointer"
            style={{ animationDelay: `${i * 0.04}s` }}
            onClick={() => onSelectDoc(doc.id)}
          >
            {/* Thumbnail or icon */}
            <div
              className="shrink-0 mr-3 rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                width: 44, height: 56,
                background: validated ? 'rgba(52, 211, 153, 0.1)' : 'rgba(139, 148, 158, 0.1)',
                border: `1px solid ${validated ? 'rgba(52, 211, 153, 0.2)' : 'rgba(139, 148, 158, 0.15)'}`,
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={doc.titulo ?? 'portada'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <FileText className="w-5 h-5" style={{ color: validated ? 'var(--success)' : 'var(--text-dim)' }} />
              )}
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
              {validated ? (
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
        )
      })}
    </div>
  )
}
