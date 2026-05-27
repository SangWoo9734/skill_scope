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
import type { LifecycleChartPoint } from '@/lib/lifecycle'
import type { Topic } from '@/types'

const TOPIC_COLORS: Record<string, string> = {
  skills: '#3b82f6',    // blue
  claudemd: '#10b981',  // emerald
  agentsmd: '#f59e0b',  // amber
  mcpjson: '#8b5cf6',   // violet
  cursorrules: '#ec4899', // pink
}

interface LifecycleChartProps {
  data: LifecycleChartPoint[]
  topics: Topic[]
  height?: number
}

export default function LifecycleChart({
  data,
  topics,
  height = 320,
}: LifecycleChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-white/30 text-sm"
      >
        Not enough data yet — check back after the first snapshot runs.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f1117',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
          itemStyle={{ padding: '2px 0' }}
          formatter={(value, name) => [
            Number(value).toLocaleString() + ' repos',
            topics.find((t) => t.id === String(name))?.label ?? String(name),
          ]}
        />
        <Legend
          formatter={(value) => topics.find((t) => t.id === value)?.label ?? value}
          wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
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
