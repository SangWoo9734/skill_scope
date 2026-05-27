'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { StarChartPoint } from '@/lib/lifecycle'

interface TrendChartProps {
  data: StarChartPoint[]
  color?: string
  height?: number
}

export default function TrendChart({
  data,
  color = '#3b82f6',
  height = 200,
}: TrendChartProps) {
  if (data.length < 2) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-1.5 text-white/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18M7 16l4-4 4 4 4-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs">Snapshot data accumulates daily — check back tomorrow</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f1117',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
          }}
          formatter={(value) => [Number(value).toLocaleString(), 'Stars']}
        />
        <Area
          type="monotone"
          dataKey="stars"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
