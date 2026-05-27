export type LifecycleStatus = 'emerging' | 'growing' | 'plateau' | 'declining'

export interface Topic {
  id: string
  label: string
  query: string
  description: string
  active: boolean
}

export interface Repo {
  id: string
  topic_id: string
  github_url: string
  owner: string
  repo: string
  name: string | null
  description: string | null
  category: string | null
  platform: string | null
  stars: number
  forks: number
  last_commit: string | null
  structure_score: number | null
  detected_files: string[]
  created_at: string
  updated_at: string
}

export interface RepoSnapshot {
  id: string
  repo_id: string
  stars: number
  snapped_at: string
}

export interface TopicSnapshot {
  id: string
  topic_id: string
  repo_count: number
  total_stars: number
  snapped_at: string
}

export interface RepoWithVelocity extends Repo {
  velocity_7d: number
  velocity_30d: number
  acceleration: number
  maintenance_score: number
}

export interface TopicWithStats extends Topic {
  repo_count: number
  total_stars: number
  velocity_30d_pct: number
  status: LifecycleStatus
  snapshots: TopicSnapshot[]
}

export interface ParsedSkillFile {
  name: string | null
  description: string | null
  platform: string | null
  has_frontmatter: boolean
  has_name: boolean
  has_examples: boolean
  has_instructions: boolean
  description_length: number
  file_size: number
  structure_score: number
}

export interface CrawlResult {
  topic_id: string
  repos_found: number
  repos_inserted: number
  repos_updated: number
  errors: string[]
}

export type SortOption = 'stars' | 'velocity_7d' | 'last_commit'
export type CategoryOption =
  | 'all'
  | 'Security'
  | 'Frontend'
  | 'Testing'
  | 'Workflow'
  | 'AI/Agents'
  | 'Docs'
  | 'Utility'
