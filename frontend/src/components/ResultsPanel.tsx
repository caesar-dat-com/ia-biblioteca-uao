import { useState } from 'react'
import { Check, Edit3, ExternalLink, Globe, Cpu, Sparkles } from 'lucide-react'
import type { DocumentFields } from '../App'
import { ConfidenceRing } from './ConfidenceRing'

interface ResultsPanelProps {
  data: DocumentFields
  onValidate: (docId: string, corrections: Record<string, string>) => void
}

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Titulo', subtitulo: 'Subtitulo', autores: 'Autor(es)',
  anio: 'Año', mes_dia: 'Mes/Dia', editorial: 'Editorial',
  lugar: 'Lugar', tipo_doc: 'Tipo', edicion_vol: 'Edicion/Vol.',
  palabras_clave: 'Palabras clave', resumen: 'Resumen', idioma: 'Idioma',
  paginas: 'Paginas', formato: 'Formato', licencia: 'Licencia', ubicacion: 'Ubicacion'
}

const FIELD_ICONS: Record<string, string> = {
  titulo: '📖', subtitulo: '📝', autores: '👤',
  anio: '📅', mes_dia: '📆', editorial: '🏢',
  lugar: '📍', tipo_doc: '📂', edicion_vol: '🔢',
  palabras_clave: '🏷️', resumen: '📄', idioma: '🌍',
  paginas: '📃', formato: '📐', licencia: '⚖️', ubicacion: '🏛️'
}

const FIELD_ORDER = [
  'titulo', 'subtitulo', 'autores', 'anio', 'mes_dia', 'editorial',
  'lugar', 'tipo_doc', 'edicion_vol', 'palabras_clave', 'resumen',
  'idioma', 'paginas', 'formato', 'licencia', 'ubicacion'
]

function SourceBadge({ field, data }: { field: string; data: DocumentFields }) {
  const source = data[`${field}_fuente`] as string
  if (!source) return null
  if (source === 'enriquecimiento') {
    return <span className="badge badge-enriched flex items-center gap-1"><Globe className="w-2.5 h-2.5" />Online</span>
  }
  if (source === 'clasificacion_auto') {
    return <span className="badge badge-manual flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />Auto</span>
  }
  return <span className="badge badge-ocr flex items-center gap-1"><Cpu className="w-2.5 h-2.5" />OCR+IA</span>
}

export function ResultsPanel({ data, onValidate }: ResultsPanelProps) {
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({})
  const [validated, setValidated] = useState(false)

  const handleSave = () => {
    const corrections: Record<string, string> = {}
    Object.entries(editing).forEach(([k, v]) => {
      if (v !== String(data[k] ?? '')) corrections[k] = v
    })
    onValidate(data._id || 'new', corrections)
    setValidated(true)
  }

  const confidence = data._ocr_confidence ?? 0
  const enrichSources = data._enrichment_sources
    ? Object.entries(data._enrichment_sources).filter(([, v]) => v).map(([k]) => k)
    : []

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Confidence + Meta */}
      <div className="card flex items-center gap-6 flex-wrap">
        <ConfidenceRing value={confidence} size={110} strokeWidth={9} />
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-base font-semibold mb-2">Extraccion completada</h3>
          <div className="space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            <p>Motor OCR: <span className="font-medium" style={{ color: 'var(--text)' }}>{data._ocr_engine || 'N/A'}</span></p>
            <p>Fuentes online: <span className="font-medium" style={{ color: enrichSources.length ? 'var(--success)' : 'var(--text-dim)' }}>
              {enrichSources.length ? enrichSources.join(', ') : 'Ninguna'}
            </span></p>
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Campos extraidos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
          {FIELD_ORDER.map(field => {
            const value = editing[field] ?? String(data[field] ?? '')
            const isEdit = isEditing[field]
            const label = FIELD_LABELS[field] || field
            const icon = FIELD_ICONS[field] || '📌'

            return (
              <div key={field} className="field-card animate-fade-in-up">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <SourceBadge field={field} data={data} />
                  <button
                    onClick={() => setIsEditing(prev => ({ ...prev, [field]: !prev }))}
                    className="ml-auto p-1 rounded-md transition-colors hover:bg-[var(--surface-light)]"
                    title="Editar"
                  >
                    <Edit3 className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />
                  </button>
                </div>
                {isEdit ? (
                  <input
                    type="text"
                    value={editing[field] ?? value}
                    onChange={(e) => setEditing(prev => ({ ...prev, [field]: e.target.value }))}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm leading-relaxed" style={{ color: value ? 'var(--text)' : 'var(--text-dim)' }}>
                    {value || '—'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* OCR raw text (terminal style) */}
      {data._ocr_text && (
        <details className="card animate-fade-in">
          <summary className="cursor-pointer font-medium text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            📝 Texto OCR crudo
          </summary>
          <div className="terminal mt-3">
            {data._ocr_text}
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end animate-fade-in-up">
        <button className="btn-secondary flex items-center gap-2">
          <ExternalLink className="w-4 h-4" /> Buscar online
        </button>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={handleSave}
          disabled={validated}
        >
          {validated ? (
            <><Check className="w-4 h-4" /> Guardado</>
          ) : (
            <><Check className="w-4 h-4" /> Validar y guardar</>
          )}
        </button>
      </div>
    </div>
  )
}