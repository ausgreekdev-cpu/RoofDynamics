'use client'

import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import { api } from "../services/api";
import { isNative } from "../services/nativeBridge";
import { Code2, Database, Key, Shield, Trash2, RefreshCw, Building2, Users, Activity, Eye } from "lucide-react";

interface TenantSummary {
  id: string;
  name: string;
  subscriptionTier: string;
  moduleEntitlements?: { moduleKey: string; isEnabled: boolean }[];
}

export default function DeveloperPortal() {
  const { user, tenant, token, setTenant } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { theme } = useTheme();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const loadTenants = async () => {
    try {
      const data = await api.getTenants();
      setTenants(Array.isArray(data) ? data : []);
    } catch {
      // Fallback to sandbox seed if API unavailable
      try {
        const raw = localStorage.getItem("rd_sandbox_db");
        if (raw) {
          const db = JSON.parse(raw);
          if (Array.isArray(db.tenants)) setTenants(db.tenants);
        }
      } catch {
        // ignore
      }
    }
  };

  const refreshStorage = () => {
    if (typeof localStorage === "undefined") return;
    setStorageKeys(Object.keys(localStorage).sort());
  };

  useEffect(() => {
    loadTenants();
    refreshStorage();
  }, []);

  const impersonate = async (t: TenantSummary) => {
    const ok = await confirm({ title: `Switch view to "${t.name}"?`, description: "You can switch back from this portal.", confirmLabel: "Switch" });
    if (!ok) return;
    const full = { ...t, moduleEntitlements: t.moduleEntitlements || [] } as any;
    localStorage.setItem("rd_tenant", JSON.stringify(full));
    localStorage.setItem("rd_tenant_id", t.id);
    setTenant(full);
    setImpersonating(t.id);
    toast.success(`Now viewing as ${t.name}. Navigate to any module to see their data.`);
  };

  const exitImpersonation = () => {
    localStorage.removeItem("rd_tenant");
    localStorage.removeItem("rd_tenant_id");
    window.location.reload();
  };

  const clearSandbox = async () => {
    const ok = await confirm({ title: "Clear sandbox database?", description: "rd_sandbox_db will be removed.", variant: "destructive", confirmLabel: "Clear" });
    if (!ok) return;
    localStorage.removeItem("rd_sandbox_db");
    refreshStorage();
    loadTenants();
    toast.success("Sandbox database cleared.");
  };

  const clearAll = async () => {
    const ok = await confirm({ title: "Clear ALL local data?", description: "You will be logged out.", variant: "destructive", confirmLabel: "Clear all" });
    if (!ok) return;
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2">
          <Code2 className="w-6 h-6 text-[#F59E0B]" /> Developer Platform
        </h1>
        <p className="text-sm text-[#94A3B8]">
          Platform-level diagnostics and tenant management. Separate from any single tenant.
        </p>
      </div>

      {impersonating && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-[#F59E0B]">
            Viewing as tenant <code className="font-mono">{impersonating}</code>
          </span>
          <button onClick={exitImpersonation} className="px-3 py-1.5 text-xs bg-[#0F172A] border border-[#F59E0B]/40 rounded text-[#F59E0B] hover:text-[#F8FAFC]">
            Exit impersonation
          </button>
        </div>
      )}

      {/* Session */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Key className="w-4 h-4 text-[#0EA5E9]" /> Session
        </h2>
        <pre className="text-xs text-[#94A3B8] whitespace-pre-wrap break-all">
{JSON.stringify({ user, tenant: tenant && { id: tenant.id, name: tenant.name, tier: tenant.subscriptionTier }, tokenPresent: !!token, theme }, null, 2)}
        </pre>
      </section>

      {/* Tenants */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0EA5E9]" /> Tenants ({tenants.length})
        </h2>
        <div className="space-y-2">
          {tenants.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-[#0F172A] border border-[#334155] rounded-lg">
              <div>
                <div className="text-sm font-bold text-[#F8FAFC]">{t.name}</div>
                <div className="text-xs text-[#94A3B8]">
                  {t.id} · {t.subscriptionTier} · {t.moduleEntitlements?.filter((e) => e.isEnabled).length ?? 0} modules
                </div>
              </div>
              <button
                onClick={() => impersonate(t)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1E293B] border border-[#334155] rounded text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <Eye className="w-3 h-3" /> View as tenant
              </button>
            </div>
          ))}
          {tenants.length === 0 && (
            <p className="text-xs text-[#64748B]">No tenants found (sandbox DB may be empty).</p>
          )}
        </div>
      </section>

      {/* System health */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#0EA5E9]" /> System health
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-[#0F172A] border border-[#334155] rounded">
            <p className="text-xs text-[#94A3B8]">Platform</p>
            <p className="text-[#F8FAFC]">{isNative() ? "Android (Capacitor)" : "Web"}</p>
          </div>
          <div className="p-2 bg-[#0F172A] border border-[#334155] rounded">
            <p className="text-xs text-[#94A3B8]">Sandbox DB</p>
            <p className="text-[#F8FAFC]">{typeof localStorage !== "undefined" && localStorage.getItem("rd_sandbox_db") ? "Seeded" : "Empty (seeded on first use)"}</p>
          </div>
          <div className="p-2 bg-[#0F172A] border border-[#334155] rounded">
            <p className="text-xs text-[#94A3B8]">localStorage keys</p>
            <p className="text-[#F8FAFC]">{storageKeys.length}</p>
          </div>
          <div className="p-2 bg-[#0F172A] border border-[#334155] rounded">
            <p className="text-xs text-[#94A3B8]">Theme</p>
            <p className="text-[#F8FAFC]">{theme}</p>
          </div>
        </div>
      </section>

      {/* Entitlements */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0EA5E9]" /> Module entitlements (current tenant)
        </h2>
        <div className="flex flex-wrap gap-2">
          {(tenant?.moduleEntitlements || []).map((e: any) => (
            <span
              key={e.moduleKey}
              className={`px-2 py-1 rounded text-xs font-mono ${e.isEnabled ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#EF4444]/20 text-[#EF4444]"}`}
            >
              {e.moduleKey}
            </span>
          ))}
        </div>
      </section>

      {/* Storage tools */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#0EA5E9]" /> Storage tools
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={refreshStorage} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0F172A] border border-[#334155] rounded text-[#94A3B8] hover:text-[#F8FAFC]">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button onClick={clearSandbox} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0F172A] border border-[#F59E0B]/40 rounded text-[#F59E0B] hover:text-[#F8FAFC]">
            <Trash2 className="w-3 h-3" /> Clear sandbox DB
          </button>
          <button onClick={clearAll} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0F172A] border border-[#EF4444]/40 rounded text-[#EF4444] hover:text-[#F8FAFC]">
            <Trash2 className="w-3 h-3" /> Clear all storage
          </button>
        </div>
        <div className="flex flex-wrap gap-1 pt-2">
          {storageKeys.map((k) => (
            <span key={k} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0F172A] text-[#64748B] border border-[#334155]">
              {k}
            </span>
          ))}
        </div>
      </section>

      {/* Role matrix */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-[#F8FAFC]">Role matrix</h2>
        <div className="text-xs text-[#94A3B8] space-y-1">
          <p><span className="font-bold text-[#F59E0B]">developer</span> — platform team: all permissions + dev:tools, all modules, all tenants. Lands on this portal.</p>
          <p><span className="font-bold text-[#0EA5E9]">owner / admin</span> — client admins: full tenant access, billing, saas:read.</p>
          <p><span className="font-bold text-[#0EA5E9]">manager</span> — operations, CRM, measurement, WHS, fleet.</p>
          <p><span className="font-bold text-[#0EA5E9]">staff</span> — read projects, measurement, reports, CRM.</p>
          <p><span className="font-bold text-[#0EA5E9]">crew</span> — projects, measurement, WHS sign.</p>
          <p><span className="font-bold text-[#0EA5E9]">viewer</span> — read-only projects, measurement, reports.</p>
        </div>
      </section>
    </div>
  );
}
