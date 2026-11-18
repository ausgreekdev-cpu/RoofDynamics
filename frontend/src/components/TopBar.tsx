"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { OfflineIndicator } from "./OfflineIndicator";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTheme } from "../contexts/ThemeContext";
import { useTutorial } from "../contexts/TutorialContext";
import { Sun, Moon, HelpCircle } from "lucide-react";
import {
  LayoutDashboard,
  ShieldCheck,
  Package,
  Truck,
  CreditCard,
  BarChart3,
  Users,
  HardHat,
  PhoneCall,
  Globe,
  Settings,
  Menu,
  X,
  ChevronDown,
  Globe2,
  Building2,
  Bot,
} from "lucide-react";

const moduleIcons: Record<string, any> = {
  CRM_QUOTING: PhoneCall,
  WMS_MRP: Package,
  OPERATIONS_HRIS: Users,
  WHS_SAFETY: HardHat,
  EAM_FLEET: Truck,
  ACCOUNTING: CreditCard,
  PUBLIC_WEBSITE: Globe2,
  AI_SOCIAL_AGENT: Bot,
  BI_EXECUTIVE: BarChart3,
  SAAS_SUPER_ADMIN: Settings,
};

const moduleLabels: Record<string, string> = {
  CRM_QUOTING: "CRM & Quoting",
  WMS_MRP: "WMS / MRP",
  OPERATIONS_HRIS: "Operations / HRIS",
  WHS_SAFETY: "WHS Safety",
  EAM_FLEET: "Fleet / Equipment",
  ACCOUNTING: "Accounting",
  PUBLIC_WEBSITE: "Public Website",
  AI_SOCIAL_AGENT: "AI Social Agent",
  BI_EXECUTIVE: "Executive BI",
  SAAS_SUPER_ADMIN: "SaaS Super-Admin",
};

export function TopBar() {
  const { tenant, logout, setTenant, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { start: startTutorial } = useTutorial();
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    api.getTenants()
      .then((data) => setTenants(data))
      .catch(() => setTenants([]));
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const handleSwitchTenant = (t: any) => {
    setTenant(t);
    localStorage.setItem("rd_tenant_id", t.id);
    setTenantMenuOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-[#0A192F] border-b border-[#1E293B] z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
          className="p-2 hover:bg-[#1E293B] rounded-md text-[#94A3B8]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0EA5E9] rounded flex items-center justify-center text-[#0F172A] font-bold text-sm">
            RD
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#F8FAFC] tracking-tight">RoofDynamics</h1>
            <p className="text-xs text-[#94A3B8]">ERP for Roofing & Trade</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <OfflineIndicator />
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded transition"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={startTutorial}
          title="Restart guided tour"
          aria-label="Restart guided tour"
          className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        {tenant && (
          <div className="relative group">
            <button
              onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[#1E293B] rounded-md transition"
            >
              <Building2 className="w-4 h-4 text-[#0EA5E9]" />
              <span className="text-sm font-medium text-[#F8FAFC]">{tenant.name}</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>
            {tenantMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-[#334155]">
                  <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Switch Tenant</p>
                </div>
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSwitchTenant(t)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left ${tenant.id === t.id ? "bg-[#0EA5E9]/20 text-[#0EA5E9]" : "text-[#94A3B8] hover:bg-[#334155]"}`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tenant.id === t.id ? "bg-[#0EA5E9]" : "bg-transparent border border-[#64748B]"}`}></div>
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
                {tenants.length === 0 && (
                  <div className="px-4 py-2 text-xs text-[#64748B]">Loading tenants...</div>
                )}
                <div className="px-4 py-2 border-t border-[#334155]">
                  <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Plan</p>
                  <p className="text-sm text-[#F8FAFC]">{tenant.subscriptionTier}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="px-3 py-2 text-sm text-[#F8FAFC] hover:bg-[#1E293B] rounded-md transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
