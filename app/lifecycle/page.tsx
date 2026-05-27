import { ACTIVE_TOPICS } from '@/lib/topics'
import { getTopicStats, getTopicSnapshots } from '@/lib/supabase'
import {
  calcTopicVelocity,
  classifyLifecycleStatus,
  buildLifecycleChartData,
  STATUS_BG,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/lifecycle'
import type { TopicWithStats } from '@/types'
import LifecycleChart from '@/components/LifecycleChart'

export const dynamic = 'force-dynamic'

export default async function LifecyclePage() {
  const topicsWithStats: TopicWithStats[] = await Promise.all(
    ACTIVE_TOPICS.map(async (topic) => {
      const [stats, snapshots] = await Promise.all([
        getTopicStats(topic.id),
        getTopicSnapshots(topic.id, 90),
      ])
      const { velocity_30d_pct, velocity_7d_count } = calcTopicVelocity(snapshots)
      return {
        ...topic,
        repo_count: stats.repo_count,
        total_stars: stats.total_stars,
        velocity_30d_pct,
        velocity_7d_count,
        status: classifyLifecycleStatus(velocity_30d_pct),
        snapshots,
      } as TopicWithStats & { velocity_7d_count: number }
    })
  )

  const chartData30 = buildLifecycleChartData(
    topicsWithStats.map((t) => ({ topic: t, snapshots: t.snapshots.slice(-30) }))
  )
  const chartData90 = buildLifecycleChartData(
    topicsWithStats.map((t) => ({ topic: t, snapshots: t.snapshots }))
  )

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Topic Lifecycle</h1>
        <p className="mt-1 text-muted text-sm">
          Which AI-native development conventions are emerging, growing, or plateauing?
        </p>
      </div>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {topicsWithStats.map((topic) => (
          <div
            key={topic.id}
            className="rounded-xl border border-rim bg-surface p-4"
            style={{ borderLeftColor: STATUS_COLORS[topic.status], borderLeftWidth: 3 }}
          >
            <p className="text-xs text-muted font-medium">{topic.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {topic.repo_count.toLocaleString()}
            </p>
            <p className="text-xs text-faint">repos</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_BG[topic.status]}`}>
                {STATUS_LABELS[topic.status]}
              </span>
              <span className="text-xs text-faint">
                {topic.velocity_30d_pct > 0 ? '+' : ''}
                {topic.velocity_30d_pct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 90-day chart */}
      <section>
        <h2 className="font-semibold text-foreground mb-1">90-Day Repo Growth</h2>
        <p className="text-xs text-faint mb-4">
          Total repos per topic — cumulative count over 90 days
        </p>
        <div className="rounded-xl border border-rim bg-surface p-4">
          <LifecycleChart data={chartData90} topics={ACTIVE_TOPICS} height={340} />
        </div>
      </section>

      {/* 30-day chart */}
      <section>
        <h2 className="font-semibold text-foreground mb-1">30-Day Detail</h2>
        <p className="text-xs text-faint mb-4">Zoomed view of the last 30 days</p>
        <div className="rounded-xl border border-rim bg-surface p-4">
          <LifecycleChart data={chartData30} topics={ACTIVE_TOPICS} height={280} />
        </div>
      </section>

      {/* Status table */}
      <section>
        <h2 className="font-semibold text-foreground mb-4">Current Status</h2>
        <div className="rounded-xl border border-rim overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rim bg-surface">
                <th className="text-left px-4 py-3 text-muted font-medium">Topic</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Repos</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Total Stars</th>
                <th className="text-right px-4 py-3 text-muted font-medium">+7d repos</th>
                <th className="text-right px-4 py-3 text-muted font-medium">+30d %</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {topicsWithStats.map((topic, i) => {
                const t = topic as TopicWithStats & { velocity_7d_count?: number }
                return (
                  <tr
                    key={topic.id}
                    className={`border-b border-line ${i % 2 === 0 ? '' : 'bg-surface'}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{topic.label}</p>
                      <p className="text-xs text-faint">{topic.description}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sub">
                      {topic.repo_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sub">
                      {topic.total_stars.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      {t.velocity_7d_count !== undefined && t.velocity_7d_count > 0
                        ? `+${t.velocity_7d_count}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {topic.velocity_30d_pct > 0 ? '+' : ''}
                      {topic.velocity_30d_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BG[topic.status]}`}
                      >
                        {STATUS_LABELS[topic.status]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Methodology note */}
      <section className="rounded-xl border border-line bg-surface p-5 text-xs text-faint space-y-1">
        <p className="font-medium text-muted">How lifecycle status is determined</p>
        <p>Status is based on 30-day repo count growth rate:</p>
        <ul className="mt-1 space-y-0.5 pl-3">
          <li><span className="text-emerald-400">Emerging</span> — &gt;+20% / month</li>
          <li><span className="text-blue-400">Growing</span> — +5% to +20% / month</li>
          <li><span className="text-amber-400">Plateau</span> — -5% to +5% / month</li>
          <li><span className="text-red-400">Declining</span> — &lt;-5% / month</li>
        </ul>
        <p className="mt-2">These thresholds are provisional. They will be recalibrated as more data accumulates.</p>
      </section>
    </div>
  )
}
