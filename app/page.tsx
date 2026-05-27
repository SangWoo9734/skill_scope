import { Suspense } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ACTIVE_TOPICS } from '@/lib/topics'
import { getTopicStats, getTopicSnapshots, getRisingRepos } from '@/lib/supabase'
import {
  calcTopicVelocity,
  classifyLifecycleStatus,
  generateEcosystemHeadline,
  buildLifecycleChartData,
  STATUS_BG,
  STATUS_LABELS,
} from '@/lib/lifecycle'
import type { TopicWithStats } from '@/types'
import EcosystemStats from '@/components/EcosystemStats'
import LifecycleChart from '@/components/LifecycleChart'
import RepoCard from '@/components/RepoCard'

export const dynamic = 'force-dynamic'

async function buildTopicsWithStats(): Promise<TopicWithStats[]> {
  return Promise.all(
    ACTIVE_TOPICS.map(async (topic) => {
      const [stats, snapshots] = await Promise.all([
        getTopicStats(topic.id),
        getTopicSnapshots(topic.id, 90),
      ])
      const { velocity_30d_pct } = calcTopicVelocity(snapshots)
      return {
        ...topic,
        repo_count: stats.repo_count,
        total_stars: stats.total_stars,
        velocity_30d_pct,
        status: classifyLifecycleStatus(velocity_30d_pct),
        snapshots,
      }
    })
  )
}

export default async function HomePage() {
  const [topicsWithStats, risingRepos, t] = await Promise.all([
    buildTopicsWithStats(),
    getRisingRepos(6),
    getTranslations('Home'),
  ])

  const headline = generateEcosystemHeadline(topicsWithStats)
  const chartData = buildLifecycleChartData(
    topicsWithStats.map((tp) => ({ topic: tp, snapshots: tp.snapshots }))
  )

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
          {t('hero1')}<br />
          <span className="text-blue-400">{t('hero2')}</span>
        </h1>
        <p className="mt-3 text-muted max-w-xl leading-relaxed">{t('desc')}</p>
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-8">
          {/* Lifecycle Chart */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">{t('lifecycle_title')}</h2>
                <p className="text-xs text-faint mt-0.5">{t('lifecycle_sub')}</p>
              </div>
              <Link href="/lifecycle" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                {t('lifecycle_full')}
              </Link>
            </div>
            <div className="rounded-xl border border-rim bg-surface p-4">
              <Suspense fallback={<div className="h-64 animate-pulse bg-surf-hi rounded-lg" />}>
                <LifecycleChart data={chartData} topics={ACTIVE_TOPICS} height={260} />
              </Suspense>
            </div>
          </section>

          {/* Rising repos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">{t('rising_title')}</h2>
                <p className="text-xs text-faint mt-0.5">{t('rising_sub')}</p>
              </div>
              <Link href="/trends" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                {t('rising_all')}
              </Link>
            </div>
            {risingRepos.length === 0 ? (
              <EmptyState message={t('empty_msg')} sub={t('empty_sub')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {risingRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} showVelocity />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside>
          <EcosystemStats topics={topicsWithStats} headline={headline} />
        </aside>
      </div>

      {/* Topic quick links */}
      <section>
        <h2 className="font-semibold text-foreground mb-4">{t('browse_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topicsWithStats.map((topic) => (
            <Link
              key={topic.id}
              href={`/${topic.id}`}
              className="group rounded-xl border border-rim bg-surface hover:bg-surf-hi hover:border-rim-hi transition-all p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground group-hover:text-blue-400 transition-colors">
                    {topic.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{topic.description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ml-3 ${STATUS_BG[topic.status]}`}>
                  {STATUS_LABELS[topic.status]}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-faint">
                <span>{topic.repo_count.toLocaleString()} repos</span>
                <span>
                  {topic.velocity_30d_pct > 0 ? '+' : ''}
                  {topic.velocity_30d_pct.toFixed(1)}% / 30d
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-rim p-10 text-center space-y-1">
      <p className="text-muted text-sm">{message}</p>
      {sub && <p className="text-faint text-xs">{sub}</p>}
    </div>
  )
}
