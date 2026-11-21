# RoofDynamics — User Guide

> **Powered by AusGreek Developments** — Multi-Tenant SaaS & Enterprise ERP for
> trade-qualified roofing & plumbing businesses in Perth, Western Australia.

This guide explains how to use every feature of RoofDynamics. For installation,
configuration and deployment, see [README.md](../README.md). For WA statutory
rules and roofing math, see [AGENTS.md](../AGENTS.md).

---

## 1. Getting started

### 1.1 Login
1. Open the app (web: https://roofdynamics.netlify.app, or the Android companion).
2. Enter any email + password in demo mode, or your real credentials when a
   backend is connected.
3. Role is derived from the email domain (demo mode):
   - `dev@...` / contains "dev" → Developer (platform-wide + dev tools)
   - `admin@...` / `owner@...` → Client admin
   - `manager@...` → Manager
   - `crew@...` → Crew
   - `viewer@...` → Viewer
   - otherwise → Staff
4. Seeded accounts (real backend):
   - Developer: `ausgreekdev@gmail.com` / `!Ausgreek123`
   - Admin: `admin@perthpremier.com.au` / `Demo1234!`

### 1.2 First-login tour
On your first login a guided 8-step tour auto-starts, spotlighting the sidebar,
the Run All button, CRM, WMS, Pipeline, Measurement, Report Studio and
Compliance. Click **Next** to advance, **Skip tour** to dismiss, or the **?**
icon in the top bar to replay it anytime.

### 1.3 Tenant & tier switcher
The top bar shows the active tenant. Click the tenant name to switch between:
- **Tenant 1 — Perth Premier Roofing** (`EMPIRE_ENTERPRISE_LEASE`, $699/mo):
  all modules + 4 AI agents unlocked, white-label branding.
- **Tenant 2 — Swan Valley Roof Restorations** (SaaS demo): switchable between
  `STARTER` ($79), `PRO_SAFETY` ($199), `OPS_ERP` ($399) plus à-la-carte
  add-ons (e.g. AI Social +$49/mo).

Locked modules render an interactive upsell card with ROI and a one-click unlock.

### 1.4 Theme
Click the sun/moon icon in the top bar to switch dark/light. The choice persists
in `localStorage` (`rd_theme`).

### 1.5 Language
Use the language switcher (EN/...) in the top bar. Translations live in
`frontend/src/i18n/`.

### 1.6 Offline mode
The app is a PWA. Mutations queue when offline and replay on reconnect. A
banner shows pending sync count. Install to home screen for full offline use.

---

## 2. Executive BI Dashboard (`/dashboard`)

- **KPI cards:** Total Quotes, Active Jobs, Total Revenue, Low Stock Items.
- **Charts:** Gross vs Net Margin per month, Lead-to-Win funnel.
- **Live Execution Feed:** shows agent run results.
- **Run All Empire Automations** button: runs all 4 autonomous agents at once
  (procurement RFQs, WHS watchdog, OCR bill matching, social/SEO posts).

---

## 3. CRM & Quoting (`/crm`)

### 3.1 Kanban board
Leads flow through statuses: NEW → CONTACTED → QUOTING → WON / LOST. Drag and
drop to move. Weighted forecast updates automatically.

### 3.2 New Quote
Click **New Quote** to open the interactive BOM estimator:
- Enter plan area (m²), pitch (°), roof type (gable / hip-valley), suburb.
- The engine computes pitch factor, true area, sheet quantities and cut lengths
  (mm), battens, insulation, fasteners (7/m² standard, 10/m² coastal/Darling
  Scarp), coastal corrosion upgrade and bushfire (BAL-19/BAL-29) items.
- Coastal suburbs auto-detected: Fremantle, Scarborough, Cottesloe, Hillarys,
  Rockingham → Colorbond Ultra + Class 4 / 316 stainless.
- Bushfire suburbs: Kalamunda, Mundaring, Roleystone (BAL-29); Wungong, Armadale
  (BAL-19) → Ember Guard mesh + Sarking.
- Asbestos removal triggers the WA compliance notice (Class B/A licence,
  5-day notification, double-wrap, licensed landfill).
- Compliance check: 6.5% deposit cap, $20k builder rule, plumber licensing,
  WorkSafe height/asbestos rules.

### 3.3 E-signature
From the pipeline, e-sign an offer to mark a job won.

---

## 4. CRM Pipeline (`/pipeline`)

- Drag-and-drop deals through stages (NEW, CONTACTED, QUOTING, NEGOTIATION, WON, LOST).
- Weighted forecast revenue card.
- Financing widget and storm/hail lookup per suburb.

---

## 5. WMS / MRP (`/wms`)

- **Stock table:** 3 locations — Welshpool Yard, Hilux Ute 1, Isuzu Truck 2.
- **Low-stock alerts** (quantity on hand ≤ reorder point).
- **Reserve stock** against a job.
- **Add stock item** form (SKU, name, location, qty, reorder point, unit cost, supplier).
- **RFQ comparison** and **PO generation** to suppliers.
- Shortage alerts feed the procurement agent.

---

## 6. Operations / HRIS (`/hris`)

- **Crew roster** with roles, rates, status.
- **HRIS profiles** with KPI ratings.
- **Payroll calculator:** ATO 2026 PAYG, 12% super guarantee, MyLeave WA 0.75%
  (0% apprentices), STP Phase 2 JSON export.
- **Pay runs** list with approve/finalise.
- **Weather/wind safety** check (Open-Meteo Perth forecast).

---

## 7. Dispatch & POs (`/operations`)

- **Weekly crew dispatch calendar** (drag to assign).
- **Supplier purchase orders** with status tracking.
- **Sub-tasks** with open/closed counts.
- **Warranty vault** for installed work.
- **Photo uploader** for job evidence.

---

## 8. WHS Safety (`/whs`)

- **Digital SWMS** for roof work > 2.0 m (signed, with edge protection check).
- **Hazard checklist** and photo uploader.
- **Field mode** for mobile crews.
- **Asbestos handling** workflow for Super Six > 10 m².

---

## 9. Fleet / EAM (`/eam`)

- **Asset register:** utes, trailers, edge protection kits, nail guns.
- **Harness register** with AS/NZS 1891.4 inspection countdowns (6-month cycle).
- **Inspection log** with pass/fail and inspector name.
- **Reminder** button schedules a notification 24 h before a harness is due.

---

## 10. Accounting (`/accounting`)

- **Milestone invoicing:** 10% deposit / 50% progress / 40% final.
- **GST ledger** and BAS returns.
- **TPAR** reporting with ABN validation (modulus-89 checksum).
- **Generate invoice PDF** per milestone.

---

## 11. Report Studio (`/reports-studio`)

- **Live React-PDF preview** with white-label branding templates.
- **One-click download** (PDF).
- **Export to Xactimate `.ESX`** format.

---

## 12. Aerial Measurement (`/measurement`)

- **SVG canvas editor:** click to place vertices, close polygon to create a roof plane.
- **Pitch & roof type** inputs drive true area (pitch factor × waste).
- **Per-plane coastal detection** (Fremantle, Scarborough, Cottesloe, Hillarys, Rockingham).
- **BOM estimate** from total true area: sheets, battens, insulation, fasteners.
- **3D viewer** (Three.js) of the first plane.
- **Site GPS capture** (native on Android, browser geolocation on web).
- **Roof photos** (native camera on Android, file picker on web).
- **Undo point / clear draft / delete plane / clear all.**
- **Export JSON** of the full measurement session.
- **Export to Google Earth (KML)** — downloads a closed-ring KML (site point +
  per-plane polygons) that opens in Google Earth / Google Earth Pro.
- **Offline persistence** — session saved to `localStorage` and restored on reload.

---

## 13. Projects (`/projects`)

- **Guided project wizard** (client, scope, roof details).
- **CRUD** with full audit trail.
- **CSV batch import**.
- **Role-gated** by `projects:read` / `projects:write`.

---

## 14. Billing & Credits (`/billing`)

- **Stripe tiers:** STARTER / PRO_SAFETY / OPS_ERP / EMPIRE_ENTERPRISE_LEASE.
- **Credit quotas** with metered usage.
- **Stripe Connect deposits** for job payments.
- **Unlock modules** à-la-carte.

---

## 15. WA Compliance (`/compliance`)

- **Security of Payment Act 2021 claims** with a 15-business-day Payment Schedule
  countdown (business days, excluding weekends).
- **Building permits (BA1/BA2)** with LGA tracking, status and expiry.
- **Add claim / add permit** forms; mutations persist to the sandbox.

---

## 16. Public Website (`/website`, `/site`)

- **White-label site builder** (branding, services, contact).
- **Public marketing site** at `/site` with ROI calculator, free-first-report lead
  capture, MDX blog and pricing.

---

## 17. SaaS Super-Admin (`/admin`)

- **Tenant switcher** (anchor vs SaaS demo).
- **Tier matrix** and add-on toggles.
- **MRR dashboard** and branding controls.

---

## 18. AI Agents

Four autonomous agents (Executive BI):
- **Procurement agent** — generates RFQs from stock shortages.
- **WHS watchdog** — flags unsigned SWMS / expired harness inspections.
- **OCR bill matcher** — matches supplier invoices to POs.
- **Social/SEO agent** — generates geo-tagged Perth suburb posts.

Run individually or via **Run All Empire Automations**. Routed through
`aiAgentService.ts` to an OpenAI-compatible endpoint (`http://localhost:1234/v1`)
with a deterministic TS fallback.

---

## 19. Companion app (Android)

- Package: `com.ausgreek.roofdynamics`, app name "RoofDynamics Field".
- Native: camera, GPS, haptics, network, preferences, local notifications,
  status bar theming, offline sync.
- Install: `npm run build:android` → Android Studio → `./gradlew bundleRelease`.
- See [docs/GOOGLE_PLAY_RELEASE.md](GOOGLE_PLAY_RELEASE.md).

---

## 20. Keyboard & accessibility

- shadcn/ui (Radix) primitives provide keyboard navigation, focus rings and
  ARIA attributes throughout.
- All forms are keyboard-operable; modals trap focus.

---

## 21. Settings (`/settings`)

Seven tabs:

- **General** — ABN, builder registration #, plumber licence #, default GST rate,
  date format, timezone, default payment terms, default warranty (years), business
  hours. Statutory identifiers sync to the tenant record.
- **Profile** — your name, email; persisted to `/api/users/me` (offline-queued).
- **Appearance** — dark/light theme toggle.
- **Tenant & Branding** — company name, primary colour, logo URL; syncs to
  `/api/tenants/me`.
- **Notifications** — local reminder toggle (EAM harness inspections etc.).
- **Data & Storage** — clear offline write queue, clear sandbox DB, clear all
  local data (with confirmation dialogs).
- **About** — version, attribution, links.

All saves use in-app toast feedback; destructive actions use a confirmation dialog.

## 22. Developer Platform (`/platform`) — developers only

- Tenant list with module counts; **View as tenant** (impersonation) with exit.
- Session inspection, system health, sandbox DB inspector, storage tools.
- Role matrix reference. Developers bypass feature gates and role guards platform-wide.

---

## 23. Data & exports

- **PDF:** `@react-pdf/renderer` live preview; jsPDF legacy generators.
- **CSV:** batch import/export for projects, leads, stock.
- **ABA:** payroll `.ABA` file export for bank upload.
- **ESX:** Xactimate export from Report Studio.

---

*RoofDynamics — Powered by AusGreek Developments.*
