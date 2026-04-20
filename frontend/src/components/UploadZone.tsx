import { useRef } from 'react'
import { Upload, Camera, Loader2 } from 'lucide-react'
import type { DocumentFields } from '../App'

interface UploadZoneProps {
  onResult: (data: DocumentFields) => void
  onLoading: (loading: boolean) => void
  onError: (error: string | null) => void
  loading: boolean
}

export function UploadZone({ onResult, onLoading, onError, loading }: UploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null)

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
    } catch (err) {
      onError('Error de conexión con el servidor')
    } finally {
      onLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
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
      className="card flex flex-col items-center justify-center py-16 cursor-pointer transition-all hover:border-[var(--color-primary)]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p className="text-lg font-medium">Procesando portada...</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            OCR → Extracción IA → Enriquecimiento online
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <Upload className="w-12 h-12" style={{ color: 'var(--color-primary)' }} />
            <Camera className="w-12 h-12" style={{ color: 'var(--color-secondary)' }} />
          </div>
          <h2 className="text-xl font-semibold">Sube una portada</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Arrastra una imagen o haz clic para seleccionar
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            PNG, JPG, WEBP — máx 10MB
          </p>
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