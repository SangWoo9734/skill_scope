import { getTranslations } from 'next-intl/server'
import { ACTIVE_TOPICS } from '@/lib/topics'
import { getReposWithVelocity, getRisingRepos } from '@/lib/supabase'
import RepoCard from '@/components/RepoCard'

export const dynamic = 'force-dynamic'

export default async function TrendsPage() {
  const [risingAll, t, ...topicVelocities] = await Promise.all([
    getRisingRepos(10),
    getTranslations('Trends'),
    ...ACTIVE_TOPICS.map((tp) => getReposWithVelocity(tp.id, 5)),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-muted text-sm">{t('sub')}</p>
      </div>

      {/* Rising this week */}
      <section>
        <div className="mb-4">
          <h2 className="font-semibold text-foreground">{t('rising_title')}</h2>
          <p className="text-xs text-faint mt-0.5">{t('rising_sub')}</p>
        </div>
        {risingAll.length === 0 ? (
          <EmptyState message={t('empty')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {risingAll.map((repo) => <RepoCard key={repo.id} repo={repo} showVelocity />)}
          </div>
        )}
      </section>

      {/* Per-topic fastest growing */}
      {ACTIVE_TOPICS.map((topic, i) => {
        const repos = topicVelocities[i] ?? []
        return (
          <section key={topic.id}>
            <div className="mb-4">
              <h2 className="font-semibold text-foreground">
                {t('fastest_title', { topic: topic.label })}
              </h2>
              <p className="text-xs text-faint mt-0.5">{t('fastest_sub')}</p>
            </div>
            {repos.length === 0 ? (
              <EmptyState message={t('empty')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {repos.map((repo) => <RepoCard key={repo.id} repo={repo} showVelocity />)}
              </div>
            )}
          </section>
        )
      })}

      {/* Methodology */}
      <section className="rounded-xl border border-line bg-surface p-5 text-xs text-faint space-y-1">
        <p className="font-medium text-muted">{t('formula_title')}</p>
        <div className="font-mono space-y-0.5 mt-1 text-muted">
          <p>{t('formula_1')}</p>
          <p>{t('formula_2')}</p>
          <p>{t('formula_3')}</p>
        </div>
        <p className="mt-2">{t('formula_note')}</p>
      </section>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-rim p-8 text-center text-muted text-sm">
      {message}
    </div>
  )
}
