"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { Lock, CreditCard, ArrowRight, TrendingUp } from "lucide-react";

const moduleROI: Record<string, { title: string; roi: string; benefit: string; price: string }> = {
  CRM_QUOTING: {
    title: "CRM & Quoting Module",
    roi: "300%",
    benefit: "Win more roofing jobs with instant quotes",
    price: "+$49/mo",
  },
  WMS_MRP: {
    title: "WMS / MRP Module",
    roi: "200%",
    benefit: "Track stock across yard, ute & truck",
    price: "+$79/mo",
  },
  OPERATIONS_HRIS: {
    title: "Operations / HRIS Module",
    roi: "180%",
    benefit: "Manage crew roster, tickets & payroll",
    price: "+$99/mo",
  },
  WHS_SAFETY: {
    title: "WHS Safety Module",
    roi: "250%",
    benefit: "Digital SWMS, hazard checks & compliance",
    price: "+$69/mo",
  },
  EAM_FLEET: {
    title: "Fleet / Equipment Module",
    roi: "150%",
    benefit: "Track utes, trailers & harness inspections",
    price: "+$59/mo",
  },
  ACCOUNTING: {
    title: "Accounting Module",
    roi: "280%",
    benefit: "Progress claims, GST, BAS & TPAR",
    price: "+$89/mo",
  },
  PUBLIC_WEBSITE: {
    title: "Public Website Module",
    roi: "220%",
    benefit: "White-label public site for your trade business",
    price: "+$39/mo",
  },
  AI_SOCIAL_AGENT: {
    title: "AI Social Media Agent",
    roi: "350%",
    benefit: "Auto-generate geo-tagged Perth suburb posts",
    price: "+$49/mo",
  },
  BI_EXECUTIVE: {
    title: "Executive BI Dashboard",
    roi: "400%",
    benefit: "Margin, cash flow & crew speed analytics",
    price: "+$149/mo",
  },
  SAAS_SUPER_ADMIN: {
    title: "SaaS Super-Admin Module",
    roi: "N/A",
    benefit: "Tenant management & tier controls",
    price: "Included",
  },
};

interface FeatureGateProps {
  moduleKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ moduleKey, children, fallback }: FeatureGateProps) {
  const { tenant, user } = useAuth();
  const isDeveloper = user?.role === "developer";
  const [upsellOpen, setUpsellOpen] = useState(false);

  const entitlement = tenant?.moduleEntitlements?.find(
    (e: any) => e.moduleKey === moduleKey
  );
  const isEnabled = isDeveloper || (entitlement?.isEnabled ?? false);

  const handleUnlock = async () => {
    try {
      await api.updateEntitlement(moduleKey, { isEnabled: true, addOnPrice: 0 });
      setUpsellOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to unlock module:", err);
    }
  };

  if (!isEnabled) {
    const info = moduleROI[moduleKey] || {
      title: moduleKey,
      roi: "—",
      benefit: "Unlock this module",
      price: "Contact sales",
    };

    return fallback ?? (
      <div className="bg-[#1E293B] border border-[#F59E0B]/30 rounded-lg p-6 relative overflow-hidden">
        {/* Amber accent border on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B]" />
        
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="text-lg font-bold text-[#F8FAFC]">{info.title} — Locked</h3>
            </div>
            <p className="text-[#94A3B8] mb-4">
              {info.benefit}. Upgrade to access this module.
            </p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-xl font-bold text-[#0EA5E9]">{info.roi}</span>
              <span className="text-[#64748B] text-sm"> ROI</span>
            </div>
            <div className="text-sm text-[#64748B] mb-6">
              {info.price} • Add-on pricing
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto justify-end md:justify-start">
            <button
              onClick={handleUnlock}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
            >
              <ArrowRight className="w-4 h-4" />
              Unlock Module
            </button>
            <button
              onClick={() => setUpsellOpen(true)}
              className="px-4 py-2.5 border border-[#334155] text-[#94A3B8] rounded-lg hover:bg-[#334155] transition"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
