const GITHUB_API = 'https://api.github.com'
const TOKEN = process.env.GITHUB_TOKEN

function githubHeaders(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`
  return h
}

async function githubFetch(url: string): Promise<Response> {
  const res = await fetch(url, { headers: githubHeaders() })
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('X-RateLimit-Reset')
    const wait = reset ? parseInt(reset) * 1000 - Date.now() : 60000
    throw new Error(`GitHub rate limit. Retry after ${Math.ceil(wait / 1000)}s`)
  }
  return res
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GithubRepo {
  id: number
  full_name: string
  owner: { login: string }
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  pushed_at: string
  html_url: string
  default_branch: string
}

export interface GithubSearchResult {
  total_count: number
  items: GithubRepo[]
}

// ─── Search ───────────────────────────────────────────────────────────────────

interface CodeSearchItem {
  repository: {
    id: number
    full_name: string
    owner: { login: string }
    name: string
    description: string | null
    stargazers_count: number
    forks_count: number
    pushed_at: string
    html_url: string
    default_branch: string
    private: boolean
  }
}

/**
 * Search GitHub via CODE search (filename:SKILL.md) to find repos
 * that actually contain the target file. Deduplicates repos and
 * returns GithubRepo[] sorted by stars.
 *
 * Code search: 10 req/min authenticated, max 1000 results.
 * Between pages we wait ~7s to stay within the limit.
 */
export async function searchRepos(
  query: string,
  maxRepos = 100
): Promise<GithubRepo[]> {
  const seenIds = new Set<number>()
  const repos: GithubRepo[] = []
  const perPage = 100
  let page = 1
  const maxPages = Math.ceil(Math.min(maxRepos * 3, 1000) / perPage) // over-fetch to get enough unique

  while (repos.length < maxRepos && page <= maxPages) {
    const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`
    const res = await githubFetch(url)

    if (res.status === 422) {
      // Fallback: try repository search (works for non-filename queries)
      return searchReposFallback(query, maxRepos)
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GitHub code search failed (${res.status}): ${text.slice(0, 200)}`)
    }

    const json: { total_count: number; items: CodeSearchItem[] } = await res.json()

    for (const item of json.items) {
      const r = item.repository
      if (!r || r.private || seenIds.has(r.id)) continue
      seenIds.add(r.id)
      repos.push({
        id: r.id,
        full_name: r.full_name,
        owner: r.owner,
        name: r.name,
        description: r.description,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        pushed_at: r.pushed_at,
        html_url: r.html_url,
        default_branch: r.default_branch ?? 'main',
      })
    }

    if (json.items.length < perPage) break
    page++

    // Code search: 10 req/min → wait 7s between pages
    if (page <= maxPages && repos.length < maxRepos) {
      await delay(7000)
    }
  }

  // Sort by stars descending (code search doesn't support sort=stars)
  return repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, maxRepos)
}

/** Fallback: repository search (for non-filename: queries) */
async function searchReposFallback(
  query: string,
  maxRepos: number
): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = []
  const perPage = Math.min(maxRepos, 100)
  let page = 1

  while (repos.length < maxRepos) {
    const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}&page=${page}`
    const res = await githubFetch(url)
    if (!res.ok) break
    const json: GithubSearchResult = await res.json()
    repos.push(...json.items)
    if (json.items.length < perPage || repos.length >= json.total_count) break
    page++
    await delay(2100)
  }

  return repos.slice(0, maxRepos)
}

// ─── File content ─────────────────────────────────────────────────────────────

/**
 * Fetch raw file content from a repo.
 * Returns null if file not found.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch = 'main'
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  const res = await fetch(url, { headers: githubHeaders() })
  if (!res.ok) {
    // Try default branch = master
    if (branch === 'main') return fetchFileContent(owner, repo, path, 'master')
    return null
  }
  return res.text()
}

/**
 * Check which convention files exist in a repo's root.
 */
const CONVENTION_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'SKILL.md',
  'mcp.json',
  '.cursorrules',
  'memory',
  'hooks',
  'evals',
]

export async function detectConventionFiles(
  owner: string,
  repo: string,
  branch = 'main'
): Promise<string[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=0`
  const res = await githubFetch(url)
  if (!res.ok) {
    if (branch === 'main') return detectConventionFiles(owner, repo, 'master')
    return []
  }
  const json = await res.json()
  const names: string[] = (json.tree ?? []).map((t: { path: string }) => t.path)
  return CONVENTION_FILES.filter((f) => names.includes(f))
}

// ─── Repo metadata ────────────────────────────────────────────────────────────

export async function getRepoMeta(owner: string, repo: string): Promise<GithubRepo | null> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}`
  const res = await githubFetch(url)
  if (!res.ok) return null
  return res.json()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export { delay }
