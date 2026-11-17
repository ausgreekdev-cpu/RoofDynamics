# ROLE & EXECUTION MANDATE
You are an Autonomous Principal Full-Stack Systems Architect. Build **RoofDynamics** (powered by AusGreek Developments) — a production-grade, Multi-Tenant SaaS & Enterprise ERP Browser System for Roofing & Trade Businesses in Perth, Western Australia.

## STRICT ANTI-PLACEHOLDER RULES (MANDATORY)
1. **NO STUBS OR TODOs**: Never write `// TODO`, `// Coming soon`, or static dummy tabs. Every module in the sidebar must render functional data tables, interactive calculators, creation modals, and state-mutating action buttons.
2. **END-TO-END REACTIVITY**: Accepting a quote in the CRM MUST dynamically create a Job, lock the BOM, deduct/reserve stock in WMS, generate shortage RFQs in SCM, check worker tickets in HRIS/WHS, and create a Deposit Invoice in Accounting.
3. **SELF-HEALING VERIFICATION**: After scaffolding and coding, you must run `npm run build` / `tsc --noEmit` via terminal tools, inspect any TypeScript or bundling errors, and fix them autonomously until compilation succeeds with zero errors.

---

# 1. TECH STACK & MULTI-TENANT SAAS ARCHITECTURE
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts.
- **Backend / API Layer**: Node.js + Express + TypeScript REST API, paired with a synchronized frontend store and an **Offline-First IndexedDB / LocalStorage Sync Engine** so the app runs seamlessly both connected and offline on roofs.
- **Database Schema**: Provide a complete, production-ready `prisma/schema.prisma` (PostgreSQL) where every model is scoped by `tenantId`.
- **Local & Cloud AI Agent Bridge**: Configure an AI service (`src/services/aiAgentService.ts`) that connects to a local OpenAI-compatible LLM endpoint (`http://localhost:1234/v1` for LM Studio / Qwen / Llama) OR standard API keys, paired with a **deterministic TypeScript fallback engine** so every AI agent executes instantaneously even if the local LLM server is offline.
- **Visual Identity**:
  - High-contrast Industrial Dark/Slate UI (`#0F172A` background, `#1E293B` cards, `#0EA5E9` Electric Blue, `#10B981` Electric Green, `#0A192F` Navy accents, `#F59E0B` High-Vis Amber warnings).
  - Top bar includes a **"RD" Monogram Logo**, dynamic White-Label Tenant Header, and footer attribution: *"RoofDynamics — Powered by AusGreek Developments"*.

---

# 2. COMMERCIAL LICENSING, TIERS & FEATURE-FLAG ENGINE
Implement a live **Tenant & SaaS Tier Switcher** in the top navigation bar so the developer can demonstrate both business models in real time:
1. **Tenant 1 (Anchor Client — "Perth Premier Roofing & Plumbing Pty Ltd")**:
   - Plan: `EMPIRE_ENTERPRISE_LEASE` ($699/mo + Custom Lease). All 9 modules and all 4 Autonomous AI Agents unlocked, custom white-label branding active.
2. **Tenant 2 (SaaS Customer — "Swan Valley Roof Restorations")**:
   - Plan: Switchable between `STARTER` ($79/mo), `PRO_SAFETY` ($199/mo), `OPS_ERP` ($399/mo), plus individual **À La Carte Module Toggles** (e.g., unlock `AI_SOCIAL_AGENT` for +$49/mo).

Wrap gated UI views in `<FeatureGate moduleKey="...">`. If locked on the current tier, render an interactive **SaaS Upsell Preview Card** showing the module's ROI and a 1-click *"Unlock Module / Upgrade Tier"* button that dynamically updates the tenant's active entitlements.

---

# 3. EXACT DOMAIN FORMULAS & WA REGULATORY LOGIC TO HARDCODE

## A. WA Roof Pitch, Coastal Zone & BOM Math (`src/utils/roofBomCalculator.ts`)
Implement these exact engineering calculations in the Interactive Roof Estimator:
- **Pitch Multiplier**: $\text{PitchFactor} = \frac{1}{\cos(\text{pitchDegrees} \times \frac{\pi}{180})}$
- **True Roof Surface Area ($m^2$)**: $\text{PlanArea} \times \text{PitchFactor} \times (1 + \text{wastePercentage})$ (Default waste: 7% gable, 12% hip/valley).
- **Colorbond Corrugated (Custom Orb) Sheets**: Effective cover width = $0.762\text{m}$. Sheet count = $\lceil \text{TrueArea} / 0.762 \rceil$ (or broken down by run length).
- **Roof Battens (Topspan 40mm)**: Spacing at $0.9\text{m}$ centres $\rightarrow \text{Lineal Metres} = \lceil \frac{\text{TrueArea}}{0.9} \rceil$, divided by $6.5\text{m}$ stock lengths.
- **Anticon 60mm Insulation Blanket**: Roll coverage = $15\text{m}^2/\text{roll} \rightarrow \lceil \frac{\text{TrueArea}}{15} \rceil$.
- **Fasteners (12g x 65mm Crest Screws with Neo Washers)**: $7\text{ screws per } m^2$ for standard region; $10\text{ screws per } m^2$ for cyclonic/high-wind ridge zones.
- **AS/NZS 2728 Perth Coastal Corrosion Check**: If the job suburb is coastal (e.g., `Fremantle`, `Scarborough`, `Cottesloe`, `Hillarys`, `Rockingham`), automatically flag **"Severe Marine Zone (<1km from surf)"** and upgrade BOM materials to **Colorbond Ultra** + **Class 4 / Stainless 316 Fasteners**.

