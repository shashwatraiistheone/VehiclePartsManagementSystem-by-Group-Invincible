type BarChartProps = {
  labels: string[]
  values: number[]
  color?: string
  height?: number
}

export function SimpleBarChart({ labels, values, color = '#2563eb', height = 160 }: BarChartProps) {
  const max = Math.max(...values, 1)
  const w = 100 / values.length

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" style={{ height }}>
      {values.map((v, i) => {
        const barH = (v / max) * 78
        const x = i * w + w * 0.15
        const bw = w * 0.7
        return (
          <g key={labels[i]}>
            <rect
              x={x}
              y={88 - barH}
              width={bw}
              height={barH}
              rx={1.2}
              fill={color}
              opacity={0.85}
              className="transition-all duration-700 ease-out"
            />
          </g>
        )
      })}
    </svg>
  )
}

type LineChartProps = {
  labels: string[]
  values: number[]
  color?: string
  height?: number
}

export function SimpleLineChart({ labels, values, color = '#2563eb', height = 160 }: LineChartProps) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100
      const y = 92 - ((v - min) / range) * 72
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div style={{ height }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-700"
        />
        <polygon
          fill={color}
          fillOpacity={0.12}
          points={`0,92 ${points} 100,92`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">
        {labels.filter((_, i) => i % 2 === 0).map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  )
}
