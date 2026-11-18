/**
 * Deterministic local sandbox API.
 *
 * Production is a demo deployment with no hosted backend. This module serves
 * seeded data and persists every mutation to localStorage, so all modules have
 * working state (offline-first, per AGENTS.md). It is activated by
 * VITE_USE_SANDBOX_API; local development keeps using the real Express API.
 */
import type { ClientEnv } from "../env";

const DB_KEY = "rd_sandbox_db";

type Row = Record<string, any>;
type Db = Record<string, Row[]>;

const ENTITLEMENTS = [
  "CRM_QUOTING", "WMS_MRP", "OPERATIONS_HRIS", "WHS_SAFETY", "EAM_FLEET",
  "ACCOUNTING", "PUBLIC_WEBSITE", "AI_SOCIAL_AGENT", "BI_EXECUTIVE", "SAAS_SUPER_ADMIN",
].map((moduleKey) => ({ id: `ent-${moduleKey}`, moduleKey, isEnabled: true, addOnPrice: 0 }));

/** Seed data mirrors the shapes used by the feature modules. */
function seedDb(): Db {
  return {
    tenants: [
      {
        id: "tenant-1",
        name: "Perth Premier Roofing & Plumbing Pty Ltd",
        subscriptionTier: "EMPIRE_ENTERPRISE_LEASE",
        moduleEntitlements: ENTITLEMENTS,
        branding: { companyName: "Perth Premier Roofing", accent: "#0EA5E9" },
      },
      {
        id: "tenant-2",
        name: "Swan Valley Roof Restorations",
        subscriptionTier: "PRO_SAFETY",
        moduleEntitlements: ENTITLEMENTS.map((e) => ({ ...e, isEnabled: e.moduleKey !== "SAAS_SUPER_ADMIN" })),
      },
    ],
    subscriptions: [
      { id: "sub-1", tenantId: "tenant-1", tier: "EMPIRE_ENTERPRISE_LEASE", monthlyFee: 699, status: "ACTIVE" },
      { id: "sub-2", tenantId: "tenant-2", tier: "PRO_SAFETY", monthlyFee: 199, status: "ACTIVE" },
    ],
    entitlements: ENTITLEMENTS,
    leads: [
      { id: "lead-1", firstName: "James", lastName: "Wilson", suburb: "Fremantle", status: "QUOTING", estimatedValue: 35000, phone: "0412 345 678" },
      { id: "lead-2", firstName: "Sarah", lastName: "McDonald", suburb: "Scarborough", status: "CONTACTED", estimatedValue: 28000, phone: "0423 456 789" },
      { id: "lead-3", firstName: "Robert", lastName: "Thompson", suburb: "Cottesloe", status: "NEW", estimatedValue: 42000, phone: "0434 567 890" },
    ],
    quotes: [
      { id: "quote-1", number: "Q-2026-014", customer: "James Wilson", suburb: "Fremantle", amount: 34850, status: "SENT", planArea: 180, pitch: 22 },
      { id: "quote-2", number: "Q-2026-015", customer: "Sarah McDonald", suburb: "Scarborough", amount: 27990, status: "DRAFT", planArea: 145, pitch: 18 },
    ],
    jobs: [
      { id: "job-1", number: "J-2026-101", customer: "Robert Thompson", suburb: "Cottesloe", status: "IN_PROGRESS", value: 42000, start: "2026-11-23" },
      { id: "job-2", number: "J-2026-102", customer: "Margaret Davis", suburb: "Kalamunda", status: "SCHEDULED", value: 31500, start: "2026-11-30" },
      { id: "job-3", number: "J-2026-100", customer: "Ian Foster", suburb: "Hillarys", status: "COMPLETE", value: 22500, start: "2026-11-02" },
    ],
    bomItems: [
      { id: "bom-1", quoteId: "quote-1", sku: "CB-CORR-3.0", description: "Colorbond Custom Orb 3.0m", quantity: 96, unit: "sheets", unitCost: 32 },
      { id: "bom-2", quoteId: "quote-1", sku: "BATT-40MM", description: "Topspan 40mm Batten 6.5m", quantity: 32, unit: "lengths", unitCost: 55 },
      { id: "bom-3", quoteId: "quote-1", sku: "ANTICON-60", description: "Anticon 60mm Insulation", quantity: 15, unit: "rolls", unitCost: 65 },
    ],
    stockItems: [
      { id: "stock-1", sku: "CB-CORR-3.0", name: "Colorbond Corrugated 3.0m", location: "WELSHPOOL_MAIN_YARD", quantityOnHand: 45, quantityReserved: 10, reorderPoint: 20, unitCost: 32, supplier: "Lysaght Welshpool" },
      { id: "stock-2", sku: "BATT-40MM", name: "Topspan 40mm Batten", location: "HILUX_UTE_1", quantityOnHand: 120, quantityReserved: 30, reorderPoint: 50, unitCost: 8.5, supplier: "Stramit Malaga" },
      { id: "stock-3", sku: "ANTICON-60", name: "Anticon 60mm Insulation", location: "WELSHPOOL_MAIN_YARD", quantityOnHand: 12, quantityReserved: 5, reorderPoint: 8, unitCost: 65, supplier: "Metroll Canning Vale" },
      { id: "stock-4", sku: "SCREW-12G", name: "12g x 65mm Crest Screws", location: "ISUZU_TRUCK_2", quantityOnHand: 5000, quantityReserved: 1500, reorderPoint: 2000, unitCost: 0.65, supplier: "Stratco" },
    ],
    stockReservations: [
      { id: "res-1", jobId: "job-1", stockItemId: "stock-1", quantity: 10, status: "ACTIVE" },
    ],
    crew: [
      { id: "crew-1", name: "Nikos Kyriakidis", role: "Lead Carpenter", phone: "0411 111 111", rate: 95, status: "ON_SITE" },
      { id: "crew-2", name: "Daniel Rossi", role: "Roof Plumber", phone: "0412 222 222", rate: 100, status: "AVAILABLE" },
      { id: "crew-3", name: "Marcus Bell", role: "Apprentice", phone: "0413 333 333", rate: 45, status: "AVAILABLE" },
      { id: "crew-4", name: "Steve Nguyen", role: "Safety Officer", phone: "0414 444 444", rate: 85, status: "OFF" },
    ],
    hris: [
      { id: "hris-1", name: "Nikos Kyriakidis", role: "Lead Carpenter", superRate: 0.12, myLeaveRate: 0.0075, apprentice: false },
      { id: "hris-2", name: "Marcus Bell", role: "Apprentice", superRate: 0.12, myLeaveRate: 0, apprentice: true },
    ],
    tickets: [
      { id: "ticket-1", title: "Replace valley iron — storm damage", suburb: "Fremantle", status: "OPEN", priority: "HIGH" },
      { id: "ticket-2", title: "Box gutter leak", suburb: "Cottesloe", status: "IN_PROGRESS", priority: "MEDIUM" },
    ],
    swms: [
      { id: "swms-1", title: "Working at heights > 2.0m — re-roof", jobId: "job-1", signed: true, signedBy: "Nikos Kyriakidis", date: "2026-11-17" },
      { id: "swms-2", title: "Asbestos removal — Super Six", jobId: "job-3", signed: true, signedBy: "Daniel Rossi", date: "2026-11-01" },
    ],
    invoices: [
      { id: "inv-1", invoiceNumber: "INV-2026-041", jobId: "job-1", client: "Robert Thompson", milestone: "DEPOSIT_10", amount: 4200, gstAmount: 381.82, totalIncGst: 4581.82, status: "PAID", dueDate: "2026-11-20" },
      { id: "inv-2", invoiceNumber: "INV-2026-042", jobId: "job-1", client: "Robert Thompson", milestone: "PROGRESS_50", amount: 21000, gstAmount: 1909.09, totalIncGst: 22909.09, status: "SENT", dueDate: "2026-12-05" },
      { id: "inv-3", invoiceNumber: "INV-2026-043", jobId: "job-2", client: "Margaret Davis", milestone: "FINAL_40", amount: 12600, gstAmount: 1145.45, totalIncGst: 13745.45, status: "DRAFT", dueDate: "2026-12-20" },
    ],
    gstLedger: [
      { id: "gst-1", date: "2026-11-17", type: "INVOICE", description: "Deposit — Robert Thompson", amount: 4200, gst: 381.82 },
      { id: "gst-2", date: "2026-11-10", type: "BILL", description: "Lysaght materials", amount: 3200, gst: 290.91 },
    ],
    basReturns: [
      { id: "bas-1", period: "2026-Q1", status: "LODGED", gstCollected: 12400, gstPaid: 8200, netGst: 4200 },
    ],
    tpar: [
      { id: "tpar-1", supplier: "Lysaght Welshpool", abn: "53004605424", total: 18400, period: "2026-Q1" },
      { id: "tpar-2", supplier: "Stramit Malaga", abn: "21005678900", total: 9200, period: "2026-Q1" },
    ],
    equipment: [
      { id: "eq-1", name: "Hilux Ute 1", assetType: "UTE", serialNumber: "HT-001", status: "ACTIVE", location: "WELSHPOOL_MAIN_YARD", assignedTo: "Nikos Kyriakidis", purchaseDate: "2023-01-15", cost: 45000 },
      { id: "eq-2", name: "Isuzu Truck 2", assetType: "UTE", serialNumber: "IS-002", status: "ACTIVE", location: "WELSHPOOL_MAIN_YARD", assignedTo: "Daniel Rossi", purchaseDate: "2022-06-10", cost: 68000 },
      { id: "eq-3", name: "Edge Protection Rail Kit A", assetType: "EDGE_PROTECTION_RAIL_KIT", serialNumber: "EP-001", status: "ACTIVE", location: "HILUX_UTE_1", assignedTo: null, purchaseDate: "2024-03-01", cost: 3500 },
    ],
    harnesses: [
      { id: "har-1", name: "Full Body Harness — Nikos", serialNumber: "HARN-001", status: "ACTIVE", lastInspectionDate: "2026-06-01", nextInspectionDue: "2026-12-01", assignedTo: "Nikos Kyriakidis" },
      { id: "har-2", name: "Full Body Harness — Daniel", serialNumber: "HARN-002", status: "ACTIVE", lastInspectionDate: "2026-05-20", nextInspectionDue: "2026-11-20", assignedTo: "Daniel Rossi" },
    ],
    inspections: [
      { id: "insp-1", equipment: { name: "Full Body Harness — Daniel" }, inspectionType: "AS/NZS 1891.4", status: "PASSED", inspectionDate: "2026-05-20", nextDueDate: "2026-11-20", inspectorName: "Steve Nguyen" },
      { id: "insp-2", equipment: { name: "Full Body Harness — Nikos" }, inspectionType: "AS/NZS 1891.4", status: "PASSED", inspectionDate: "2026-06-01", nextDueDate: "2026-12-01", inspectorName: "Steve Nguyen" },
    ],
    rfqs: [
      { id: "rfq-1", item: "Colorbond Corrugated 3.0m", quantity: 96, status: "OPEN", supplier: "Lysaght", price: 3072 },
      { id: "rfq-2", item: "Topspan 40mm Batten", quantity: 32, status: "RECEIVED", supplier: "Stramit", price: 1760 },
    ],
    purchaseOrders: [
      { id: "po-1", number: "PO-2026-088", supplier: "Lysaght Welshpool", total: 3072, status: "ORDERED" },
      { id: "po-2", number: "PO-2026-089", supplier: "Stramit Malaga", total: 1760, status: "DRAFT" },
    ],
    auditLogs: [
      { id: "audit-1", action: "QUOTE_CREATED", actor: "admin@perthpremier.com.au", at: "2026-11-17T09:12:00Z" },
      { id: "audit-2", action: "SWMS_SIGNED", actor: "admin@perthpremier.com.au", at: "2026-11-17T14:30:00Z" },
    ],
    photos: [
      { id: "photo-1", jobId: "job-1", fileName: "before-1.jpg", mimeType: "image/jpeg", uploadedAt: "2026-11-17T08:00:00Z" },
      { id: "photo-2", jobId: "job-1", fileName: "after-1.jpg", mimeType: "image/jpeg", uploadedAt: "2026-11-18T16:00:00Z" },
    ],
    payRuns: [
      { id: "payrun-1", period: "2026-11-W3", status: "DRAFT", gross: 12400, superAmount: 1488, myLeave: 93 },
      { id: "payrun-2", period: "2026-11-W2", status: "APPROVED", gross: 11800, superAmount: 1416, myLeave: 88.5 },
    ],
    paymentClaims: [
      { id: "claim-1", claimNumber: "PC-2026-007", claimantName: "Robert Thompson", claimAmount: 42000, servedDate: "2026-11-10", responseDueDate: "2026-12-01", status: "PENDING", noticeAttached: true },
      { id: "claim-2", claimNumber: "PC-2026-006", claimantName: "Margaret Davis", claimAmount: 31500, servedDate: "2026-11-01", responseDueDate: "2026-11-22", status: "PENDING", noticeAttached: true },
    ],
    buildingPermits: [
      { id: "permit-1", permitNumber: "BA1-2026-1188", permitType: "BA1", lga: "City of Fremantle", status: "APPROVED", expiryDate: "2027-05-18" },
      { id: "permit-2", permitNumber: "BA2-2026-1042", permitType: "BA2", lga: "Shire of Kalamunda", status: "UNDER_REVIEW" },
    ],
  };
}

