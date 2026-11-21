"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { env } from "../env";
import { Building2, ShieldCheck, HardHat, Truck, CreditCard, Package } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // In the sandbox deployment there is no backend to call.
      if (!env.VITE_USE_SANDBOX_API) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, tenantId: "tenant-1" }),
        });

        if (response.ok) {
          const data = await response.json();
          login(data.token, data.user, data.tenant);
          navigate(data.user?.role === "developer" ? "/platform" : "/dashboard");
          return;
        }
      }

      // Demo login (also the sandbox path)
      const tenantData = {
        id: "tenant-1",
        name: "Perth Premier Roofing & Plumbing Pty Ltd",
        subscriptionTier: "EMPIRE_ENTERPRISE_LEASE",
        moduleEntitlements: [
          { moduleKey: "CRM_QUOTING", isEnabled: true },
          { moduleKey: "WMS_MRP", isEnabled: true },
          { moduleKey: "OPERATIONS_HRIS", isEnabled: true },
          { moduleKey: "WHS_SAFETY", isEnabled: true },
          { moduleKey: "EAM_FLEET", isEnabled: true },
          { moduleKey: "ACCOUNTING", isEnabled: true },
          { moduleKey: "PUBLIC_WEBSITE", isEnabled: true },
          { moduleKey: "AI_SOCIAL_AGENT", isEnabled: true },
          { moduleKey: "BI_EXECUTIVE", isEnabled: true },
          { moduleKey: "SAAS_SUPER_ADMIN", isEnabled: true },
        ],
      };

      const deriveRole = (e: string): string => {
        const lower = e.toLowerCase();
        if (lower.includes("dev@") || lower.endsWith("@ausgreekdev.com") || lower.includes("developer")) return "developer";
        if (lower.includes("admin@") || lower.includes("owner@")) return "admin";
        if (lower.includes("manager@")) return "manager";
        if (lower.includes("crew@")) return "crew";
        if (lower.includes("viewer@")) return "viewer";
        return "staff";
      };

      const userData = {
        id: "user-1",
        tenantId: "tenant-1",
        email,
        name: "Demo User",
        role: deriveRole(email),
      };

      const token = "demo-token-" + Date.now();
      login(token, userData as any, tenantData as any);
      navigate(deriveRole(email) === "developer" ? "/platform" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="w-full max-w-md p-8 bg-[#1E293B] rounded-xl border border-[#334155] shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#0EA5E9] rounded-lg flex items-center justify-center text-[#0F172A] font-bold text-xl">
            RD
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">RoofDynamics</h2>
            <p className="text-xs text-[#94A3B8]">ERP for Roofing & Trade Businesses</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition"
              placeholder="you@roofing.com.au"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-[#7F1D1D]/20 border border-[#7F1D1D]/30 text-[#FCA5A5] text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#334155]">
          <p className="text-xs text-[#64748B] text-center mb-4">
            Demo credentials: any email / any password
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-[#0F172A] rounded border border-[#334155] text-center">
              <Building2 className="w-5 h-5 mx-auto mb-1 text-[#0EA5E9]" />
              <p className="text-xs text-[#94A3B8]">CRM & Quoting</p>
            </div>
            <div className="p-3 bg-[#0F172A] rounded border border-[#334155] text-center">
              <Package className="w-5 h-5 mx-auto mb-1 text-[#0EA5E9]" />
              <p className="text-xs text-[#94A3B8]">WMS / MRP</p>
            </div>
            <div className="p-3 bg-[#0F172A] rounded border border-[#334155] text-center">
              <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-[#0EA5E9]" />
              <p className="text-xs text-[#94A3B8]">WHS Safety</p>
            </div>
            <div className="p-3 bg-[#0F172A] rounded border border-[#334155] text-center">
              <Truck className="w-5 h-5 mx-auto mb-1 text-[#0EA5E9]" />
              <p className="text-xs text-[#94A3B8]">Fleet / Equipment</p>
            </div>
            <div className="p-3 bg-[#0F172A] rounded border border-[#334155] text-center">
              <CreditCard className="w-5 h-5 mx-auto mb-1 text-[#0EA5E9]" />
              <p className="text-xs text-[#94A3B8]">Accounting</p>
            </div>
            <div className="p-3 bg-[#0F172A] rounded border border-[#334155] text-center">
              <HardHat className="w-5 h-5 mx-auto mb-1 text-[#0EA5E9]" />
              <p className="text-xs text-[#94A3B8]">Operations</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-[#546A84] text-center mt-6">
          RoofDynamics — Powered by AusGreek Developments
        </p>
      </div>
    </div>
  );
}
