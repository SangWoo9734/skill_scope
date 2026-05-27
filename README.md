# SkillScope

> Track the evolution of AI-native development conventions.

Not which tools are "best" — but which conventions, workflows, and agent patterns are gaining momentum across the ecosystem.

**Stack**: Next.js 16 · Supabase · Recharts · Tailwind CSS · Vercel

---

## Setup

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) → New project
2. SQL Editor에서 `supabase/schema.sql` 전체 실행
3. Project Settings → API에서 URL / anon key / service role key 복사

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
# .env.local 편집 — Supabase + GitHub 값 채우기
```

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `GITHUB_TOKEN` | GitHub PAT (없으면 60 req/hr, 있으면 5000 req/hr) |
| `CRON_SECRET` | Cron endpoint 보호용 임의 문자열 |

### 3. 로컬 개발

```bash
npm install
npm run dev
```

### 4. 초기 데이터 수집

개발 서버 실행 후:

```bash
# 크롤링 (GitHub Search → Supabase)
curl http://localhost:3000/api/cron/crawl

# 스냅샷 저장 (velocity 계산용)
curl http://localhost:3000/api/cron/snapshot
```

특정 topic만 크롤링:
```bash
curl "http://localhost:3000/api/cron/crawl?topic=skills&max=50"
```

---

## 배포 (Vercel)

1. GitHub repo push
2. Vercel에서 import
3. Environment Variables에 `.env.local` 값 입력 (`CRON_SECRET` 포함)
4. 배포 완료 후 `vercel.json`의 cron이 자동 등록됨

**Cron 스케줄** (vercel.json):
- `0 2 * * *` — 매일 02:00 UTC 스냅샷 저장
- `0 3 * * 0` — 매주 일요일 03:00 UTC 전체 크롤링

---

## 폴더 구조

```
app/
  page.tsx                    # 홈 (Ecosystem Overview + Lifecycle 요약)
  lifecycle/page.tsx          # Topic Lifecycle Graph 전체
  trends/page.tsx             # Trend Velocity + Rising repos
  [topicId]/page.tsx          # Topic별 레포 목록 (정렬/필터)
  [topicId]/[repoId]/page.tsx # 레포 상세 + Star 히스토리
  api/cron/crawl/route.ts     # GitHub 크롤링 cron
  api/cron/snapshot/route.ts  # 일일 스냅샷 저장 cron
  api/repos/route.ts          # 레포 조회 API

lib/
  topics.ts      # TOPICS 정의 (확장 포인트)
  supabase.ts    # Supabase 클라이언트 + DB 헬퍼
  github.ts      # GitHub Search API 클라이언트
  parser.ts      # SKILL.md / CLAUDE.md 파서
  classifier.ts  # 카테고리 / 플랫폼 분류
  lifecycle.ts   # Lifecycle 상태 계산 + 차트 데이터

components/
  RepoCard.tsx            # 레포 카드
  LifecycleChart.tsx      # Topic 성장 곡선 (핵심)
  TrendChart.tsx          # Stars 히스토리 area chart
  EcosystemStats.tsx      # 통계 사이드바 + headline
  TopicTabs.tsx           # 네비게이션 탭
  DetectedConventions.tsx # Convention 파일 감지 표시

supabase/
  schema.sql  # 전체 DB 스키마 (여기서 시작)
```

---

## 새 Topic 추가

`lib/topics.ts`에 한 줄 추가:

```ts
{
  id: 'agentsmd',
  label: 'AGENTS.md',
  query: 'filename:AGENTS.md',
  description: 'Multi-agent coordination files',
  active: true,  // false → true로 변경하면 활성화
}
```

크롤링 + 스냅샷 cron이 자동으로 포함.

---

## 지표 정의

| 지표 | 공식 |
|------|------|
| velocity_7d | `stars_now − stars_7d_ago` |
| velocity_30d | `stars_now − stars_30d_ago` |
| acceleration | `velocity_7d(this week) − velocity_7d(last week)` |
| maintenance_score | `max(0, 100 − days_since_commit × 2)` |
| structure_score | frontmatter/name/description/examples/instructions 가중합 |

**Stars = 관심도 지표. 사용량이나 품질을 의미하지 않음.**
