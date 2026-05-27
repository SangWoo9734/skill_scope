import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { RepoWithVelocity, Repo } from '@/types'
import { STATUS_BG } from '@/lib/lifecycle'

interface RepoCardProps {
  repo: Repo | RepoWithVelocity
  showVelocity?: boolean
}

function hasVelocity(r: Repo | RepoWithVelocity): r is RepoWithVelocity {
  return 'velocity_7d' in r
}

export default function RepoCard({ repo, showVelocity = true }: RepoCardProps) {
  const velocity7d = hasVelocity(repo) ? repo.velocity_7d : null
  const maintenanceScore = hasVelocity(repo) ? repo.maintenance_score : null

  const commitLabel = repo.last_commit
    ? formatDistanceToNow(new Date(repo.last_commit), { addSuffix: true })
    : null

  return (
    <Link
      href={`/${repo.topic_id}/${repo.id}`}
      className="group block rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-white/50 truncate">{repo.owner}/</span>
            <span className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
              {repo.repo}
            </span>
          </div>
          {repo.name && repo.name !== repo.repo && (
            <p className="text-xs text-white/40 mt-0.5 truncate">{repo.name}</p>
          )}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 text-amber-400 shrink-0">
          <StarIcon />
          <span className="text-sm font-medium">{formatNumber(repo.stars)}</span>
        </div>
      </div>

      {/* Description */}
      {repo.description && (
        <p className="mt-2 text-sm text-white/50 line-clamp-2 leading-relaxed">
          {repo.description}
        </p>
      )}

      {/* Tags row */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {repo.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.08]">
            {repo.category}
          </span>
        )}
        {repo.platform && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {repo.platform}
          </span>
        )}
        {showVelocity && velocity7d !== null && velocity7d > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            +{formatNumber(velocity7d)} this week
          </span>
        )}
        {showVelocity && velocity7d !== null && velocity7d < 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
            {velocity7d} this week
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-white/30">
        <div className="flex items-center gap-3">
          {commitLabel && (
            <span>committed {commitLabel}</span>
          )}
          {repo.forks > 0 && (
            <span>{formatNumber(repo.forks)} forks</span>
          )}
        </div>
        {maintenanceScore !== null && (
          <MaintenanceDot score={maintenanceScore} />
        )}
      </div>
    </Link>
  )
}

function MaintenanceDot({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
  const label =
    score >= 70 ? 'Active' : score >= 40 ? 'Slowing' : 'Inactive'
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  )
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
