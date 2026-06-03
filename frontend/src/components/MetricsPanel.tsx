import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Stats {
  total: number
  by_status: Record<string, number>
  by_tipo_doc: Record<string, number>
  by_idioma: Record<string, number>
  by_ocr_engine: Record<string, number>
  by_enrichment_source: Record<string, number>
  avg_ocr_confidence: number | null
  field_fill_rate: Record<string, number>
  avg_fields_per_doc: number
  validated_count: number
  confidence_distribution: Record<string, number>
  source_breakdown: Record<string, number>
  top_keywords: { kw: string; count: number }[]
}

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título', subtitulo: 'Subtítulo', autores: 'Autores',
  anio: 'Año', mes_dia: 'Mes/Día', editorial: 'Editorial',
  lugar: 'Lugar', tipo_doc: 'Tipo Doc.', edicion_vol: 'Edición/Vol.',
  palabras_clave: 'Palabras Clave', resumen: 'Resumen', idioma: 'Idioma',
  paginas: 'Páginas', formato: 'Formato', licencia: 'Licencia',
}

const TIPO_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']
const STATUS_COLORS: Record<string, string> = {
  validated: '#4ade80', enriched: '#60a5fa',
  extracting: '#facc15', uploaded: '#94a3b8', error: '#f87171',
}
const ENRICH_COLORS: Record<string, string> = {
  google_books: '#4285f4', open_library: '#ea4335', crossref: '#34a853', local: '#a259ff',
}
const ENRICH_LABELS: Record<string, string> = {
  google_books: 'Google Books', open_library: 'Open Library',
  crossref: 'Crossref', local: 'Biblioteca local',
}

/* ── Micro components ── */

function KPI({ label, value, sub, color = 'var(--accent)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '1rem 1.2rem' }}>
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function HBar({ label, value, max, color = '#6366f1', suffix = '' }: { label: string; value: number; max: number; color?: string; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 90, flexShrink: 0, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'var(--surface-light)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.7s ease', borderRadius: 6 }} />
        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: pct > 25 ? '#fff' : 'var(--text-muted)' }}>
          {value}{suffix}
        </span>
      </div>
    </div>
  )
}

function FillBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 75 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171'
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 80, textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--surface-light)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, color, width: 34, textAlign: 'right', fontFamily: 'monospace' }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 14 }}>{title}</h3>
      {children}
    </div>
  )
}

/* ── Main component ── */

