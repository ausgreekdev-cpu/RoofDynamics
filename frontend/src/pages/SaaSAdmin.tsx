"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { FeatureGate } from "../components/FeatureGate";
import { useToast } from "../components/Toast";
import {
  Settings,
  Building2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";

const TIERS = [
  { key: "STARTER", label: "Starter", price: 79, features: ["CRM & Quoting", "Public Website"] },
  { key: "PRO_SAFETY", label: "Pro Safety", price: 199, features: ["All Starter", "WHS Safety", "EAM Fleet"] },
  { key: "OPS_ERP", label: "Ops ERP", price: 399, features: ["All Pro", "WMS/MRP", "Operations/HRIS", "Accounting"] },
  { key: "EMPIRE_ENTERPRISE_LEASE", label: "Empire Enterprise Lease", price: 699, features: ["All Modules", "4 AI Agents", "White-Label", "Priority Support"] },
];

const MODULES = [
  { key: "CRM_QUOTING", label: "CRM & Quoting" },
  { key: "WMS_MRP", label: "WMS / MRP" },
  { key: "OPERATIONS_HRIS", label: "Operations / HRIS" },
  { key: "WHS_SAFETY", label: "WHS Safety" },
  { key: "EAM_FLEET", label: "EAM / Fleet" },
  { key: "ACCOUNTING", label: "Accounting" },
  { key: "PUBLIC_WEBSITE", label: "Public Website" },
  { key: "AI_SOCIAL_AGENT", label: "AI Social Agent", addOn: 49 },
  { key: "BI_EXECUTIVE", label: "Executive BI" },
  { key: "SAAS_SUPER_ADMIN", label: "SaaS Super-Admin" },
];

export default function SaaSAdmin() {
  const { tenant, setTenant } = useAuth();
  const toast = useToast();
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [mrr, setMrr] = useState(0);

  useEffect(() => {
    loadEntitlements();
  }, []);

  const loadEntitlements = async () => {
    try {
      const data = await api.getEntitlements();
      setEntitlements(data);
    } catch {
      setEntitlements([
        { moduleKey: "CRM_QUOTING", isEnabled: true, addOnPrice: 0 },
        { moduleKey: "WMS_MRP", isEnabled: true, addOnPrice: 0 },
        { moduleKey: "OPERATIONS_HRIS", isEnabled: true, addOnPrice: 0 },
        { moduleKey: "WMS_MRP", isEnabled: true, addOnPrice: 0 },
      ]);
    }
  };

  useEffect(() => {
    calculateMRR();
  }, [entitlements, tenant]);

  const calculateMRR = () => {
    let total = 699; // base lease
    if (tenant?.subscriptionTier === "STARTER") total = 79;
    else if (tenant?.subscriptionTier === "PRO_SAFETY") total = 199;
    else if (tenant?.subscriptionTier === "OPS_ERP") total = 399;

    entitlements.forEach((e) => {
      if (e.isEnabled && e.addOnPrice) total += Number(e.addOnPrice);
    });
    setMrr(total);
  };

  const handleToggleModule = async (moduleKey: string, isEnabled: boolean) => {
    try {
      await api.updateEntitlement(moduleKey, { isEnabled });
      setEntitlements((prev) =>
        prev.map((e) => (e.moduleKey === moduleKey ? { ...e, isEnabled } : e))
      );
      // Update local tenant state
      if (tenant) {
        setTenant({
          ...tenant,
          moduleEntitlements: entitlements.map((e) =>
            e.moduleKey === moduleKey ? { ...e, isEnabled } : e
          ),
        } as any);
      }
    } catch (err: any) {
      toast.showToast("error", err.message || "Failed to update module");
    }
  };

  const handleTierChange = async (tier: string) => {
    if (!tenant) return;
    setTenant({ ...tenant, subscriptionTier: tier } as any);
    try {
      await api.updateTenant({ subscriptionTier: tier });
      toast.showToast("success", `Subscription tier changed to ${tier}`);
    } catch (err: any) {
      setTenant(tenant);
      toast.showToast("error", err.message || "Failed to update tier");
    }
  };

  const handleSaveBranding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const updated = await api.updateTenant({
        name: form.get("tenantName"),
        abn: form.get("abn"),
        builderRegNumber: form.get("builderReg"),
        plumberLicence: form.get("plumberLicence"),
        primaryColour: form.get("primaryColour"),
      });
      setTenant({ ...tenant, ...(updated as any) } as any);
      toast.showToast("success", "White-label branding saved");
    } catch (err: any) {
      toast.showToast("error", err.message || "Failed to save branding");
    }
  };

  return (
    <FeatureGate moduleKey="SAAS_SUPER_ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">SaaS Super-Admin & Lease Manager</h1>
            <p className="text-[#94A3B8]">Tenant management, subscription tiers, à la carte modules & MRR tracking</p>
          </div>
          <button
            onClick={loadEntitlements}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg hover:text-[#F8FAFC] transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* MRR Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-[#10B981]" />
              <p className="text-xs text-[#64748B] font-medium uppercase">Monthly Recurring Revenue</p>
            </div>
            <p className="text-2xl font-bold text-[#F8FAFC]">${mrr.toLocaleString()}</p>
            <p className="text-xs text-[#10B981] mt-1">+12% vs last month</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-[#0EA5E9]" />
              <p className="text-xs text-[#64748B] font-medium uppercase">Active Tenants</p>
            </div>
            <p className="text-2xl font-bold text-[#F8FAFC]">2</p>
            <p className="text-xs text-[#94A3B8] mt-1">1 Enterprise, 1 SaaS</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#F59E0B]" />
              <p className="text-xs text-[#64748B] font-medium uppercase">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-[#F8FAFC]">12</p>
            <p className="text-xs text-[#94A3B8] mt-1">Across all tenants</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
              <p className="text-xs text-[#64748B] font-medium uppercase">ARR Projection</p>
            </div>
            <p className="text-2xl font-bold text-[#F8FAFC]">${(mrr * 12).toLocaleString()}</p>
            <p className="text-xs text-[#94A3B8] mt-1">Annual run rate</p>
          </div>
        </div>

        {/* Tenant & Tier Switcher */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Tenant & Tier Switcher
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-lg border-2 cursor-pointer transition ${tenant?.id === "tenant-1" ? "border-[#0EA5E9] bg-[#0EA5E9]/10" : "border-[#334155] bg-[#0F172A]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#F8FAFC]">Perth Premier Roofing & Plumbing Pty Ltd</span>
                {tenant?.id === "tenant-1" && <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />}
              </div>
              <p className="text-xs text-[#94A3B8]">Anchor Client — Empire Enterprise Lease</p>
              <p className="text-xs text-[#64748B] mt-1">ABN: 51 004 395 174 • Builder Reg: BU12345</p>
            </div>
            <div className={`p-4 rounded-lg border-2 cursor-pointer transition ${tenant?.id === "tenant-2" ? "border-[#0EA5E9] bg-[#0EA5E9]/10" : "border-[#334155] bg-[#0F172A]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#F8FAFC]">Swan Valley Roof Restorations</span>
                {tenant?.id === "tenant-2" && <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />}
              </div>
              <p className="text-xs text-[#94A3B8]">SaaS Customer — {tenant?.subscriptionTier || "STARTER"}</p>
              <p className="text-xs text-[#64748B] mt-1">ABN: 87 004 419 283</p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Subscription Tier Matrix</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {TIERS.map((tier) => {
              const isActive = tenant?.subscriptionTier === tier.key;
              return (
                <div
                  key={tier.key}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${isActive ? "border-[#0EA5E9] bg-[#0EA5E9]/10" : "border-[#334155] bg-[#0F172A] hover:border-[#0EA5E9]/50"}`}
                  onClick={() => handleTierChange(tier.key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#F8FAFC]">{tier.label}</span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />}
                  </div>
                  <p className="text-lg font-bold text-[#0EA5E9]">${tier.price}<span className="text-xs text-[#64748B]">/mo</span></p>
                  <ul className="mt-2 space-y-1">
                    {tier.features.map((f) => (
                      <li key={f} className="text-xs text-[#94A3B8] flex items-center gap-1">
                        <span className="text-[#10B981]">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Module Entitlements */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            À La Carte Module Toggles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULES.map((mod) => {
              const ent = entitlements.find((e) => e.moduleKey === mod.key);
              const isEnabled = ent?.isEnabled ?? false;
              return (
                <div key={mod.key} className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-[#334155]">
                  <div>
                    <span className="text-sm text-[#F8FAFC]">{mod.label}</span>
                    {mod.addOn && <span className="ml-2 text-xs text-[#F59E0B]">+${mod.addOn}/mo</span>}
                  </div>
                  <button
                    onClick={() => handleToggleModule(mod.key, !isEnabled)}
                    className={`relative w-11 h-6 rounded-full transition ${isEnabled ? "bg-[#10B981]" : "bg-[#334155]"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* White-Label Branding Editor */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            White-Label Branding Editor
          </h3>
          <form onSubmit={handleSaveBranding} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Tenant Name</label>
              <input
                name="tenantName"
                defaultValue={tenant?.name}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">ABN</label>
              <input
                name="abn"
                defaultValue={tenant?.abn}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                placeholder="51 004 395 174"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Builder Registration</label>
              <input
                name="builderReg"
                defaultValue={tenant?.builderRegNumber}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                placeholder="BU12345"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Plumber Licence</label>
              <input
                name="plumberLicence"
                defaultValue={tenant?.plumberLicence}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                placeholder="PL999"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Primary Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primaryColour"
                  defaultValue={tenant?.primaryColour || "#0EA5E9"}
                  className="w-12 h-10 rounded border border-[#334155] bg-[#0F172A] cursor-pointer"
                />
                <span className="text-xs text-[#94A3B8]">{tenant?.primaryColour || "#0EA5E9"}</span>
              </div>
            </div>
            <div className="flex items-end">
              <button type="submit" className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition">
                Save Branding
              </button>
            </div>
          </form>
        </div>
      </div>
    </FeatureGate>
  );
}
