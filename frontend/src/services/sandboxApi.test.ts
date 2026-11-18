import { describe, it, expect, beforeEach, vi } from "vitest";
import { sandboxRequest } from "./sandboxApi";
import { env } from "../env";

const store = new Map<string, string>();
function installLocalStorage() {
  vi.mocked(localStorage.getItem).mockImplementation((k) => store.get(k) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((k, v) => {
    store.set(k, String(v));
  });
  vi.mocked(localStorage.removeItem).mockImplementation((k) => {
    store.delete(k);
  });
  vi.mocked(localStorage.clear).mockImplementation(() => store.clear());
}

describe("sandboxApi", () => {
  beforeEach(() => {
    store.clear();
    installLocalStorage();
  });

  it("serves seeded collection data", async () => {
    const leads: any[] = await sandboxRequest("/leads", {}, env);
    expect(leads.length).toBeGreaterThanOrEqual(3);
    expect(leads[0]).toHaveProperty("suburb");
  });

  it("filters list results by query parameters", async () => {
    const rows: any[] = await sandboxRequest("/stock-items?location=HILUX_UTE_1", {}, env);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.location === "HILUX_UTE_1")).toBe(true);
  });

  it("creates, updates and deletes records with persistence", async () => {
    const created: any = await sandboxRequest("/leads", {
      method: "POST",
      body: JSON.stringify({ firstName: "Test", lastName: "Lead", suburb: "Perth" }),
    }, env);
    expect(created.id).toBeTruthy();

    const fetched: any = await sandboxRequest(`/leads/${created.id}`, {}, env);
    expect(fetched.firstName).toBe("Test");

    const updated: any = await sandboxRequest(`/leads/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "WON" }),
    }, env);
    expect(updated.status).toBe("WON");

    await sandboxRequest(`/leads/${created.id}`, { method: "DELETE" }, env);
    await expect(sandboxRequest(`/leads/${created.id}`, {}, env)).rejects.toThrow(/Not found/);
  });

  it("computes the dashboard summary", async () => {
    const summary: any = await sandboxRequest("/dashboard/summary", {}, env);
    expect(summary.totalQuotes).toBeGreaterThan(0);
    expect(summary.totalRevenue).toBeGreaterThan(0);
    expect(typeof summary.lowStockCount).toBe("number");
  });

  it("handles compliance endpoints", async () => {
    const claims: any[] = await sandboxRequest("/compliance/payment-claims", {}, env);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].responseDueDate).toBeTruthy();

    const permits: any[] = await sandboxRequest("/compliance/building-permits", {}, env);
    expect(permits.length).toBeGreaterThan(0);
  });

  it("fails loudly for unknown endpoints", async () => {
    await expect(sandboxRequest("/does-not-exist", {}, env)).rejects.toThrow(/no data/);
  });
});
