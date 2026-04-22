import { Edit3, Check } from 'lucide-react'

interface FieldCardProps {
  fieldKey: string
  label: string
  icon: string
  value: string | null
  source: string
  sourceLabel: string
  confidence?: number
  isEditing?: boolean
  editValue?: string
  onToggleEdit?: (field: string) => void
  onEditChange?: (field: string, value: string) => void
}

/** Confidence-based CSS class for the left border accent */
function confClass(confidence?: number): string {
  if (confidence === undefined) return ''
  if (confidence > 0.7) return 'conf-high'
  if (confidence > 0.4) return 'conf-medium'
  return 'conf-low'
}

/** Source badge config */
const SOURCE_STYLES: Record<string, { bg: string; text: string }> = {
  ocr:                  { bg: 'var(--info-bg)',     text: 'var(--info)' },
  enriquecimiento:      { bg: 'var(--success-bg)',  text: 'var(--success)' },
  clasificacion_auto:   { bg: 'var(--warning-bg)',  text: 'var(--warning)' },
}

const SOURCE_ICONS: Record<string, string> = {
  ocr: '🤖',
  enriquecimiento: '🌐',
  clasificacion_auto: '✨',
}

export function FieldCard({
  fieldKey,
  label,
  icon,
  value,
  source,
  sourceLabel,
  confidence,
  isEditing = false,
  editValue,
  onToggleEdit,
  onEditChange,
}: FieldCardProps) {
  const displayValue = editValue ?? value ?? ''
  const hasValue = !!value
  const srcStyle = SOURCE_STYLES[source] ?? SOURCE_STYLES.ocr
  const srcIcon = SOURCE_ICONS[source] ?? '🤖'

  return (
    <div className={`field-card animate-fade-in-up ${confClass(confidence)}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm leading-none">{icon}</span>
        <span className="text-[0.68rem] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>

        {sourceLabel && (
          <span
            className="badge"
            style={{ background: srcStyle.bg, color: srcStyle.text }}
          >
            {srcIcon} {sourceLabel}
          </span>
        )}

        {confidence !== undefined && (
          <span className="ml-auto text-[0.65rem] font-mono tabular-nums" style={{ color: 'var(--text-dim)' }}>
            {Math.round(confidence * 100)}%
          </span>
        )}

        {onToggleEdit && (
          <button
            onClick={() => onToggleEdit(fieldKey)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-[var(--surface-light)]"
            title={isEditing ? 'Confirmar' : 'Editar'}
            style={{ opacity: isEditing ? 1 : undefined }}
          >
            {isEditing
              ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
              : <Edit3 className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
            }
          </button>
        )}
      </div>

      {/* Value or edit input */}
      {isEditing ? (
        <input
          type="text"
          value={editValue ?? displayValue}
          onChange={(e) => onEditChange?.(fieldKey, e.target.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') onToggleEdit?.(fieldKey) }}
        />
      ) : (
        <span
          className="text-sm leading-relaxed"
          style={{ color: hasValue ? 'var(--text)' : 'var(--text-dim)' }}
        >
          {hasValue ? displayValue : '—'}
        </span>
      )}
    </div>
  )
}