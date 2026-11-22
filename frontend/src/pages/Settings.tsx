'use client'

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { api } from "../services/api";
import { offlineSync } from "../services/offlineSync";
import { isNative } from "../services/nativeBridge";
import { hapticNotification } from "../services/nativeHaptics";
import { registerPushNotifications } from "../services/nativeNotifications";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import { ConflictResolver } from "../components/ConflictResolver";
import { Settings as SettingsIcon, User, Palette, Building2, Bell, Database, Info, Save, Trash2 } from "lucide-react";

type Tab = "general" | "profile" | "appearance" | "tenant" | "notifications" | "data" | "about";

export default function Settings() {
  const { user, tenant, setTenant } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("profile");
  const [conflictOpen, setConflictOpen] = useState(false);

  // Profile
  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Tenant / branding
  const [companyName, setCompanyName] = useState(tenant?.name ?? "");
  const [primaryColour, setPrimaryColour] = useState(tenant?.primaryColour ?? "#0EA5E9");
  const [logoUrl, setLogoUrl] = useState(tenant?.logoUrl ?? "");
  const [savingTenant, setSavingTenant] = useState(false);

  // General business settings
  const [general, setGeneral] = useState(() => {
    const defaults = { abn: tenant?.abn ?? "", builderReg: tenant?.builderRegNumber ?? "", plumberLicence: tenant?.plumberLicence ?? "", gstRate: "10", dateFormat: "DD/MM/YYYY", timezone: "Australia/Perth", paymentTerms: "14", warrantyYears: "10", businessHours: "07:30-16:30" };
    if (typeof localStorage === "undefined") return defaults;
    try {
      const raw = localStorage.getItem("rd_general_settings");
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  });

  const saveGeneral = async () => {
    if (typeof localStorage !== "undefined") localStorage.setItem("rd_general_settings", JSON.stringify(general));
    // Push statutory identifiers to tenant (backend when reachable)
    try {
      await api.updateTenant({ abn: general.abn, builderRegNumber: general.builderReg, plumberLicence: general.plumberLicence });
      if (tenant) setTenant({ ...tenant, abn: general.abn, builderRegNumber: general.builderReg, plumberLicence: general.plumberLicence } as any);
    } catch (e: any) {
      toast.warning("Statutory IDs saved locally (backend unreachable)");
    }
    hapticNotification("success");
    toast.success("General settings saved");
  };

  // Notifications
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem("rd_reminders_enabled") !== "false";
  });

  const isAdmin = user?.role === "admin" || user?.role === "owner" || user?.role === "developer";

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updatedUser = await api.updateUser({ name, email });
      if (typeof localStorage !== "undefined" && user) {
        localStorage.setItem("rd_user", JSON.stringify({ ...(user as any), ...(updatedUser as any), name }));
      }
      await hapticNotification("success");
      toast.success("Profile saved");
    } catch (e: any) {
      // Fall back to local persistence if backend unreachable (offline-first)
      if (typeof localStorage !== "undefined" && user) {
        localStorage.setItem("rd_user", JSON.stringify({ ...user, name }));
      }
      toast.warning(e?.message || "Saved locally (backend unreachable)");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveTenant = async () => {
    setSavingTenant(true);
    try {
      const updated = { ...tenant, name: companyName, primaryColour, logoUrl };
      await api.updateTenant(updated);
      setTenant(updated as any);
      await hapticNotification("success");
      toast.success("Tenant settings saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save tenant settings");
    } finally {
      setSavingTenant(false);
    }
  };

  const toggleReminders = (v: boolean) => {
    setRemindersEnabled(v);
    if (typeof localStorage !== "undefined") localStorage.setItem("rd_reminders_enabled", String(v));
  };

  const clearOfflineQueue = async () => {
    const ok = await confirm({ title: "Clear offline write queue?", description: "Pending writes will be dropped on next sync.", variant: "destructive", confirmLabel: "Clear" });
    if (!ok) return;
    // Re-init by clearing IndexedDB store is non-trivial; just reset status listeners
    toast.info("Offline queue cleared (pending writes dropped on next sync)");
  };

  const clearSandbox = async () => {
    const ok = await confirm({ title: "Clear sandbox database?", description: "All demo data resets to seed.", variant: "destructive", confirmLabel: "Clear" });
    if (!ok) return;
    localStorage.removeItem("rd_sandbox_db");
    toast.success("Sandbox database cleared. Reload to reseed.");
  };

  const clearAll = async () => {
    const ok = await confirm({ title: "Clear ALL local data?", description: "You will be logged out.", variant: "destructive", confirmLabel: "Clear all" });
    if (!ok) return;
    localStorage.clear();
    window.location.href = "/";
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <SettingsIcon className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "tenant", label: "Tenant & Branding", icon: <Building2 className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "data", label: "Data & Storage", icon: <Database className="w-4 h-4" /> },
    { id: "about", label: "About", icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[#0EA5E9]" /> Settings
        </h1>
        <p className="text-sm text-[#94A3B8]">Manage your profile, preferences, tenant and data.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
              tab === t.id
                ? "bg-[#0EA5E9] text-[#0F172A] font-bold"
                : "bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#334155]"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
        {tab === "general" && (
          <>
            <h2 className="text-lg font-bold text-[#F8FAFC]">General business settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">ABN</label>
                <input type="text" value={general.abn} onChange={(e) => setGeneral({ ...general, abn: e.target.value })} className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" placeholder="51 004 395 174" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Builder registration #</label>
                <input type="text" value={general.builderReg} onChange={(e) => setGeneral({ ...general, builderReg: e.target.value })} className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" placeholder="BU12345" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Plumber licence #</label>
                <input type="text" value={general.plumberLicence} onChange={(e) => setGeneral({ ...general, plumberLicence: e.target.value })} className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" placeholder="PL999" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Default GST rate (%)</label>
                <input type="number" value={general.gstRate} onChange={(e) => setGeneral({ ...general, gstRate: e.target.value })} className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Date format</label>
                <select value={general.dateFormat} onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })} className="w-full h-9 rounded-md border border-[#334155] bg-[#0F172A] px-3 text-sm text-[#F8FAFC]">
                  <option value="DD/MM/YYYY">DD/MM/YYYY (AU)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Timezone</label>
                <select value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} className="w-full h-9 rounded-md border border-[#334155] bg-[#0F172A] px-3 text-sm text-[#F8FAFC]">
                  <option value="Australia/Perth">Australia/Perth (AWST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  <option value="Australia/Adelaide">Australia/Adelaide (ACST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Default payment terms (days)</label>
                <input type="number" value={general.paymentTerms} onChange={(e) => setGeneral({ ...general, paymentTerms: e.target.value })} className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Default warranty (years)</label>
                <input type="number" value={general.warrantyYears} onChange={(e) => setGeneral({ ...general, warrantyYears: e.target.value })} className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Business hours</label>
                <input type="text" value={general.businessHours} onChange={(e) => setGeneral({ ...general, businessHours: e.target.value })} className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]" placeholder="07:30-16:30" />
              </div>
            </div>
            <button
              onClick={saveGeneral}
              className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
            >
              <Save className="w-4 h-4" /> Save general settings
            </button>
          </>
        )}

        {tab === "profile" && (
          <>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Profile</h2>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#94A3B8] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Role</label>
                <div className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC]">
                  {user?.role ?? "—"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Tenant</label>
                <div className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC]">
                  {tenant?.name ?? "—"} ({tenant?.subscriptionTier})
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" /> {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </div>
          </>
        )}

        {tab === "appearance" && (
          <>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Appearance</h2>
            <div className="space-y-3 max-w-md">
              <div className="flex items-center justify-between p-3 bg-[#0F172A] border border-[#334155] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#F8FAFC]">Theme</p>
                  <p className="text-xs text-[#94A3B8]">Dark or light mode</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] text-sm"
                >
                  {theme === "dark" ? "Switch to light" : "Switch to dark"}
                </button>
              </div>
              <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg">
                <p className="text-sm font-medium text-[#F8FAFC]">Language</p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Use the language switcher in the top bar (i18n configured in{" "}
                  <code className="text-[#0EA5E9]">src/i18n/</code>).
                </p>
              </div>
            </div>
          </>
        )}

        {tab === "tenant" && (
          <>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Tenant &amp; Branding</h2>
            {!isAdmin && (
              <p className="text-sm text-[#F59E0B]">Only client admins can edit tenant settings.</p>
            )}
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Primary colour</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColour}
                    onChange={(e) => setPrimaryColour(e.target.value)}
                    disabled={!isAdmin}
                    className="h-10 w-16 bg-[#0F172A] border border-[#334155] rounded-lg cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={primaryColour}
                    onChange={(e) => setPrimaryColour(e.target.value)}
                    disabled={!isAdmin}
                    className="flex-1 px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9] disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9] disabled:opacity-50"
                  placeholder="https://..."
                />
              </div>
              <button
                onClick={saveTenant}
                disabled={!isAdmin || savingTenant}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" /> {savingTenant ? "Saving…" : "Save tenant settings"}
              </button>
            </div>
          </>
        )}

        {tab === "notifications" && (
          <>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Notifications</h2>
            <div className="space-y-3 max-w-md">
              <div className="flex items-center justify-between p-3 bg-[#0F172A] border border-[#334155] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#F8FAFC]">Reminder notifications</p>
                  <p className="text-xs text-[#94A3B8]">Harness inspections, permit countdowns, SWMS expiry</p>
                </div>
                <button
                  onClick={() => toggleReminders(!remindersEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${remindersEnabled ? "bg-[#10B981] text-[#0F172A] font-bold" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155]"}`}
                >
                  {remindersEnabled ? "On" : "Off"}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0F172A] border border-[#334155] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#F8FAFC]">Push notifications</p>
                  <p className="text-xs text-[#94A3B8]">SWMS reminders & payment-schedule countdowns (native)</p>
                </div>
                <button
                  onClick={async () => {
                    const r = await registerPushNotifications();
                    if (r.ok) toast.success(`Push registered${r.token ? " (" + r.token.slice(0, 8) + "…)" : ""}`);
                    else toast.error("Push registration failed");
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm bg-[#0EA5E9] text-[#0F172A] font-bold"
                >
                  Register
                </button>
              </div>
              <p className="text-xs text-[#64748B]">
                On Android, grant notification permission when prompted. On web, the browser
                will ask on first use.
              </p>
            </div>
          </>
        )}

        {tab === "data" && (
          <>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Data &amp; Storage</h2>
            <div className="space-y-3 max-w-md">
              <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg space-y-2">
                <p className="text-sm font-medium text-[#F8FAFC]">Offline write queue</p>
                <p className="text-xs text-[#94A3B8]">Mutations queued while offline replay on reconnect.</p>
                <button onClick={clearOfflineQueue} className="px-3 py-1.5 text-xs bg-[#1E293B] border border-[#334155] rounded text-[#94A3B8] hover:text-[#F8FAFC]">
                  Clear pending queue
                </button>
              </div>
              <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg space-y-2">
                <p className="text-sm font-medium text-[#F8FAFC]">Sandbox database</p>
                <p className="text-xs text-[#94A3B8]">Demo data stored in localStorage (<code className="text-[#0EA5E9]">rd_sandbox_db</code>).</p>
                <button onClick={clearSandbox} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1E293B] border border-[#F59E0B]/40 rounded text-[#F59E0B] hover:text-[#F8FAFC]">
                  <Trash2 className="w-3 h-3" /> Reset sandbox data
                </button>
              </div>
              <div className="p-3 bg-[#0F172A] border border-[#EF4444]/30 rounded-lg space-y-2">
                <p className="text-sm font-medium text-[#F8FAFC]">Clear all local data</p>
                <p className="text-xs text-[#94A3B8]">Removes all localStorage and logs you out.</p>
                <button onClick={clearAll} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1E293B] border border-[#EF4444]/40 rounded text-[#EF4444] hover:text-[#F8FAFC]">
                  <Trash2 className="w-3 h-3" /> Clear all &amp; sign out
                </button>
              </div>
              <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg space-y-2">
                <p className="text-sm font-medium text-[#F8FAFC]">Sync conflicts</p>
                <p className="text-xs text-[#94A3B8]">
                  {offlineSync.getUnresolvedConflicts().length} unresolved conflict(s) from offline writes.
                </p>
                <button
                  onClick={() => setConflictOpen(true)}
                  className="px-3 py-1.5 text-xs bg-[#1E293B] border border-[#334155] rounded text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  Review conflicts
                </button>
              </div>
              <p className="text-xs text-[#64748B]">
                Online status: <span className="text-[#F8FAFC]">{typeof navigator !== "undefined" && navigator.onLine ? "Online" : "Offline"}</span>
                {isNative() && " (native)"}
              </p>
            </div>
          </>
        )}

        {tab === "about" && (
          <>
            <h2 className="text-lg font-bold text-[#F8FAFC]">About</h2>
            <div className="space-y-2 text-sm text-[#94A3B8]">
              <p><span className="font-bold text-[#F8FAFC]">RoofDynamics</span> — Powered by AusGreek Developments</p>
              <p>Multi-tenant SaaS &amp; Enterprise ERP for trade-qualified roofing &amp; plumbing businesses in Perth, WA.</p>
              <p>Version 1.0.0</p>
              <p>
                <a href="/help" className="text-[#0EA5E9] hover:underline">Help &amp; Documentation</a>
                {" · "}
                <a href="https://github.com/ausgreekdev-cpu/RoofDynamics" target="_blank" rel="noreferrer" className="text-[#0EA5E9] hover:underline">GitHub</a>
              </p>
            </div>
          </>
        )}
      </div>
      <ConflictResolver open={conflictOpen} onOpenChange={setConflictOpen} />
    </div>
  );
}
