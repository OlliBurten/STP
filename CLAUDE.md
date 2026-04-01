# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Transportplattformen** (acronym: STP — Sveriges Transportplattform) — a Swedish job marketplace connecting professional truck drivers with companies. Drivers browse and apply to jobs; companies post listings and contact drivers directly (no staffing agencies). UI content is in Swedish. The legacy repo/package name is "drivermatch" but the platform brand is STP/Transportplattformen.

## Commands

### Frontend (project root)
```bash
npm run dev        # Vite dev server → localhost:5173
npm run build      # Production build
npm run lint       # ESLint check
npm run e2e        # Playwright E2E tests (requires dev server running)
npm run e2e:ui     # Playwright UI mode for debugging
npx playwright test --project=chromium  # Single-browser E2E run
```

### Backend (server/)
```bash
npm run dev        # Express with --watch → localhost:3001
npm run test       # API tests (Node native test runner)
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:push       # Sync schema to database (no migration file)
npm run db:migrate    # Create a new migration file
npm run db:seed       # Create test users: driver@example.com / company@example.com (password: password123)
npm run db:seed:demo  # Load full demo dataset (10 companies, 18 drivers, 28 jobs)
```

### Local full-stack setup
```bash
# Terminal 1 — backend
cd server && cp .env.example .env  # set DATABASE_URL, JWT_SECRET, ADMIN_EMAILS, FRONTEND_URL
npx prisma generate && npx prisma db push
npm run dev

# Terminal 2 — frontend
echo "VITE_API_URL=http://localhost:3001" > .env
npm run dev
```

### Deployment
```bash
npx vercel          # Deploy preview
npx vercel --prod   # Deploy to production (transportplattformen.se)
vercel env add <NAME> production   # Add/update env var
vercel env ls                      # List env vars
```

## Architecture

The app is a **React SPA + Express REST API** separated into two deployed services.

### Frontend (`src/`)
- **`pages/`** — 35+ route-level components (Home, JobList, JobDetail, DriverSearch, Admin, etc.)
- **`components/`** — Shared UI (Header, JobCard, DriverCard, Filters, OAuthButtons, etc.)
- **`context/`** — `AuthContext`, `ProfileContext`, `ChatContext` for global state
- **`api/`** — Client-side API abstraction modules (one file per domain: auth.js, jobs.js, admin.js, etc.)
- **`utils/`** — Matching logic (`matchUtils.js`), job helpers, driver profile requirements, segment metrics
- **`index.css`** — Global styles + CSS design tokens (colors, fonts)

### Backend (`server/`)
- **`server.js`** — Main Express app entry point
- **`routes/`** — 13 routers mounted at `/api/*`:
  - `auth.js` — Registration, login, OAuth (Google/Microsoft), email verification, password reset
  - `jobs.js` — Job CRUD, filtering, search
  - `profile.js` — Driver profile management
  - `drivers.js` — Driver search with filters
  - `companies.js` — Company profiles, organization management
  - `conversations.js` — Driver ↔ company messaging
  - `admin.js` — Company verification, audit logs, impersonation sessions
  - `notifications.js`, `invites.js`, `reviews.js`, `reports.js`, `organizations.js`, `feedback.js`
- **`middleware/`** — JWT auth (`auth.js`), request logging (`requestId.js`), input validation (`validate.js`)
- **`lib/`** — OAuth helpers, email sending (Resend), invitation tokens, Zod validators, company verification, notifications
- **`prisma/schema.prisma`** — 13+ models; run `db:generate` after any schema edit
- **`scripts/`** — Database utilities (verify user email, remove demo data from prod, etc.)

### Key data models
- **User** — `role: DRIVER | COMPANY | RECRUITER`, `status: PENDING | VERIFIED` (companies start PENDING)
- **DriverProfile** — Licenses (CE, C), certificates (YKB, ADR), regions, availability, visibility toggle
- **Job** — Requirements, type (fjärrkörning/lokalt/distribution/tim), employment type, segment (FULLTIME/FLEX/INTERNSHIP), status (ACTIVE/HIDDEN/REMOVED)
- **Conversation + Message** — Driver ↔ company thread tied to a specific job
- **Organization** — Multi-org support; a company User can own multiple orgs; `UserOrganization` join table for team members
- **AdminImpersonationSession** — Admin "view-as" feature for support
- **AdminAuditLog** — Tracks all admin actions

### Authentication
Dual-path: email/password (bcrypt + JWT) and OAuth (Google via `@react-oauth/google`, Microsoft via MSAL). JWKS-RSA validates OAuth tokens server-side. Company verification (`PENDING → VERIFIED`) is required before companies can post jobs or contact drivers.

### Infrastructure
- **Live production**: Vercel project `drivermatch-20260212` → transportplattformen.se | Railway `drivermatch-clean` backend
- **Demo**: Vercel `transportplattform-demo` → transportplattform-demo.vercel.app | Railway `drivermatch-demo` (separate DB)
- **Note**: Railway project `drivermatch (nodejs)` serves an unrelated app — production backend is `drivermatch-clean`
- Health check endpoint: `GET /api/health`
- `DEPLOYMENT` env var on backend (`production` | `demo` | `development`) controls environment-specific behavior
- Infrastructure docs: `docs/INFRASTRUKTUR.md`, `docs/STACK.md`, `docs/RAILWAY-OVERSIKT.md`

### Email
Email (verification, password reset, match alerts) requires `RESEND_API_KEY` and `EMAIL_FROM` in `server/.env`. Without these, email content is logged to the server console in development. Verification route: `/verifiera-email?token=...`; password reset: `/aterstall-losenord?token=...`.
