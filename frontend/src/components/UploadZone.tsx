import { useRef, useState } from 'react'
import { Upload, Camera, Loader2, ImagePlus } from 'lucide-react'
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
      onError('Error de conexion con el servidor')
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
      className={`upload-zone flex flex-col items-center justify-center py-20 px-8 ${
        dragover ? 'dragover' : ''
      } ${loading ? '' : 'animate-pulse-border'}`}
      onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
      onDragLeave={() => setDragover(false)}
      onDrop={handleDrop}
      onClick={() => !loading && fileRef.current?.click()}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-5 animate-fade-in relative z-10">
          <div className="relative">
            <Loader2 className="w-20 h-20 animate-spin-slow" style={{ color: 'var(--primary)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Procesando portada...</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              OCR · Extraccion IA · Enriquecimiento online
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 animate-fade-in-up relative z-10">
          <div className="flex gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--primary)20', border: '1px solid var(--primary)40' }}
            >
              <Upload className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            </div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent)20', border: '1px solid var(--accent)40' }}
            >
              <ImagePlus className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Sube una portada</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Arrastra una imagen aqui o haz clic para seleccionar
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              PNG, JPG, WEBP — max 10MB
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