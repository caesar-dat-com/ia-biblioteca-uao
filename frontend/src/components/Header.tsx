import { BookOpen, Cpu } from 'lucide-react'

export function Header() {
  return (
    <header
      className="border-b animate-slide-down sticky top-0 z-50"
      style={{
        borderColor: 'var(--border)',
        background: 'rgba(7, 10, 18, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 1px 0 var(--border-light), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              boxShadow: '0 0 20px var(--primary-glow), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight leading-none"
              style={{
                background: 'linear-gradient(135deg, var(--text) 40%, var(--primary-light))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Catalog<span style={{ WebkitTextFillColor: 'var(--accent-light)' }}>IA</span>
            </h1>
            <p className="text-[0.68rem] font-medium mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Agente de IA · Catalogación Empresarial
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-float"
              style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}
            />
            <span className="text-[0.68rem] font-medium" style={{ color: 'var(--text-dim)' }}>
              live
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'var(--surface-light)',
              border: '1px solid var(--border)',
            }}
          >
            <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--primary-light)' }} />
            <span className="text-[0.7rem] font-semibold" style={{ color: 'var(--text-muted)' }}>
              IA 535212 · UAO
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
