interface DetectedConventionsProps {
  files: string[]
}

const FILE_ICONS: Record<string, string> = {
  'CLAUDE.md': '🤖',
  'AGENTS.md': '🕸',
  'SKILL.md': '⚡',
  'mcp.json': '🔌',
  '.cursorrules': '🎯',
  'memory': '🧠',
  'hooks': '🪝',
  'evals': '📊',
}

const FILE_LABELS: Record<string, string> = {
  'CLAUDE.md': 'CLAUDE.md',
  'AGENTS.md': 'AGENTS.md',
  'SKILL.md': 'SKILL.md',
  'mcp.json': 'mcp.json',
  '.cursorrules': '.cursorrules',
  'memory': 'memory/',
  'hooks': 'hooks/',
  'evals': 'evals/',
}

export default function DetectedConventions({ files }: DetectedConventionsProps) {
  if (files.length === 0) {
    return (
      <div className="text-xs text-faint py-2">
        No convention files detected in this repo&apos;s root.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-faint">
        Also found in this repo:
      </p>
      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <div
            key={file}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono"
          >
            <span>{FILE_ICONS[file] ?? '📄'}</span>
            <span>{FILE_LABELS[file] ?? file}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-faint pt-1">
        Convention co-occurrence analysis coming soon — tracking which files appear together.
      </p>
    </div>
  )
}
