import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, Tenant, AuthState } from "../types";
import { env } from "../env";

const AuthContext = createContext<AuthState | undefined>(undefined);

const DEMO_MODULES = [
  "CRM_QUOTING", "WMS_MRP", "OPERATIONS_HRIS", "WHS_SAFETY", "EAM_FLEET",
  "ACCOUNTING", "PUBLIC_WEBSITE", "AI_SOCIAL_AGENT", "BI_EXECUTIVE", "SAAS_SUPER_ADMIN",
];
const DEMO_ENTITLEMENTS = DEMO_MODULES.map((moduleKey) => ({ moduleKey, isEnabled: true }));

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore the user alongside the token on full reload / deep links.
  // Without this, RoleGuard sees no role and protected pages render blank.
  const [user, setUser] = useState<User | null>(() => {
    if (typeof localStorage === "undefined") return null;
    const stored = localStorage.getItem("rd_user");
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        // Corrupt value — recover below when possible.
      }
    }
    // Self-heal legacy demo sessions that have a token but no stored user
    // (created before rd_user persistence was added). Without this, every
    // RoleGuard page renders blank. Demo-only: never inferred for real auth.
    if (env.VITE_USE_SANDBOX_API && localStorage.getItem("rd_token")) {
      const demoUser = {
        id: "user-1",
        tenantId: "tenant-1",
        email: "admin@perthpremier.com.au",
        name: "Demo User",
        role: "admin",
      } as User;
      localStorage.setItem("rd_user", JSON.stringify(demoUser));
      return demoUser;
    }
    return null;
  });
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("rd_token");
    }
    return null;
  });

  // Load persisted tenant. In the demo sandbox, repair incomplete legacy
  // tenant data so FeatureGate does not hide every sidebar link.
  if (typeof localStorage !== "undefined" && !tenant) {
    const stored = localStorage.getItem("rd_tenant");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (env.VITE_USE_SANDBOX_API &&
            (!Array.isArray(parsed.moduleEntitlements) || parsed.moduleEntitlements.length === 0)) {
          parsed.moduleEntitlements = DEMO_ENTITLEMENTS;
          localStorage.setItem("rd_tenant", JSON.stringify(parsed));
        }
        setTenant(parsed);
      } catch {
        // Corrupt tenant data — ignore
      }
    } else if (env.VITE_USE_SANDBOX_API && localStorage.getItem("rd_token")) {
      const demoTenant = {
        id: "tenant-1",
        name: "Perth Premier Roofing & Plumbing Pty Ltd",
        subscriptionTier: "EMPIRE_ENTERPRISE_LEASE",
        moduleEntitlements: DEMO_ENTITLEMENTS,
      } as Tenant;
      localStorage.setItem("rd_tenant", JSON.stringify(demoTenant));
      setTenant(demoTenant);
    }
  }

  const login = useCallback((tokenValue: string, userData: User, tenantData: Tenant) => {
    localStorage.setItem("rd_token", tokenValue);
    localStorage.setItem("rd_user", JSON.stringify(userData));
    localStorage.setItem("rd_tenant", JSON.stringify(tenantData));
    localStorage.setItem("rd_tenant_id", tenantData.id);
    setToken(tokenValue);
    setUser(userData);
    setTenant(tenantData);
  }, []);

  // Session hardening: validate token against backend on mount (non-sandbox only).
  useEffect(() => {
    if (env.VITE_USE_SANDBOX_API || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled && (res.status === 401 || res.status === 403)) {
          // Token invalid/expired — clear session
          localStorage.removeItem("rd_token");
          localStorage.removeItem("rd_user");
          localStorage.removeItem("rd_tenant");
          setToken(null);
          setUser(null);
          setTenant(null);
        }
      } catch {
        // Network error — keep session (offline-first)
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem("rd_token");
    localStorage.removeItem("rd_user");
    localStorage.removeItem("rd_tenant");
    localStorage.removeItem("rd_tenant_id");
    setToken(null);
    setUser(null);
    setTenant(null);
  }, []);

  const setTenantCtx = useCallback((tenantData: Tenant) => {
    localStorage.setItem("rd_tenant", JSON.stringify(tenantData));
    localStorage.setItem("rd_tenant_id", tenantData.id);
    setTenant(tenantData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenant, token, isAuthenticated: !!token, login, logout, setTenant: setTenantCtx }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
