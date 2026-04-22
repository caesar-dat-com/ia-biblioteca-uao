import { useState } from 'react'
import { Check, ExternalLink, Terminal, ChevronDown } from 'lucide-react'
import type { DocumentFields } from '../App'
import { ConfidenceRing } from './ConfidenceRing'
import { FieldCard } from './FieldCard'

interface ResultsPanelProps {
  data: DocumentFields
  onValidate: (docId: string, corrections: Record<string, string>) => void
}

/* ── Field metadata ── */

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título', subtitulo: 'Subtítulo', autores: 'Autor(es)',
  anio: 'Año', mes_dia: 'Mes/Día', editorial: 'Editorial',
  lugar: 'Lugar', tipo_doc: 'Tipo', edicion_vol: 'Edición/Vol.',
  palabras_clave: 'Palabras clave', resumen: 'Resumen', idioma: 'Idioma',
  paginas: 'Páginas', formato: 'Formato', licencia: 'Licencia', ubicacion: 'Ubicación'
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

function getSourceInfo(field: string, data: DocumentFields) {
  const source = data[`${field}_fuente`] as string | undefined
  if (!source) return { source: 'ocr', label: 'OCR+IA' }
  if (source === 'enriquecimiento') return { source: 'enriquecimiento', label: 'Online' }
  if (source === 'clasificacion_auto') return { source: 'clasificacion_auto', label: 'Auto' }
  return { source: 'ocr', label: 'OCR+IA' }
}

/* ── Component ── */

export function ResultsPanel({ data, onValidate }: ResultsPanelProps) {
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({})
  const [validated, setValidated] = useState(false)
  const [ocrOpen, setOcrOpen] = useState(false)

  const handleSave = () => {
    const corrections: Record<string, string> = {}
    Object.entries(editing).forEach(([k, v]) => {
      const raw = data[k];
      const rawStr = raw === null || raw === undefined ? '' : String(raw);
      if (v !== rawStr) corrections[k] = v
    })
    onValidate(String(data.id ?? 'new'), corrections)
    setValidated(true)
  }

  const confidence = data.ocr_confidence ?? 0
  const enrichSources = data.enriched_from ?? []

  return (
    <div className="space-y-5 section-enter">
      {/* ── Confidence + Meta ── */}
      <div className="card flex items-center gap-6 flex-wrap">
        <ConfidenceRing value={confidence} size={110} strokeWidth={8} />
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Extracción completada
          </h3>
          <div className="space-y-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            <p>
              Motor OCR:{' '}
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                {data.ocr_engine || 'N/A'}
              </span>
            </p>
            <p>
              Fuentes online:{' '}
              <span
                className="font-medium"
                style={{ color: enrichSources.length ? 'var(--success)' : 'var(--text-dim)' }}
              >
                {enrichSources.length ? enrichSources.join(', ') : 'Ninguna'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Fields grid ── */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          Campos extraídos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
          {FIELD_ORDER.map((field) => {
            const { source, label: sourceLabel } = getSourceInfo(field, data)
            const fieldConf = data.confidence?.[field] ?? data.ocr_confidence ?? 0.5
            return (
              <FieldCard
                key={field}
                fieldKey={field}
                label={FIELD_LABELS[field] || field}
                icon={FIELD_ICONS[field] || '📌'}
                value={data[field] as string | null}
                source={source}
                sourceLabel={sourceLabel}
                confidence={fieldConf}
                isEditing={isEditing[field]}
                editValue={editing[field]}
                onToggleEdit={(f) => setIsEditing(prev => ({ ...prev, [f]: !prev }))}
                onEditChange={(f, v) => setEditing(prev => ({ ...prev, [f]: v }))}
              />
            )
          })}
        </div>
      </div>

      {/* ── OCR raw text (terminal style) ── */}
      {data.ocr_text && (
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
              {data.ocr_text}
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 justify-end animate-fade-in-up">
        <button className="btn-secondary flex items-center gap-2">
          <ExternalLink className="w-4 h-4" /> Buscar online
        </button>
        <button
          className="btn-primary"
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