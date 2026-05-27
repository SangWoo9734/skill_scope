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
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { StarChartPoint } from '@/lib/lifecycle'

interface TrendChartProps {
  data: StarChartPoint[]
  color?: string
  height?: number
}

function useChartColors() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dark = !mounted || resolvedTheme === 'dark'
  return {
    grid:        dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
    tick:        dark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.40)',
    tooltipBg:   dark ? '#0f1117'                : '#ffffff',
    tooltipBord: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    tooltipText: dark ? 'rgba(255,255,255,0.80)' : 'rgba(15,23,42,0.85)',
  }
}

export default function TrendChart({ data, color = '#3b82f6', height = 200 }: TrendChartProps) {
  const c = useChartColors()
  const t = useTranslations('Detail')

  if (data.length < 2) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center gap-1.5 text-faint">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18M7 16l4-4 4 4 4-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs">{t('chart_empty')}</span>
      </div>
    )
  }

  const gradId = `grad-${color.replace('#', '')}`

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis
          dataKey="date"
          tick={{ fill: c.tick, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: c.tick, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: c.tooltipBg,
            border: `1px solid ${c.tooltipBord}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: c.tooltipText,
          }}
          formatter={(value) => [Number(value).toLocaleString(), 'Stars']}
        />
        <Area
          type="monotone"
          dataKey="stars"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
