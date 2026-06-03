import { useRef, useState, useCallback } from 'react'
import { Upload, FileImage, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { DocumentFields } from '../App'
import { ScanLive } from './ScanLive'

interface UploadZoneProps {
  onResult: (data: DocumentFields) => void
  onBatchDone?: () => void
  onLoading: (loading: boolean) => void
  onError: (error: string | null) => void
  loading: boolean
}

interface BatchItem { name: string; status: 'pending' | 'processing' | 'done' | 'error' }

export function UploadZone({ onResult, onBatchDone, onLoading, onError, loading }: UploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)
  const [streamDocId, setStreamDocId] = useState<string | null>(null)
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [batchCurrent, setBatchCurrent] = useState(0)

  const handleStreamError = useCallback((msg: string) => {
    setStreamDocId(null)
    onLoading(false)
    onError(msg)
  }, [onError, onLoading])

  const handleStreamComplete = useCallback((data: DocumentFields) => {
    setStreamDocId(null)
    onLoading(false)
    onResult(data)
  }, [onResult, onLoading])

  const uploadSingle = async (file: File): Promise<DocumentFields | null> => {
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await fetch('/api/catalog/upload', { method: 'POST', body: formData })
      const data = await res.json()
      return data.status === 'success' ? data.data : null
    } catch { return null }
  }

  const handleFiles = async (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'))
    if (images.length === 0) return
    onError(null)

    if (images.length === 1) {
      // SSE flow for single file
      onLoading(true)
      try {
        const formData = new FormData()
        formData.append('image', images[0])
        const res = await fetch('/api/catalog/upload-only', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.doc_id) {
          setStreamDocId(data.doc_id)
        } else {
          onLoading(false)
          onError('Error al subir la imagen')
        }
      } catch {
        onLoading(false)
        onError('Error de conexión con el servidor')
      }
      return
    }

    // Batch mode — sin SSE
    const items: BatchItem[] = images.map(f => ({ name: f.name, status: 'pending' }))
    setBatch(items)
    setBatchCurrent(0)
    onLoading(true)

    for (let i = 0; i < images.length; i++) {
      setBatchCurrent(i + 1)
      setBatch(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'processing' } : it))
      const result = await uploadSingle(images[i])
      setBatch(prev => prev.map((it, idx) => idx === i ? { ...it, status: result ? 'done' : 'error' } : it))
    }

    onLoading(false)
    setBatch([])
    setBatchCurrent(0)
    onBatchDone?.()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragover(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const isBatch = batch.length > 0
  const isStreaming = !!streamDocId

  return (
    <div
      className={`upload-zone flex flex-col items-center justify-center ${isStreaming ? 'py-6' : 'py-16'} px-8 ${dragover ? 'dragover' : ''}`}
      style={{ borderRadius: 18, minHeight: 260 }}
      onDragOver={(e) => { e.preventDefault(); if (!loading) setDragover(true) }}
      onDragLeave={() => setDragover(false)}
      onDrop={handleDrop}
      onClick={() => !loading && !isStreaming && fileRef.current?.click()}
    >
      <div
        style={{
          position: 'absolute', inset: 16, borderRadius: 12, pointerEvents: 'none',
          border: '1.5px dashed',
          borderColor: dragover ? 'var(--cyan)' : isStreaming ? 'var(--primary)' : 'var(--border-glow)',
          transition: 'border-color 0.3s ease',
        }}
      />

      {/* SSE live scan */}
      {isStreaming && (
        <div className="w-full relative z-10">
          <ScanLive
            docId={streamDocId!}
            onComplete={handleStreamComplete}
            onError={handleStreamError}
          />
        </div>
      )}

      {/* Batch progress */}
      {!isStreaming && loading && isBatch && (
        <div className="flex flex-col items-center gap-4 relative z-10 w-full max-w-xs animate-fade-in">
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Procesando {batchCurrent} de {batch.length}
          </p>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(batchCurrent / batch.length) * 100}%`, background: 'var(--primary)' }}
            />
          </div>
          <div className="w-full space-y-1.5 max-h-40 overflow-y-auto">
            {batch.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--success)' }} />}
                {item.status === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--error)' }} />}
                {item.status === 'processing' && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin-slow" style={{ color: 'var(--primary)' }} />}
                {item.status === 'pending' && <div className="w-3.5 h-3.5 shrink-0 rounded-full" style={{ background: 'var(--border)' }} />}
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idle state */}
      {!isStreaming && !loading && (
        <div className="flex flex-col items-center gap-6 animate-fade-in-up relative z-10">
          <div className="flex gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: 'var(--primary-glow-sm)', border: '1px solid var(--border-glow)' }}
            >
              <Upload className="w-8 h-8" style={{ color: 'var(--primary-light)' }} />
            </div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: 'var(--accent-glow)', border: '1px solid #A259FF30' }}
            >
              <FileImage className="w-8 h-8" style={{ color: 'var(--accent-light)' }} />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Sube una o varias portadas
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              PNG, JPG, WEBP — múltiples archivos permitidos
            </p>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleChange} className="hidden" />
    </div>
  )
}
