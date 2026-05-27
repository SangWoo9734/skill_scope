'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

export default function LangToggle() {
  const locale = useLocale()
  const router = useRouter()

  function toggle() {
    const next = locale === 'en' ? 'ko' : 'en'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="shrink-0 flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-semibold text-faint hover:text-muted hover:bg-surface transition-all duration-150 font-mono tracking-wider"
      aria-label="Toggle language"
    >
      {locale === 'en' ? 'KO' : 'EN'}
    </button>
  )
}
