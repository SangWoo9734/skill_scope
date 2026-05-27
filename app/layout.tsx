import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale, getTranslations } from 'next-intl/server'
import './globals.css'
import TopicTabs from '@/components/TopicTabs'
import ThemeProvider from '@/components/ThemeProvider'
import ThemeToggle from '@/components/ThemeToggle'
import LangToggle from '@/components/LangToggle'
import { ACTIVE_TOPICS } from '@/lib/topics'
import Link from 'next/link'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SkillScope — AI-native development convention trends',
  description:
    'Track which Claude Skills, CLAUDE.md patterns, and AI development conventions are gaining momentum across the ecosystem.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const t = await getTranslations('Layout')

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-page text-foreground">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {/* Nav */}
            <header
              className="sticky top-0 z-50 border-b border-line backdrop-blur-sm"
              style={{ background: 'var(--c-nav)' }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-4 h-14">
                  <Link href="/" className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-foreground text-base tracking-tight">SkillScope</span>
                    <span className="hidden lg:inline text-xs text-faint font-normal mt-px">
                      {t('tagline')}
                    </span>
                  </Link>
                  <div className="flex-1 overflow-x-auto scrollbar-none">
                    <TopicTabs topics={ACTIVE_TOPICS} />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <LangToggle />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </header>

            {/* Main */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-line py-6">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-faint">
                <span>SkillScope · {t('footer_signal')}</span>
                <span>{t('footer_source')}</span>
              </div>
            </footer>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
