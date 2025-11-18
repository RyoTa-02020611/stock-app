/**
 * Chart Pin Component
 * Represents a buy/sell point on the chart
 */

export interface ChartPin {
  id: string
  date: string // ISO date string matching chart data
  price: number
  side: 'BUY' | 'SELL'
  quantity?: number
  notes?: string
  createdAt: string
}

export interface ChartPinProps {
  pin: ChartPin
  x: number
  y: number
  onClick?: (pin: ChartPin) => void
  onDelete?: (pinId: string) => void
}

export default function ChartPinMarker({ pin, x, y, onClick, onDelete }: ChartPinProps) {
  const isBuy = pin.side === 'BUY'
  const color = isBuy ? '#34D399' : '#F87171'
  const icon = isBuy ? '▲' : '▼'

  return (
    <g>
      {/* Pin marker */}
      <circle
        cx={x}
        cy={y}
        r={8}
        fill={color}
        stroke="#1F2937"
        strokeWidth={2}
        className="cursor-pointer hover:r-10 transition-all"
        onClick={() => onClick?.(pin)}
      />
      {/* Icon */}
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="bold"
        pointerEvents="none"
      >
        {icon}
      </text>
      {/* Tooltip on hover */}
      <title>
        {pin.side === 'BUY' ? '買い' : '売り'} - {pin.price.toFixed(2)}
        {pin.quantity && ` (${pin.quantity}株)`}
        {pin.notes && ` - ${pin.notes}`}
      </title>
    </g>
  )
}

