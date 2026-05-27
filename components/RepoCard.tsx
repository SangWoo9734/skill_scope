import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { RepoWithVelocity, Repo } from '@/types'

interface RepoCardProps {
  repo: Repo | RepoWithVelocity
  showVelocity?: boolean
}

function hasVelocity(r: Repo | RepoWithVelocity): r is RepoWithVelocity {
  return 'velocity_7d' in r
}

/** Strip markdown syntax for display */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function RepoCard({ repo, showVelocity = true }: RepoCardProps) {
  const velocity7d = hasVelocity(repo) ? repo.velocity_7d : null
  const maintenanceScore = hasVelocity(repo) ? repo.maintenance_score : null

  const commitLabel = repo.last_commit
    ? formatDistanceToNow(new Date(repo.last_commit), { addSuffix: true })
    : null

  const displayDesc = repo.description ? stripMarkdown(repo.description) : null

  return (
    <Link
      href={`/${repo.topic_id}/${repo.id}`}
      className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 p-5 gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/35 font-mono truncate">{repo.owner}/</p>
          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate leading-snug">
            {repo.repo}
          </p>
          {repo.name && repo.name !== repo.repo && (
            <p className="text-xs text-white/35 truncate mt-0.5">{repo.name}</p>
          )}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 text-amber-400 shrink-0 bg-amber-400/10 rounded-lg px-2 py-1">
          <StarIcon />
          <span className="text-sm font-semibold tabular-nums">{formatNum(repo.stars)}</span>
        </div>
      </div>

      {/* Description */}
      {displayDesc && (
        <p className="text-sm text-white/45 line-clamp-2 leading-relaxed flex-1">
          {displayDesc}
        </p>
      )}

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {repo.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-white/35 border border-white/[0.07]">
            {repo.category}
          </span>
        )}
        {repo.platform && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {repo.platform}
          </span>
        )}
        {showVelocity && velocity7d !== null && velocity7d > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium ml-auto">
            +{formatNum(velocity7d)} this week
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-white/25 border-t border-white/[0.05] pt-2.5">
        <div className="flex items-center gap-3">
          {commitLabel && <span>{commitLabel}</span>}
          {repo.forks > 0 && <span>{formatNum(repo.forks)} forks</span>}
        </div>
        {maintenanceScore !== null && <MaintenanceDot score={maintenanceScore} />}
      </div>
    </Link>
  )
}

function MaintenanceDot({ score }: { score: number }) {
  const [color, label] =
    score >= 70
      ? ['bg-emerald-500', 'Active']
      : score >= 40
      ? ['bg-amber-500', 'Slowing']
      : ['bg-red-500/70', 'Inactive']
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  )
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  )
}
