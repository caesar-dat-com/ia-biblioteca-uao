import { Edit3, Check } from 'lucide-react'
import { useState } from 'react'

interface FieldCardProps {
  fieldKey: string
  label: string
  value: string | null
  source: string
  sourceLabel: string
  confidence?: number
  isEditing?: boolean
  editValue?: string
  onToggleEdit?: (field: string) => void
  onEditChange?: (field: string, value: string) => void
  index?: number
}

export function FieldCard({
  fieldKey,
  label,
  value,
  source,
  sourceLabel,
  confidence,
  isEditing = false,
  editValue,
  onToggleEdit,
  onEditChange,
  index = 0,
}: FieldCardProps) {
  const displayValue = editValue ?? value ?? ''
  const hasValue = !!value

  // Source badge colors
  const sourceStyles: Record<string, { bg: string; text: string }> = {
    ocr: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' },
    enriquecimiento: { bg: 'rgba(16,185,129,0.15)', text: '#34D399' },
    clasificacion_auto: { bg: 'rgba(251,191,36,0.15)', text: '#FBBF24' },
  }
  const srcStyle = sourceStyles[source] || sourceStyles.ocr

  // Confidence border color
  const borderColor =
    confidence !== undefined
      ? confidence > 0.7
        ? 'rgba(52,211,153,0.3)'
        : confidence > 0.4
          ? 'rgba(251,191,36,0.3)'
          : 'rgba(248,113,113,0.3)'
      : 'var(--color-surface-light)'

  return (
    <div
      className="field-card group relative flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-300"
      style={{
        background: 'var(--color-surface)',
        borderLeft: `3px solid ${borderColor}`,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
        {sourceLabel && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{ background: srcStyle.bg, color: srcStyle.text }}
          >
            {sourceLabel}
          </span>
        )}
        {confidence !== undefined && (
          <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
            {Math.round(confidence * 100)}%
          </span>
        )}
        {onToggleEdit && (
          <button
            onClick={() => onToggleEdit(fieldKey)}
            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded hover:bg-[var(--color-surface-light)]"
            title="Editar"
          >
            {isEditing ? (
              <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
            ) : (
              <Edit3 className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
            )}
          </button>
        )}
      </div>

      {/* Value */}
      {isEditing ? (
        <input
          type="text"
          value={editValue ?? displayValue}
          onChange={(e) => onEditChange?.(fieldKey, e.target.value)}
          className="w-full px-2 py-1 rounded-md text-sm field-edit-input"
          autoFocus
        />
      ) : (
        <span
          className="text-sm leading-snug"
          style={{ color: hasValue ? 'var(--color-text)' : 'var(--color-text-muted)' }}
        >
          {hasValue ? displayValue : '—'}
        </span>
      )}
    </div>
  )
}