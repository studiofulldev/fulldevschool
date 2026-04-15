# Contributing to Fulldev School

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) — the only required tool
- Node.js 20+ — only needed if running the Angular dev server outside Docker (`make serve`)

---

## Local development setup

### First time

```bash
git clone git@github.com:studiofulldev/fulldevschool.git
cd fulldevschool
make setup   # installs npm deps and creates runtime-config.js
make up      # starts everything
```

That's it. Open http://localhost:4200.

### Daily use

```bash
make up      # start everything
make down    # stop everything (database volume is preserved)
```

### Services started by `make up`

| Service | URL | What it does |
|---|---|---|
| App (Angular) | http://localhost:4200 | The application |
| Supabase API | http://localhost:8000 | Kong gateway → auth + REST |
| Supabase Studio | http://localhost:3000 | Visual database browser |
| PostgreSQL | localhost:5433 | Direct DB access (psql, TablePlus) |
| Inbucket (email) | http://localhost:54324 | Catches all outgoing emails locally |

### Local credentials

These are static development values — safe to share, useless in production:

| | Value |
|---|---|
| JWT Secret | `super-secret-jwt-token-with-at-least-32-characters-long` |
| anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7W9oA9_3J3_0E9pNTTxMRStomCuMEoL-_IU` |
| DB password | `postgres` |

---

## Running tests

```bash
make test           # single run
make test-watch     # watch mode
make test-coverage  # with coverage report
```

---

## Database migrations

Migrations live in `supabase/migrations/` as timestamped SQL files.

### How migrations are applied

On the **first `make up`** (or after `make db-reset`), a one-shot `db-migrate` container runs all `.sql` files in `supabase/migrations/` in alphabetical order, then applies `supabase/seed.sql`.

On **subsequent `make up` calls**, the database volume already exists so `db-migrate` runs again but the SQL files use `IF NOT EXISTS` guards — safe to re-run.

### Adding a new migration

1. Create a new file in `supabase/migrations/` following the naming convention:
   ```
   YYYYMMDDHHMMSS_short_description.sql
   ```
2. Write your SQL. Use `IF NOT EXISTS` / `IF EXISTS` guards where possible.
3. To apply it locally without losing data:
   ```bash
   docker compose run --rm db-migrate
   ```
4. To apply it from scratch (wipes local data):
   ```bash
   make db-reset
   ```

> **Note:** Unlike the Supabase CLI, the Docker setup does not auto-detect and apply only new migrations incrementally. `make db-reset` is the reset valve — use it whenever your local schema drifts from the migrations.

### Applying to production

Migrations are applied automatically by the CI/CD pipeline on every push to `main` (via the `migrate` job in `.github/workflows/deploy.yml`).

---

## Project structure

```
fulldevschool/
├── fulldev-school/
│   ├── app/              Angular 19 application
│   │   ├── src/app/
│   │   │   ├── data/     Read-only data services (content, navigation)
│   │   │   ├── guards/   Route guards
│   │   │   ├── pages/    Routable page components (one per route)
│   │   │   ├── services/ Business services (auth, progress, config)
│   │   │   └── shells/   Layout wrappers (sidebar, header, router-outlet)
│   │   └── public/
│   │       └── runtime-config.js  ← gitignored, created by make setup
│   └── mock-db/          Course content (Markdown + navigation tree JSON)
├── supabase/
│   ├── migrations/       SQL migration files (applied in order)
│   ├── seed.sql          Initial data
│   ├── config.toml       Supabase project config
│   └── docker/           Docker-specific init scripts (not Supabase CLI)
├── docker-compose.yml    Full local dev environment
├── Makefile              Developer commands
└── plan/okrs.md          Q2 2026 OKRs and execution plan
```

---

## Opening a pull request

- Branch from `main`: `git checkout main && git pull && git checkout -b feat/my-feature`
- One PR per feature or fix — keep it reviewable in under 30 minutes
- All commits, PR titles, and PR descriptions in English
- Tests must pass: `make test`
- Build must pass: `docker compose build app`

See `CLAUDE.md` for architecture rules (component/service separation, signals pattern, security checklist).
