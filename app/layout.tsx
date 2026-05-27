import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import TopicTabs from '@/components/TopicTabs'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#080a0f] text-white">
        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#080a0f]/90 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-white text-base tracking-tight">SkillScope</span>
                <span className="hidden sm:inline text-xs text-white/25 font-normal mt-px">
                  ecosystem intelligence
                </span>
              </Link>
              <TopicTabs topics={ACTIVE_TOPICS} />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.05] py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-white/25">
            <span>SkillScope · Stars = interest signal, not usage</span>
            <span>Data from GitHub Search API</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