export function MetricsPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/stats/')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStats(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>Cargando métricas...</div>
  if (error) return <div className="card text-center py-16" style={{ color: 'var(--error)' }}>Error: {error}</div>
  if (!stats || stats.total === 0) return (
    <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
      Sin datos aún. Cataloga documentos para ver métricas.
    </div>
  )

  const validationRate = ((stats.validated_count / stats.total) * 100).toFixed(0)
  const sortedFields = Object.entries(stats.field_fill_rate).sort(([, a], [, b]) => b - a)
  const sortedTypes = Object.entries(stats.by_tipo_doc).sort(([, a], [, b]) => b - a)
  const maxType = Math.max(...Object.values(stats.by_tipo_doc))
  const maxIdioma = Math.max(...Object.values(stats.by_idioma))
  const sortedIdioma = Object.entries(stats.by_idioma).sort(([, a], [, b]) => b - a)
  const sortedEnrich = Object.entries(stats.by_enrichment_source).sort(([, a], [, b]) => b - a)
  const maxEnrich = Math.max(...Object.values(stats.by_enrichment_source), 1)
  const confDist = stats.confidence_distribution
  const maxConfBucket = Math.max(...Object.values(confDist), 1)

  return (
    <div className="space-y-4 animate-fade-in-up">

      {/* Refresh */}
      <div className="flex justify-end">
        <button className="btn-secondary flex items-center gap-1.5" style={{ fontSize: 12, padding: '5px 12px' }} onClick={fetchStats}>
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Documentos" value={stats.total} sub="en el catálogo" />
        <KPI label="Validados" value={`${validationRate}%`} sub={`${stats.validated_count} de ${stats.total}`} color="#4ade80" />
        <KPI label="Confianza OCR" value={stats.avg_ocr_confidence !== null ? `${(stats.avg_ocr_confidence * 100).toFixed(0)}%` : '—'} sub="promedio del motor" color="#60a5fa" />
        <KPI label="Campos / Doc." value={`${stats.avg_fields_per_doc}/15`} sub="promedio extraídos" color="#a78bfa" />
      </div>

      {/* ── Row 1: Tipos + Idiomas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Tipo de documento">
          <div className="space-y-2">
            {sortedTypes.map(([tipo, count], i) => (
              <HBar key={tipo} label={tipo} value={count} max={maxType} color={TIPO_COLORS[i % TIPO_COLORS.length]} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Idioma">
          <div className="space-y-2">
            {sortedIdioma.slice(0, 6).map(([idioma, count]) => (
              <HBar key={idioma} label={idioma} value={count} max={maxIdioma} color="#0ea5e9" />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Row 2: Fuentes de datos + Distribución confianza ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Fuentes de enriquecimiento */}
        <SectionCard title="Fuentes de datos — enriquecimiento online">
          {sortedEnrich.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sin documentos enriquecidos aún</p>
          ) : (
            <div className="space-y-3">
              {sortedEnrich.map(([src, count]) => (
                <HBar
                  key={src}
                  label={ENRICH_LABELS[src] || src}
                  value={count}
                  max={maxEnrich}
                  color={ENRICH_COLORS[src] || '#a259ff'}
                  suffix=" docs"
                />
              ))}
              {/* Futura: Biblioteca local */}
              <div
                style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 8,
                  border: '1px dashed var(--border)', fontSize: 11,
                  color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ color: '#a259ff' }}>+</span>
                Biblioteca local — disponible al conectar fuente propia
              </div>
            </div>
          )}
        </SectionCard>

        {/* Distribución confianza OCR */}
        <SectionCard title="Distribución de confianza OCR">
          <div className="space-y-2">
            {Object.entries(confDist).map(([bucket, count]) => {
              const colors: Record<string, string> = {
                '0-25%': '#f87171', '25-50%': '#fb923c',
                '50-75%': '#facc15', '75-100%': '#4ade80',
              }
              return (
                <div key={bucket} className="flex items-center gap-2">
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 55, textAlign: 'right' }}>{bucket}</span>
                  <div style={{ flex: 1, height: 22, borderRadius: 6, background: 'var(--surface-light)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${maxConfBucket > 0 ? (count / maxConfBucket) * 100 : 0}%`, height: '100%', background: colors[bucket] || '#60a5fa', transition: 'width 0.7s ease' }} />
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: count / maxConfBucket > 0.3 ? '#000' : 'var(--text-muted)' }}>
                      {count} docs
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Motor OCR */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Motor OCR utilizado</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.by_ocr_engine).map(([engine, count]) => (
                <span key={engine} style={{ padding: '3px 10px', borderRadius: 20, background: '#0ea5e922', border: '1px solid #0ea5e955', fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                  {engine} · {count}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Row 3: Cobertura de campos ── */}
      <SectionCard title="Cobertura de campos (% de documentos con valor)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {sortedFields.map(([field, rate]) => (
            <FillBar key={field} label={FIELD_LABELS[field] || field} value={rate} />
          ))}
        </div>
      </SectionCard>

      {/* ── Row 4: Estado pipeline + Keywords ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Estado */}
        <SectionCard title="Estado del pipeline">
          <div className="space-y-2">
            {Object.entries(stats.by_status).sort(([, a], [, b]) => b - a).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] || '#94a3b8', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{status}</span>
                <div style={{ flex: 2, height: 6, borderRadius: 3, background: 'var(--surface-light)', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / stats.total) * 100}%`, height: '100%', background: STATUS_COLORS[status] || '#94a3b8', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', width: 20, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
          {/* Source breakdown */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Origen de los datos extraídos</p>
            <div className="flex gap-2">
              {Object.entries(stats.source_breakdown).map(([src, pct]) => (
                <div key={src} style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{src}</p>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-light)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: src === 'OCR+IA' ? '#60a5fa' : '#4ade80', transition: 'width 0.7s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: src === 'OCR+IA' ? '#60a5fa' : '#4ade80', marginTop: 2 }}>{pct}%</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Keywords */}
        <SectionCard title="Palabras clave más frecuentes">
          {stats.top_keywords.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sin palabras clave registradas aún</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.top_keywords.map(({ kw, count }, i) => {
                const size = 10 + Math.min(count * 2, 6)
                const opacity = 0.5 + (i / stats.top_keywords.length) * 0.5
                return (
                  <span
                    key={kw}
                    style={{
                      padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      fontSize: size, color: `rgba(165,180,252,${opacity})`,
                      fontWeight: count > 1 ? 600 : 400,
                    }}
                  >
                    {kw} {count > 1 && <span style={{ fontSize: 9, opacity: 0.7 }}>×{count}</span>}
                  </span>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Pipeline note ── */}
      <div style={{ background: '#1e1b4b33', border: '1px solid #4338ca33', borderRadius: 10, padding: '12px 16px', fontSize: 11, color: '#a5b4fc', lineHeight: 1.7 }}>
        <strong>Pipeline:</strong> Tesseract / PaddleOCR (OCR) →
        GLM-5.1 vía Ollama (extracción 16 campos, zero-shot) →
        Google Books · Open Library · Crossref (enriquecimiento en cascada) →
        <span style={{ color: '#a259ff' }}> Biblioteca local (próximamente)</span> →
        Validación humana (Human-in-the-Loop)
      </div>
    </div>
  )
}
