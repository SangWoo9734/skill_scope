/**
 * Strip common markdown syntax from a string, returning plain text.
 * Used for displaying repo descriptions in cards and detail pages.
 */
export function stripMarkdown(text: string): string {
  return text
    // Bold + italic combined (***text***)
    .replace(/\*{3}(.+?)\*{3}/g, '$1')
    // Bold (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Italic (*text* or _text_)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Inline code (`text`)
    .replace(/`(.+?)`/g, '$1')
    // Links ([label](url))
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Headings (## heading)
    .replace(/#{1,6}\s+/g, '')
    // Strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // HTML tags
    .replace(/<[^>]+>/g, '')
    // Multiple newlines → space
    .replace(/\n+/g, ' ')
    .trim()
}

/**
 * Format a number for compact display (1200 → 1.2k)
 */
export function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
