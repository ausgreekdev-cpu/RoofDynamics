# RoofDynamics — Backend

Node.js + Express 4 + TypeScript REST API for the RoofDynamics ERP. Part of the
[RoofDynamics monorepo](../README.md).

---

## Quick start

```bash
npm install
npm run dev            # tsx watch src/server.ts -> http://localhost:5000
npm run build          # tsc -> dist/
npm start              # node dist/server.js
```

The frontend dev server proxies `/api` to this service on port 5000.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Development server with hot reload (tsx watch) |
| `build` | Compile TypeScript to `dist/` |
| `start` | Run compiled server |
| `test` | Jest + Supertest |
| `prisma:generate` | Generate Prisma client |
| `prisma:migrate` | Apply Prisma migrations (dev) |
| `prisma:seed` | Seed tenants, crew, leads, quotes, jobs |
| `db:generate` | Generate Drizzle migrations |
| `db:migrate` | Apply Drizzle migrations (needs PostGIS) |
| `db:studio` | Drizzle Studio |

---

## Source layout

```
src/
├── routes/               # auth, payroll (top-level mounted routers)
├── server/
│   ├── routes/           # projects, batches, billing, compliance, geo,
│   │                     # integrations, operations, storage, supplierCatalog
│   ├── integrations/     # typed B2B adapters + sandbox mocks
│   │                     # (financing, storm, billing, suppliers, xactimate)
│   ├── cache/            # Upstash Redis adapter, memory sandbox, geospatial helpers
│   ├── db/               # Drizzle schema + PostGIS geometry helpers
│   ├── observability/    # Sentry init, structured logger, request/error middleware
│   ├── storage/          # R2/S3 adapter + local sandbox
│   └── auth/             # RBAC matrix, Supabase verification, middleware
├── utils/                # payrollCalculator, abnValidator
├── middleware/           # JWT auth, tenant scoping
├── lib/prisma.ts         # Prisma client singleton
├── env.ts                # Zod server environment validation
└── server.ts             # Express app, all mounts, Socket.io, health/status
```

---

## API surface

All `/api` routes (except `/api/health`, `/api/auth/*`, `/api/inngest`,
`/api/public/*`) require a JWT and a `x-tenant-id` header. Role/permission
guards are applied per route via `requirePermission`.

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/login`, `/register`, `/me`, `/session`, `PUT /change-password` |
| Tenants | `GET/PUT /api/tenants/me`, `GET /api/tenants` |
| Projects | `GET/POST/PATCH/DELETE /api/projects[/:id]`, `/audit`, CSV `/batch` |
| Compliance | `/api/compliance/payment-claims`, `/building-permits` |
| Payroll | `POST /api/payroll/calculate`, `GET/PATCH /pay-runs` |
| Billing | `GET /api/billing/credits`, `POST /checkout`, `/connect-deposit` |
| Integrations | financing, storm, suppliers, Xactimate, storage |
| Operations | tasks, warranties, photos, inspections |
| System | `/api/health`, `/api/system/status`, `/api/system/metrics`, `/api/system/ping` |

Real-time events are delivered over Socket.io (tenant-scoped rooms); Inngest
handles background jobs with a deterministic local worker fallback.

---

## Domain rules

- **Payroll** (`src/utils/payrollCalculator.ts`): ATO 2026 PAYG tables, 12% super
  guarantee, MyLeave WA **0.75%** (0% apprentices), STP Phase 2 JSON.
- **ABN** (`src/utils/abnValidator.ts`): official modulus-89 checksum with
  optional ABR lookup.
- **Geospatial** (`src/server/db/geo.ts`): WKT builders, PostGIS `ST_Area`,
  `ST_Distance`, `ST_Centroid`, coastal zone detection; cached via Upstash.
- **Multi-tenancy:** every domain model carries `tenantId`, enforced by
  `middleware/tenant.ts`.

---

## Configuration

Copy `.env.example` to `.env`. All variables are validated at startup by
`src/env.ts` (Zod). See the canonical [`../.env.example`](../.env.example)
for documented descriptions. B2B integrations use sandbox adapters while
`ENABLE_MOCK_INTEGRATIONS=true` (the default) or credentials are absent; live
adapters intentionally fail loudly until signed contracts exist.

---

## Deployment

A `Dockerfile`, root `docker-compose.yml`, `nginx.conf` and `deploy.sh` are
provided for container/VPS deployment. Run `prisma migrate deploy` and
`db:migrate` (the latter requires PostGIS) in production. Observability is via
Sentry and `/api/system/metrics`.

See [docs/DISASTER_RECOVERY.md](../docs/DISASTER_RECOVERY.md) for backups/PITR.

*RoofDynamics — Powered by AusGreek Developments.*
