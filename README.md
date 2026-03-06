# SEO Audit App — Next.js Web App

AI-powered SEO & SEM audit tool with user authentication, PostgreSQL history tracking, and score progress comparison.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** NextAuth v5 (credentials, JWT)
- **Database:** PostgreSQL + Prisma ORM
- **Crawler:** TypeScript port using Cheerio (replaces Python requests/BeautifulSoup)
- **AI Providers:** Anthropic Claude + Google Gemini
- **Styling:** Tailwind CSS
- **Charts:** Recharts

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

AUTH_SECRET="$(openssl rand -hex 32)"
AUTH_URL="http://localhost:3000"

# 32-byte hex key for encrypting stored API keys
ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
```

### 3. Set up the database

```bash
pnpm db:push       # push schema to DB (no migration history)
# or
pnpm db:migrate    # create a migration file
```

### 4. Generate Prisma client

```bash
pnpm db:generate
```

### 5. Run dev server

```bash
pnpm dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## Usage

1. **Register** an account at `/register`
2. **Add API keys** in Settings (Claude and/or Gemini)
3. **Create a project** — name + URL of the website to audit
4. **Run an audit** — pick provider, click Start, watch live progress
5. **View results** — scores, checks, quick wins, ad groups
6. **Track progress** — run multiple audits to see score trend charts

## Scoring

Scores are computed **deterministically from a fixed rubric** — AI assigns PASS/WARN/FAIL per check, Python weights compute the final score. This means scores are always comparable across runs and providers.

| Category  | Weight |
|-----------|--------|
| Technical | 40%    |
| Content   | 35%    |
| SEM       | 25%    |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/projects` | List / create projects |
| GET/DELETE | `/api/projects/[id]` | Get / delete project |
| POST | `/api/audits/run` | Start streaming audit (SSE) |
| GET | `/api/audits/[id]` | Get audit results |
| GET/PATCH | `/api/settings` | User settings + API keys |

## Database Schema

```
User → Project → AuditRun → AuditCheck (many)
                          → AuditMeta  (one)
```

## Future Features

- [ ] DOCX report export (port from Python using `docx` npm package)
- [ ] Side-by-side run comparison view (`/audits/[id]/compare`)
- [ ] Email notifications when audit completes
- [ ] Scheduled/recurring audits (cron)
- [ ] Multi-page crawl (not just homepage)
- [ ] PDF export
- [ ] Shareable public report links
- [ ] Team / organisation support

## Deployment

### Coolify / Docker

The app runs on Node 20+. Set all env vars in Coolify dashboard.

```bash
pnpm build
pnpm start
```

### Vercel

Push to GitHub and connect to Vercel. Set env vars in project settings.
Note: Streaming audit route requires `maxDuration = 300` — needs Vercel Pro plan.
On Hobby plan, use a separate background worker instead.

## Development Notes

- API keys are encrypted with AES-256-GCM before being stored in the DB
- The crawler rewrites the Python `SEOCrawler` class in TypeScript using `cheerio`
- SSE streaming (Server-Sent Events) provides real-time audit progress
- The fixed scoring rubric in `src/lib/constants.ts` must stay in sync with the weights if you update checks
