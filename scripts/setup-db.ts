/**
 * SkillScope DB setup script
 * Run: npx tsx scripts/setup-db.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars — load .env.local first')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── DDL statements (ordered for FK safety) ────────────────────────────────────
const DDL: string[] = [
  // extensions
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  // topics
  `CREATE TABLE IF NOT EXISTS topics (
    id          text PRIMARY KEY,
    label       text NOT NULL,
    query       text NOT NULL,
    description text,
    active      boolean DEFAULT true,
    created_at  timestamptz DEFAULT now()
  )`,

  // repos
  `CREATE TABLE IF NOT EXISTS repos (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id         text REFERENCES topics(id) ON DELETE CASCADE,
    github_url       text UNIQUE NOT NULL,
    owner            text NOT NULL,
    repo             text NOT NULL,
    name             text,
    description      text,
    category         text,
    platform         text,
    stars            int DEFAULT 0,
    forks            int DEFAULT 0,
    last_commit      timestamptz,
    structure_score  int,
    detected_files   text[] DEFAULT '{}',
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
  )`,

  // repo_snapshots
  `CREATE TABLE IF NOT EXISTS repo_snapshots (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id    uuid REFERENCES repos(id) ON DELETE CASCADE,
    stars      int NOT NULL,
    snapped_at timestamptz DEFAULT now()
  )`,

  // topic_snapshots
  `CREATE TABLE IF NOT EXISTS topic_snapshots (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id    text REFERENCES topics(id) ON DELETE CASCADE,
    repo_count  int NOT NULL,
    total_stars int NOT NULL,
    snapped_at  timestamptz DEFAULT now()
  )`,

  // indexes
  `CREATE INDEX IF NOT EXISTS repos_topic_id_idx    ON repos (topic_id)`,
  `CREATE INDEX IF NOT EXISTS repos_stars_idx        ON repos (stars DESC)`,
  `CREATE INDEX IF NOT EXISTS repos_category_idx     ON repos (category)`,
  `CREATE INDEX IF NOT EXISTS repos_last_commit_idx  ON repos (last_commit DESC)`,
  `CREATE INDEX IF NOT EXISTS repo_snapshots_repo_id_idx    ON repo_snapshots (repo_id)`,
  `CREATE INDEX IF NOT EXISTS repo_snapshots_snapped_at_idx ON repo_snapshots (snapped_at DESC)`,
  `CREATE INDEX IF NOT EXISTS topic_snapshots_topic_id_idx  ON topic_snapshots (topic_id)`,

  // updated_at trigger
  `CREATE OR REPLACE FUNCTION update_updated_at()
   RETURNS TRIGGER AS $$
   BEGIN NEW.updated_at = now(); RETURN NEW; END;
   $$ LANGUAGE plpgsql`,

  `DROP TRIGGER IF EXISTS set_repos_updated_at ON repos`,
  `CREATE TRIGGER set_repos_updated_at
   BEFORE UPDATE ON repos
   FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,

  // RLS
  `ALTER TABLE topics          ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE repos           ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE repo_snapshots  ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE topic_snapshots ENABLE ROW LEVEL SECURITY`,
]

// RLS policies (separate — IF NOT EXISTS not available for policies, use DO blocks)
const POLICIES: string[] = [
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='public read topics') THEN
       CREATE POLICY "public read topics" ON topics FOR SELECT USING (true);
     END IF;
   END $$`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='public read repos') THEN
       CREATE POLICY "public read repos" ON repos FOR SELECT USING (true);
     END IF;
   END $$`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='public read repo_snapshots') THEN
       CREATE POLICY "public read repo_snapshots" ON repo_snapshots FOR SELECT USING (true);
     END IF;
   END $$`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='public read topic_snapshots') THEN
       CREATE POLICY "public read topic_snapshots" ON topic_snapshots FOR SELECT USING (true);
     END IF;
   END $$`,
]

// Seed data
async function seedTopics() {
  const { error } = await supabase.from('topics').upsert([
    { id: 'skills',       label: 'Claude Skills', query: 'filename:SKILL.md',     description: 'Claude Code / Cursor / Gemini CLI skill files',  active: true  },
    { id: 'claudemd',     label: 'CLAUDE.md',     query: 'filename:CLAUDE.md',    description: 'Project-level Claude behavior instructions',      active: true  },
    { id: 'agentsmd',     label: 'AGENTS.md',     query: 'filename:AGENTS.md',    description: 'Multi-agent coordination files',                  active: false },
    { id: 'mcpjson',      label: 'mcp.json',      query: 'filename:mcp.json',     description: 'MCP server configuration files',                  active: false },
    { id: 'cursorrules',  label: '.cursorrules',  query: 'filename:.cursorrules', description: 'Cursor IDE AI behavior rules',                    active: false },
  ], { onConflict: 'id', ignoreDuplicates: true })

  if (error) throw error
  console.log('✓ Topics seeded')
}

async function runSQL(sql: string): Promise<void> {
  // Use the pg-meta REST endpoint that Supabase exposes with service role key
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ sql }),
  })
  if (!res.ok) {
    // Fallback: try the pg endpoint
    const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    })
    if (!res2.ok) {
      const body = await res2.text()
      throw new Error(`SQL failed: ${body.slice(0, 200)}`)
    }
  }
}

async function main() {
  console.log('🔧 Applying schema to Supabase...\n')

  // Try running DDL via pg endpoint
  for (const stmt of DDL) {
    const preview = stmt.trim().slice(0, 60).replace(/\s+/g, ' ')
    process.stdout.write(`  ${preview}… `)
    try {
      await runSQL(stmt)
      console.log('✓')
    } catch (e) {
      console.log(`⚠  (${(e as Error).message.slice(0, 80)})`)
    }
  }

  for (const stmt of POLICIES) {
    process.stdout.write(`  policy… `)
    try {
      await runSQL(stmt)
      console.log('✓')
    } catch (e) {
      console.log(`⚠  (${(e as Error).message.slice(0, 80)})`)
    }
  }

  // Seed topics (this uses the standard REST API — always works)
  console.log('\n📦 Seeding topics...')
  try {
    await seedTopics()
  } catch (e) {
    console.error('Topics seed failed — tables may not exist yet:', (e as Error).message)
    console.log('\n⚠️  DDL via REST not supported. Paste supabase/schema.sql in the SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/dqkseqtlmlbvifuqgpnk/sql/new\n')
    process.exit(1)
  }

  console.log('\n✅ DB setup complete!\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
