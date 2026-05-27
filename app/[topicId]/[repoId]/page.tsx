import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getTopicById } from '@/lib/topics'
import { getRepoById, getRepoSnapshots, getReposByTopic } from '@/lib/supabase'
import { buildStarChartData } from '@/lib/lifecycle'
import { stripMarkdown } from '@/lib/utils'
import TrendChart from '@/components/TrendChart'
import DetectedConventions from '@/components/DetectedConventions'
import RepoCard from '@/components/RepoCard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ topicId: string; repoId: string }>
}

export default async function RepoDetailPage({ params }: Props) {
  const { topicId, repoId } = await params

  const topic = getTopicById(topicId)
  if (!topic) notFound()

  const [repo, snapshots] = await Promise.all([
    getRepoById(repoId),
    getRepoSnapshots(repoId, 30),
  ])

  if (!repo) notFound()

  const starChartData = buildStarChartData(snapshots)

  const similar = await getReposByTopic(topicId, {
    category: repo.category ?? undefined,
    limit: 4,
  })
  const similarFiltered = similar.filter((r) => r.id !== repo.id).slice(0, 3)

  const commitLabel = repo.last_commit
    ? formatDistanceToNow(new Date(repo.last_commit), { addSuffix: true })
    : null

  const daysSinceCommit = repo.last_commit
    ? (Date.now() - new Date(repo.last_commit).getTime()) / 86400000
    : 999
  const maintenanceScore = Math.max(0, Math.round(100 - daysSinceCommit * 2))

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-faint">
        <Link href="/" className="hover:text-muted transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/${topicId}`} className="hover:text-muted transition-colors">
          {topic.label}
        </Link>
        <span>/</span>
        <span className="text-muted">{repo.owner}/{repo.repo}</span>
      </nav>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              <span className="text-faint">{repo.owner}/</span>{repo.repo}
            </h1>
            {repo.name && repo.name !== repo.repo && (
              <p className="text-sm text-faint mt-0.5">{repo.name}</p>
            )}
          </div>
          <a
            href={repo.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-rim text-sm text-muted hover:text-foreground hover:border-rim-hi transition-all"
          >
            <GithubIcon />
            GitHub
          </a>
        </div>

        {repo.description && (
          <p className="text-sub leading-relaxed">
            {stripMarkdown(repo.description)}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {repo.category && (
            <span className="text-xs px-2.5 py-1 rounded-full border border-rim bg-surface text-muted">
              {repo.category}
            </span>
          )}
          {repo.platform && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {repo.platform}
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatItem label="Stars" value={repo.stars.toLocaleString()} icon="★" />
        <StatItem label="Forks" value={repo.forks.toLocaleString()} icon="⑂" />
        <StatItem
          label="Last Commit"
          value={commitLabel ?? 'Unknown'}
          icon="⏱"
        />
        <StatItem
          label="Maintenance"
          value={`${maintenanceScore}/100`}
          icon="⚡"
          valueClass={
            maintenanceScore >= 70
              ? 'text-emerald-400'
              : maintenanceScore >= 40
              ? 'text-amber-400'
              : 'text-red-400'
          }
        />
      </div>

      {/* Star history chart */}
      <section>
        <h2 className="font-semibold text-foreground mb-3">Star History (30 days)</h2>
        <div className="rounded-xl border border-rim bg-surface p-4">
          <TrendChart data={starChartData} height={220} />
        </div>
      </section>

      {/* Detected conventions */}
      <section>
        <h2 className="font-semibold text-foreground mb-3">Detected Conventions</h2>
        <div className="rounded-xl border border-rim bg-surface p-5">
          <DetectedConventions files={repo.detected_files ?? []} />
        </div>
      </section>

      {/* Structure score */}
      {repo.structure_score !== null && repo.structure_score !== undefined && (
        <section>
          <h2 className="font-semibold text-foreground mb-3">Structure Score</h2>
          <div className="rounded-xl border border-rim bg-surface p-5">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-foreground">{repo.structure_score}</div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-surf-hi overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${repo.structure_score}%` }}
                  />
                </div>
                <p className="text-xs text-faint mt-1.5">
                  Spec compliance score — measures structure, not quality.
                  Has frontmatter, name, description, examples, and instructions.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Similar repos */}
      {similarFiltered.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">More in {repo.category ?? topic.label}</h2>
            <Link
              href={`/${topicId}${repo.category ? `?category=${encodeURIComponent(repo.category)}` : ''}`}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {similarFiltered.map((r) => (
              <RepoCard key={r.id} repo={r} showVelocity={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatItem({
  label,
  value,
  icon,
  valueClass = 'text-foreground',
}: {
  label: string
  value: string
  icon: string
  valueClass?: string
}) {
  return (
    <div className="rounded-xl border border-rim bg-surface p-4">
      <p className="text-faint text-xs">{icon} {label}</p>
      <p className={`text-lg font-semibold mt-1 ${valueClass}`}>{value}</p>
    </div>
  )
}

function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}
