# AGENTS.md — RoofDynamics (Powered by AusGreek Developments)

Routing document for AI coding agents working in this repository. For the full
project overview, see [README.md](README.md).

---

## 1. Project Identity

- **Platform:** Multi-Tenant SaaS & Enterprise ERP for trade-qualified roofing &
  plumbing businesses in Perth, Western Australia.
- **Attribution:** Persistent footer and login badge:
  `"RoofDynamics — Powered by AusGreek Developments"`.
- **Visual theme:** Industrial dark/slate — `#0F172A` bg, `#1E293B` cards,
  `#0A192F` navy header, `#0EA5E9` electric blue, `#10B981` electric green,
  `#F59E0B` high-vis amber. Logo: `RD` monogram.
- **Dual commercial mode:**
  - Tenant 1 (`EMPIRE_ENTERPRISE_LEASE`, $699/mo + custom white-label lease): all
    9 modules + 4 AI agents unlocked.
  - Tenant 2 (SaaS demo): switchable `STARTER` ($79), `PRO_SAFETY` ($199),
    `OPS_ERP` ($399) + à-la-carte add-ons.

## 2. Non-negotiable guardrails

1. **Zero placeholders** — no `// TODO`, `// Coming soon`, or unclickable
   buttons. Every module must have working state mutations, tables, and modals.
2. **Offline-first** — persist all mutations to `localStorage`/IndexedDB
   alongside the API so the Field Crew Mobile PWA works on roofs.
3. **Local AI compatibility** — route agent tasks through
   `frontend/src/services/aiAgentService.ts` to an OpenAI-compatible endpoint
   (`http://localhost:1234/v1`) with a deterministic TS fallback.
4. **Verification before done:**
   ```bash
   npx tsc --noEmit        # backend (from backend/)
   npm run build           # frontend (tsc -b && vite build)
   npm run test            # unit tests
   npm run test:e2e        # Playwright
   ```
   Fix every TypeScript/bundling error before completing a task.

## 3. WA statutory logic — `frontend/src/utils/waComplianceEngine.ts`

- **Home Building Contracts Act 1991 (WA):** residential $7,500–$500,000 →
  max **6.5% deposit** + mandatory WA Notice for the Home Owner.
- **Building Services Board:** ≥ $20,000 or structural re-roof → Registered
  Building Practitioner number + **BA1/BA2** LGA permit tracking.
- **Plumbers Licensing Board:** gutters, downpipes, valley irons, box gutters,
  flashings → Roof Plumbing work requiring a licensed contractor/tradesperson.
- **WorkSafe WHS Act 2020:** > 2.0 m → signed digital SWMS + perimeter edge
  protection; asbestos Super Six > 10 m² → Class B/A licence, 5-day
  notification, double-wrap disposal, licensed landfill tip receipts.
- **Security of Payment Act 2021:** statutory claims + **15-business-day**
  Payment Schedule countdown.
- **Payday Super / MyLeave WA:** 12% super of qualifying earnings per pay run
  (STP Phase 2); MyLeave WA **0.75%** of ordinary pay (0% apprentices),
  aggregated quarterly.

## 4. Roofing math — `frontend/src/utils/roofBomCalculator.ts`

- Pitch multiplier `1 / cos(pitchDegrees × π / 180)`; true area =
  `planArea × pitch × (1 + waste)` (7% gable / 12% hip-valley).
- Custom Orb effective cover 0.762 m; exact sheet quantities **and** cut-length
  runs in mm per plane.
- Battens: `ceil((trueArea / 0.9) / 6.5)`; Anticon: `ceil(trueArea / 15)`.
- Fasteners: 7/m² standard, 10/m² coastal/Darling Scarp high-wind ridge.
- Coastal marine (<1km surf: Fremantle, Scarborough, Cottesloe, Hillarys) →
  Colorbond Ultra + Class 4/316 stainless (AS/NZS 2728).
- Bushfire prone (Kalamunda, Mundaring, Roleystone = BAL-29; Wungong,
  Armadale = BAL-19) → Ember Guard mesh + Sarking under AS 3959.

## 5. Repository conventions

- Frontend: React 19 + Vite 8 + Tailwind v4 + shadcn/ui (Radix) + Lucide.
- Backend: Express + TypeScript + Socket.io; Prisma (37 tenant-scoped models)
  plus Drizzle/PostGIS spatial schema.
- All env access via `src/env.ts` (Zod); document new variables in `.env.example`.
- B2B integrations use typed adapters + deterministic sandbox mocks — never
  invent external APIs; live adapters fail loudly until credentials exist.
- Every domain model is scoped by `tenantId`; API auth + RBAC middleware enforced.

## 6. Living docs

- `docs/ROADMAP_STATE.md` — 22-phase checklist, stack lockdown, commit history.
- `docs/DISASTER_RECOVERY.md` — backups & PITR restoration runbook.

*RoofDynamics — Powered by AusGreek Developments.*
