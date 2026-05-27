import { NextRequest } from 'next/server'
import { ACTIVE_TOPICS } from '@/lib/topics'
import { searchRepos, fetchFileContent, detectConventionFiles, getRepoMeta, delay } from '@/lib/github'
import { parseSkillFile, parseClaudeFile } from '@/lib/parser'
import { classifyRepo } from '@/lib/classifier'
import { upsertRepo } from '@/lib/supabase'
import type { CrawlResult } from '@/types'

// Vercel cron secret guard
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev: allow without secret
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const topicId = url.searchParams.get('topic') // optional: crawl single topic
  const maxRepos = parseInt(url.searchParams.get('max') ?? '100')

  const targets = topicId
    ? ACTIVE_TOPICS.filter((t) => t.id === topicId)
    : ACTIVE_TOPICS

  if (targets.length === 0) {
    return Response.json({ error: 'No active topics found' }, { status: 400 })
  }

  const results: CrawlResult[] = []

  for (const topic of targets) {
    const result: CrawlResult = {
      topic_id: topic.id,
      repos_found: 0,
      repos_inserted: 0,
      repos_updated: 0,
      errors: [],
    }

    try {
      const ghRepos = await searchRepos(topic.query, maxRepos)
      result.repos_found = ghRepos.length

      for (const ghRepo of ghRepos) {
        try {
          const [owner, repoName] = ghRepo.full_name.split('/')

          // Code search returns minimal repo object without stars/forks/pushed_at.
          // Enrich with full metadata if stars is missing (=0 and no pushed_at).
          let stars = ghRepo.stargazers_count
          let forks = ghRepo.forks_count
          let pushedAt = ghRepo.pushed_at
          if (!stars && !pushedAt) {
            const meta = await getRepoMeta(owner, repoName)
            if (meta) {
              stars = meta.stargazers_count
              forks = meta.forks_count
              pushedAt = meta.pushed_at
            }
          }

          // Fetch convention file content for parsing + classification
          let fileContent: string | null = null
          if (topic.id === 'skills') {
            fileContent = await fetchFileContent(owner, repoName, 'SKILL.md')
          } else if (topic.id === 'claudemd') {
            fileContent = await fetchFileContent(owner, repoName, 'CLAUDE.md')
          }

          // Detect sibling convention files
          const detectedFiles = await detectConventionFiles(owner, repoName)

          // Parse + classify
          let structureScore: number | null = null
          let parsedName: string | null = null
          let parsedDescription: string | null = null

          if (fileContent) {
            if (topic.id === 'skills') {
              const parsed = parseSkillFile(fileContent)
              structureScore = parsed.structure_score
              parsedName = parsed.name
              parsedDescription = parsed.description
            } else if (topic.id === 'claudemd') {
              const parsed = parseClaudeFile(fileContent)
              structureScore = parsed.structure_score
              parsedName = parsed.name
              parsedDescription = parsed.description
            }
          }

          const { category, platform } = classifyRepo(
            ghRepo.name,
            ghRepo.description,
            fileContent
          )

          await upsertRepo({
            topic_id: topic.id,
            github_url: ghRepo.html_url,
            owner,
            repo: repoName,
            name: parsedName ?? ghRepo.name,
            description: parsedDescription ?? ghRepo.description,
            category,
            platform,
            stars,
            forks,
            last_commit: pushedAt,
            structure_score: structureScore,
            detected_files: detectedFiles,
          })

          result.repos_inserted++

          // Gentle rate limiting between repos
          await delay(500)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          result.errors.push(`${ghRepo.full_name}: ${msg}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`topic ${topic.id}: ${msg}`)
    }

    results.push(result)

    // Pause between topics to respect rate limits
    if (targets.indexOf(topic) < targets.length - 1) {
      await delay(3000)
    }
  }

  return Response.json({
    ok: true,
    crawled_at: new Date().toISOString(),
    results,
  })
}
