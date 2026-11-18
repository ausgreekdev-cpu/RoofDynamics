import { z } from "zod";
import { env } from "../env";
import { sandboxRequest } from "./sandboxApi";

const API_BASE = env.VITE_API_BASE;

class ApiService {
  private getToken(): string | null {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("rd_token");
    }
    return null;
  }

  private getTenantId(): string | null {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("rd_tenant_id");
    }
    return null;
  }

  /** Typed request — public so feature-scoped clients can reuse the auth/tenant headers. */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Production demo has no hosted backend — serve deterministic local data.
    if (env.VITE_USE_SANDBOX_API) {
      return sandboxRequest<T>(endpoint, options, env);
    }

    const token = this.getToken();
    const tenantId = this.getTenantId();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    if (tenantId) {
      (headers as Record<string, string>)["x-tenant-id"] = tenantId;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // ============================================================
  // Tenants
  // ============================================================
  getTenant() {
    return this.request<{ id: string; name: string; subscriptionTier: string; moduleEntitlements: any[]; _count: any }>("/tenants/me");
  }

  getTenants() {
    return this.request<any[]>("/tenants");
  }

  updateTenant(data: any) {
    return this.request(`/tenants/me`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Subscriptions & Entitlements
  // ============================================================
  getSubscriptions() {
    return this.request<any[]>("/subscriptions");
  }

  createSubscription(data: any) {
    return this.request("/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getEntitlements() {
    return this.request<any[]>("/entitlements");
  }

  updateEntitlement(moduleKey: string, data: { isEnabled: boolean; addOnPrice?: number }) {
    return this.request(`/entitlements/${moduleKey}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Leads
  // ============================================================
  getLeads() {
    return this.request<any[]>("/leads");
  }

  createLead(data: any) {
    return this.request("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateLead(id: string, data: any) {
    return this.request(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Quotes
  // ============================================================
  getQuotes() {
    return this.request<any[]>("/quotes");
  }

  createQuote(data: any) {
    return this.request("/quotes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateQuote(id: string, data: any) {
    return this.request(`/quotes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Jobs
  // ============================================================
  getJobs() {
    return this.request<any[]>("/jobs");
  }

  createJob(data: any) {
    return this.request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateJob(id: string, data: any) {
    return this.request(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // BOM Items
  // ============================================================
  getBOMItems(quoteId?: string) {
    const qs = quoteId ? `?quoteId=${quoteId}` : "";
    return this.request<any[]>(`/bom-items${qs}`);
  }

  createBOMItem(data: any) {
    return this.request("/bom-items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Stock Items
  // ============================================================
  getStockItems(location?: string) {
    const qs = location ? `?location=${location}` : "";
    return this.request<any[]>(`/stock-items${qs}`);
  }

  createStockItem(data: any) {
    return this.request("/stock-items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateStockItem(id: string, data: any) {
    return this.request(`/stock-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Stock Reservations
  // ============================================================
  getStockReservations(jobId?: string) {
    const qs = jobId ? `?jobId=${jobId}` : "";
    return this.request<any[]>(`/stock-reservations${qs}`);
  }

  createStockReservation(data: any) {
    return this.request("/stock-reservations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Crew
  // ============================================================
  getCrew() {
    return this.request<any[]>("/crew");
  }

  createCrewMember(data: any) {
    return this.request("/crew", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // HRIS
  // ============================================================
  getHRIS() {
    return this.request<any[]>("/hris");
  }

  updateHRIS(id: string, data: any) {
    return this.request(`/hris/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Tickets
  // ============================================================
  getTickets() {
    return this.request<any[]>("/tickets");
  }

  createTicket(data: any) {
    return this.request("/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // SWMS
  // ============================================================
  getSWMS() {
    return this.request<any[]>("/swms");
  }

  createSWMS(data: any) {
    return this.request("/swms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateSWMS(id: string, data: any) {
    return this.request(`/swms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Invoices
  // ============================================================
  getInvoices() {
    return this.request<any[]>("/invoices");
  }

  createInvoice(data: any) {
    return this.request("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateInvoice(id: string, data: any) {
    return this.request(`/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // GST & BAS
  // ============================================================
  getGSTLedger(period?: string, year?: string) {
    const qs = new URLSearchParams();
    if (period) qs.set("period", period);
    if (year) qs.set("year", year);
    return this.request<any[]>(`/gst-ledger?${qs.toString()}`);
  }

  getBASReturns() {
    return this.request<any[]>("/bas-returns");
  }

  computeBAS(period?: string, year?: string) {
    const qs = new URLSearchParams();
    if (period) qs.set("period", period);
    if (year) qs.set("year", year);
    return this.request<{
      period: string;
      year: number;
      gstCollected: number;
      gstPaid: number;
      netGst: number;
      totalSales: number;
      totalPurchases: number;
      invoiceCount: number;
      ledgerEntries: number;
    }>(`/bas-returns/compute?${qs.toString()}`);
  }

  createBASReturn(data: any) {
    return this.request("/bas-returns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  lodgeBASReturn(id: string) {
    return this.request(`/bas-returns/${id}`, {
      method: "PUT",
      body: JSON.stringify({ filed: true, filedAt: new Date().toISOString() }),
    });
  }

  // ============================================================
  // TPAR
  // ============================================================
  getTPAR(financialYear?: string) {
    const qs = financialYear ? `?financialYear=${financialYear}` : "";
    return this.request<any[]>(`/tpar${qs}`);
  }

  validateABN(abn: string) {
    return this.request<{
      abn: string;
      isValid: boolean;
      checksumValid: boolean;
      formatValid: boolean;
      entityName?: string;
      entityType?: string;
      status?: string;
      source: string;
      message: string;
    }>(`/tpar/validate-abn/${encodeURIComponent(abn)}`);
  }

  createTPAR(data: any) {
    return this.request("/tpar", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  deleteTPAR(id: string) {
    return this.request(`/tpar/${id}`, { method: "DELETE" });
  }

  // ============================================================
  // Equipment & Harness
  // ============================================================
  getEquipment() {
    return this.request<any[]>("/equipment");
  }

  createEquipment(data: any) {
    return this.request("/equipment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getHarnesses() {
    return this.request<any[]>("/harnesses");
  }

  createHarness(data: any) {
    return this.request("/harnesses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Inspections
  // ============================================================
  getInspections() {
    return this.request<any[]>("/inspections");
  }

  createInspection(data: any) {
    return this.request("/inspections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // RFQ
  // ============================================================
  getRFQs() {
    return this.request<any[]>("/rfqs");
  }

  createRFQ(data: any) {
    return this.request("/rfqs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateRFQ(id: string, data: any) {
    return this.request(`/rfqs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Purchase Orders
  // ============================================================
  getPurchaseOrders() {
    return this.request<any[]>("/purchase-orders");
  }

  createPurchaseOrder(data: any) {
    return this.request("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Audit Logs
  // ============================================================
  getAuditLogs() {
    return this.request<any[]>("/audit-logs");
  }

  // ============================================================
  // Photos
  // ============================================================
  getPhotos(jobId?: string, category?: string) {
    const qs = new URLSearchParams();
    if (jobId) qs.set("jobId", jobId);
    if (category) qs.set("category", category);
    return this.request<any[]>(`/photos?${qs.toString()}`);
  }

  getPhotoData(id: string) {
    return this.request<{ dataUrl: string; mimeType: string; fileName: string }>(`/photos/${id}/data`);
  }

  uploadPhoto(data: any) {
    return this.request<any>("/photos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  deletePhoto(id: string) {
    return this.request(`/photos/${id}`, { method: "DELETE" });
  }

  // ============================================================
  // Payroll
  // ============================================================
  calculatePayroll(data: any) {
    return this.request("/payroll/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getPayRuns() {
    return this.request<any[]>("/payroll/pay-runs");
  }

  getPayRun(id: string) {
    return this.request(`/payroll/pay-runs/${id}`);
  }

  updatePayRun(id: string, data: any) {
    return this.request(`/payroll/pay-runs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Dashboard
  // ============================================================
  getDashboardSummary() {
    return this.request<{
      totalQuotes: number;
      totalJobs: number;
      totalRevenue: number;
      lowStockCount: number;
    }>("/dashboard/summary");
  }
}

export const api = new ApiService();
