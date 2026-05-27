import type { TopicWithStats } from '@/types'
import { STATUS_BG, STATUS_LABELS } from '@/lib/lifecycle'

interface EcosystemStatsProps {
  topics: TopicWithStats[]
  headline: string
}

export default function EcosystemStats({ topics, headline }: EcosystemStatsProps) {
  const activeTopics = topics.filter((t) => t.active && t.repo_count > 0)
  const totalRepos = activeTopics.reduce((s, t) => s + t.repo_count, 0)
  const totalStars = activeTopics.reduce((s, t) => s + t.total_stars, 0)

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-blue-500/5 to-emerald-500/5 p-6">
        <p className="text-lg font-medium text-white/80 leading-snug">{headline}</p>
        <p className="mt-1 text-xs text-white/30">
          Stars = interest signal, not usage. Updated daily.
        </p>
      </div>

      {/* Global totals */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Repos Tracked"
          value={totalRepos.toLocaleString()}
          sub={`across ${activeTopics.length} topics`}
        />
        <StatCard
          label="Total Stars"
          value={formatNumber(totalStars)}
          sub="community attention"
        />
      </div>

      {/* Per-topic cards */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-white/30 uppercase tracking-wider px-1">
          By Topic
        </p>
        {activeTopics.map((topic) => (
          <TopicRow key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs font-medium text-white/50 mt-0.5">{label}</p>
      <p className="text-xs text-white/25 mt-0.5">{sub}</p>
    </div>
  )
}

function TopicRow({ topic }: { topic: TopicWithStats }) {
  const velStr =
    topic.velocity_30d_pct > 0
      ? `+${topic.velocity_30d_pct.toFixed(1)}%`
      : `${topic.velocity_30d_pct.toFixed(1)}%`

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{topic.label}</p>
          <p className="text-xs text-white/30">{topic.repo_count.toLocaleString()} repos</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-white/40">{velStr} / 30d</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BG[topic.status]}`}
        >
          {STATUS_LABELS[topic.status]}
        </span>
      </div>
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
