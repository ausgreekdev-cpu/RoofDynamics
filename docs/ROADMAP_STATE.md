# Roof Dynamics — Enterprise Transformation Roadmap State

> Living checklist for the end-to-end transformation of Roof Dynamics into an
> enterprise-grade, multi-tenant roofing intelligence, aerial measurement and
> contractor SaaS platform.
>
> **Rule:** One phase per turn. Check off `[x]` only after typecheck, build and
> tests pass. Log files touched, output a suggested commit command, then STOP.

---

## Meta

| Field | Value |
|-------|-------|
| Repository | `/mnt/916e9d35-9ea9-42a4-9a82-08369546c62d/RoofDynamics` |
| Production URL | `https://roofdynamics.netlify.app` |
| Roadmap started | 2026-11-17 |
| Phase range | 1.1 → 4.5 (22 phases; 1.6 cache/queue + 1.7 observability added) |
| Current phase | 4.5 — E2E, Security, Disaster Recovery, Final Deploy ✅ — **TRANSFORMATION COMPLETE** |
| Git status | ✅ Git repo on `main`, pushed to `https://github.com/ausgreekdev-cpu/RoofDynamics.git` |

---

## Stack Lockdown (Guardrail #2)

Inspected `package.json` files on 2026-11-17. Decisions are final for all phases:

| Layer | Decision | Current state | Target / action |
|-------|----------|---------------|-----------------|
| Framework | **React 19 + Vite 8** | Confirmed (frontend/) | Keep. Do NOT migrate to Next.js |
| Language | TypeScript | Confirmed | Keep (strict) |
| UI / Styling | **Tailwind CSS + shadcn/ui (Radix) + Lucide** | Tailwind v4 + Lucide present; shadcn/ui not yet | Add shadcn/ui primitives in 1.3 |
| Database / Spatial | **PostgreSQL 16 + PostGIS + Drizzle ORM** | Prisma + plain Postgres present | Introduce Drizzle + PostGIS in 1.4 |
| Auth | **Supabase Auth (JWT + OAuth)** | Custom JWT + bcrypt present | Migrate in 1.5 |
| Cache / Queues | **Upstash Redis + Inngest** | Socket.io real-time present | Add in 1.6 |
| Maps / 3D | **Mapbox GL JS + mapbox-gl-draw + Turf.js + Three.js (R3F + drei)** | None | Add in 2.3 / 2.4 |
| PDF / Storage | **@react-pdf/renderer + Cloudflare R2 / AWS S3** | jsPDF present | Replace in 2.5 / 3.6 |
| Billing / Observability | **Stripe + Sentry + Playwright** | None | Add in 1.7 / 3.3 / 4.1 |
| Tests | Vitest + Testing Library (FE), Jest + Supertest (BE) | Confirmed | Keep; add Playwright in 4.1 |
| Runtime env | **Zod validation in `src/env.ts`** | No central validation | Add in 1.2 |

### Known migration debt (tracked, not deleted yet — Guardrail #6)
- `frontend/src/utils/documentGenerator.ts` uses jsPDF — replacement arrives in phase 2.5; do not delete until verified.
- `backend/src/lib/prisma.ts` + Prisma schema — replacement arrives in phase 1.4; do not delete until verified.
- Custom JWT auth (`backend/src/routes/auth.ts`) — replacement arrives in phase 1.5; do not delete until verified.

---

## Phase Checklist

### Wave 1 — Foundation & Infrastructure
- [x] **1.1** Repository audit & living roadmap state (this phase)
- [x] **1.2** Centralized Zod environment validation (`src/env.ts`, `.env.example`)
- [x] **1.3** shadcn/ui primitives + design tokens (`src/components/ui`)
- [x] **1.4** Drizzle schema + PostGIS geometry helpers + migrations (`src/server/db`)
- [x] **1.5** Supabase Auth (JWT + OAuth) + RBAC guards (`src/features/auth`)
- [x] **1.6** Upstash Redis + Inngest workers scaffolding (`src/server/cache`, `src/server/queues`)
- [x] **1.7** Sentry + observability (`src/server/observability`)

### Wave 2 — Product Core
- [x] **2.1** Guided project wizard + CRUD + audit trails (`src/features/projects`)
- [x] **2.2** Batch CSV queue + Inngest worker (`src/server/queues`)
- [x] **2.3** Mapbox GL 2D vector editor + draw controls (`src/features/measurement`)
- [x] **2.4** Pitch overrides + Three.js 3D viewer (`@react-three/fiber`, `drei`)
- [x] **2.5** Live PDF preview + branding templates (`@react-pdf/renderer`)
- [x] **2.6** Xactimate `.ESX` export (`src/features/reporting`)

### Wave 3 — CRM, Operations, Billing & Integrations
- [x] **3.1** CRM Kanban pipeline + e-signature (`src/features/crm`)
- [x] **3.2** Financing widget + storm/hail lookup adapters (`src/features/crm`)
- [x] **3.3** Crew dispatch calendar + supplier POs (`src/features/operations`)
- [x] **3.4** Sub-tasks + warranty vault (`src/features/operations`)
- [x] **3.5** Stripe tiers, credit quotas, Stripe Connect deposits (`src/features/billing`)

### Wave 4 — Hardening, Marketing & Launch
- [x] **4.1** Typed integration adapters + sandbox mocks (`src/server/integrations`)
- [x] **4.2** R2/S3 storage pipeline (`src/server/api`, `@aws-sdk/client-s3`)
- [x] **4.3** Upstash rate limiting + geospatial caching (`src/server/cache`)
- [x] **4.4** Marketing site: ROI calculator, free first report, MDX blog, pricing (`src/features/marketing`)
- [x] **4.5** Playwright E2E + security hardening + disaster recovery + final deploy

---

## Phase Log

### 1.1 — Repository Audit & Roadmap State ✅

**Inspected:** `package.json` (root, frontend, backend), top-level tree, `.env*`
files, `docs/` (absent), git status (not a repo).

**Files created:**
- `docs/ROADMAP_STATE.md` — this living checklist + stack lockdown + phase log

**Files modified:** none

**Verification:** documentation-only phase; no source code changed. `npm run
typecheck` and `npm run build` run as a regression baseline (see turn output).

**Suggested commit:**
```bash
git init
git add docs/ROADMAP_STATE.md
git commit -m "docs: add enterprise transformation roadmap state and stack lockdown"
```

### 1.2 — Centralized Zod Environment Validation ✅

