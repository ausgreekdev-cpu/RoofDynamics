import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { User, Tenant, AuthState } from "../types";

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore the user alongside the token on full reload / deep links.
  // Without this, RoleGuard sees no role and protected pages render blank.
  const [user, setUser] = useState<User | null>(() => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("rd_user");
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          return null;
        }
      }
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

  // Load persisted tenant
  if (typeof localStorage !== "undefined" && !tenant) {
    const stored = localStorage.getItem("rd_tenant");
    if (stored) {
      try {
        setTenant(JSON.parse(stored));
      } catch {}
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
