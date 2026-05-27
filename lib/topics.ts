import type { Topic } from '@/types'

export const TOPICS: Topic[] = [
  {
    id: 'skills',
    label: 'Claude Skills',
    query: 'filename:SKILL.md',
    description: 'Claude Code / Cursor / Gemini CLI skill files',
    active: true,
  },
  {
    id: 'claudemd',
    label: 'CLAUDE.md',
    query: 'filename:CLAUDE.md',
    description: 'Project-level Claude behavior instructions',
    active: true,
  },
  {
    id: 'agentsmd',
    label: 'AGENTS.md',
    query: 'filename:AGENTS.md',
    description: 'Multi-agent coordination files',
    active: true,
  },
  {
    id: 'mcpjson',
    label: 'mcp.json',
    query: 'filename:mcp.json path:.claude',
    description: 'MCP server configuration files',
    active: false,
  },
  {
    id: 'cursorrules',
    label: '.cursorrules',
    query: 'filename:.cursorrules',
    description: 'Cursor IDE AI behavior rules',
    active: false,
  },
]

export const ACTIVE_TOPICS = TOPICS.filter((t) => t.active)

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id)
}
