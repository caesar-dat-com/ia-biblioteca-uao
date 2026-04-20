import { BookOpen, Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b animate-fade-in" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Catalog<span style={{ color: 'var(--accent)' }}>IA</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Agente de IA para Catalogacion
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-ocr">535212</span>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>UAO</span>
        </div>
      </div>
    </header>
  )
}