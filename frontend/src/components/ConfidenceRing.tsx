interface ConfidenceRingProps {
  value: number // 0 to 1
  size?: number
  strokeWidth?: number
}

export function ConfidenceRing({ value, size = 110, strokeWidth = 8 }: ConfidenceRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - value * circumference
  const pct = Math.round(value * 100)

  const color =
    pct > 70 ? 'var(--success)' :
    pct > 40 ? 'var(--warning)' :
    'var(--error)'

  return (
    <div className="confidence-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-light)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="confidence-ring-fill"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div className="label">
        <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
        <span className="text-[0.65rem] font-medium" style={{ color: 'var(--text-dim)' }}>
          confianza
        </span>
      </div>
    </div>
  )
}