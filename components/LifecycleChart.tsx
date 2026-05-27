'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { LifecycleChartPoint } from '@/lib/lifecycle'
import type { Topic } from '@/types'

const TOPIC_COLORS: Record<string, string> = {
  skills:      '#3b82f6',
  claudemd:    '#10b981',
  agentsmd:    '#f59e0b',
  mcpjson:     '#8b5cf6',
  cursorrules: '#ec4899',
}

interface LifecycleChartProps {
  data: LifecycleChartPoint[]
  topics: Topic[]
  height?: number
}

function useChartColors() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dark = !mounted || resolvedTheme === 'dark'
  return {
    grid:         dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    tick:         dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.40)',
    axisLine:     dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)',
    tooltipBg:    dark ? '#0f1117'                : '#ffffff',
    tooltipBord:  dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    tooltipText:  dark ? 'rgba(255,255,255,0.80)' : 'rgba(15,23,42,0.85)',
    tooltipLabel: dark ? 'rgba(255,255,255,0.50)' : 'rgba(15,23,42,0.50)',
    legend:       dark ? 'rgba(255,255,255,0.50)' : 'rgba(15,23,42,0.50)',
  }
}

export default function LifecycleChart({ data, topics, height = 320 }: LifecycleChartProps) {
  const c = useChartColors()
  const t = useTranslations('Lifecycle')

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-muted text-sm">
        {t('no_data')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis
          dataKey="date"
          tick={{ fill: c.tick, fontSize: 11 }}
          axisLine={{ stroke: c.axisLine }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: c.tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: c.tooltipBg,
            border: `1px solid ${c.tooltipBord}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: c.tooltipText,
          }}
          labelStyle={{ color: c.tooltipLabel, marginBottom: 4 }}
          itemStyle={{ padding: '2px 0' }}
          formatter={(value, name) => [
            t('tooltip_repos', { count: Number(value).toLocaleString() }),
            topics.find((tp) => tp.id === String(name))?.label ?? String(name),
          ]}
        />
        <Legend
          formatter={(value) => topics.find((tp) => tp.id === value)?.label ?? value}
          wrapperStyle={{ fontSize: '12px', color: c.legend }}
        />
        {topics.map((topic) => (
          <Line
            key={topic.id}
            type="monotone"
            dataKey={topic.id}
            stroke={TOPIC_COLORS[topic.id] ?? '#6b7280'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
