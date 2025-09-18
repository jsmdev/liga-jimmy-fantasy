import { useMemo } from 'react'

export default function ParticipantLineChart({ rows = [], height = 220, width = 680 }) {
  // rows: [{ jornada, rank_adjusted }]
  const padding = 24
  const H = height - padding * 2
  const W = width - padding * 2

  const jornadas = rows.map(r => r.jornada)
  const minJ = jornadas.length ? Math.min(...jornadas) : 1
  const maxJ = jornadas.length ? Math.max(...jornadas) : 38
  const maxRank = rows.length ? Math.max(...rows.map(r => r.rank_adjusted)) : 10

  const points = useMemo(() => {
    if (!rows.length) return []
    return rows.map(r => {
      const x = padding + ((r.jornada - minJ) / (maxJ - minJ || 1)) * W
      // Invertimos Y: rank=1 arriba
      const y = padding + ((r.rank_adjusted - 1) / (maxRank - 1 || 1)) * H
      return `${x},${y}`
    })
  }, [rows, H, W, padding, minJ, maxJ, maxRank])

  return (
    <div className="rounded-2xl border p-3">
      <svg width={width} height={height}>
        {/* ejes simples */}
        <line x1={padding} y1={padding} x2={padding} y2={padding + H} stroke="currentColor" opacity="0.3" />
        <line x1={padding} y1={padding + H} x2={padding + W} y2={padding + H} stroke="currentColor" opacity="0.3" />
        {/* polyline */}
        {points.length > 1 && (
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}
        {/* puntos */}
        {points.map((p, i) => {
          const [x, y] = p.split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r="3" fill="currentColor" />
        })}
        {/* etiquetas mínimas */}
        <text x={padding} y={padding - 6} fontSize="10">1º</text>
        <text x={padding} y={padding + H + 12} fontSize="10">{maxRank}º</text>
        <text x={padding} y={height - 4} fontSize="10">{minJ}</text>
        <text x={padding + W - 10} y={height - 4} fontSize="10">{maxJ}</text>
      </svg>
    </div>
  )
}