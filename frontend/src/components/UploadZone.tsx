import { useRef, useState } from 'react'
import { Upload, Loader2, Camera, FileImage } from 'lucide-react'
import type { DocumentFields } from '../App'

interface UploadZoneProps {
  onResult: (data: DocumentFields) => void
  onLoading: (loading: boolean) => void
  onError: (error: string | null) => void
  loading: boolean
}

export function UploadZone({ onResult, onLoading, onError, loading }: UploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)

  const handleUpload = async (file: File) => {
    onLoading(true)
    onError(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/catalog/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.status === 'success') {
        onResult(data.data)
      } else {
        onError(data.detail || 'Error al procesar la imagen')
      }
    } catch {
      onError('Error de conexión con el servidor')
    } finally {
      onLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div
      className={`upload-zone flex flex-col items-center justify-center py-20 px-8 rounded-[20px] ${
        dragover ? 'dragover' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
      onDragLeave={() => setDragover(false)}
      onDrop={handleDrop}
      onClick={() => !loading && fileRef.current?.click()}
    >
      {/* Animated dashed border — rendered via CSS background */}
      <div
        className="upload-border"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          pointerEvents: 'none',
          border: '2px dashed',
          borderColor: dragover ? 'var(--accent)' : 'var(--border)',
          animation: 'pulse-glow 2.5s ease-in-out infinite',
          transition: 'border-color 0.3s ease',
        }}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-5 animate-fade-in relative z-10">
          <div className="relative">
            <Loader2 className="w-20 h-20 animate-spin-slow" style={{ color: 'var(--primary)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Procesando portada...
            </p>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
              OCR · Extracción IA · Enriquecimiento online
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {['OCR', 'IA', 'Online'].map((step, i) => (
                <span
                  key={step}
                  className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold"
                  style={{
                    background: 'var(--surface-light)',
                    color: 'var(--text-muted)',
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 animate-fade-in-up relative z-10">
          {/* Icon pair */}
          <div className="flex gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: 'rgba(42, 125, 110, 0.12)',
                border: '1px solid rgba(42, 125, 110, 0.25)',
              }}
            >
              <Upload className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            </div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: 'rgba(196, 149, 106, 0.12)',
                border: '1px solid rgba(196, 149, 106, 0.25)',
              }}
            >
              <FileImage className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ color: 'var(--text)' }}
            >
              Sube una portada
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              PNG, JPG, WEBP — máx 10MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}