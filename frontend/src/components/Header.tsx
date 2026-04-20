export function Header() {
  return (
    <header className="border-b" style={{ borderColor: 'var(--color-surface-light)', background: 'var(--color-surface)' }}>
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
               style={{ background: 'var(--color-primary)' }}>
            📚
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              CatalogIA
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Agente de IA para Catalogación Empresarial
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-ocr">535212</span>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>UAO</span>
        </div>
      </div>
    </header>
  )
}