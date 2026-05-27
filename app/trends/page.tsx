import { ACTIVE_TOPICS, getTopicById } from '@/lib/topics'
import { getReposWithVelocity, getRisingRepos } from '@/lib/supabase'
import RepoCard from '@/components/RepoCard'

export const dynamic = 'force-dynamic'

export default async function TrendsPage() {
  // Rising overall + per-topic fastest growing
  const [risingAll, ...topicVelocities] = await Promise.all([
    getRisingRepos(10),
    ...ACTIVE_TOPICS.map((t) => getReposWithVelocity(t.id, 5)),
  ])

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Trend Velocity</h1>
        <p className="mt-1 text-white/40 text-sm">
          Stars are a signal of interest, not quality. Velocity shows where attention is moving.
        </p>
      </div>

      {/* Rising this week */}
      <section>
        <div className="mb-4">
          <h2 className="font-semibold text-white">Rising This Week</h2>
          <p className="text-xs text-white/35 mt-0.5">
            Fastest 7-day star velocity across all topics
          </p>
        </div>
        {risingAll.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {risingAll.map((repo) => (
              <RepoCard key={repo.id} repo={repo} showVelocity />
            ))}
          </div>
        )}
      </section>

      {/* Per-topic fastest growing */}
      {ACTIVE_TOPICS.map((topic, i) => {
        const repos = topicVelocities[i] ?? []
        return (
          <section key={topic.id}>
            <div className="mb-4">
              <h2 className="font-semibold text-white">{topic.label} — Fastest Growing</h2>
              <p className="text-xs text-white/35 mt-0.5">
                Top 5 by 7-day velocity in this topic
              </p>
            </div>
            {repos.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} showVelocity />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {/* Methodology */}
      <section className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-5 text-xs text-white/30 space-y-1">
        <p className="font-medium text-white/40">Velocity formula</p>
        <div className="font-mono space-y-0.5 mt-1 text-white/40">
          <p>velocity_7d  = stars_now − stars_7days_ago</p>
          <p>velocity_30d = stars_now − stars_30days_ago</p>
          <p>acceleration = velocity_7d(this week) − velocity_7d(last week)</p>
        </div>
        <p className="mt-2">
          Requires at least one day of snapshot history. Low-star repos with high velocity are
          intentionally surfaced — early signals matter.
        </p>
      </section>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/30 text-sm">
      No velocity data yet. Run the crawl + snapshot crons to populate.
    </div>
  )
}
