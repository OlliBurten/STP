# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Sveriges Transportplattform (DriverMatch) is a two-package monorepo — a React+Vite frontend at the repository root and a Node.js/Express backend in `server/`. See `README.md` for standard dev commands.

### Services

| Service | Dir | Dev command | Port |
|---------|-----|-------------|------|
| Frontend (Vite) | `/` | `npm run dev` | 5173 |
| Backend (Express) | `server/` | `npm run dev` | 3001 |
| PostgreSQL | — | `sudo pg_ctlcluster 16 main start` | 5432 |

### PostgreSQL setup (one-time in cloud)

PostgreSQL must be installed and running before the backend can start. After installing (`sudo apt-get install -y postgresql postgresql-client`):

```bash
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE USER drivermatch WITH PASSWORD 'drivermatch' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE drivermatch OWNER drivermatch;"
```

### Environment files

- `server/.env` — copy from `server/.env.example`; set `DATABASE_URL=postgresql://drivermatch:drivermatch@localhost:5432/drivermatch`
- `.env` (root) — set `VITE_API_URL=http://localhost:3001` to connect frontend to backend

### Starting services

1. Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
2. Backend: `cd server && npx prisma generate && npx prisma db push && npm run dev`
3. Frontend: `npm run dev` (from repo root)

Seed test data (once): `cd server && npm run db:seed` — creates `driver@example.com` / `company@example.com` with password `password123`.

### Lint, test, build

- **Lint (frontend):** `npm run lint` — pre-existing lint errors in the codebase (mostly `no-undef` for `process` in server files picked up by the browser-globals ESLint config)
- **Backend API tests:** `cd server && npm run test` — runs Node.js built-in test runner with Supertest
- **E2E tests:** `npm run e2e` — requires both frontend and backend running; see `README.md` for details
- **Build:** `npm run build` (frontend only; backend has no build step)

### Gotchas

- The frontend can run standalone with mock data (no backend) if `VITE_API_URL` is not set. For full E2E, both services must be running.
- Email sending (Resend) is optional; without `RESEND_API_KEY`, emails are logged to the server console.
- The backend uses `node --watch` for hot reload; newly installed dependencies are picked up automatically on restart.
- Prisma schema changes require `npx prisma generate` + `npx prisma db push` before the backend can use them.
