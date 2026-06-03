import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { ConfidenceRing } from './ConfidenceRing'
import type { DocumentFields } from '../App'

interface ScanLiveProps {
  docId: string
  onComplete: (data: DocumentFields) => void
  onError: (msg: string) => void
}

type Step = 'waiting' | 'active' | 'done' | 'error'

interface FieldChip { field: string; confidence: number }

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título', subtitulo: 'Subtítulo', autores: 'Autores',
  anio: 'Año', mes_dia: 'Mes/Día', editorial: 'Editorial',
  lugar: 'Lugar', tipo_doc: 'Tipo', edicion_vol: 'Edición',
  palabras_clave: 'Palabras clave', resumen: 'Resumen', idioma: 'Idioma',
  paginas: 'Páginas', formato: 'Formato', licencia: 'Licencia',
}

function confColor(c: number) {
  if (c > 0.7) return 'var(--success)'
  if (c > 0.4) return 'var(--warning)'
  return 'var(--error)'
}

function StepRow({ label, step, children }: { label: string; step: Step; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {step === 'done' && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--success)' }} />}
        {step === 'active' && <Loader2 className="w-5 h-5 shrink-0 animate-spin-slow" style={{ color: 'var(--primary)' }} />}
        {step === 'waiting' && <div className="w-5 h-5 shrink-0 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />}
        {step === 'error' && <AlertCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--error)' }} />}
        <span
          className="text-sm font-semibold"
          style={{ color: step === 'waiting' ? 'var(--text-dim)' : 'var(--text)' }}
        >
          {label}
        </span>
      </div>
      {children && step !== 'waiting' && (
        <div className="ml-8">{children}</div>
      )}
    </div>
  )
}

export function ScanLive({ docId, onComplete, onError }: ScanLiveProps) {
  const [ocrStep, setOcrStep] = useState<Step>('waiting')
  const [llmStep, setLlmStep] = useState<Step>('waiting')
  const [enrichStep, setEnrichStep] = useState<Step>('waiting')

  const [ocrConf, setOcrConf] = useState<number>(0)
  const [ocrEngine, setOcrEngine] = useState<string>('')
  const [ocrChars, setOcrChars] = useState<number>(0)

  const [fields, setFields] = useState<FieldChip[]>([])
  const [fieldsFound, setFieldsFound] = useState<number>(0)

  const [sources, setSources] = useState<string[]>([])

  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(`/api/catalog/stream/${docId}`)
    esRef.current = es

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      switch (msg.event) {
        case 'ocr_start':
          setOcrStep('active')
          break
        case 'ocr_done':
          setOcrStep('done')
          setOcrConf(msg.confidence)
          setOcrEngine(msg.engine)
          setOcrChars(msg.chars)
          break
        case 'llm_start':
          setLlmStep('active')
          break
        case 'field_found':
          setFields(prev => [...prev, { field: msg.field, confidence: msg.confidence }])
          break
        case 'llm_done':
          setLlmStep('done')
          setFieldsFound(msg.fields_found)
          break
        case 'enrich_start':
          setEnrichStep('active')
          break
        case 'enrich_done':
          setEnrichStep('done')
          setSources(msg.sources || [])
          break
        case 'complete':
          esRef.current?.close()
          onComplete(msg.data)
          break
        case 'error':
          esRef.current?.close()
          onError(msg.message)
          break
      }
    }

    es.onerror = () => {
      esRef.current?.close()
      onError('Error de conexión con el pipeline')
    }

    return () => { esRef.current?.close() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId])

  const totalFields = 15
  const progress = Math.round((fields.length / totalFields) * 100)

  return (
    <div className="space-y-6 animate-fade-in-up p-6">
      {/* Progress bar global */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>
          <span>Pipeline en progreso</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--cyan))' }}
          />
        </div>
      </div>

      {/* Paso 1: OCR */}
      <StepRow label="01 · OCR — Extracción de texto" step={ocrStep}>
        <div className="flex items-center gap-4 flex-wrap">
          <ConfidenceRing value={ocrConf} size={72} strokeWidth={5} />
          <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
            <p>Motor: <span style={{ color: 'var(--text)' }}>{ocrEngine}</span></p>
            <p>Caracteres: <span style={{ color: 'var(--text)' }}>{ocrChars}</span></p>
          </div>
        </div>
      </StepRow>

      {/* Paso 2: LLM */}
      <StepRow label="02 · IA — Identificación de campos" step={llmStep}>
        <div className="space-y-2">
          {llmStep === 'done' && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              {fieldsFound} de {totalFields} campos identificados
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {fields.map((f, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium animate-fade-in-up"
                style={{
                  background: `${confColor(f.confidence)}22`,
                  border: `1px solid ${confColor(f.confidence)}44`,
                  color: confColor(f.confidence),
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                {FIELD_LABELS[f.field] || f.field} · {Math.round(f.confidence * 100)}%
              </span>
            ))}
          </div>
        </div>
      </StepRow>

      {/* Paso 3: Enriquecimiento */}
      <StepRow label="03 · APIs — Enriquecimiento online" step={enrichStep}>
        <div className="flex flex-wrap gap-2">
          {sources.length === 0 && enrichStep === 'done' && (
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Sin fuentes externas</span>
          )}
          {sources.map((s, i) => (
            <span
              key={i}
              className="px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium animate-fade-in-up"
              style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #34d39922' }}
            >
              🌐 {s.replace('_', ' ')}
            </span>
          ))}
        </div>
      </StepRow>
    </div>
  )
}