function loadDb(): Db {
  const fresh = seedDb();
  if (typeof localStorage === "undefined") return fresh;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return { ...fresh, ...JSON.parse(raw) };
  } catch {
    // Corrupt sandbox state — fall back to a clean seed.
  }
  return fresh;
}

function saveDb(db: Db) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

const PATH_TO_KEY: Record<string, string> = {
  tenants: "tenants", subscriptions: "subscriptions", entitlements: "entitlements",
  leads: "leads", quotes: "quotes", jobs: "jobs", "bom-items": "bomItems",
  "stock-items": "stockItems", "stock-reservations": "stockReservations",
  crew: "crew", hris: "hris", tickets: "tickets", swms: "swms", invoices: "invoices",
  "gst-ledger": "gstLedger", "bas-returns": "basReturns", tpar: "tpar",
  equipment: "equipment", harnesses: "harnesses", inspections: "inspections",
  rfqs: "rfqs", "purchase-orders": "purchaseOrders", "audit-logs": "auditLogs",
  photos: "photos", "payroll/pay-runs": "payRuns",
  "compliance/payment-claims": "paymentClaims", "compliance/building-permits": "buildingPermits",
};

function newId(prefix: string): string {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

/** Handle an API request entirely in the browser. */
export async function sandboxRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _env: ClientEnv
): Promise<T> {
  const [rawPath, rawQuery = ""] = endpoint.split("?");
  const path = rawPath.replace(/^\/+|\/+$/g, "");
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(String(options.body)) : undefined;
  const db = loadDb();

  // ---- Special, non-CRUD endpoints ----
  if (path === "auth/login") {
    return {
      token: "sandbox-token",
      user: { id: "user-1", tenantId: "tenant-1", email: "admin@perthpremier.com.au", name: "Demo User", role: "admin" },
      tenant: db.tenants[0],
    } as T;
  }
  if (path === "tenants/me") {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("rd_tenant") : null;
    return (stored ? JSON.parse(stored) : db.tenants[0]) as T;
  }
  if (path === "dashboard/summary") {
    return {
      totalQuotes: db.quotes.length,
      totalJobs: db.jobs.length,
      totalRevenue: db.invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0),
      lowStockCount: db.stockItems.filter(
        (s) => Number(s.quantityOnHand) <= Number(s.reorderPoint)
      ).length,
    } as T;
  }
  if (path === "payroll/calculate") {
    const gross = Number(body?.gross ?? 0);
    return {
      gross,
      payg: Math.round(gross * 0.19 * 100) / 100,
      superAmount: Math.round(gross * 0.12 * 100) / 100,
      myLeave: Math.round(gross * 0.0075 * 100) / 100,
    } as T;
  }
  if (/^photos\/[^/]+\/data$/.test(path)) {
    return {
      dataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=",
      mimeType: "image/svg+xml",
      fileName: "photo.svg",
    } as T;
  }

  // ---- Generic collection CRUD ----
  const segments = path.split("/");
  const matchedPath = PATH_TO_KEY[path] ? path : segments[0];
  const key = PATH_TO_KEY[matchedPath];
  if (!key || !db[key]) {
    throw new Error(`Sandbox has no data for ${path}`);
  }
  const collection = db[key];
  const matchedDepth = matchedPath.split("/").length;
  const itemId = segments.length > matchedDepth
    ? segments.slice(matchedDepth).join("/")
    : undefined;

  if (method === "GET") {
    if (itemId) {
      const row = collection.find((r) => String(r.id) === itemId || String(r.moduleKey) === itemId);
      if (!row) throw new Error(`Not found: ${path}`);
      return row as T;
    }
    const params = new URLSearchParams(rawQuery);
    let rows = collection;
    params.forEach((value, field) => {
      if (!value) return;
      if (rows.some((r) => field in r)) {
        rows = rows.filter((r) => String(r[field]) === value);
      }
    });
    return rows as T;
  }

  if (method === "POST") {
    const row = { id: newId(key), ...(body || {}) };
    collection.unshift(row);
    saveDb(db);
    return row as T;
  }

  if (method === "PATCH" || method === "PUT") {
    if (!itemId) throw new Error(`Missing id for ${path}`);
    const row = collection.find((r) => String(r.id) === itemId || String(r.moduleKey) === itemId);
    if (!row) throw new Error(`Not found: ${path}`);
    Object.assign(row, body || {});
    saveDb(db);
    return row as T;
  }

  if (method === "DELETE") {
    if (!itemId) throw new Error(`Missing id for ${path}`);
    const index = collection.findIndex((r) => String(r.id) === itemId || String(r.moduleKey) === itemId);
    if (index >= 0) collection.splice(index, 1);
    saveDb(db);
    return { success: true } as T;
  }

  throw new Error(`Unsupported sandbox method: ${method}`);
}
