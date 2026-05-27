import { NextRequest } from 'next/server'
import { ACTIVE_TOPICS } from '@/lib/topics'
import { supabaseAdmin, insertRepoSnapshot, insertTopicSnapshot } from '@/lib/supabase'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const snapResults: Array<{
    topic_id: string
    repos_snapped: number
    errors: string[]
  }> = []

  for (const topic of ACTIVE_TOPICS) {
    const result = { topic_id: topic.id, repos_snapped: 0, errors: [] as string[] }

    try {
      // Fetch all repos for this topic
      const { data: repos, error } = await supabaseAdmin
        .from('repos')
        .select('id, stars')
        .eq('topic_id', topic.id)

      if (error) throw error

      // Insert per-repo snapshots
      for (const repo of repos ?? []) {
        try {
          await insertRepoSnapshot(repo.id, repo.stars)
          result.repos_snapped++
        } catch (err) {
          result.errors.push(`repo ${repo.id}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      // Insert topic-level snapshot
      const totalStars = (repos ?? []).reduce((s: number, r: { stars: number }) => s + (r.stars ?? 0), 0)
      await insertTopicSnapshot(topic.id, (repos ?? []).length, totalStars)
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err))
    }

    snapResults.push(result)
  }

  return Response.json({
    ok: true,
    snapped_at: new Date().toISOString(),
    results: snapResults,
  })
}
