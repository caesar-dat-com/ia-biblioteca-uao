import { useState } from 'react'
import { Check, X, Edit3, ExternalLink, Loader2 } from 'lucide-react'
import type { DocumentFields } from '../App'

interface ResultsPanelProps {
  data: DocumentFields
  onValidate: (docId: string, corrections: Partial<DocumentFields>) => void
}

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título', subtitulo: 'Subtítulo', autores: 'Autor(es)',
  anio: 'Año', mes_dia: 'Mes/Día', editorial: 'Editorial',
  lugar: 'Lugar', tipo_doc: 'Tipo de Doc.', edicion_vol: 'Edición/Vol.',
  palabras_clave: 'Palabras clave', resumen: 'Resumen', idioma: 'Idioma',
  paginas: 'Páginas', formato: 'Formato', licencia: 'Licencia', ubicacion: 'Ubicación'
}

const FIELD_ORDER = [
  'titulo', 'subtitulo', 'autores', 'anio', 'mes_dia', 'editorial',
  'lugar', 'tipo_doc', 'edicion_vol', 'palabras_clave', 'resumen',
  'idioma', 'paginas', 'formato', 'licencia', 'ubicacion'
]

export function ResultsPanel({ data, onValidate }: ResultsPanelProps) {
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({})
  const [validated, setValidated] = useState(false)

  const getBadgeClass = (field: string) => {
    const source = data[`${field}_fuente`] as string
    if (!source) return 'badge-ocr'
    if (source === 'enriquecimiento') return 'badge-enriched'
    if (source === 'clasificacion_auto') return 'badge-manual'
    return 'badge-ocr'
  }

  const getSourceLabel = (field: string) => {
    const source = data[`${field}_fuente`] as string
    if (!source) return ''
    if (source === 'enriquecimiento') return '🌐 Online'
    if (source === 'clasificacion_auto') return '🤖 Auto'
    return '📸 OCR+IA'
  }

  const handleSave = () => {
    const corrections: Record<string, string> = {}
    Object.entries(editing).forEach(([k, v]) => {
      if (v !== (data[k] ?? '')) corrections[k] = v
    })
    onValidate(data._id || 'new', corrections)
    setValidated(true)
  }

  const confidence = data._ocr_confidence ?? 0
  const confidencePct = Math.round(confidence * 100)
  const confidenceColor = confidencePct > 70 ? 'var(--color-success)' : confidencePct > 40 ? 'var(--color-warning)' : 'var(--color-error)'

  return (
    <div className="space-y-4">
      {/* Confidence bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Confianza de extracción</span>
          <span className="font-bold" style={{ color: confidenceColor }}>{confidencePct}%</span>
        </div>
        <div className="confidence-bar">
          <div className="confidence-fill" style={{ width: `${confidencePct}%`, background: confidenceColor }} />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Motor: {data._ocr_engine || 'N/A'} | Fuentes online: {
            data._enrichment_sources 
              ? Object.entries(data._enrichment_sources).filter(([,v]) => v).map(([k]) => k).join(', ') || 'Ninguna'
              : 'N/A'
          }
        </p>
      </div>

      {/* Fields grid */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Campos extraídos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FIELD_ORDER.map(field => {
            const value = editing[field] ?? (data[field] as string ?? '')
            const isEdit = isEditing[field]
            const label = FIELD_LABELS[field] || field
            const source = getSourceLabel(field)
            
            return (
              <div key={field} className="flex flex-col gap-1 p-2 rounded-lg" style={{ background: 'var(--color-bg)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                  {source && <span className={`badge ${getBadgeClass(field)}`}>{source}</span>}
                  <button
                    onClick={() => setIsEditing(prev => ({ ...prev, [field]: !prev }))}
                    className="ml-auto"
                    title="Editar"
                  >
                    <Edit3 className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                </div>
                {isEdit ? (
                  <input
                    type="text"
                    value={editing[field] ?? value}
                    onChange={(e) => setEditing(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-2 py-1 rounded text-sm"
                    style={{ background: 'var(--color-surface-light)', color: 'var(--color-text)', border: '1px solid var(--color-primary)' }}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm" style={{ color: value ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {value || '—'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* OCR raw text (collapsible) */}
      {data._ocr_text && (
        <details className="card">
          <summary className="cursor-pointer font-medium text-sm" style={{ color: 'var(--color-text-muted)' }}>
            📝 Texto OCR crudo
          </summary>
          <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 rounded" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
            {data._ocr_text}
          </pre>
        </details>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary flex items-center gap-2" onClick={() => {/* TODO: search online */}}>
          <ExternalLink className="w-4 h-4" /> Buscar online
        </button>
        <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={validated}>
          {validated ? <><Check className="w-4 h-4" /> Guardado</> : <><Check className="w-4 h-4" /> Validar y guardar</>}
        </button>
      </div>
    </div>
  )
}