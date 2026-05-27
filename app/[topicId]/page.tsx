import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getTopicById } from '@/lib/topics'
import { getReposByTopic, getTopicStats, getReposWithVelocity } from '@/lib/supabase'
import RepoCard from '@/components/RepoCard'
import type { CategoryOption, SortOption, Repo, RepoWithVelocity } from '@/types'

export const dynamic = 'force-dynamic'

const CATEGORIES: CategoryOption[] = [
  'all', 'AI/Agents', 'Frontend', 'Testing', 'Workflow',
  'Security', 'Docs', 'Utility',
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

  const t = await getTranslations('TopicPage')
  const currentPage = Math.max(1, parseInt(page))
  const limit = 24
  const offset = (currentPage - 1) * limit

  const stats = await getTopicStats(topicId)

  let repos: (Repo | RepoWithVelocity)[]
  if (sort === 'velocity_7d') {
    repos = await getReposWithVelocity(topicId, limit)
  } else {
    repos = await getReposByTopic(topicId, {
      sort: sort as SortOption,
      category: category !== 'all' ? category : undefined,
      limit,
      offset,
    })
  }

  const hasMore = sort !== 'velocity_7d' && offset + repos.length < stats.repo_count

  const SORT_OPTIONS = [
    { value: 'stars',       label: t('sort_stars') },
    { value: 'velocity_7d', label: t('sort_trending') },
    { value: 'last_commit', label: t('sort_recent') },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{topic.label}</h1>
          <p className="text-muted text-sm mt-1">{topic.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-faint">{stats.repo_count.toLocaleString()} repos</span>
            <span className="text-faint opacity-40">·</span>
            <span className="text-xs text-amber-400/60">
              {t('total_stars', { count: stats.total_stars.toLocaleString() })}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={buildUrl(topicId, { sort, category: cat, page: '1' })}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-active text-foreground'
                  : 'text-muted hover:text-sub hover:bg-surf-hi'
              }`}
            >
              {cat === 'all' ? t('all') : cat}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <span className="text-xs text-faint">{t('sort')}</span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={buildUrl(topicId, { sort: opt.value, category, page: '1' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort === opt.value
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-muted hover:text-sub hover:bg-surf-hi'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Repo grid */}
      {repos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rim p-12 text-center text-muted text-sm">
          {t('empty')}
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
        <p className="text-xs text-faint">
          {t('showing', { from: offset + 1, to: offset + repos.length, total: stats.repo_count.toLocaleString() })}
        </p>
        <div className="flex gap-2">
          {currentPage > 1 && (
            <Link
              href={buildUrl(topicId, { sort, category, page: String(currentPage - 1) })}
              className="px-4 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surf-hi border border-rim transition-all"
            >
              {t('prev')}
            </Link>
          )}
          {hasMore && (
            <Link
              href={buildUrl(topicId, { sort, category, page: String(currentPage + 1) })}
              className="px-4 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surf-hi border border-rim transition-all"
            >
              {t('next')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function buildUrl(topicId: string, params: { sort: string; category: string; page: string }): string {
  const sp = new URLSearchParams()
  if (params.sort !== 'stars') sp.set('sort', params.sort)
  if (params.category !== 'all') sp.set('category', params.category)
  if (params.page !== '1') sp.set('page', params.page)
  const qs = sp.toString()
  return `/${topicId}${qs ? '?' + qs : ''}`
}
