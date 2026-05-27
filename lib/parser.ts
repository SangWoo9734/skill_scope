import matter from 'gray-matter'
import type { ParsedSkillFile } from '@/types'

// ─── SKILL.md parser ──────────────────────────────────────────────────────────

export function parseSkillFile(content: string): ParsedSkillFile {
  const file_size = content.length

  let frontmatterData: Record<string, unknown> = {}
  let body = content
  let has_frontmatter = false

  try {
    const parsed = matter(content)
    frontmatterData = parsed.data ?? {}
    body = parsed.content ?? content
    has_frontmatter = Object.keys(frontmatterData).length > 0
  } catch {
    // not valid frontmatter
  }

  const name =
    (frontmatterData['name'] as string | null) ??
    extractFirstH1(body) ??
    null

  const description =
    (frontmatterData['description'] as string | null) ??
    extractFirstParagraph(body) ??
    null

  const platform =
    (frontmatterData['platform'] as string | null) ??
    (frontmatterData['platforms'] as string | null) ??
    inferPlatform(body) ??
    null

  const has_name = !!name
  const description_length = description?.length ?? 0
  const has_examples = /```/.test(body) || /##\s*example/i.test(body)
  const has_instructions =
    /##\s*(usage|instruction|how to|getting started|steps)/i.test(body) ||
    /\d+\.\s/.test(body)

  const structure_score = calcStructureScore({
    has_frontmatter,
    has_name,
    description_length,
    has_examples,
    has_instructions,
    file_size,
  })

  return {
    name,
    description,
    platform,
    has_frontmatter,
    has_name,
    has_examples,
    has_instructions,
    description_length,
    file_size,
    structure_score,
  }
}

function calcStructureScore(fields: {
  has_frontmatter: boolean
  has_name: boolean
  description_length: number
  has_examples: boolean
  has_instructions: boolean
  file_size: number
}): number {
  let score = 0
  if (fields.has_frontmatter) score += 20
  if (fields.has_name) score += 10
  // description: 0-20 pts, capped at 100 chars
  score += Math.min(20, Math.round((fields.description_length / 100) * 20))
  if (fields.has_examples) score += 20
  if (fields.has_instructions) score += 15
  // file size: 0-15 pts, capped at 2000 chars
  score += Math.min(15, Math.round((fields.file_size / 2000) * 15))
  return Math.min(100, score)
}

// ─── CLAUDE.md parser ─────────────────────────────────────────────────────────

export interface ParsedClaudeFile {
  name: string | null
  description: string | null
  has_instructions: boolean
  has_examples: boolean
  file_size: number
  structure_score: number
}

export function parseClaudeFile(content: string): ParsedClaudeFile {
  const file_size = content.length
  const name = extractFirstH1(content)
  const description = extractFirstParagraph(content)
  const has_examples = /```/.test(content)
  const has_instructions =
    /##\s*(instruction|rule|guideline|how|usage|behavior)/i.test(content) ||
    /- \[/.test(content)

  let score = 0
  if (name) score += 15
  if (description && description.length > 50) score += 20
  if (has_instructions) score += 30
  if (has_examples) score += 20
  score += Math.min(15, Math.round((file_size / 2000) * 15))

  return {
    name,
    description,
    has_instructions,
    has_examples,
    file_size,
    structure_score: Math.min(100, score),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractFirstH1(text: string): string | null {
  const match = text.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function extractFirstParagraph(text: string): string | null {
  // Skip headings and code blocks, return first non-empty text paragraph
  const lines = text.split('\n')
  const paras: string[] = []
  let inCode = false

  for (const line of lines) {
    if (line.startsWith('```')) { inCode = !inCode; continue }
    if (inCode) continue
    if (line.startsWith('#') || line.startsWith('---')) continue
    if (line.trim().length > 20) paras.push(line.trim())
    if (paras.length > 0) break
  }

  return paras[0] ?? null
}

function inferPlatform(body: string): string | null {
  const lower = body.toLowerCase()
  if (lower.includes('claude code') || lower.includes('claude-code')) return 'Claude Code'
  if (lower.includes('cursor')) return 'Cursor'
  if (lower.includes('gemini cli') || lower.includes('gemini-cli')) return 'Gemini CLI'
  if (lower.includes('copilot')) return 'GitHub Copilot'
  return null
}
