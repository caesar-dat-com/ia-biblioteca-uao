import { useEffect, useState } from 'react'

interface Stats {
  total: number
  by_status: Record<string, number>
  by_tipo_doc: Record<string, number>
  by_idioma: Record<string, number>
  by_ocr_engine: Record<string, number>
  avg_ocr_confidence: number | null
  field_fill_rate: Record<string, number>
  avg_fields_per_doc: number
  validated_count: number
}

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  autores: 'Autores',
  anio: 'Año',
  mes_dia: 'Mes/Día',
  editorial: 'Editorial',
  lugar: 'Lugar',
  tipo_doc: 'Tipo Doc.',
  edicion_vol: 'Edición/Vol.',
  palabras_clave: 'Palabras Clave',
  resumen: 'Resumen',
  idioma: 'Idioma',
  paginas: 'Páginas',
  formato: 'Formato',
  licencia: 'Licencia',
}

const STATUS_COLORS: Record<string, string> = {
  validated: '#4ade80',
  enriched: '#60a5fa',
  extracting: '#facc15',
  uploaded: '#94a3b8',
  error: '#f87171',
}

function FillBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: pct >= 80 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171',
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36 }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 28, fontWeight: 700, color: accent || 'var(--accent)', lineHeight: 1.1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}

export function MetricsPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stats/')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStats(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        Cargando métricas…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--error)' }}>
        Error: {error}
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        Sin datos aún. Cataloga documentos para ver métricas.
      </div>
    )
  }

  const validationRate = stats.total > 0
    ? ((stats.validated_count / stats.total) * 100).toFixed(0)
    : '0'

  const sortedFields = Object.entries(stats.field_fill_rate).sort(([, a], [, b]) => b - a)
  const sortedTypes = Object.entries(stats.by_tipo_doc).sort(([, a], [, b]) => b - a)
  const sortedStatus = Object.entries(stats.by_status).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={fetchStats}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ↻ Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Documentos" value={stats.total} sub="catalogados en total" />
        <StatCard
          label="Validados"
          value={`${validationRate}%`}
          sub={`${stats.validated_count} de ${stats.total}`}
          accent="#4ade80"
        />
        <StatCard
          label="Confianza OCR"
          value={stats.avg_ocr_confidence !== null ? `${(stats.avg_ocr_confidence * 100).toFixed(0)}%` : '—'}
          sub="promedio del motor"
          accent="#60a5fa"
        />
        <StatCard
          label="Campos / Doc."
          value={stats.avg_fields_per_doc}
          sub="promedio extraídos"
          accent="#a78bfa"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fill rate por campo */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
            Cobertura de campos (% docs con valor)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedFields.map(([field, rate]) => (
              <div key={field}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {FIELD_LABELS[field] || field}
                  </span>
                </div>
                <FillBar value={rate} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Por tipo doc */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 20,
              flex: 1,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
              Por tipo de documento
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedTypes.map(([tipo, count]) => (
                <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 28,
                      borderRadius: 6,
                      background: 'var(--border)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: `${(count / stats.total) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        transition: 'width 0.6s ease',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#fff',
                      }}
                    >
                      {tipo}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 20 }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Por estado */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 20,
              flex: 1,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
              Estado del pipeline
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sortedStatus.map(([status, count]) => (
                <div
                  key={status}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: (STATUS_COLORS[status] || '#94a3b8') + '22',
                    border: `1px solid ${STATUS_COLORS[status] || '#94a3b8'}55`,
                    fontSize: 12,
                    color: STATUS_COLORS[status] || '#94a3b8',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: STATUS_COLORS[status] || '#94a3b8',
                      display: 'inline-block',
                    }}
                  />
                  {status} · {count}
                </div>
              ))}
            </div>

            {/* Motor OCR */}
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Motor OCR</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(stats.by_ocr_engine).map(([engine, count]) => (
                  <div
                    key={engine}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: '#0ea5e922',
                      border: '1px solid #0ea5e955',
                      fontSize: 12,
                      color: '#38bdf8',
                      fontWeight: 600,
                    }}
                  >
                    {engine} · {count}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nota técnica */}
      <div
        style={{
          background: '#1e1b4b33',
          border: '1px solid #4338ca33',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 12,
          color: '#a5b4fc',
          lineHeight: 1.6,
        }}
      >
        <strong>Pipeline IA:</strong> PaddleOCR (detección + reconocimiento de texto) →{' '}
        GLM-5.1 via Ollama (extracción estructurada de 16 campos) →{' '}
        Google Books / Open Library (enriquecimiento) → Validación humana
      </div>
    </div>
  )
}
