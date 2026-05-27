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
        <h1 className="text-2xl font-bold text-white">Topic Lifecycle</h1>
        <p className="mt-1 text-white/40 text-sm">
          Which AI-native development conventions are emerging, growing, or plateauing?
        </p>
      </div>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {topicsWithStats.map((topic) => (
          <div
            key={topic.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            style={{ borderLeftColor: STATUS_COLORS[topic.status], borderLeftWidth: 3 }}
          >
            <p className="text-xs text-white/40 font-medium">{topic.label}</p>
            <p className="text-xl font-bold text-white mt-1">
              {topic.repo_count.toLocaleString()}
            </p>
            <p className="text-xs text-white/30">repos</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_BG[topic.status]}`}>
                {STATUS_LABELS[topic.status]}
              </span>
              <span className="text-xs text-white/30">
                {topic.velocity_30d_pct > 0 ? '+' : ''}
                {topic.velocity_30d_pct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 90-day chart */}
      <section>
        <h2 className="font-semibold text-white mb-1">90-Day Repo Growth</h2>
        <p className="text-xs text-white/35 mb-4">
          Total repos per topic — cumulative count over 90 days
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <LifecycleChart data={chartData90} topics={ACTIVE_TOPICS} height={340} />
        </div>
      </section>

      {/* 30-day chart */}
      <section>
        <h2 className="font-semibold text-white mb-1">30-Day Detail</h2>
        <p className="text-xs text-white/35 mb-4">Zoomed view of the last 30 days</p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <LifecycleChart data={chartData30} topics={ACTIVE_TOPICS} height={280} />
        </div>
      </section>

      {/* Status table */}
      <section>
        <h2 className="font-semibold text-white mb-4">Current Status</h2>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-white/40 font-medium">Topic</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium">Repos</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium">Total Stars</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium">+7d repos</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium">+30d %</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {topicsWithStats.map((topic, i) => {
                const t = topic as TopicWithStats & { velocity_7d_count?: number }
                return (
                  <tr
                    key={topic.id}
                    className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{topic.label}</p>
                      <p className="text-xs text-white/30">{topic.description}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">
                      {topic.repo_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">
                      {topic.total_stars.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      {t.velocity_7d_count !== undefined && t.velocity_7d_count > 0
                        ? `+${t.velocity_7d_count}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-white/60">
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
      <section className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-5 text-xs text-white/30 space-y-1">
        <p className="font-medium text-white/40">How lifecycle status is determined</p>
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
