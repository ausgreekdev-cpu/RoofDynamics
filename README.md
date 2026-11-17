# RoofDynamics

> **Powered by AusGreek Developments** — Multi-Tenant SaaS & Enterprise ERP for
> trade-qualified roofing & plumbing businesses in Perth, Western Australia.

[![Deployed on Netlify](https://img.shields.io/badge/Netlify-live-10B981)](https://roofdynamics.netlify.app)
[![Tests](https://img.shields.io/badge/tests-207%20passing-0EA5E9)](#verification)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](frontend/tsconfig.app.json)

---

## Overview

RoofDynamics is a production-grade, multi-tenant roofing intelligence, aerial
measurement and contractor ERP platform. It runs as a React SPA backed by a
Node/Express REST API with a PostgreSQL 16 + PostGIS database, with offline-first
sync for field crews working on roofs.

**Live production site:** <https://roofdynamics.netlify.app>  
**Public marketing site:** <https://roofdynamics.netlify.app/site>  
**Source:** <https://github.com/ausgreekdev-cpu/RoofDynamics>

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Feature Modules](#feature-modules)
- [Commercial / Tenancy Model](#commercial--tenancy-model)
- [WA Statutory Compliance](#wa-statutory-compliance)
- [Engineering Formulas](#engineering-formulas)
- [Configuration](#configuration)
- [Verification](#verification)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL 16 with the PostGIS extension (local dev uses an embedded Postgres)

### Install & run
```bash
# Install all three workspaces (root, frontend, backend)
npm run install:all

# Generate Prisma client & apply migrations
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start frontend (:5173) and backend (:5000) concurrently
npm run dev
```

The frontend proxies `/api` to the backend via `vite.config.ts`.

### Demo login
Any email + password works with the local JWT fallback. For the seeded admin:
- **Email:** `admin@perthpremier.com.au`
- **Password:** `Demo1234!`

---

## Architecture

```
RoofDynamics/
├── frontend/                 # React 19 + Vite 8 + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── components/ui/    # shadcn/ui (Radix) primitives + design tokens
│   │   ├── features/         # auth, billing, compliance, crm, marketing,
│   │   │                     # measurement, operations, projects, reporting
│   │   ├── contexts/         # Auth, Theme
│   │   ├── services/         # API, AI agent bridge, offline sync, socket, notifications
│   │   ├── utils/            # roofBomCalculator, waComplianceEngine, documentGenerator
│   │   ├── pages/            # 20 route pages
│   │   └── env.ts            # Zod-validated client environment
│   ├── e2e/                  # Playwright smoke tests
│   └── dist/                 # production build (Netlify publish dir)
├── backend/                  # Express 4 + TypeScript
│   └── src/
│       ├── routes/           # auth, payroll
│       ├── server/routes/    # projects, batches, billing, compliance, geo,
│       │                     # integrations, operations, storage, supplierCatalog
│       ├── server/integrations/  # typed B2B adapters + sandbox mocks
│       ├── server/cache/     # Upstash Redis + geospatial caching
│       ├── server/db/        # Drizzle schema + PostGIS geometry helpers
│       ├── server/observability/ # Sentry + structured logging
│       ├── server/storage/   # R2/S3 adapter
│       ├── utils/            # payrollCalculator, abnValidator
│       └── env.ts            # Zod-validated server environment
├── prisma/                   # Prisma schema (37 tenant-scoped models) + migrations
├── docs/
│   ├── ROADMAP_STATE.md      # living 22-phase checklist + commit log
│   └── DISASTER_RECOVERY.md  # backup & PITR restoration runbook
└── netlify.toml              # Netlify build, redirects, security headers
```

### Technology stack

| Layer | Technology |
|-------|------------|
| UI | React 19, Vite 8, TypeScript (strict), Tailwind CSS v4, Lucide, shadcn/ui (Radix) |
| Maps / 3D | Mapbox GL JS, `@mapbox/mapbox-gl-draw`, Turf.js, Three.js (`@react-three/fiber`, `drei`) |
| PDF | `@react-pdf/renderer` (live preview), jsPDF (legacy generators) |
| Server | Node.js + Express 4 + TypeScript + Socket.io |
| Database | PostgreSQL 16 + PostGIS; Prisma 6 (37 models) + Drizzle ORM (spatial schema) |
| Auth | Supabase Auth (JWT + OAuth) with local JWT fallback; RBAC role matrix |
| Cache / Queues | Upstash Redis, Inngest workers; deterministic in-memory sandbox |
| Storage | Cloudflare R2 / AWS S3 (`@aws-sdk/client-s3`) with local sandbox |
| Billing | Stripe tiers, credit quotas, Stripe Connect deposits (sandbox by default) |
| Observability | Sentry, structured JSON logging, `/api/system/metrics` |
| Testing | Vitest + Testing Library, Jest + Supertest, Playwright E2E |
| Deployment | Netlify (SPA) + Node backend |

All B2B integrations use a **typed adapter pattern** with deterministic sandbox
mocks — no invented APIs. Live adapters fail loudly until credentials and signed
contracts are supplied.

---

## Feature Modules

The sidebar exposes 10 core modules plus supporting tools:

| Module | Route | Highlights |
|--------|-------|------------|
| Executive BI | `/dashboard` | 4 Recharts visuals, 4 autonomous AI agents, live execution feed |
| CRM & Quoting | `/crm` | Kanban, interactive BOM estimator, coastal/bushfire detection |
| CRM Pipeline | `/pipeline` | Drag-and-drop deals, weighted forecast, e-signature |
| WMS / MRP | `/wms` | 3-location stock, shortage alerts, RFQ comparison, PO generation |
| Operations / HRIS | `/hris` | Crew roster, weather/wind safety, payday super, `.ABA` export |
| Dispatch & POs | `/operations` | Weekly crew calendar, supplier POs, sub-tasks, warranty vault |
| WHS Safety | `/whs` | Digital SWMS, mobile field mode, hazard checklist, photo uploader |
| Fleet / EAM | `/eam` | Asset register, 6-month AS/NZS 1891.4 inspection countdowns |
| Accounting | `/accounting` | Milestone invoicing (10/50/40), GST/BAS, TPAR + ABN check |
| Report Studio | `/reports-studio` | Live React-PDF preview, branding templates, Xactimate `.ESX` |
| Aerial Measurement | `/measurement` | Mapbox/Turf 2D editor + Three.js 3D viewer, pitch/waste math |
| Projects | `/projects` | Guided wizard, CRUD, audit trail, CSV batch import |
| Billing & Credits | `/billing` | Stripe tiers, credit quotas, Connect deposits |
| WA Compliance | `/compliance` | SOP Act claims (15-day countdown), BA1/BA2 permits |
| Public Website | `/website` | White-label site builder + public site link |
| SaaS Super-Admin | `/admin` | Tenant switcher, tier matrix, add-on toggles, MRR, branding |

Plus a public marketing site at `/site` with ROI calculator, free-first-report
lead capture, MDX blog and pricing.

---

## Commercial / Tenancy Model

- **Tenant 1 — Anchor Client:** `EMPIRE_ENTERPRISE_LEASE` ($699/mo + custom lease).
  All modules and 4 AI agents unlocked, white-label branding.
- **Tenant 2 — SaaS demo:** switchable between `STARTER` ($79), `PRO_SAFETY`
  ($199), `OPS_ERP` ($399), plus à-la-carte add-ons (e.g. AI social +$49/mo).

Views are wrapped in `<FeatureGate moduleKey="…">`; locked modules render an
interactive upsell card with ROI and 1-click unlock. UI actions are further
guarded by `<RoleGuard permission="…">` using the server RBAC matrix.

Every domain model is scoped by `tenantId`.

---

## WA Statutory Compliance

The compliance engine (`frontend/src/utils/waComplianceEngine.ts`) hardcodes:

1. **Home Building Contracts Act 1991 (WA)** — residential contracts $7,500–
   $500,000: maximum **6.5% deposit**, mandatory WA Notice for the Home Owner.
2. **WA Building Services Board** — work ≥ **$20,000** or structural re-roofing
   requires a Registered Building Practitioner number **and** LGA Building
   Permit (`BA1`/`BA2`) tracking.
3. **WA Plumbers Licensing Board** — gutters, downpipes, valley irons, box
   gutters or flashings = Roof Plumbing work requiring a licensed contractor
   and tradesperson, regardless of value.
4. **WorkSafe WA WHS Act 2020** — roof work > **2.0 m** requires a signed
   digital SWMS and verified perimeter edge protection; asbestos (Super Six)
   removal > **10 m²** requires a Class B/A licence, 5-day notification,
   double-wrapped disposal and licensed landfill tip receipts.
5. **Security of Payment Act 2021 (WA)** — statutory payment claims with a
   **15-business-day** Payment Schedule countdown.
6. **ATO Payday Super & MyLeave WA** — Super Guarantee **12%** of qualifying
   earnings per pay run (STP Phase 2); MyLeave WA **0.75%** of ordinary pay for
   construction workers, **0% for apprentices**, aggregated quarterly.

---

## Engineering Formulas

`frontend/src/utils/roofBomCalculator.ts` implements the exact WA roofing math:

- **Pitch multiplier:** `1 / cos(pitchDegrees × π / 180)`
- **True roof area:** `planArea × pitchFactor × (1 + waste)` — waste 7% gable, 12% hip/valley
- **Colorbond Custom Orb sheets:** effective cover **0.762 m**; exact cut-length
  runs in **millimetres per roof plane**
- **Battens (Topspan 40mm):** `ceil((trueArea / 0.9) / 6.5)` stock lengths @ 900mm centres
- **Anticon 60mm:** `ceil(trueArea / 15)` rolls
- **Fasteners:** **7/m²** standard, **10/m²** coastal / Darling Scarp high-wind ridge
- **Coastal marine (<1km surf):** Fremantle, Scarborough, Cottesloe, Hillarys,
  Rockingham → Colorbond Ultra + Class 4 / Stainless 316 (AS/NZS 2728)
- **Bushfire prone (AS 3959):** Kalamunda, Mundaring, Roleystone (BAL-29);
  Wungong, Armadale (BAL-19) → Ember Guard mesh + Sarking

---

## Configuration

All environment variables are validated by Zod in `frontend/src/env.ts` and
`backend/src/env.ts`. Copy `.env.example` (and the per-workspace `.env.example`
files) and fill in values. Key groups:

| Group | Variables |
|-------|-----------|
| Core | `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_URL` |
| AI | `AI_LLM_ENDPOINT` (`http://localhost:1234/v1`), `AI_API_KEY` |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Cache | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `INNGEST_*` |
| Storage | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable keys |
| Observability | `SENTRY_DSN`, `VITE_SENTRY_DSN`, `LOG_LEVEL` |
| Maps | `MAPBOX_TOKEN`, `VITE_MAPBOX_TOKEN` |
| B2B | `GREENSKY_API_KEY`, `NOAA_API_KEY`, `ABC_SUPPLY_API_KEY`, `BEACON_API_KEY`, `XACTIMATE_API_KEY`, `ABR_GUID` |
| Sandbox | `ENABLE_MOCK_INTEGRATIONS=true` (keep true until contracts approved) |

Never commit real `.env` files — they are gitignored.

---

## Verification

```bash
# Typecheck
npx --prefix backend tsc --noEmit        # backend
npm --prefix frontend run build           # frontend (tsc -b && vite build)

# Unit / integration tests
npm --prefix backend run test             # Jest + Supertest
npm --prefix frontend run test            # Vitest

# E2E (requires Chromium: npx playwright install chromium)
npm run test:e2e                          # Playwright
```

Latest results: **89 backend + 114 frontend unit tests, 4 E2E tests (207 total)
— all passing, zero TypeScript errors.**

---

## Deployment

- **Frontend:** Netlify builds from `frontend/` (`npm run build`, publish `dist`).
  `netlify.toml` supplies SPA fallback, security headers and asset caching.
- **Backend:** Node/Express server; `Dockerfile`, `docker-compose.yml`, `nginx.conf`
  and `deploy.sh` are provided for VPS/container deployment.
- **Database:** run `prisma migrate deploy` and `db:migrate` (the latter needs
  PostGIS) in production.

See [docs/DISASTER_RECOVERY.md](docs/DISASTER_RECOVERY.md) for backups and PITR.

---

## Documentation

| File | Contents |
|------|----------|
| [docs/ROADMAP_STATE.md](docs/ROADMAP_STATE.md) | 22-phase checklist, stack lockdown, per-phase file logs & commit history |
| [docs/DISASTER_RECOVERY.md](docs/DISASTER_RECOVERY.md) | Backup policy, restore runbook, failure scenarios |
| [frontend/README.md](frontend/README.md) | Frontend workspace guide |
| [backend/README.md](backend/README.md) | Backend workspace guide |
| [.env.example](.env.example) | Canonical, commented environment reference |

---

*RoofDynamics — Powered by AusGreek Developments.*
