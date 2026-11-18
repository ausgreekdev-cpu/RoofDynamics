"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  PhoneCall,
  Package,
  Users,
  HardHat,
  Truck,
  CreditCard,
  Globe2,
  Bot,
  BarChart3,
  Settings,
  ChevronRight,
  FolderKanban,
  Ruler,
  FileText,
  Columns3,
  CalendarDays,
  Wallet,
  Scale,
} from "lucide-react";
import { FeatureGate } from "./FeatureGate";

const MODULES = [
  {
    key: "BI_EXECUTIVE",
    label: "Executive BI",
    icon: BarChart3,
    path: "/dashboard",
  },
  {
    key: "CRM_QUOTING",
    label: "CRM & Quoting",
    icon: PhoneCall,
    path: "/crm",
  },
  {
    key: "WMS_MRP",
    label: "WMS / MRP",
    icon: Package,
    path: "/wms",
  },
  {
    key: "OPERATIONS_HRIS",
    label: "Operations / HRIS",
    icon: Users,
    path: "/hris",
  },
  {
    key: "WHS_SAFETY",
    label: "WHS Safety",
    icon: HardHat,
    path: "/whs",
  },
  {
    key: "EAM_FLEET",
    label: "Fleet / Equipment",
    icon: Truck,
    path: "/eam",
  },
  {
    key: "ACCOUNTING",
    label: "Accounting",
    icon: CreditCard,
    path: "/accounting",
  },
  {
    key: "PUBLIC_WEBSITE",
    label: "Public Website",
    icon: Globe2,
    path: "/website",
  },
  {
    key: "AI_SOCIAL_AGENT",
    label: "AI Social Agent",
    icon: Bot,
    path: "/ai-social",
  },
  {
    key: "SAAS_SUPER_ADMIN",
    label: "SaaS Super-Admin",
    icon: Settings,
    path: "/admin",
  },
  {
    key: "BI_EXECUTIVE",
    label: "Advanced Reports",
    icon: BarChart3,
    path: "/reports",
  },
  {
    key: "CRM_QUOTING",
    label: "Projects",
    icon: FolderKanban,
    path: "/projects",
  },
  {
    key: "CRM_QUOTING",
    label: "Aerial Measurement",
    icon: Ruler,
    path: "/measurement",
  },
  {
    key: "BI_EXECUTIVE",
    label: "Report Studio",
    icon: FileText,
    path: "/reports-studio",
  },
  {
    key: "CRM_QUOTING",
    label: "CRM Pipeline",
    icon: Columns3,
    path: "/pipeline",
  },
  {
    key: "OPERATIONS_HRIS",
    label: "Dispatch & POs",
    icon: CalendarDays,
    path: "/operations",
  },
  {
    key: "SAAS_SUPER_ADMIN",
    label: "Billing & Credits",
    icon: Wallet,
    path: "/billing",
  },
  {
    key: "WHS_SAFETY",
    label: "WA Compliance",
    icon: Scale,
    path: "/compliance",
  },
];

export function Sidebar() {
  const { tenant } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const entitlements = tenant?.moduleEntitlements || [];

  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  const isEnabled = (moduleKey: string) => {
    const ent = entitlements.find((e: any) => e.moduleKey === moduleKey);
    return ent?.isEnabled ?? false;
  };

  return (
    <aside
      data-tour="sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-[#0F172A] border-r border-[#1E293B] transform transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#0EA5E9] rounded flex items-center justify-center text-[#0F172A] font-bold">
            RD
          </div>
          <span className="text-sm font-bold text-[#F8FAFC]">RoofDynamics</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 text-[#94A3B8] hover:text-[#F8FAFC]"
        >
          <span className="sr-only">Close menu</span>
          <div className="w-6 h-0.5 bg-current"></div>
        </button>
      </div>

      <nav className="mt-6 px-3 space-y-1 flex-1 overflow-y-auto pb-4">
        {MODULES.map((mod) => (
          <FeatureGate key={mod.path} moduleKey={mod.key}>
            <a
              href={mod.path}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]"
            >
              <mod.icon className="w-4 h-4" />
              {mod.label}
              <ChevronRight className="w-3 h-3 ml-auto text-[#475569]" />
            </a>
          </FeatureGate>
        ))}
      </nav>

      <div className="mt-auto shrink-0 p-4 border-t border-[#1E293B] bg-[#0F172A]">
        <div className="text-xs text-[#64748B]">RoofDynamics v1.0</div>
        <div className="text-[10px] text-[#546A84] mt-1">
          Powered by AusGreek Developments
        </div>
      </div>
    </aside>
  );
}
