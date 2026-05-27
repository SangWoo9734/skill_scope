import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export type Locale = 'en' | 'ko'
export const LOCALES: Locale[] = ['en', 'ko']
export const DEFAULT_LOCALE: Locale = 'en'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? DEFAULT_LOCALE
  const locale: Locale = (LOCALES.includes(raw as Locale) ? raw : DEFAULT_LOCALE) as Locale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
