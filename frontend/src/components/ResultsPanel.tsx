import { useState } from 'react'
import { Check, ExternalLink, Terminal, ChevronDown } from 'lucide-react'
import type { DocumentFields } from '../App'
import { ConfidenceRing } from './ConfidenceRing'
import { FieldCard } from './FieldCard'

/* ── Confidence bar chart ── */
function ConfidenceChart({ data }: { data: DocumentFields }) {
  const fields = [
    'titulo', 'subtitulo', 'autores', 'anio', 'editorial',
    'lugar', 'tipo_doc', 'palabras_clave', 'resumen', 'idioma',
    'paginas', 'formato', 'licencia', 'mes_dia', 'edicion_vol',
  ]
  const labels: Record<string, string> = {
    titulo: 'Título', subtitulo: 'Subtítulo', autores: 'Autores', anio: 'Año',
    editorial: 'Editorial', lugar: 'Lugar', tipo_doc: 'Tipo', palabras_clave: 'P. clave',
    resumen: 'Resumen', idioma: 'Idioma', paginas: 'Páginas', formato: 'Formato',
    licencia: 'Licencia', mes_dia: 'Mes/Día', edicion_vol: 'Edición',
  }
  const sourceLabel: Record<string, { label: string; color: string }> = {
    ocr_ia: { label: 'OCR+IA', color: 'var(--info)' },
    enriquecimiento: { label: 'Online', color: 'var(--success)' },
  }

  const ocr = data.ocr_confidence ?? 0.5

  const countBySource: Record<string, number> = {}
  fields.forEach(f => {
    const src = (data[`${f}_fuente`] as string) || 'ocr_ia'
    countBySource[src] = (countBySource[src] || 0) + 1
  })

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Confianza por campo
        </h3>
        <div className="flex gap-3 text-xs">
          {Object.entries(countBySource).map(([src, count]) => (
            <span key={src} className="flex items-center gap-1.5" style={{ color: sourceLabel[src]?.color || 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: sourceLabel[src]?.color || 'var(--text-muted)' }} />
              {sourceLabel[src]?.label || src}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {fields.map((field, i) => {
          const conf = (data.confidence?.[field] ?? ocr)
          const pct = Math.round(conf * 100)
          const hasVal = !!data[field]
          const src = (data[`${field}_fuente`] as string) || 'ocr_ia'
          const color = conf > 0.7 ? 'var(--success)' : conf > 0.4 ? 'var(--warning)' : 'var(--error)'

          return (
            <div key={field} className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <span className="text-[0.7rem] w-20 shrink-0 text-right" style={{ color: 'var(--text-muted)' }}>
                {labels[field]}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: hasVal ? `${pct}%` : '4%',
                    background: hasVal ? color : 'var(--border)',
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              </div>
              <span className="text-[0.65rem] w-8 font-mono tabular-nums" style={{ color: hasVal ? color : 'var(--text-dim)' }}>
                {hasVal ? `${pct}%` : '—'}
              </span>
              <span
                className="text-[0.6rem] w-12 text-center rounded-full px-1"
                style={{ background: `${sourceLabel[src]?.color || 'var(--text-dim)'}22`, color: sourceLabel[src]?.color || 'var(--text-dim)' }}
              >
                {sourceLabel[src]?.label || src}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
                onToggleEdit={(f) => setIsEditing(prev => ({ ...prev, [f]: !prev[f] }))}
                onEditChange={(f, v) => setEditing(prev => ({ ...prev, [f]: v }))}
              />
            )
          })}
        </div>
      </div>

      {/* ── Confidence chart ── */}
      <ConfidenceChart data={data} />

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