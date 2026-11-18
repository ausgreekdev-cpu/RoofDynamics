import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { RoleGuard } from "../features/auth/RoleGuard";
import { env } from "../env";

// Global setup uses a no-op localStorage mock; provide a real in-memory store.
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

const DEMO_USER = { id: "u1", tenantId: "t1", email: "admin@perthpremier.com.au", name: "Demo", role: "admin" };
const DEMO_TENANT = { id: "t1", name: "Perth Premier", subscriptionTier: "EMPIRE_ENTERPRISE_LEASE", moduleEntitlements: [] };

function Probe() {
  const { user, tenant, login, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="email">{user?.email ?? "none"}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="modules">{String(tenant?.moduleEntitlements?.length ?? 0)}</span>
      <RoleGuard permission="projects:read">
        <span data-testid="allowed">allowed</span>
      </RoleGuard>
      <button onClick={() => login("tok", DEMO_USER as any, DEMO_TENANT as any)}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

describe("AuthProvider session restoration", () => {
  beforeEach(() => {
    store.clear();
    installLocalStorage();
  });

  it("restores the user on a full reload so protected pages render", () => {
    store.set("rd_token", "tok");
    store.set("rd_user", JSON.stringify(DEMO_USER));
    store.set("rd_tenant", JSON.stringify(DEMO_TENANT));

    renderAuth();

    expect(screen.getByTestId("email").textContent).toBe(DEMO_USER.email);
    expect(screen.getByTestId("auth").textContent).toBe("true");
    expect(screen.getByTestId("allowed")).toBeTruthy();
  });

  it("does not render protected content without a restored user", () => {
    store.set("rd_token", "tok");
    renderAuth();
    expect(screen.queryByTestId("allowed")).toBeNull();
  });

  it("self-heals a legacy sandbox session with a token but no user", () => {
    const original = env.VITE_USE_SANDBOX_API;
    env.VITE_USE_SANDBOX_API = true;
    store.set("rd_token", "tok");
    store.set("rd_tenant", JSON.stringify({ ...DEMO_TENANT, moduleEntitlements: [] }));
    try {
      renderAuth();
      expect(screen.getByTestId("email").textContent).toBe("admin@perthpremier.com.au");
      expect(screen.getByTestId("allowed")).toBeTruthy();
      expect(screen.getByTestId("modules").textContent).not.toBe("0");
      expect(store.get("rd_user")).toBeTruthy();
    } finally {
      env.VITE_USE_SANDBOX_API = original;
    }
  });

  it("persists the user on login and removes it on logout", () => {
    renderAuth();
    fireEvent.click(screen.getByText("login"));
    expect(JSON.parse(store.get("rd_user") || "{}").email).toBe(DEMO_USER.email);
    expect(screen.getByTestId("allowed")).toBeTruthy();

    fireEvent.click(screen.getByText("logout"));
    expect(store.get("rd_user")).toBeUndefined();
    expect(screen.getByTestId("email").textContent).toBe("none");
    expect(screen.queryByTestId("allowed")).toBeNull();
  });
});
