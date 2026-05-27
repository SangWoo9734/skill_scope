import { getTranslations } from 'next-intl/server'
import type { TopicWithStats } from '@/types'
import { STATUS_BG, STATUS_LABELS } from '@/lib/lifecycle'

interface EcosystemStatsProps {
  topics: TopicWithStats[]
  headline: string
}

export default async function EcosystemStats({ topics, headline }: EcosystemStatsProps) {
  const t = await getTranslations('Stats')
  const activeTopics = topics.filter((tp) => tp.active && tp.repo_count > 0)
  const totalRepos = activeTopics.reduce((s, tp) => s + tp.repo_count, 0)
  const totalStars = activeTopics.reduce((s, tp) => s + tp.total_stars, 0)

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="rounded-xl border border-rim bg-gradient-to-br from-blue-500/5 to-emerald-500/5 p-6">
        <p className="text-lg font-medium text-sub leading-snug">{headline}</p>
        <p className="mt-1 text-xs text-faint">{t('note')}</p>
      </div>

      {/* Global totals */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t('total_repos')}
          value={totalRepos.toLocaleString()}
          sub={t('across', { n: activeTopics.length })}
        />
        <StatCard
          label={t('total_stars')}
          value={formatNumber(totalStars)}
          sub={t('attention')}
        />
      </div>

      {/* Per-topic cards */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-faint uppercase tracking-wider px-1">
          {t('by_topic')}
        </p>
        {activeTopics.map((topic) => (
          <TopicRow key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-rim bg-surface p-4">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted mt-0.5">{label}</p>
      <p className="text-xs text-faint mt-0.5">{sub}</p>
    </div>
  )
}

function TopicRow({ topic }: { topic: TopicWithStats }) {
  const velStr =
    topic.velocity_30d_pct > 0
      ? `+${topic.velocity_30d_pct.toFixed(1)}%`
      : `${topic.velocity_30d_pct.toFixed(1)}%`

  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-sub">{topic.label}</p>
        <p className="text-xs text-faint">{topic.repo_count.toLocaleString()} repos</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted">{velStr} / 30d</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BG[topic.status]}`}>
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
