-- SkillScope DB Schema
-- Run this in the Supabase SQL Editor to initialize your database.

-- ─── Enable extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── topics ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  query       text NOT NULL,
  description text,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Seed initial topics
INSERT INTO topics (id, label, query, description, active) VALUES
  ('skills',    'Claude Skills', 'filename:SKILL.md',    'Claude Code / Cursor / Gemini CLI skill files',  true),
  ('claudemd',  'CLAUDE.md',     'filename:CLAUDE.md',   'Project-level Claude behavior instructions',     true),
  ('agentsmd',  'AGENTS.md',     'filename:AGENTS.md',   'Multi-agent coordination files',                 false),
  ('mcpjson',   'mcp.json',      'filename:mcp.json',    'MCP server configuration files',                 false),
  ('cursorrules', '.cursorrules', 'filename:.cursorrules', 'Cursor IDE AI behavior rules',                  false)
ON CONFLICT (id) DO NOTHING;

-- ─── repos ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repos (
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
);

CREATE INDEX IF NOT EXISTS repos_topic_id_idx    ON repos (topic_id);
CREATE INDEX IF NOT EXISTS repos_stars_idx        ON repos (stars DESC);
CREATE INDEX IF NOT EXISTS repos_category_idx     ON repos (category);
CREATE INDEX IF NOT EXISTS repos_last_commit_idx  ON repos (last_commit DESC);

-- ─── repo_snapshots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repo_snapshots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id    uuid REFERENCES repos(id) ON DELETE CASCADE,
  stars      int NOT NULL,
  snapped_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repo_snapshots_repo_id_idx    ON repo_snapshots (repo_id);
CREATE INDEX IF NOT EXISTS repo_snapshots_snapped_at_idx ON repo_snapshots (snapped_at DESC);

-- ─── topic_snapshots ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topic_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    text REFERENCES topics(id) ON DELETE CASCADE,
  repo_count  int NOT NULL,
  total_stars int NOT NULL,
  snapped_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS topic_snapshots_topic_id_idx    ON topic_snapshots (topic_id);
CREATE INDEX IF NOT EXISTS topic_snapshots_snapped_at_idx  ON topic_snapshots (snapped_at DESC);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_repos_updated_at ON repos;
CREATE TRIGGER set_repos_updated_at
  BEFORE UPDATE ON repos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Public read access; writes only via service role key.

ALTER TABLE topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE repos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read
CREATE POLICY "public read topics"          ON topics          FOR SELECT USING (true);
CREATE POLICY "public read repos"           ON repos           FOR SELECT USING (true);
CREATE POLICY "public read repo_snapshots"  ON repo_snapshots  FOR SELECT USING (true);
CREATE POLICY "public read topic_snapshots" ON topic_snapshots FOR SELECT USING (true);

-- Service role can do everything (bypasses RLS by default, but be explicit)
CREATE POLICY "service write topics"          ON topics          FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service write repos"           ON repos           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service write repo_snapshots"  ON repo_snapshots  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service write topic_snapshots" ON topic_snapshots FOR ALL USING (auth.role() = 'service_role');