**Approach:** Custom Zod parser (per Guardrail #5 allowance). All future-service
variables are optional so development and tests never break; every variable is
documented with an inline comment in `.env.example`.

**Files created:**
- `backend/src/env.ts` — validated server env, `assertProductionEnv()` helper
- `frontend/src/env.ts` — validated client env (import.meta.env), safe fallback
- `.env.example` — canonical reference documenting every variable
- `backend/.env.example` — backend copy template
- `frontend/.env.example` — frontend copy template

**Files modified:**
- `backend/src/server.ts` — uses `env.PORT`, `env.CLIENT_URL`
- `backend/src/middleware/auth.ts` — uses `env.JWT_SECRET`
- `backend/src/utils/abnValidator.ts` — uses `env.ABR_GUID`
- `backend/src/lib/prisma.ts` — uses `env.NODE_ENV`
- `frontend/src/services/api.ts` — uses `env.VITE_API_BASE`
- `frontend/src/services/aiAgentService.ts` — uses env LLM keys
- `frontend/src/services/socketService.ts` — uses env API base
- `frontend/src/services/notificationService.ts` — uses env providers
- `frontend/src/components/ErrorBoundary.tsx` — uses `env.DEV`

**Verification:** backend TSC 0 errors; frontend build pass; backend tests 16
passed; frontend tests 39 passed; backend boots and serves `/api/health`;
frontend serves HTTP 200.

**Suggested commit:**
```bash
git add backend/src/env.ts frontend/src/env.ts .env.example \
  backend/.env.example frontend/.env.example \
  backend/src/server.ts backend/src/middleware/auth.ts \
  backend/src/utils/abnValidator.ts backend/src/lib/prisma.ts \
  frontend/src/services/api.ts frontend/src/services/aiAgentService.ts \
  frontend/src/services/socketService.ts \
  frontend/src/services/notificationService.ts \
  frontend/src/components/ErrorBoundary.tsx docs/ROADMAP_STATE.md
git commit -m "feat(env): add centralized Zod env validation and documented templates"
```

### 1.3 — shadcn/ui Primitives + Design Tokens ✅

**Approach:** Added Radix-backed shadcn/ui primitives as copy-in components
(no CLI scaffolding). Design tokens live as CSS variables in `index.css`
consumed via Tailwind arbitrary values, with `.light-theme` overrides. Existing
UI left untouched (Guardrail #6) — primitives are additive until later phases
migrate features.

**Files created:**
- `frontend/src/lib/utils.ts` — `cn()` (clsx + tailwind-merge)
- `frontend/src/components/ui/button.tsx` — cva variants
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/input.tsx` — Input + Textarea
- `frontend/src/components/ui/label.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/separator.tsx`
- `frontend/src/components/ui/avatar.tsx`
- `frontend/src/components/ui/dialog.tsx`
- `frontend/src/components/ui/dropdown-menu.tsx`
- `frontend/src/components/ui/select.tsx`
- `frontend/src/components/ui/tabs.tsx`
- `frontend/src/components/ui/checkbox.tsx`
- `frontend/src/components/ui/switch.tsx`
- `frontend/src/components/ui/progress.tsx`
- `frontend/src/components/ui/tooltip.tsx`
- `frontend/src/components/ui/skeleton.tsx`
- `frontend/src/components/ui/table.tsx`
- `frontend/src/components/ui/index.ts` — barrel export
- `frontend/src/components/ui/ui.test.tsx` — 5 smoke tests

**Files modified:**
- `frontend/src/index.css` — shadcn design tokens + light-theme overrides
- `frontend/package.json` — Radix primitives + class-variance-authority added

**Verification:** frontend build/typecheck pass; backend TSC 0 errors; frontend
tests 44 passed (39 existing + 5 new); backend tests 16 passed; design tokens
present in built CSS.

**Suggested commit:**
```bash
git add frontend/src/lib/utils.ts frontend/src/components/ui/ \
  frontend/src/index.css frontend/package.json frontend/package-lock.json \
  docs/ROADMAP_STATE.md
git commit -m "feat(ui): add shadcn/ui Radix primitives and design tokens"
```

### 1.4 — Drizzle Schema + PostGIS Geometry Helpers + Migrations ✅

**Workspace mapping:** target `/src/server/db` → `backend/src/server/db`
(matches existing React+Vite + Express workspace layout).

**Files created:**
- `backend/src/server/db/schema.ts` — tenant-scoped Drizzle tables:
  `tenants_drizzle`, `users_drizzle`, `projects_drizzle`, `measurements_drizzle`
  (native PostGIS `geometry(point, 4326)` centroid), `audit_logs_drizzle`
- `backend/src/server/db/geo.ts` — PostGIS helpers: WKT builders, `ST_Area`,
  `ST_Distance`, `ST_Centroid`, `ST_Within`, pitch/waste true-area expression,
  coastal-zone OR expression for all 5 Perth suburbs
- `backend/src/server/db/index.ts` — Drizzle client (postgres.js) using validated
  `DATABASE_URL`; strips Prisma-style `?schema=` param
- `backend/src/server/db/geo.test.ts` — 12 helper tests
- `backend/drizzle.config.ts` — drizzle-kit config
- `backend/drizzle/0000_easy_saracen.sql` — generated migration with
  `CREATE EXTENSION IF NOT EXISTS postgis;` prepended
- `backend/drizzle/meta/_journal.json`

**Files modified:**
- `backend/package.json` — `db:generate`, `db:migrate`, `db:studio` scripts
- `docs/ROADMAP_STATE.md` — manual PostGIS provisioning step added

**Environment constraint (documented, not faked):** the local embedded
PostgreSQL does not ship the PostGIS extension, so applying the migration here
fails with `extension "postgis" is not available`. Per Guardrail #4 this is a
human provisioning action; the migration and helpers are complete and verified
without a live PostGIS runtime. Prisma remains untouched (Guardrail #6).

**Verification:** backend TSC 0 errors; frontend build pass; backend tests 28
passed (16 existing + 12 new); frontend tests 44 passed; existing backend
`/api/health` still 200 (zero regression); `drizzle-kit generate` produced valid
SQL with all 5 tables and the geometry column.

**Suggested commit:**
```bash
git add backend/src/server/db/ backend/drizzle/ backend/drizzle.config.ts \
  backend/package.json backend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(db): add Drizzle tenant schema, PostGIS helpers and migration"
```

### 1.5 — Supabase Auth (JWT + OAuth) + RBAC Guards ✅

**Workspace mapping:** target `/src/features/auth` → `frontend/src/features/auth`;
server-side verification → `backend/src/server/auth`.

**Files created:**
- `frontend/src/features/auth/types.ts` — typed `AuthAdapter`, `Role`, `Permission`
- `frontend/src/features/auth/rbac.ts` — client permission matrix
- `frontend/src/features/auth/adapters.ts` — Supabase adapter + local-JWT fallback
  (auto-selects when `VITE_SUPABASE_URL` + anon key are configured)
- `frontend/src/features/auth/useAuthSession.ts` — session hook with realtime
  `onAuthStateChange`
- `frontend/src/features/auth/RoleGuard.tsx` — role/permission UI gate
- `frontend/src/features/auth/index.ts`, `rbac.test.ts` (3 tests)
- `backend/src/server/auth/rbac.ts` — authoritative permission matrix
- `backend/src/server/auth/supabase.ts` — service-role client + token verification
- `backend/src/server/auth/middleware.ts` — `attachRole`, `requireRoles`,
  `requirePermission`
- `backend/src/server/auth/index.ts`, `rbac.test.ts` (10 tests)

**Files modified:**
- `backend/src/middleware/auth.ts` — Supabase verification first, local JWT
  fallback preserved;role normalized
- `backend/src/server.ts` — `attachRole` wired after auth; RBAC on users/photos;
  new `GET /api/auth/session`; **payroll routes moved behind auth** (security fix)
- `frontend/package.json`, `backend/package.json` — `@supabase/supabase-js`

**Auth adapters:** Supabase used when configured; otherwise the existing local
JWT flow continues unchanged (Guardrail #6 — nothing deleted).

**Verification:** backend TSC 0 errors; frontend build pass; backend tests 38
passed (28 + 10); frontend tests 47 passed (44 + 3); backend boots;
`/api/auth/session` returns role+provider; RBAC allows admin read (200) and
denies admin user-create (403).

**Suggested commit:**
```bash
git add frontend/src/features/auth/ backend/src/server/auth/ \
  backend/src/middleware/auth.ts backend/src/server.ts \
  frontend/package.json backend/package.json \
  frontend/package-lock.json backend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(auth): add Supabase adapters, OAuth and RBAC guards"
```

### 1.6 — Upstash Redis + Inngest Workers ✅

**Files created:**
- `backend/src/server/cache/types.ts` — `CacheAdapter`, `RateLimitResult` contracts
- `backend/src/server/cache/memory.ts` — deterministic in-memory sandbox
- `backend/src/server/cache/redis.ts` — Upstash adapter
- `backend/src/server/cache/index.ts` — adapter selection + Express rate limiter
- `backend/src/server/cache/cache.test.ts` (8 tests)
- `backend/src/server/queues/types.ts` — typed event names/payloads + `QueueAdapter`
- `backend/src/server/queues/memory.ts` — deterministic in-memory event bus
- `backend/src/server/queues/inngest.ts` — Inngest client + adapter
- `backend/src/server/queues/functions.ts` — 3 workers (segmentation, PDF compile, CSV batch)
- `backend/src/server/queues/index.ts` — adapter selection
- `backend/src/server/queues/queues.test.ts` (5 tests)

**Files modified:**
- `backend/src/server.ts` — Inngest `serve` at `/api/inngest` (before JWT auth),
  `GET /api/system/status`, `POST /api/queue/events` (RBAC guarded)
- `backend/src/env.ts`, `.env.example`, `backend/.env.example` — new `INNGEST_DEV`
  variable documented (Guardrail #5)
- `backend/.env` — `INNGEST_DEV=true` for local dev
- `backend/package.json` — `@upstash/redis`, `@upstash/ratelimit`, `inngest`

**Adapters:** Upstash/Inngest used when configured and mocks disabled; otherwise
deterministic sandbox (Guardrail #3). Nothing deleted (Guardrail #6).

**Verification:** backend TSC 0 errors; backend tests 51 passed (38 + 13 new);
frontend build pass; frontend tests 47 passed; backend boots; `/api/inngest`
returns 200; `/api/system/status` reports `cache:"memory", queue:"memory"`;
`POST /api/queue/events` returns deterministic `mock-event-1`.

**Suggested commit:**
```bash
git add backend/src/server/cache/ backend/src/server/queues/ \
  backend/src/server.ts backend/src/env.ts backend/.env \
  .env.example backend/.env.example backend/package.json \
  backend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(infra): add Upstash cache and Inngest worker adapters"
```

### 1.7 — Sentry + Observability ✅

**Files created:**
- `backend/src/server/observability/sentry.ts` — init/capture/flush/error-handler
  (no-op without DSN)
- `backend/src/server/observability/logging.ts` — structured JSON logger
  filtered by `LOG_LEVEL`
- `backend/src/server/observability/middleware.ts` — request logger, error
  capture, `collectMetrics()`
- `backend/src/server/observability/index.ts`, `observability.test.ts` (5 tests)
- `frontend/src/lib/observability.ts`, `observability.test.ts` (2 tests)

**Files modified:**
- `backend/src/server.ts` — `initSentry()` at startup, `requestLogger`,
  `installSentryErrorHandler` + `errorCapture`, `GET /api/system/metrics`
  (RBAC `saas:read`), Sentry flag on `/api/system/status`
- `frontend/src/main.tsx` — `initFrontendSentry()` before render
- `frontend/src/components/ErrorBoundary.tsx` — captures errors to Sentry
- `backend/package.json`, `frontend/package.json` — `@sentry/node`,
  `@sentry/react`, `@sentry/vite-plugin`

**Verification:** backend TSC 0 errors; backend tests 56 passed (51 + 5);
frontend build pass; frontend tests 49 passed (47 + 2); backend boots;
`/api/system/status` reports `sentry:false`; `/api/system/metrics` returns
uptime/pid/memory/logLevel.

**Suggested commit:**
```bash
git add backend/src/server/observability/ backend/src/server.ts \
  frontend/src/lib/observability.ts frontend/src/lib/observability.test.ts \
  frontend/src/main.tsx frontend/src/components/ErrorBoundary.tsx \
  backend/package.json frontend/package.json \
  backend/package-lock.json frontend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(obs): add Sentry error tracking and structured logging"
```

### 2.1 — Guided Project Wizard + CRUD + Audit Trails ✅

**Workspace mapping:** target `/src/features/projects` → `frontend/src/features/projects`.

**Files created:**
- `frontend/src/features/projects/types.ts` — `Project`, `ProjectDraft`, `AuditEntry`, statuses
- `frontend/src/features/projects/api.ts` — typed API client
- `frontend/src/features/projects/useProjects.ts` — CRUD hooks with optimistic state
- `frontend/src/features/projects/ProjectWizard.tsx` — 4-step wizard
  (Project → Site → Measurement → Review) using shadcn/ui primitives, automatic
  coastal detection, validation gating
- `frontend/src/features/projects/ProjectsList.tsx` — searchable/sortable table
  with delete + audit dialogs
- `frontend/src/features/projects/AuditTrail.tsx` — audit timeline
- `frontend/src/features/projects/index.ts`, `ProjectWizard.test.tsx` (4 tests)
- `frontend/src/pages/Projects.tsx` — gated page (`FeatureGate` + `RoleGuard`)
- `backend/src/server/routes/projects.ts` — CRUD + append-only audit trail with
  safe demo-actor handling (FK guard)

**Files modified:**
- `prisma/schema.prisma` — new `Project` model (additive; Drizzle equivalent
  already in `backend/src/server/db/schema.ts` for the future swap)
- `prisma/migrations/20261117032010_add_projects/`
- `backend/src/server.ts` — mounted `/api/projects`
- `frontend/src/services/api.ts` — `request()` made public for feature clients
- `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx` — `/projects` route + nav

**Verification:** backend TSC 0 errors; backend tests 56 passed; frontend build
pass; frontend tests 53 passed (49 + 4); live CRUD verified (CREATE → UPDATE →
AUDIT 2 entries → LIST → DELETE); audit FK bug fixed for demo tokens.

**Suggested commit:**
```bash
git add frontend/src/features/projects/ frontend/src/pages/Projects.tsx \
  frontend/src/App.tsx frontend/src/components/Sidebar.tsx \
  frontend/src/services/api.ts backend/src/server/routes/projects.ts \
  backend/src/server.ts prisma/schema.prisma prisma/migrations/ \
  docs/ROADMAP_STATE.md
git commit -m "feat(projects): add guided wizard, CRUD and audit trails"
```

### 2.2 — Batch CSV Queue + Inngest Worker ✅

**Files created:**
- `backend/src/server/routes/csv.ts` — PapaParse-backed CSV parser + validator
  (6 tests in `csv.test.ts`)
- `backend/src/server/routes/batches.ts` — batch upload/status/detail endpoints
- `backend/src/server/queues/localWorkers.ts` — deterministic sandbox handler
  registration
- `frontend/src/features/projects/BatchImport.tsx` — file/paste upload, row
  preview, progress polling, results + parse errors

**Files modified:**
- `backend/src/server/queues/functions.ts` — `processProjectBatch()` creates
  Project rows from batch rows, updates row/batch statuses; Inngest worker uses it
- `backend/src/server/queues/index.ts` — exports processor + local registration
- `backend/src/server.ts` — mounted batch routes before `/:id`; registers local workers
- `prisma/schema.prisma` + migration `20261117033159_add_project_batches` —
  `ProjectBatch` + `ProjectBatchRow` models
- `frontend/src/pages/Projects.tsx` — Batch Import tab
- `frontend/src/features/projects/index.ts`
- `backend/package.json` — `papaparse`, `@types/papaparse`

**Verification:** backend TSC 0 errors; backend tests 62 passed (56 + 6);
frontend build pass; frontend tests 53 passed; live flow verified — CSV upload
→ batch QUEUED (job `mock-event-1`, provider `memory`) → worker processing →
status COMPLETED with 2/2 rows SUCCESS and 2 Project rows created; project
search returns both imported rows.

**Suggested commit:**
```bash
git add backend/src/server/routes/csv.ts backend/src/server/routes/csv.test.ts \
  backend/src/server/routes/batches.ts backend/src/server/queues/ \
  backend/src/server.ts prisma/schema.prisma prisma/migrations/ \
  frontend/src/features/projects/BatchImport.tsx \
  frontend/src/features/projects/index.ts frontend/src/pages/Projects.tsx \
  backend/package.json backend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(projects): add CSV batch import with Inngest worker"
```

### 2.3 — Mapbox GL 2D Vector Editor + Draw Controls ✅

**Workspace mapping:** target `/src/features/measurement` → `frontend/src/features/measurement`.

**Files created:**
- `frontend/src/features/measurement/types.ts` — `RoofPolygon`, `MapAdapter`, Perth center
- `frontend/src/features/measurement/area.ts` — Turf.js plan area, pitch factor,
  true area (7% gable / 12% hip-valley), point-in-polygon, coastal detection
- `frontend/src/features/measurement/adapters.ts` — typed map adapter: Mapbox GL
  when `VITE_MAPBOX_TOKEN` present, deterministic SVG sandbox otherwise
- `frontend/src/features/measurement/VectorEditor.tsx` — click-to-add vertices,
  close/undo, live plan/true area totals, per-plane list, pitch + roof-type controls
- `frontend/src/features/measurement/index.ts`, `area.test.ts` (6 tests)
- `frontend/src/pages/Measurement.tsx` — gated page (`FeatureGate` + `RoleGuard`)

**Files modified:**
- `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx` — `/measurement` route + nav
- `frontend/package.json` — `mapbox-gl`, `@mapbox/mapbox-gl-draw`, `@turf/turf`, types

**Adapter note:** Mapbox tiles require the human-supplied token (already in the
Manual DevOps Checklist). Locally the deterministic SVG editor runs with Turf.js
area math — fully functional offline (Guardrail #3: no invented map APIs).

**Verification:** frontend build pass; frontend tests 59 passed (53 + 6);
backend TSC 0 errors; `/measurement` route 200; feature bundled; adapter reports
`Sandbox Editor` without a token.

**Suggested commit:**
```bash
git add frontend/src/features/measurement/ frontend/src/pages/Measurement.tsx \
  frontend/src/App.tsx frontend/src/components/Sidebar.tsx \
  frontend/package.json frontend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(measurement): add 2D vector editor with Turf area math"
```

### 2.4 — Pitch Overrides + Three.js 3D Viewer ✅

**Files created:**
- `frontend/src/features/measurement/geometry3d.ts` — pure, WebGL-free geometry:
  lon/lat→local metres, ridge height, gable mesh positions, scene scale
- `frontend/src/features/measurement/Roof3DViewer.tsx` — R3F Canvas with
  OrbitControls, Grid, lighting, pitch override input, ridge/span readout
- `frontend/src/features/measurement/geometry3d.test.ts` (5 tests)

**Files modified:**
- `frontend/src/features/measurement/VectorEditor.tsx` — embeds `Roof3DViewer`
  for the first drawn plane; pitch slider shared with 2D totals
- `frontend/src/features/measurement/index.ts`
- `frontend/vite.config.ts` — PWA workbox `maximumFileSizeToCacheInBytes` raised
  to 6 MiB (Three.js chunk is 2.8 MiB)
- `frontend/package.json` — `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

**Verification:** frontend build pass (PWA limit fix); frontend tests 64 passed
(59 + 5); backend TSC 0 errors; `/measurement` route 200; 3D viewer bundled;
geometry helpers unit-tested without WebGL.

**Suggested commit:**
```bash
git add frontend/src/features/measurement/ frontend/vite.config.ts \
  frontend/package.json frontend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(measurement): add Three.js 3D roof viewer with pitch overrides"
```

### 2.5 — Live PDF Preview + Branding Templates ✅

**Workspace mapping:** target `/src/features/reporting` → `frontend/src/features/reporting`.

**Files created:**
- `frontend/src/features/reporting/types.ts` — `Branding`, `ReportData`, 3 template types, defaults
- `frontend/src/features/reporting/templates.ts` — pure helpers (hex normalisation,
  measurement report builder, report payload composer, safe filenames)
- `frontend/src/features/reporting/ReportDocument.tsx` — `@react-pdf/renderer`
  Document with branded header + measurement/warranty/invoice templates
- `frontend/src/features/reporting/ReportPreview.tsx` — live `PDFViewer`,
  template selector, branding editor (company/ABN/builder/colour), `PDFDownloadLink`
- `frontend/src/features/reporting/index.ts`, `templates.test.ts` (5 tests)
- `frontend/src/pages/Reports.tsx` — gated page (`FeatureGate` + `RoleGuard`)

**Files modified:**
- `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx` — `/reports-studio`
  route + nav
- `frontend/package.json` — `@react-pdf/renderer`

**Note:** jsPDF-based `documentGenerator.ts` is retained (Guardrail #6) until all
call sites migrate to the new React PDF templates in a later phase.

**Verification:** frontend build pass; frontend tests 69 passed (64 + 5);
backend TSC 0 errors; `/reports-studio` route 200; report feature bundled
(1.2 MB chunk, within the 6 MiB PWA limit).

**Suggested commit:**
```bash
git add frontend/src/features/reporting/ frontend/src/pages/Reports.tsx \
  frontend/src/App.tsx frontend/src/components/Sidebar.tsx \
  frontend/package.json frontend/package-lock.json docs/ROADMAP_STATE.md
git commit -m "feat(reporting): add live PDF preview with branding templates"
```

### 2.6 — Xactimate `.ESX` Export ✅

**Files created:**
- `frontend/src/features/reporting/esx.ts` — deterministic ESX XML serializer:
  XML escaping, BOM line-item derivation (sheets/battens/insulation/fasteners),
  coastal pricing, square-metre→square-foot conversion, browser download helper
- `frontend/src/features/reporting/esx.test.ts` (6 tests)

**Files modified:**
- `frontend/src/features/reporting/ReportPreview.tsx` — "Export Xactimate .ESX"
  button for measurement reports
- `frontend/src/features/reporting/index.ts`

**Adapter note:** ESX is a documented XML exchange format. No invented external
API or unverified package was used (Guardrail #3).

**Verification:** frontend build pass; frontend tests 75 passed (69 + 6);
backend TSC 0 errors; `/reports-studio` route 200; ESX export bundled.

**Suggested commit:**
```bash
git add frontend/src/features/reporting/ docs/ROADMAP_STATE.md
git commit -m "feat(reporting): add Xactimate ESX export"
```

### 3.1 — CRM Kanban Pipeline + E-Signature ✅

**Workspace mapping:** target `/src/features/crm` → `frontend/src/features/crm`.

**Files created:**
- `frontend/src/features/crm/types.ts` — `Deal`, `PipelineStage`, `SignatureRecord`
- `frontend/src/features/crm/pipeline.ts` — stage probabilities, weighted
  forecast, won revenue, transition rules, lead→deal mapper
- `frontend/src/features/crm/PipelineBoard.tsx` — drag-and-drop 6-stage Kanban
  with optimistic moves, forecast cards, e-sign trigger for negotiation deals
- `frontend/src/features/crm/OfferSigner.tsx` — e-signature dialog using the
  existing canvas `SignaturePad`, signer name, sign-and-mark-won action
- `frontend/src/features/crm/index.ts`, `pipeline.test.ts` (6 tests)
- `frontend/src/pages/Pipeline.tsx` — gated page (`FeatureGate` + `RoleGuard`)

**Files modified:**
- `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx` — `/pipeline` route + nav

**Verification:** frontend build pass; frontend tests 81 passed (75 + 6);
backend TSC 0 errors; `/pipeline` route 200; feature bundled.

**Suggested commit:**
```bash
git add frontend/src/features/crm/ frontend/src/pages/Pipeline.tsx \
  frontend/src/App.tsx frontend/src/components/Sidebar.tsx docs/ROADMAP_STATE.md
git commit -m "feat(crm): add Kanban pipeline with weighted forecast and e-signature"
```

### 3.2 — Financing Widget + Storm/Hail Lookup Adapters ✅

**Files created:**
- `backend/src/server/integrations/types.ts` — typed `FinancingAdapter`,
  `StormLookupAdapter` contracts
- `backend/src/server/integrations/financing.ts` — deterministic sandbox
  (amortised payment, credit-based APR) + live adapter requiring `GREENSKY_API_KEY`
- `backend/src/server/integrations/storm.ts` — deterministic sandbox events +
  live adapter requiring `NOAA_API_KEY`
- `backend/src/server/integrations/index.ts`, `integrations.test.ts` (4 tests)
- `backend/src/server/routes/integrations.ts` — POST financing quote, GET storm
- `frontend/src/features/crm/FinancingWidget.tsx`, `StormLookup.tsx`

**Files modified:**
- `backend/src/env.ts`, `.env.example`, `backend/.env.example` — new
  `GREENSKY_API_KEY`, `NOAA_API_KEY` documented (Guardrail #5)
- `backend/src/server.ts` — mounted `/api/integrations`
- `frontend/src/features/crm/index.ts`, `frontend/src/pages/Pipeline.tsx`

**Guardrail #3:** Live adapters fail loudly rather than fabricate endpoints/URLs;
sandbox used until signed B2B contracts and credentials exist.

**Verification:** backend TSC 0 errors; backend tests 66 passed (62 + 4);
frontend build pass; frontend tests 81 passed; live endpoints verified —
financing quote returned 9.9% APR / $1,127.71 monthly, storm lookup returned
2 deterministic moderate events for Fremantle.

**Suggested commit:**
```bash
git add backend/src/server/integrations/ backend/src/server/routes/integrations.ts \
  backend/src/server.ts backend/src/env.ts .env.example backend/.env.example \
  frontend/src/features/crm/ frontend/src/pages/Pipeline.tsx docs/ROADMAP_STATE.md
git commit -m "feat(crm): add financing and storm lookup with sandbox adapters"
```

### 3.3 — Crew Dispatch Calendar + Supplier POs ✅

**Workspace mapping:** target `/src/features/operations` → `frontend/src/features/operations`.

**Files created:**
- `frontend/src/features/operations/types.ts` — `DispatchJob`, `CrewResource`, `SupplierPO`
- `frontend/src/features/operations/dispatch.ts` — certification gating, crew
  load, week generation, job filtering, API→dispatch mapper
- `frontend/src/features/operations/DispatchCalendar.tsx` — navigable Mon–Sun
  dispatch calendar with per-day job cards
- `frontend/src/features/operations/SupplierPOs.tsx` — PO list + creation form
  sourced from real RFQs (FK-safe)
- `frontend/src/features/operations/index.ts`, `dispatch.test.ts` (5 tests)
- `frontend/src/pages/Operations.tsx` — gated page

**Files modified:**
- `frontend/src/App.tsx`, `components/Sidebar.tsx` — `/operations` route + nav
- `backend/src/server.ts` — hardened `POST /api/purchase-orders`: validates
  `rfqId`/`poNumber`, checks tenant ownership, catches errors (no server crash)

**Verification:** backend TSC 0 errors; backend tests 66 passed; frontend build
pass; frontend tests 86 passed (81 + 5); `/operations` route 200; live PO
creation succeeded with a real RFQ; invalid PO returns 400 and server stays up.

**Suggested commit:**
```bash
git add frontend/src/features/operations/ frontend/src/pages/Operations.tsx \
  frontend/src/App.tsx frontend/src/components/Sidebar.tsx \
  backend/src/server.ts docs/ROADMAP_STATE.md
git commit -m "feat(operations): add dispatch calendar and supplier POs"
```

### 3.4 — Sub-tasks + Warranty Vault ✅

**Files created:**
- `backend/src/server/routes/operations.ts` — tenant-scoped task CRUD + warranty
  issue endpoints with RBAC `operations:manage`
- `frontend/src/features/operations/SubTasks.tsx` — task create/status-cycle list
- `frontend/src/features/operations/WarrantyVault.tsx` — certificate issue + vault
- `frontend/src/features/operations/tasks.ts`, `tasks.test.ts` (3 tests)

**Files modified:**
- `prisma/schema.prisma` + migration `20261117071506_add_tasks_warranties` —
  `Task` + `WarrantyDocument` models
- `backend/src/server/routes/projects.ts` — exported `audit` helper
- `backend/src/server.ts` — mounted `/api/operations`
- `frontend/src/features/operations/index.ts`, `frontend/src/pages/Operations.tsx`

**Verification:** backend TSC 0 errors; backend tests 66 passed; frontend build
pass; frontend tests 89 passed (86 + 3); `/operations` route 200; live endpoints
verified — task created (PENDING), listed, warranty certificate
`WTY-MWKD5J39` issued.

**Suggested commit:**
```bash
git add backend/src/server/routes/operations.ts backend/src/server.ts \
  backend/src/server/routes/projects.ts prisma/schema.prisma prisma/migrations/ \
  frontend/src/features/operations/ frontend/src/pages/Operations.tsx \
  docs/ROADMAP_STATE.md
git commit -m "feat(operations): add sub-tasks and warranty vault"
```

### 3.5 — Stripe Tiers, Credit Quotas, Stripe Connect Deposits ✅

**Workspace mapping:** target `/src/features/billing` → `frontend/src/features/billing`.

**Files created:**
- `backend/src/server/integrations/billingTypes.ts` — `Tier`, `TIER_METADATA`, `tierCredits()`
- `backend/src/server/integrations/billing.ts` — typed `BillingAdapter`,
  deterministic sandbox (checkout + Connect deposit), live adapter requiring
  `STRIPE_SECRET_KEY`
- `backend/src/server/integrations/billing.test.ts` (4 tests)
- `backend/src/server/routes/billing.ts` — credits quota, checkout, Connect deposit
- `frontend/src/features/billing/types.ts`, `quota.ts`, `BillingPanel.tsx`,
  `quota.test.ts` (3 tests), `index.ts`
- `frontend/src/pages/Billing.tsx` — gated page

**Files modified:**
- `backend/src/server.ts` — mounted `/api/billing`
- `backend/src/server/integrations/index.ts`
- `frontend/src/App.tsx`, `components/Sidebar.tsx` — `/billing` route + nav
- RBAC matrices (backend + frontend) — granted admin `billing:manage` so the
  demo role can access billing (owner keeps all permissions)

**Guardrail #3:** live Stripe adapters fail loudly without configured keys;
sandbox used until dashboard credentials + price IDs exist.

**Verification:** backend TSC 0 errors; backend tests 70 passed (66 + 4);
frontend build pass; frontend tests 92 passed (89 + 3); `/billing` route 200;
live endpoints verified — credits (`quota:999, used:3`), checkout
(`cs_sandbox_tenant-1_PRO_SAFETY`), deposit (`tr_sandbox_acct_123`);
RBAC blocks/permits as expected.

**Suggested commit:**
```bash
git add backend/src/server/integrations/ backend/src/server/routes/billing.ts \
  backend/src/server.ts backend/src/server/auth/rbac.ts \
  frontend/src/features/billing/ frontend/src/pages/Billing.tsx \
  frontend/src/App.tsx frontend/src/components/Sidebar.tsx \
  frontend/src/features/auth/rbac.ts docs/ROADMAP_STATE.md
git commit -m "feat(billing): add Stripe tiers, credit quotas and Connect deposits"
```

### 4.1 — Typed Integration Adapters + Sandbox Mocks ✅

**Files created:**
- `backend/src/server/integrations/suppliers.ts` — typed `SupplierAdapter`
  (ABC Supply / Beacon), deterministic product catalog + pricing sandbox
- `backend/src/server/integrations/xactimate.ts` — typed `XactimateAdapter`
  with sandbox estimate creation
- `backend/src/server/integrations/suppliers.test.ts` (4 tests)
- `backend/src/server/routes/supplierCatalog.ts` — supplier products/pricing +
  Xactimate estimate endpoints

**Files modified:**
- `backend/src/env.ts`, `.env.example`, `backend/.env.example` — new
  `ABC_SUPPLY_API_KEY`, `BEACON_API_KEY`, `XACTIMATE_API_KEY` documented
- `backend/src/server.ts` — mounted supplier catalog routes
- `backend/src/server/integrations/index.ts`

**Adapter inventory (all typed, sandbox-toggled):**
GreenSky financing (3.2), NOAA storm (3.2), Stripe billing (3.5),
ABC Supply/Beacon catalogs (4.1), Xactimate (4.1). Live adapters fail loudly
without credentials/contracts (Guardrail #3).

**Verification:** backend TSC 0 errors; backend tests 74 passed (70 + 4);
frontend build pass; frontend tests 92 passed; live endpoints verified —
ABC products (2 filtered), Beacon price ($320 for 10 units), Xactimate
estimate (`esx_JOB-1`, 4 line items).

**Suggested commit:**
```bash
git add backend/src/server/integrations/ backend/src/server/routes/supplierCatalog.ts \
  backend/src/server.ts backend/src/env.ts .env.example backend/.env.example \
  docs/ROADMAP_STATE.md
git commit -m "feat(integrations): add supplier catalog and Xactimate adapters"
```

### 4.2 — R2/S3 Storage Pipeline ✅

**Files created:**
- `backend/src/server/storage/storage.ts` — typed `StorageAdapter` with
  in-memory sandbox and R2/S3 implementation (`@aws-sdk/client-s3`,
  `@aws-sdk/s3-request-presigner`); signed URLs for private buckets
- `backend/src/server/storage/storage.test.ts` (3 tests)
- `backend/src/server/routes/storage.ts` — base64 upload, signed URL lookup,
  delete (query-param key to support slashes)

**Files modified:**
- `backend/src/server.ts` — mounted `/api/storage`
- `backend/package.json` — AWS S3 SDK packages

**Verification:** backend TSC 0 errors; backend tests 77 passed (74 + 3);
frontend build pass; frontend tests 92 passed; live flow verified — upload
(`sandbox://photos/roof.jpg`), URL lookup, delete all succeed.

**Suggested commit:**
```bash
git add backend/src/server/storage/ backend/src/server/routes/storage.ts \
  backend/src/server.ts backend/package.json backend/package-lock.json \
  docs/ROADMAP_STATE.md
git commit -m "feat(storage): add R2/S3 object storage pipeline with sandbox"
```

### 4.3 — Upstash Rate Limiting + Geospatial Caching ✅

**Files created:**
- `backend/src/server/cache/geospatial.ts` — geo cache keys, cached coastal
  lookups, haversine distance, WKT conversion
- `backend/src/server/cache/geospatial.test.ts` (6 tests)
- `backend/src/server/routes/geo.ts` — coastal check (with cache), reference
  points, distance endpoint

**Files modified:**
- `backend/src/server/cache/index.ts` — exports geospatial helpers
- `backend/src/server.ts` — mounted `/api/geo`, rate-limited `/api/system/ping`

**Verification:** backend TSC 0 errors; backend tests 83 passed (77 + 6);
frontend build pass; frontend tests 92 passed; live endpoints verified —
coastal check computed then cache hit, haversine distance 942 m; rate limiting
returns `X-RateLimit-Limit/Remaining` headers and enforces 429 after limit.

**Suggested commit:**
```bash
git add backend/src/server/cache/ backend/src/server/routes/geo.ts \
  backend/src/server.ts docs/ROADMAP_STATE.md
git commit -m "feat(cache): add geospatial caching and rate limiting"
```

### 4.4 — Marketing: ROI Calculator, Free Report, MDX Blog, Pricing ✅

**Workspace mapping:** target `/src/features/marketing` → `frontend/src/features/marketing`.

**Files created:**
- `frontend/src/features/marketing/roi.ts` — pure ROI math (labour saving,
  ROI %, payback months), `roi.test.ts` (4 tests)
- `frontend/src/features/marketing/blog.ts` — 3 MDX-style blog posts
- `frontend/src/features/marketing/ROICalculator.tsx`, `FreeReportForm.tsx`,
  `PricingTable.tsx`, `Blog.tsx` (react-markdown), `index.ts`

**Files modified:**
- `frontend/src/pages/PublicSite.tsx` — added ROI, free-report, pricing and blog sections
- `backend/src/server.ts` — public `POST /api/public/leads` (rate-limited 5/hr,
  no auth) feeding the CRM Lead model
- `frontend/package.json` — `react-markdown`

**Verification:** backend TSC 0 errors; backend tests 83 passed; frontend build
pass; frontend tests 96 passed (92 + 4); `/site` route 200; public lead POST
returned 201 with a lead id without auth; marketing sections bundled.

**Suggested commit:**
```bash
git add frontend/src/features/marketing/ frontend/src/pages/PublicSite.tsx \
  frontend/package.json frontend/package-lock.json backend/src/server.ts \
  docs/ROADMAP_STATE.md
git commit -m "feat(marketing): add ROI calculator, free report, blog and pricing"
```

### 4.5 — E2E, Security, Disaster Recovery, Final Deploy ✅ — FINAL

**Files created:**
- `frontend/playwright.config.ts` — E2E config (Chromium, reuse dev server)
- `frontend/e2e/smoke.spec.ts` — 4 E2E tests (public site, ROI, login, modules)
- `docs/DISASTER_RECOVERY.md` — backup policy, PITR/logical restore runbook,
  failure scenarios, verification checklist

**Files modified:**
- `backend/src/server.ts` — rate limit on `/api/auth` (10/15min), email format
  validation on public leads
- `frontend/package.json`, `package.json` — `test:e2e` scripts

**Verification:**
- Backend TSC 0 errors; backend tests 83 passed; frontend tests 96 passed
- Frontend build pass
- Playwright: **4/4 E2E tests passed** (Chromium installed)
- Security: auth rate-limit headers present; invalid public lead → 400
- Netlify production deploy: `/` and `/site` return 200

---

## Transformation Complete ✅

All 22 phases (1.1 → 4.5) checked off. The platform now includes:

- **Foundation**: Zod env validation, shadcn/ui, Drizzle+PostGIS schema, Supabase
  auth + RBAC, Upstash/Inngest, Sentry observability
- **Product**: Projects wizard/CRUD/audit, CSV batch import, Mapbox/Turf 2D editor,
  Three.js 3D viewer, React PDF studio, Xactimate ESX export
- **CRM/Ops/Billing**: Kanban + e-sign, financing/storm adapters, dispatch + POs,
  sub-tasks/warranty vault, Stripe tiers/credits/Connect
- **Integrations/Launch**: typed B2B adapters (GreenSky, NOAA, Stripe, ABC,
  Beacon, Xactimate), R2/S3 storage, geospatial cache + rate limits, marketing
  site, Playwright E2E, disaster recovery runbook

**Production**: https://roofdynamics.netlify.app

**Remaining human actions**: see Manual DevOps Checklist — provision external
service credentials/contracts and configure production environment variables.

**Final commit:**
```bash
git add frontend/playwright.config.ts frontend/e2e/ frontend/package.json \
  backend/src/server.ts package.json docs/
git commit -m "chore: add E2E tests, disaster recovery and security hardening"
```

---

## Manual DevOps Checklist (human-only actions)

These cannot be performed by the agent in any phase:

- [x] `git init` in the repository and push to the remote — **done**, branch `main`, remote `origin`.
- [ ] Provision PostgreSQL 16 with PostGIS extension enabled. **Required before
      `npm --prefix backend run db:migrate` — the local embedded Postgres lacks
      PostGIS, so the phase 1.4 migration could not be applied locally.**
- [ ] Create a Supabase project; supply `SUPABASE_URL`, service role + anon keys.
      Enable Google/Azure/GitHub OAuth providers and set the redirect URL to
      `https://roofdynamics.netlify.app/auth/callback`. Store `role` and
      `tenant_id` in `app_metadata` so RBAC guards resolve correctly.
- [ ] Create Upstash Redis instance; supply REST URL + token.
- [ ] Create Inngest account/signing key; register `https://api.roofdynamics.com.au/api/inngest`.
      In production set `INNGEST_DEV=false` and supply `INNGEST_SIGNING_KEY`.
- [ ] Create Cloudflare R2 bucket (or AWS S3) + credentials; supply
      `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
      `R2_PUBLIC_URL` (or AWS equivalents). Sandbox active until then.
- [ ] Create Stripe account; supply `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      publishable key and real Price IDs. Live adapters currently fail loudly by
      design; sandbox is active until then.
- [ ] Create Sentry project; supply `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN`
      (frontend). Set `LOG_LEVEL` appropriately in production.
- [ ] Create Mapbox access token with GL JS + geocoding scopes.
- [ ] Approve B2B partner contracts (ABC Supply, Beacon, GreenSky, HailTrace/NOAA, Xactimate) — sandbox adapters used until then.
      For GreenSky/NOAA/ABC/Beacon/Xactimate supply the matching `*_API_KEY`
      and a signed transport contract; live adapters currently fail loudly by
      design.
- [ ] Configure Netlify environment variables from `.env.example` (phase 1.2).

---

## AGENTS.md Compliance Update (2026-11-17)

Applied the new master spec (AGENTS.md) — critical statutory fixes and features:

### Critical Bug Fixes
- [x] **MyLeave WA rate**: 2.7% → **0.75%** construction workers, **0% apprentices**
      (`backend/src/utils/payrollCalculator.ts`). Was over-charging 3.6×.
- [x] **Darling Scarp high-wind zone** (Kalamunda, Mundaring, Roleystone, Wungong,
      Armadale): 10 screws/m² (was cyclonic-only).
- [x] **6.5% residential deposit cap** (Home Building Contracts Act 1991 WA)
      with mandatory WA Notice for the Home Owner.
- [x] **LGA Building Permit BA1/BA2** tracking for ≥$20k / structural conversion.
- [x] **Security of Payment Act 2021** — 15-business-day Payment Schedule countdown.

### BOM Enhancements
- [x] **AS 3959 BAL-19 / BAL-29** bushfire zones with Ember Guard mesh + Sarking BOM items.
- [x] **Custom sheet rolling schedule** — cut lengths in mm per roof plane.

### New Files
- `backend/src/server/routes/compliance.ts` (payment claims + building permits + `addBusinessDays`)
- `backend/src/utils/payrollCalculator.test.ts`
- `backend/src/server/routes/compliance.test.ts`
- `frontend/src/features/compliance/` (ComplianceTracker + page)
- `frontend/src/pages/Compliance.tsx`
- Prisma models `PaymentClaim`, `BuildingPermit` + migration `20261117144026_add_payment_claims_permits`

### Verification
Backend TSC 0 errors; backend tests 89 passed; frontend build pass;
frontend tests 114 passed; Playwright E2E 4/4; live payment claim (due 2026-12-11)
and building permit endpoints verified.

---

## In-App Guided Tutorial (2026-11-18)

Shipped an 8-step onboarding walkthrough that spotlights each core module and
auto-starts on the first authenticated session.

- [x] `frontend/src/contexts/TutorialContext.tsx` — 8-step state machine, first-login
      auto-start, `rd_tutorial_completed` localStorage persistence.
- [x] `frontend/src/components/Tutorial.tsx` — spotlight overlay + tooltip card
      (progress dots, Back/Next/Skip/Done); navigates via React Router `useNavigate`.
- [x] Help (`?`) button in TopBar restarts the tour on demand.
- [x] `data-tour` anchors added: Sidebar, Dashboard run-all, CRM new-quote, WMS
      stock table, Pipeline board, Measurement canvas, Report preview, Compliance.
- [x] Tests: `TutorialContext.test.tsx` (10 unit tests) + E2E tutorial flow test.

### Verification
Backend TSC 0 errors; frontend build pass; backend tests 89 passed;
frontend tests **124 passed**; Playwright E2E **5/5**. Committed as `99fa920`
(`feat: add in-app guided onboarding tutorial`) and pushed to `origin/main`.

### First-login auto-start fix
Live-browser verification exposed a race: the auth token is set by `login()`
*after* `TutorialProvider` mounts on the login screen, so the mount-only token
check never fired. `TutorialProvider` now consumes `useAuth()` and watches
`isAuthenticated`, so the tour auto-starts reliably on the login transition.
Added a unit test for the unauthenticated → authenticated transition and an E2E
assertion for auto-start. Tour step 0 no longer navigates (the sidebar exists on
every route, so deep links are not hijacked), and auto-start is limited to once
per browser session via `sessionStorage`. Redeployed to
<https://roofdynamics.netlify.app>.

### Verification
Backend TSC 0 errors; frontend build pass; backend tests 89 passed;
frontend tests **127 passed**; Playwright E2E **5/5**.

---

## Protected Page Load Fix (2026-11-18)

Live-browser sweep found all 7 `<RoleGuard>` pages (Projects, Measurement,
Report Studio, Pipeline, Operations, Billing, Compliance) rendered **blank** on
direct navigation / refresh.

- [x] Root cause: `AuthProvider` restored `token` and `tenant` from localStorage
      on reload but not `user`, so `can(undefined, permission)` returned false
      and `RoleGuard` rendered its default `null`.
- [x] `login()` now persists `rd_user`; `AuthProvider` initialises `user` from
      it; `logout()` removes it.
- [x] E2E assertions now target page `<h1>` elements (sidebar link text had
      masked the blank pages) and cover a full reload of a protected route.
- [x] Regression tests: `AuthContext.test.tsx` (3 unit tests).

### Verification
All 19 live routes (18 app + `/site`) confirmed rendering content. Committed as
`d3631ca` and redeployed to <https://roofdynamics.netlify.app>.
