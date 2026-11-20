'use client'

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { RoleGuard } from "../features/auth/RoleGuard";
import { Code2, Database, Key, Shield, Trash2, RefreshCw } from "lucide-react";

export default function DeveloperTools() {
  const { user, tenant, token } = useAuth();
  const { theme } = useTheme();
  const [storageKeys, setStorageKeys] = useState<string[]>([]);

  const refresh = () => {
    if (typeof localStorage === "undefined") return;
    setStorageKeys(Object.keys(localStorage).sort());
  };

  React.useEffect(() => {
    refresh();
  }, []);

  const clearSandbox = () => {
    if (!confirm("Clear the sandbox database (rd_sandbox_db)?")) return;
    localStorage.removeItem("rd_sandbox_db");
    refresh();
  };

  const clearAll = () => {
    if (!confirm("Clear ALL localStorage for this origin?")) return;
    localStorage.clear();
    refresh();
  };

  return (
    <RoleGuard permission="dev:tools" fallback={
      <div className="bg-[#1E293B] border border-[#F59E0B]/30 rounded-lg p-6">
        <h2 className="text-lg font-bold text-[#F8FAFC]">Developer tools — restricted</h2>
        <p className="text-sm text-[#94A3B8] mt-2">
          This area is only available to developer accounts (platform team).
        </p>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2">
            <Code2 className="w-6 h-6 text-[#0EA5E9]" /> Developer Tools
          </h1>
          <p className="text-sm text-[#94A3B8]">
            Platform-level diagnostics. Only visible to <code className="text-[#0EA5E9]">developer</code> role.
          </p>
        </div>

        {/* Session */}
        <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#0EA5E9]" /> Session
          </h2>
          <pre className="text-xs text-[#94A3B8] whitespace-pre-wrap break-all">
{JSON.stringify({ user, tenant: tenant && { id: tenant.id, name: tenant.name, tier: tenant.subscriptionTier }, tokenPresent: !!token, theme }, null, 2)}
          </pre>
        </section>

        {/* Entitlements */}
        <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0EA5E9]" /> Module entitlements
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

        {/* Storage */}
        <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#0EA5E9]" /> localStorage keys ({storageKeys.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {storageKeys.map((k) => (
              <span key={k} className="px-2 py-1 rounded text-xs font-mono bg-[#0F172A] text-[#94A3B8] border border-[#334155]">
                {k}
              </span>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={refresh} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0F172A] border border-[#334155] rounded text-[#94A3B8] hover:text-[#F8FAFC]">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <button onClick={clearSandbox} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0F172A] border border-[#334155] rounded text-[#F59E0B] hover:text-[#F8FAFC]">
              <Trash2 className="w-3 h-3" /> Clear sandbox DB
            </button>
            <button onClick={clearAll} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#0F172A] border border-[#EF4444]/40 rounded text-[#EF4444] hover:text-[#F8FAFC]">
              <Trash2 className="w-3 h-3" /> Clear all storage
            </button>
          </div>
        </section>

        {/* Role matrix reference */}
        <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-[#F8FAFC]">Role matrix</h2>
          <div className="text-xs text-[#94A3B8] space-y-1">
            <p><span className="font-bold text-[#0EA5E9]">developer</span> — platform team: all permissions + dev:tools, all modules, all tenants.</p>
            <p><span className="font-bold text-[#0EA5E9]">owner / admin</span> — client admins: full tenant access, billing, saas:read.</p>
            <p><span className="font-bold text-[#0EA5E9]">manager</span> — operations, CRM, measurement, WHS, fleet.</p>
            <p><span className="font-bold text-[#0EA5E9]">staff</span> — read projects, measurement, reports, CRM.</p>
            <p><span className="font-bold text-[#0EA5E9]">crew</span> — projects, measurement, WHS sign.</p>
            <p><span className="font-bold text-[#0EA5E9]">viewer</span> — read-only projects, measurement, reports.</p>
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
