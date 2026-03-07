# SEO/SEM Audit Report

AI-powered SEO & SEM audit tool. Crawl any URL, run it through Claude or Gemini, and get a scored audit report with actionable recommendations, Core Web Vitals, score history, and DOCX export.

---

## Features

- **AI-powered audit** — Claude or Gemini analyzes crawled page data and returns structured findings
- **Deterministic scoring** — fixed rubric (Technical 40% / Content 35% / SEM 25%) ensures scores are always comparable across runs and providers
- **PageSpeed Insights** — mobile + desktop Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index) with detailed audit items
- **Score trends** — area chart + summary cards tracking score history across multiple runs
- **Audit history** — filterable, sortable table with multi-select bulk delete
- **DOCX export** — full report export including PSI data and audit checks
- **Project & page management** — organize audits by project and track multiple pages per site
- **Dashboard** — recent audit activity across all projects
- **Team management** — admin can invite members, set roles (Admin/Member), edit, and remove
- **API key encryption** — Claude and Gemini keys stored with AES-256-GCM encryption

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v5 beta (credentials + JWT) |
| Database | PostgreSQL + Prisma ORM |
| Crawler | Cheerio (HTML parsing + PSI API) |
| AI Providers | Anthropic Claude SDK, Google Generative AI |
| Charts | Recharts |
| Export | docx |
| Validation | Zod |
| Icons | Lucide React |

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgres://myuser:mypassword@localhost:5432/seoaudit"

AUTH_SECRET="your-secret-here"   # openssl rand -hex 32
AUTH_URL="http://localhost:3000"

# 32-byte hex key for AES-256-GCM encryption of stored API keys
ENCRYPTION_KEY="your-64-char-hex-string"   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the database

```bash
docker compose up -d   # PostgreSQL on port 5432
```

### 4. Push schema and generate Prisma client

```bash
pnpm db:push
pnpm db:generate
```

### 5. Run the dev server

```bash
pnpm dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

---

## Usage

1. **Register** at `/register` — the first account becomes the organization Admin
2. **Add API keys** in Settings → paste your Gemini (or Claude) API key
3. **Create a project** at `/projects` — name + root domain
4. **Add pages** inside the project — each page has its own audit history
5. **Run an audit** — real-time progress via SSE streaming
6. **View results** — score cards, PSI Core Web Vitals, checks table, quick wins, ad groups
7. **Track trends** — run multiple audits to see the score trend chart
8. **Export** — download a DOCX report from any audit result page

---

## Scoring

Scores are computed **deterministically from a fixed rubric** — AI assigns PASS / WARN / FAIL per check, and weighted math computes the final score. This makes scores consistent across runs and providers.

| Category | Weight | Checks |
|---|---|---|
| Technical SEO | 40% | 16 checks |
| Content SEO | 35% | 14 checks |
| SEM Readiness | 25% | 11 checks |

**Grade scale:** A (90+) · A- (85+) · B+ (80+) · B (70+) · C (60+) · D (50+) · F (<50)

**Score badges:** green ≥80 · amber 60–79 · red <60

---

## Database Schema

```
Organization
  └── OrganizationMember (userId, role: ADMIN|MEMBER, status: PENDING|ACTIVE)
  └── Project
        └── Page
              └── AuditRun
                    ├── AuditCheck[]   (section, name, status, finding, recommendation)
                    └── AuditMeta      (scores, summary, PSI data, quick wins, ad groups)

User
  ├── memberships → OrganizationMember[]
  └── encrypted API keys (claudeApiKey, geminiApiKey)
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/projects` | List / create projects |
| GET/DELETE | `/api/projects/[id]` | Get / delete project |
| GET/POST | `/api/projects/[id]/pages` | List / add pages |
| GET/DELETE | `/api/projects/[id]/pages/[pageId]` | Get / delete page |
| POST | `/api/audits/run` | Start streaming audit (SSE) |
| GET/DELETE | `/api/audits/[id]` | Get / delete audit run |
| GET | `/api/audits/[id]/export` | Download DOCX report |
| DELETE | `/api/audits/bulk-delete` | Bulk delete audit runs |
| GET/PATCH | `/api/settings` | User settings + API keys |
| GET/POST/PATCH | `/api/admin/members` | Team member management (admin only) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login + Register
│   ├── (dashboard)/
│   │   ├── dashboard/       # Recent audits overview
│   │   ├── projects/        # Projects list + new project form
│   │   ├── projects/[id]/   # Project detail + pages list
│   │   ├── projects/[id]/pages/[pageId]/       # Page detail + audit history
│   │   ├── projects/[id]/pages/[pageId]/run/   # Audit runner
│   │   ├── audits/[id]/     # Audit result detail
│   │   └── settings/        # API keys, model preferences, team management
│   └── api/                 # All API routes
├── components/
│   ├── audit/               # ScoreCard, ChecksTable, PsiSection, AuditHistoryTable, ScoreTrendChart
│   └── layout/              # Sidebar, Header
└── lib/
    ├── analyzer.ts          # AI prompt builders (Claude + Gemini)
    ├── crawler.ts           # SEOCrawler + PageSpeed Insights fetcher
    ├── constants.ts         # Scoring rubric (check names + weights)
    ├── scoring.ts           # Deterministic score calculator
    ├── report.ts            # DOCX report generator
    └── encrypt.ts           # AES-256-GCM API key encryption
```

---

## Development

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm lint         # ESLint
pnpm type-check   # TypeScript check
pnpm db:push      # push schema changes
pnpm db:migrate   # create migration
pnpm db:studio    # open Prisma Studio
pnpm db:seed      # seed database
```

---

## Deployment

### Coolify / Docker

Set all env vars in the Coolify dashboard, then:

```bash
pnpm build
pnpm start
```

### Vercel

Push to GitHub and connect to Vercel. Set env vars in project settings.

> **Note:** The streaming audit route (`/api/audits/run`) uses SSE and requires `maxDuration = 300`. This needs a Vercel Pro plan. On Hobby, use a separate background worker.

---

## Roadmap

- [ ] Side-by-side audit comparison view
- [ ] Scheduled / recurring audits
- [ ] Email notifications on audit completion
- [ ] PDF export
- [ ] Shareable public report links
- [ ] Multi-page bulk audit runner
