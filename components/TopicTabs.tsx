'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Topic } from '@/types'

interface TopicTabsProps {
  topics: Topic[]
}

export default function TopicTabs({ topics }: TopicTabsProps) {
  const pathname = usePathname()
  const activeTopics = topics.filter((t) => t.active)

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      <TabLink href="/" label="Overview" pathname={pathname} exact />
      {activeTopics.map((topic) => (
        <TabLink
          key={topic.id}
          href={`/${topic.id}`}
          label={topic.label}
          pathname={pathname}
        />
      ))}
      <TabLink href="/trends" label="Trending" pathname={pathname} />
      <TabLink href="/lifecycle" label="Lifecycle" pathname={pathname} />
    </div>
  )
}

function TabLink({
  href,
  label,
  pathname,
  exact = false,
}: {
  href: string
  label: string
  pathname: string
  exact?: boolean
}) {
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-active text-foreground'
          : 'text-muted hover:text-sub hover:bg-surf-hi'
      }`}
    >
      {label}
    </Link>
  )
}
