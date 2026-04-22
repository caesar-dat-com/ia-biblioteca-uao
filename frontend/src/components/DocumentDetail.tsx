import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock, Terminal, ChevronDown, Edit3, Check } from 'lucide-react'
import { ConfidenceRing } from './ConfidenceRing'
import { FieldCard } from './FieldCard'

interface DocDetail {
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
  status: string
  ocr_text: string | null
  ocr_engine: string | null
  ocr_confidence: number | null
  confidence: Record<string, number> | null
  source_image: string | null
  extraction_method: string | null
  enriched_from: string[] | null
  validated_by: string | null
  created_at: string | null
  updated_at: string | null
}

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título', subtitulo: 'Subtítulo', autores: 'Autor(es)',
  anio: 'Año', mes_dia: 'Mes/Día', editorial: 'Editorial',
  lugar: 'Lugar', tipo_doc: 'Tipo', edicion_vol: 'Edición/Vol.',
  palabras_clave: 'Palabras clave', resumen: 'Resumen', idioma: 'Idioma',
  paginas: 'Páginas', formato: 'Formato', licencia: 'Licencia',
}

const FIELD_ICONS: Record<string, string> = {
  titulo: '📖', subtitulo: '📝', autores: '👤',
  anio: '📅', mes_dia: '📆', editorial: '🏢',
  lugar: '📍', tipo_doc: '📂', edicion_vol: '🔢',
  palabras_clave: '🏷️', resumen: '📄', idioma: '🌍',
  paginas: '📃', formato: '📐', licencia: '⚖️',
}

const FIELD_ORDER = [
  'titulo', 'subtitulo', 'autores', 'anio', 'mes_dia', 'editorial',
  'lugar', 'tipo_doc', 'edicion_vol', 'palabras_clave', 'resumen',
  'idioma', 'paginas', 'formato', 'licencia',
]

interface DocumentDetailProps {
  docId: string
  onBack: () => void
}

export function DocumentDetail({ docId, onBack }: DocumentDetailProps) {
  const [doc, setDoc] = useState<DocDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [ocrOpen, setOcrOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    fetch(`/api/documents/${docId}`)
      .then(res => res.json())
      .then(data => {
        setDoc(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [docId])

  if (loading) {
    return (
      <div className="card text-center py-16">
        <div
          className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-t-transparent animate-spin-slow"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>Cargando documento...</p>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="card text-center py-16">
        <p style={{ color: 'var(--error)' }}>Documento no encontrado</p>
        <button className="btn-secondary mt-4" onClick={onBack}>Volver</button>
      </div>
    )
  }

  const confidence = doc.ocr_confidence ?? 0
  const isValidated = doc.status === 'validated'
  // Extract just the filename from source_image path
  const imageFilename = doc.source_image ? decodeURIComponent(doc.source_image.replace(/\\/g, '/').split('/').pop() || '') : null
  const imageUrl = imageFilename ? `/api/images/${encodeURIComponent(imageFilename)}` : null

  const statusBadge = isValidated ? (
    <span className="badge badge-enriched flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> Validado
    </span>
  ) : (
    <span className="badge badge-pending flex items-center gap-1">
      <Clock className="w-3 h-3" /> Pendiente
    </span>
  )

  return (
    <div className="space-y-5 section-enter">
      {/* Back button */}
      <button
        className="btn-secondary flex items-center gap-2 mb-2"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4" /> Volver a documentos
      </button>

      {/* Header: Image + Meta */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          {imageUrl && !imgError && (
            <div className="shrink-0">
              <img
                src={imageUrl}
                alt={doc.titulo || 'Portada del documento'}
                className="rounded-xl max-h-64 max-w-xs object-contain"
                style={{ border: '1px solid var(--border)' }}
                onError={() => setImgError(true)}
              />
            </div>
          )}
          {imgError && (
            <div
              className="shrink-0 w-48 h-48 rounded-xl flex items-center justify-center text-4xl"
              style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}
            >
              🖼️
            </div>
          )}

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              {statusBadge}
              {doc.extraction_method && (
                <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                  {doc.extraction_method}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
              {doc.titulo || 'Sin título'}
            </h2>
            {doc.subtitulo && (
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{doc.subtitulo}</p>
            )}

            <div className="space-y-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              {doc.autores && <p>👤 {doc.autores}</p>}
              {doc.anio && <p>📅 {doc.anio}</p>}
              {doc.editorial && <p>🏢 {doc.editorial}</p>}
              {doc.tipo_doc && <p>📂 {doc.tipo_doc}</p>}
            </div>

            {/* Confidence ring */}
            <div className="flex items-center gap-4 mt-4">
              <ConfidenceRing value={confidence} size={80} strokeWidth={6} />
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                <p>Motor: <span style={{ color: 'var(--text)' }}>{doc.ocr_engine || 'N/A'}</span></p>
                <p>Fuentes: <span style={{ color: 'var(--text)' }}>
                  {doc.enriched_from?.length ? doc.enriched_from.join(', ') : 'Ninguna'}
                </span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          Campos del documento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
          {FIELD_ORDER.map(field => {
            const value = (doc as Record<string, unknown>)[field] as string | number | null
            const valueStr = value === null || value === undefined ? null : String(value)
            const fieldConf = doc.confidence?.[field] ?? doc.ocr_confidence ?? 0.5
            const enrichSource = doc.enriched_from?.includes('google_books') ||
                                 doc.enriched_from?.includes('open_library') ||
                                 doc.enriched_from?.includes('crossref')
            const source = enrichSource ? 'enriquecimiento' : 'ocr'
            const sourceLabel = enrichSource ? 'Online' : 'OCR+IA'

            return (
              <FieldCard
                key={field}
                fieldKey={field}
                label={FIELD_LABELS[field] || field}
                icon={FIELD_ICONS[field] || '📌'}
                value={valueStr}
                source={source}
                sourceLabel={sourceLabel}
                confidence={fieldConf}
              />
            )
          })}
        </div>
      </div>

      {/* OCR raw text */}
      {doc.ocr_text && (
        <div className="terminal-wrapper animate-fade-in-up">
          <button
            className="terminal-header w-full"
            onClick={() => setOcrOpen(!ocrOpen)}
          >
            <div className="terminal-dots">
              <span style={{ background: '#FF5F57' }} />
              <span style={{ background: '#FEBC2E' }} />
              <span style={{ background: '#28C840' }} />
            </div>
            <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--primary-light)' }} />
            <span className="font-medium">Texto OCR crudo</span>
            <ChevronDown
              className="w-4 h-4 ml-auto transition-transform duration-200"
              style={{
                color: 'var(--text-dim)',
                transform: ocrOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
          {ocrOpen && (
            <div className="terminal-body">
              <span className="terminal-prompt">$</span> ocr extract --raw{'\n'}
              {doc.ocr_text}
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="card-flat text-xs" style={{ color: 'var(--text-dim)' }}>
        <p>Creado: {doc.created_at ? new Date(doc.created_at).toLocaleString('es-CO') : '—'}</p>
        <p>Actualizado: {doc.updated_at ? new Date(doc.updated_at).toLocaleString('es-CO') : '—'}</p>
        {doc.validated_by && <p>Validado por: {doc.validated_by}</p>}
      </div>
    </div>
  )
}