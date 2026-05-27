import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTopicById } from '@/lib/topics'
import { getReposByTopic, getTopicStats } from '@/lib/supabase'
import RepoCard from '@/components/RepoCard'
import type { CategoryOption, SortOption } from '@/types'

export const dynamic = 'force-dynamic'

const CATEGORIES: CategoryOption[] = [
  'all', 'AI/Agents', 'Frontend', 'Testing', 'Workflow',
  'Security', 'Docs', 'Utility',
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'stars', label: 'Most Stars' },
  { value: 'velocity_7d', label: 'Trending' },
  { value: 'last_commit', label: 'Recently Updated' },
]

interface Props {
  params: Promise<{ topicId: string }>
  searchParams: Promise<{ sort?: string; category?: string; page?: string }>
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { topicId } = await params
  const { sort = 'stars', category = 'all', page = '1' } = await searchParams

  const topic = getTopicById(topicId)
  if (!topic || !topic.active) notFound()

  const currentPage = Math.max(1, parseInt(page))
  const limit = 24
  const offset = (currentPage - 1) * limit

  const [repos, stats] = await Promise.all([
    getReposByTopic(topicId, {
      sort: sort as SortOption,
      category: category !== 'all' ? category : undefined,
      limit,
      offset,
    }),
    getTopicStats(topicId),
  ])

  const hasMore = offset + repos.length < stats.repo_count

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{topic.label}</h1>
          <p className="text-white/40 text-sm mt-1">{topic.description}</p>
          <p className="text-xs text-white/25 mt-2">
            {stats.repo_count.toLocaleString()} repos · {stats.total_stars.toLocaleString()} total stars
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={buildUrl(topicId, { sort, category: cat, page: '1' })}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.05]'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </Link>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <span className="text-xs text-white/30">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={buildUrl(topicId, { sort: opt.value, category, page: '1' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort === opt.value
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.05]'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Repo grid */}
      {repos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-white/30 text-sm">
          No repos found. Try a different filter or run the crawl cron.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} showVelocity />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-white/30">
          Showing {offset + 1}–{offset + repos.length} of {stats.repo_count.toLocaleString()}
        </p>
        <div className="flex gap-2">
          {currentPage > 1 && (
            <Link
              href={buildUrl(topicId, { sort, category, page: String(currentPage - 1) })}
              className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-all"
            >
              ← Prev
            </Link>
          )}
          {hasMore && (
            <Link
              href={buildUrl(topicId, { sort, category, page: String(currentPage + 1) })}
              className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-all"
            >
              Next →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function buildUrl(
  topicId: string,
  params: { sort: string; category: string; page: string }
): string {
  const sp = new URLSearchParams()
  if (params.sort !== 'stars') sp.set('sort', params.sort)
  if (params.category !== 'all') sp.set('category', params.category)
  if (params.page !== '1') sp.set('page', params.page)
  const qs = sp.toString()
  return `/${topicId}${qs ? '?' + qs : ''}`
}
