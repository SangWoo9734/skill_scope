import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const topicId = searchParams.get('topic')
  const category = searchParams.get('category')
  const sort = (searchParams.get('sort') ?? 'stars') as 'stars' | 'last_commit'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const search = searchParams.get('q')

  let query = supabase.from('repos').select('*', { count: 'exact' })

  if (topicId) query = query.eq('topic_id', topicId)
  if (category && category !== 'all') query = query.eq('category', category)
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (sort === 'last_commit') {
    query = query.order('last_commit', { ascending: false })
  } else {
    query = query.order('stars', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ repos: data ?? [], total: count ?? 0, offset, limit })
}
