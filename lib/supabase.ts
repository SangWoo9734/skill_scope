import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Repo, RepoSnapshot, TopicSnapshot, RepoWithVelocity } from '@/types'

// Lazy singletons — safe at build time when env vars aren't set
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase public env vars')
    _supabase = createClient(url, key)
  }
  return _supabase
}

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase service role env vars')
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

// Convenience accessors (use inside functions, not at module scope)
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get: (_, prop) => getSupabase()[prop as keyof SupabaseClient],
})
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get: (_, prop) => getSupabaseAdmin()[prop as keyof SupabaseClient],
})

// ─── Repos ────────────────────────────────────────────────────────────────────

export async function getReposByTopic(
  topicId: string,
  options: {
    sort?: 'stars' | 'velocity_7d' | 'last_commit'
    category?: string
    limit?: number
    offset?: number
  } = {}
): Promise<Repo[]> {
  const { sort = 'stars', category, limit = 50, offset = 0 } = options

  let query = supabase
    .from('repos')
    .select('*')
    .eq('topic_id', topicId)
    .range(offset, offset + limit - 1)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (sort === 'stars') {
    query = query.order('stars', { ascending: false })
  } else if (sort === 'last_commit') {
    query = query.order('last_commit', { ascending: false })
  } else {
    // velocity_7d: stars DESC as proxy until velocity computed
    query = query.order('stars', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getRepoById(id: string): Promise<Repo | null> {
  const { data, error } = await supabase.from('repos').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function getRepoByGithubUrl(githubUrl: string): Promise<Repo | null> {
  const { data, error } = await supabase
    .from('repos')
    .select('*')
    .eq('github_url', githubUrl)
    .single()
  if (error) return null
  return data
}

export async function upsertRepo(repo: Omit<Repo, 'id' | 'created_at' | 'updated_at'>): Promise<Repo> {
  const { data, error } = await supabaseAdmin
    .from('repos')
    .upsert(
      { ...repo, updated_at: new Date().toISOString() },
      { onConflict: 'github_url', ignoreDuplicates: false }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

export async function getRepoSnapshots(repoId: string, days = 30): Promise<RepoSnapshot[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await supabase
    .from('repo_snapshots')
    .select('*')
    .eq('repo_id', repoId)
    .gte('snapped_at', since)
    .order('snapped_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertRepoSnapshot(repoId: string, stars: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('repo_snapshots')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ repo_id: repoId, stars, snapped_at: new Date().toISOString() } as any)
  if (error) throw error
}

export async function getTopicSnapshots(topicId: string, days = 90): Promise<TopicSnapshot[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await supabase
    .from('topic_snapshots')
    .select('*')
    .eq('topic_id', topicId)
    .gte('snapped_at', since)
    .order('snapped_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertTopicSnapshot(
  topicId: string,
  repoCount: number,
  totalStars: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabaseAdmin.from('topic_snapshots').insert({
    topic_id: topicId,
    repo_count: repoCount,
    total_stars: totalStars,
    snapped_at: new Date().toISOString(),
  } as any)
  if (error) throw error
}

// ─── Aggregates ───────────────────────────────────────────────────────────────

export async function getTopicStats(
  topicId: string
): Promise<{ repo_count: number; total_stars: number }> {
  const { data, error } = await supabase
    .from('repos')
    .select('stars')
    .eq('topic_id', topicId)
  if (error) throw error
  const repos = data ?? []
  return {
    repo_count: repos.length,
    total_stars: repos.reduce((sum, r) => sum + (r.stars ?? 0), 0),
  }
}

export async function getReposWithVelocity(
  topicId: string,
  limit = 20
): Promise<RepoWithVelocity[]> {
  // Fetch repos + their snapshots from the last 30d
  const repos = await getReposByTopic(topicId, { limit: 200 })
  if (repos.length === 0) return []

  const now = Date.now()
  const day7ago = new Date(now - 7 * 86400000).toISOString()
  const day30ago = new Date(now - 30 * 86400000).toISOString()

  const repoIds = repos.map((r) => r.id)
  const { data: snaps } = await supabase
    .from('repo_snapshots')
    .select('repo_id, stars, snapped_at')
    .in('repo_id', repoIds)
    .gte('snapped_at', day30ago)
    .order('snapped_at', { ascending: true })

  type SnapRow = { repo_id: string; stars: number; snapped_at: string }
  const snapsByRepo = new Map<string, SnapRow[]>()
  for (const s of (snaps ?? []) as SnapRow[]) {
    if (!snapsByRepo.has(s.repo_id)) snapsByRepo.set(s.repo_id, [])
    snapsByRepo.get(s.repo_id)!.push(s)
  }

  const withVelocity: RepoWithVelocity[] = repos.map((repo) => {
    const repoSnaps = snapsByRepo.get(repo.id) ?? []

    const snap7 = repoSnaps.find((s) => s.snapped_at >= day7ago)
    const snap30 = repoSnaps[0]
    const prevSnap7 = repoSnaps.find(
      (s) =>
        s.snapped_at < day7ago &&
        s.snapped_at >= new Date(now - 14 * 86400000).toISOString()
    )

    const velocity_7d = snap7 ? repo.stars - snap7.stars : 0
    const velocity_30d = snap30 ? repo.stars - snap30.stars : 0
    const prev7d = prevSnap7 ? (snap7 ? snap7.stars - prevSnap7.stars : 0) : 0
    const acceleration = velocity_7d - prev7d

    const daysSinceCommit = repo.last_commit
      ? (now - new Date(repo.last_commit).getTime()) / 86400000
      : 999
    const maintenance_score = Math.max(0, Math.round(100 - daysSinceCommit * 2))

    return { ...repo, velocity_7d, velocity_30d, acceleration, maintenance_score }
  })

  return withVelocity
    .sort((a, b) => b.velocity_7d - a.velocity_7d)
    .slice(0, limit)
}

export async function getRisingRepos(limit = 10): Promise<RepoWithVelocity[]> {
  // Pull from all active topics
  const { data: repos } = await supabase
    .from('repos')
    .select('*')
    .order('stars', { ascending: false })
    .limit(500)

  if (!repos || repos.length === 0) return []

  const day7ago = new Date(Date.now() - 7 * 86400000).toISOString()
  const repoIds = repos.map((r) => r.id)

  const { data: snaps } = await supabase
    .from('repo_snapshots')
    .select('repo_id, stars, snapped_at')
    .in('repo_id', repoIds)
    .gte('snapped_at', day7ago)
    .order('snapped_at', { ascending: true })

  type SnapRow2 = { repo_id: string; stars: number; snapped_at: string }
  const snapsByRepo = new Map<string, SnapRow2[]>()
  for (const s of (snaps ?? []) as SnapRow2[]) {
    if (!snapsByRepo.has(s.repo_id)) snapsByRepo.set(s.repo_id, [])
    snapsByRepo.get(s.repo_id)!.push(s)
  }

  const now = Date.now()
  const withV = repos.map((repo) => {
    const repoSnaps = snapsByRepo.get(repo.id) ?? []
    const oldest7 = repoSnaps[0]
    const velocity_7d = oldest7 ? repo.stars - oldest7.stars : 0
    const daysSinceCommit = repo.last_commit
      ? (now - new Date(repo.last_commit).getTime()) / 86400000
      : 999
    const maintenance_score = Math.max(0, Math.round(100 - daysSinceCommit * 2))
    return { ...repo, velocity_7d, velocity_30d: 0, acceleration: 0, maintenance_score }
  })

  return withV
    .filter((r) => r.velocity_7d > 0)
    .sort((a, b) => b.velocity_7d - a.velocity_7d)
    .slice(0, limit)
}
