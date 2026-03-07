# SEO/SEM Audit Report

## Project Overview
Web app that crawls a URL, sends the extracted data to an AI provider (Claude or Gemini), and produces a scored SEO/SEM audit report with actionable recommendations. Users manage projects with multiple pages, run audits, view results with score trends, and export DOCX reports.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (brand color: blue `#1F4E79`)
- **Database:** PostgreSQL (Docker) with Prisma ORM
- **Auth:** NextAuth.js v5 beta (credentials provider, JWT sessions)
- **AI Providers:** Anthropic Claude SDK, Google Generative AI (Gemini)
- **Crawling:** Cheerio (HTML parsing)
- **Charts:** Recharts
- **Export:** docx (DOCX generation)
- **Validation:** Zod
- **Icons:** Lucide React

## Project Structure
```
src/
├── app/
│   ├── (auth)/              # Login + Register pages
│   ├── (dashboard)/         # Protected: Dashboard, Projects, Audit Results, Settings
│   │   ├── audits/[id]/     # Audit result detail page
│   │   ├── dashboard/       # Main dashboard
│   │   ├── projects/[id]/   # Project detail, page management, audit runner
│   │   └── settings/        # User settings (API keys, model preferences)
│   └── api/
│       ├── audits/          # Run audit (SSE streaming), delete, export DOCX
│       ├── auth/            # NextAuth handlers + register endpoint
│       ├── projects/        # CRUD for projects and pages
│       └── settings/        # User settings API
├── components/
│   ├── audit/               # ScoreCard, ChecksTable, QuickWinsTable, ScoreTrendChart, AuditProgress
│   └── layout/              # Header, Sidebar
├── lib/
│   ├── analyzer.ts          # AI analysis (Claude + Gemini prompt builders)
│   ├── auth.ts              # NextAuth config with Prisma adapter
│   ├── constants.ts         # Scoring rubric (check names + weights)
│   ├── crawler.ts           # SEOCrawler class (Cheerio-based)
│   ├── db.ts                # Prisma client singleton
│   ├── encrypt.ts           # AES-256-GCM for API key storage
│   ├── report.ts            # DOCX report generator
│   ├── scoring.ts           # Deterministic rubric-based scoring
│   └── utils.ts             # Shared utilities
├── types/
│   └── audit.ts             # Core types: CrawlData, AnalysisResult, AuditStreamEvent
prisma/
├── schema.prisma            # DB schema (User, Project, Page, AuditRun, AuditCheck, AuditMeta)
└── seed.ts                  # Database seeder
middleware.ts                # Auth redirect middleware
```

## Commands
- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
- `pnpm type-check` — Run TypeScript type checker
- `pnpm db:push` — Push Prisma schema to DB
- `pnpm db:migrate` — Run Prisma migrations
- `pnpm db:seed` — Seed database
- `pnpm db:studio` — Open Prisma Studio
- `pnpm db:generate` — Regenerate Prisma client

## Environment Variables
Defined in `.env` (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret (generated via `openssl rand -hex 32`)
- `AUTH_URL` — App URL (default `http://localhost:3000`)
- `ENCRYPTION_KEY` — 64-char hex string for AES-256-GCM API key encryption

User API keys (Claude/Gemini) are stored encrypted in the `User` table, not in env vars.

## Key Architecture

### Audit Pipeline
1. **Crawl** — `SEOCrawler` fetches the URL, extracts HTML metadata, links, images, schema, forms, robots.txt, sitemap (`src/lib/crawler.ts`)
2. **Analyze** — Crawl data sent to Claude or Gemini with a structured prompt; AI returns JSON matching `AnalysisResult` (`src/lib/analyzer.ts`)
3. **Score** — AI-assigned scores are overridden by deterministic rubric-based scoring for consistency (`src/lib/scoring.ts`)
4. **Save** — Results persisted to `AuditRun`, `AuditCheck`, `AuditMeta` tables
5. **Stream** — Entire flow runs via SSE (`/api/audits/run`) with typed `AuditStreamEvent` updates

### Scoring System
- **3 sections:** Technical SEO (16 checks), Content SEO (14 checks), SEM Readiness (11 checks)
- **Status values:** PASS=1.0, WARN=0.5, FAIL=0.0
- **Weighted scoring:** Each check has a fixed weight defined in `src/lib/constants.ts`
- **Overall:** Technical 40% + Content 35% + SEM 25%
- **Grades:** A (90+), A- (85+), B+ (80+), B (70+), C (60+), D (50+), F (<50)

### Auth Flow
- NextAuth v5 beta with Prisma adapter and JWT strategy
- Credentials provider (email + bcrypt-hashed password)
- Middleware redirects unauthenticated users to `/login`
- API keys encrypted with AES-256-GCM before storage

## Database
- PostgreSQL running in Docker (`myuser`/`mypassword` on port 5432, database `seoaudit`)
- Models: User, Project, Page, AuditRun, AuditCheck, AuditMeta, Account, Session, VerificationToken
- Cascade deletes: User -> Project -> Page -> AuditRun -> AuditCheck/AuditMeta

## Design
- Clean professional UI with gray-50 background
- Brand palette: blue tones (`brand-50` to `brand-900`, primary `#1F4E79`)
- Sidebar navigation for dashboard layout