## B. Western Australian Statutory Compliance Gatekeeper (`src/utils/waComplianceEngine.ts`)
Automatically evaluate every Quote and Job against WA laws:
1. **WA Building Services Board ($20,000 Rule)**: If `quote.totalIncGst >= 20000` and job involves structural/re-roofing work, require an active **WA Registered Builder Practitioner** number on the job.
2. **WA Plumbers Licensing Board Rule**: If the quote includes `Gutters`, `Downpipes`, `Valley Irons`, or `Roof Flashings`, classify as *Roof Plumbing Work* and block job scheduling unless an assigned crew member holds a valid **WA Plumbing Tradesperson / Contractor Licence**.
3. **WorkSafe WA WHS Act 2020 (High-Risk Construction Work)**:
   - Any job with roof height $> 2.0\text{m}$ requires a signed digital **Falling from Heights SWMS** and verified perimeter Edge Protection before the crew can clock in.
   - Any job marked `Asbestos Super Six Removal` over $10\text{m}^2$ requires a **WorkSafe WA Class B/A Asbestos Removal Licence** + mandatory 5-day WorkSafe notification log + tip receipt tracking.

---

# 4. THE 9 CORE MODULES TO BUILD

1. **SaaS Super-Admin & Lease Manager**: Tenant switcher, Subscription Tier matrix, À La Carte add-on toggles, White-Label branding editor (Name, ABN, Builder Reg, Plumber Lic, Primary Colour), and SaaS MRR tracker.
2. **Executive BI & "One-Man Empire" AI Autopilot Hub**:
   - Charts: Gross vs. Net Margin per $m^2$, Monthly Cash Flow, Lead-to-Win Funnel, Crew installation speed ($m^2$/day).
   - **4 Autonomous Agents** with a "Run All Empire Automations" button and live terminal-style execution feed:
     1. *Procurement & RFQ Agent* (auto-generates RFQs to Lysaght Welshpool, Metroll Canning Vale, Stramit Malaga, Stratco).
     2. *WHS & Licence Watchdog Agent* (audits crew tickets & WA statutory rules).
     3. *OCR Bill & 3-Way Match Agent* (matches Supplier Invoice $\leftrightarrow$ PO $\leftrightarrow$ Delivery Docket).
     4. *Social Media & Local SEO Agent* (turns Before/After roof photos into geo-tagged Perth suburb posts).
3. **CRM, Quoting & Interactive 3D/Pitch BOM Estimator**: Kanban board, interactive calculator using the exact formulas above, coastal suburb detector, and **"1-Click Accept Quote & Trigger ERP Pipeline"** button.
4. **WMS (Warehouse & Van Inventory), MRP & RFQ Manager**: Track stock across *Welshpool Main Yard*, *Hilux Ute 1*, and *Isuzu Truck 2*. Live MRP shortage table and side-by-side Supplier RFQ bid comparison with 1-click PO generation.
5. **Operations Scheduler, HRIS & 2026 ATO Payday Super Payroll**:
   - Visual crew roster with Perth Weather & Wind Speed safety warnings (flags high wind $> 35\text{km/h}$ as unsafe for sheet laying).
   - Employee & Subbie HRIS profiles (White Card, Working at Heights, EWP, Plumbing Licence, KPIs).
   - **Payday Super & STP Phase 2 Calculator**: Calculates Ordinary Time Earnings, 12% Super Guarantee payable every pay run, PAYG withholding, WA **MyLeave** (Construction Portable Long Service Leave levy), STP JSON preview, and `.ABA` bank file generator.
6. **WHS Safety, Digital SWMS & Field Crew Mobile PWA View**:
   - Dedicated toggle for **"Field Crew Mobile Mode"** (simulates a smartphone on the roof): Pre-start hazard checklist, harness serial check, digital signature pad/button for SWMS, Before/After photo uploader, and variation request form.
7. **Equipment, Fleet & Harness Register (EAM)**: Track utes, trailers, edge-protection rail kits, nail guns, and harnesses with mandatory **6-month AS/NZS 1891.4 fall-arrest inspection tag countdowns**.
8. **Accounting, Progress Claims, BAS & TPAR**:
   - Roofing milestone invoicing (10% Deposit, 50% Materials on Site, 40% Completion + Auto-Generated 10-Year Workmanship & Bluescope Warranty Certificate).
   - 10% GST ledger, quarterly BAS summary, and Contractor **TPAR (Taxable Payments Annual Report)** tracker with ABN check.
9. **Public Website