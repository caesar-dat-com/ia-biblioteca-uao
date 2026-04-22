import { BookOpen, Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header
      className="border-b animate-fade-in sticky top-0 z-50"
      style={{
        borderColor: 'var(--border)',
        background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              boxShadow: '0 4px 14px var(--primary-glow)',
            }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none" style={{ color: 'var(--text)' }}>
              Catalog<span style={{ color: 'var(--accent)' }}>IA</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <p className="text-[0.7rem] font-medium" style={{ color: 'var(--text-muted)' }}>
                Agente de IA para Catalogación Empresarial
              </p>
            </div>
          </div>
        </div>

        {/* Right side badge */}
        <div className="flex items-center gap-2">
          <span className="badge badge-ocr">IA 535212</span>
          <span className="text-[0.7rem] font-medium" style={{ color: 'var(--text-dim)' }}>UAO</span>
        </div>
      </div>
    </header>
  )
}