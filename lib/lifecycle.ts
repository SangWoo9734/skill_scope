import type { LifecycleStatus, TopicSnapshot, TopicWithStats } from '@/types'
import type { Topic } from '@/types'

// ─── Status classification ───────────────────────────────────────────────────

/**
 * Classify a topic's lifecycle status based on 30-day repo count growth rate.
 *
 * velocity_30d_pct = (count_now - count_30d_ago) / count_30d_ago * 100
 *
 *   > +20%/month  → Emerging
 *   +5 ~ +20%     → Growing
 *   -5 ~ +5%      → Plateau
 *   < -5%         → Declining
 */
export function classifyLifecycleStatus(velocity30dPct: number): LifecycleStatus {
  if (velocity30dPct > 20) return 'emerging'
  if (velocity30dPct > 5) return 'growing'
  if (velocity30dPct >= -5) return 'plateau'
  return 'declining'
}

export const STATUS_LABELS: Record<LifecycleStatus, string> = {
  emerging: 'Emerging',
  growing: 'Growing',
  plateau: 'Plateau',
  declining: 'Declining',
}

export const STATUS_COLORS: Record<LifecycleStatus, string> = {
  emerging: '#10b981',  // emerald-500
  growing: '#3b82f6',   // blue-500
  plateau: '#f59e0b',   // amber-500
  declining: '#ef4444', // red-500
}

export const STATUS_BG: Record<LifecycleStatus, string> = {
  emerging: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  growing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  plateau: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  declining: 'bg-red-500/10 text-red-400 border-red-500/20',
}

// ─── Velocity calculation ────────────────────────────────────────────────────

export function calcTopicVelocity(snapshots: TopicSnapshot[]): {
  velocity_30d_pct: number
  velocity_7d_count: number
} {
  if (snapshots.length < 2) return { velocity_30d_pct: 0, velocity_7d_count: 0 }

  const now = Date.now()
  const day7ago = new Date(now - 7 * 86400000).toISOString()
  const day30ago = new Date(now - 30 * 86400000).toISOString()

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapped_at).getTime() - new Date(b.snapped_at).getTime()
  )
  const latest = sorted[sorted.length - 1]

  // 30d velocity (repo count growth %)
  const snap30 = sorted.find((s) => s.snapped_at >= day30ago) ?? sorted[0]
  const velocity_30d_pct =
    snap30.repo_count > 0
      ? ((latest.repo_count - snap30.repo_count) / snap30.repo_count) * 100
      : 0

  // 7d new repos (absolute count)
  const snap7 = sorted.find((s) => s.snapped_at >= day7ago)
  const velocity_7d_count = snap7 ? latest.repo_count - snap7.repo_count : 0

  return { velocity_30d_pct, velocity_7d_count }
}

// ─── Headline generation ─────────────────────────────────────────────────────

export function generateEcosystemHeadline(topics: TopicWithStats[]): string {
  const active = topics.filter((t) => t.active && t.repo_count > 0)
  if (active.length === 0) return 'AI-native development conventions are growing fast.'

  // Find the fastest growing
  const fastest = active.reduce((best, t) =>
    t.velocity_30d_pct > best.velocity_30d_pct ? t : best
  )

  if (fastest.velocity_30d_pct > 50) {
    return `${fastest.label} repos grew ${Math.round(fastest.velocity_30d_pct)}% this month — fastest in the ecosystem.`
  }
  if (fastest.velocity_30d_pct > 20) {
    return `${fastest.label} is the fastest-growing convention this month (+${Math.round(fastest.velocity_30d_pct)}%).`
  }
  if (fastest.velocity_30d_pct > 5) {
    return `${fastest.label} continues to grow — ${fastest.repo_count.toLocaleString()} repos tracked.`
  }

  const total = active.reduce((s, t) => s + t.repo_count, 0)
  return `${total.toLocaleString()} AI-native convention repos tracked across ${active.length} categories.`
}

// ─── Chart data formatting ────────────────────────────────────────────────────

export interface LifecycleChartPoint {
  date: string       // 'MM/DD' display label
  [topicId: string]: number | string
}

/**
 * Transform per-topic snapshots into a merged time-series for Recharts.
 */
export function buildLifecycleChartData(
  topicsWithSnapshots: Array<{ topic: Topic; snapshots: TopicSnapshot[] }>
): LifecycleChartPoint[] {
  // Collect all unique dates
  const dateSet = new Set<string>()
  for (const { snapshots } of topicsWithSnapshots) {
    for (const s of snapshots) {
      dateSet.add(s.snapped_at.slice(0, 10)) // 'YYYY-MM-DD'
    }
  }

  const dates = Array.from(dateSet).sort()

  return dates.map((date) => {
    const point: LifecycleChartPoint = {
      date: formatChartDate(date),
    }
    for (const { topic, snapshots } of topicsWithSnapshots) {
      // Find closest snapshot on or before this date
      const snap = [...snapshots]
        .filter((s) => s.snapped_at.slice(0, 10) <= date)
        .sort((a, b) => b.snapped_at.localeCompare(a.snapped_at))[0]
      point[topic.id] = snap?.repo_count ?? 0
    }
    return point
  })
}

function formatChartDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${month}/${day}`
}

// ─── Stars chart data ─────────────────────────────────────────────────────────

export interface StarChartPoint {
  date: string
  stars: number
}

export function buildStarChartData(
  snapshots: Array<{ stars: number; snapped_at: string }>
): StarChartPoint[] {
  return snapshots
    .sort((a, b) => a.snapped_at.localeCompare(b.snapped_at))
    .map((s) => ({
      date: formatChartDate(s.snapped_at.slice(0, 10)),
      stars: s.stars,
    }))
}
