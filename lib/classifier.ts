// ─── Category classification ─────────────────────────────────────────────────

const CATEGORY_RULES: Array<{ label: string; keywords: string[] }> = [
  {
    label: 'Security',
    keywords: ['security', 'vulnerability', 'audit', 'semgrep', 'codeql', 'pentest', 'sast', 'secret', 'owasp'],
  },
  {
    label: 'Frontend',
    keywords: ['react', 'vue', 'svelte', 'angular', 'css', 'ui', 'component', 'design', 'tailwind', 'nextjs', 'nuxt', 'frontend', 'html'],
  },
  {
    label: 'Testing',
    keywords: ['test', 'playwright', 'jest', 'e2e', 'vitest', 'cypress', 'unittest', 'tdd', 'spec', 'assertion'],
  },
  {
    label: 'Workflow',
    keywords: ['automation', 'ci', 'cd', 'pipeline', 'deploy', 'git', 'github actions', 'workflow', 'devops', 'release'],
  },
  {
    label: 'AI/Agents',
    keywords: ['llm', 'agent', 'mcp', 'rag', 'embedding', 'prompt', 'openai', 'claude', 'anthropic', 'langchain', 'ai', 'gpt', 'model'],
  },
  {
    label: 'Docs',
    keywords: ['documentation', 'readme', 'markdown', 'writing', 'docs', 'wiki', 'changelog', 'docstring'],
  },
  {
    label: 'Utility',
    keywords: ['file', 'convert', 'format', 'parse', 'scrape', 'util', 'helper', 'tool', 'script', 'cli'],
  },
]

export function classifyCategory(
  text: string,
  fallback = 'Utility'
): string {
  const lower = (text ?? '').toLowerCase()

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.label
    }
  }

  return fallback
}

// ─── Platform classification ─────────────────────────────────────────────────

const PLATFORM_RULES: Array<{ label: string; keywords: string[] }> = [
  {
    label: 'Claude Code',
    keywords: ['claude code', 'claude-code', 'anthropic', 'skill.md', 'claude.md'],
  },
  {
    label: 'Cursor',
    keywords: ['cursor', '.cursorrules', 'cursor ide', 'cursorignore'],
  },
  {
    label: 'Gemini CLI',
    keywords: ['gemini cli', 'gemini-cli', 'google gemini', 'gemini code'],
  },
  {
    label: 'GitHub Copilot',
    keywords: ['copilot', 'github copilot', '.github/copilot'],
  },
  {
    label: 'Windsurf',
    keywords: ['windsurf', '.windsurfrules'],
  },
]

export function classifyPlatform(text: string): string | null {
  const lower = (text ?? '').toLowerCase()

  for (const rule of PLATFORM_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.label
    }
  }

  return null
}

/**
 * Classify both category and platform from repo description + name.
 */
export function classifyRepo(
  name: string,
  description: string | null,
  fileContent: string | null
): { category: string; platform: string | null } {
  const combined = [name, description, fileContent].filter(Boolean).join(' ')
  return {
    category: classifyCategory(combined),
    platform: classifyPlatform(combined),
  }
}
