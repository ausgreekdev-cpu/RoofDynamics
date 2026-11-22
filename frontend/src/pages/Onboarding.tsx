"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Building2, Palette, CreditCard } from "lucide-react";
import { useToast } from "../components/Toast";

const STEPS = ["Company", "Branding", "Tier", "Done"];

export default function Onboarding() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    colour: "#0EA5E9",
    logoUrl: "",
    tier: "STARTER",
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    toast.success(`Tenant "${form.name}" provisioned on ${form.tier}`);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-[#0EA5E9]" />
          <h1 className="text-xl font-bold">Tenant Onboarding</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= step ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#0F172A] border border-[#334155] text-[#94A3B8]"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i <= step ? "text-[#F8FAFC]" : "text-[#64748B]"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-[#334155]" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <label className="block text-xs text-[#94A3B8]">Company name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Swan Valley Roof Restorations"
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC]"
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#0EA5E9]" />
              <span className="text-sm font-bold">Branding</span>
            </div>
            <label className="block text-xs text-[#94A3B8]">Primary colour</label>
            <input
              type="color"
              value={form.colour}
              onChange={(e) => setForm({ ...form, colour: e.target.value })}
              className="w-16 h-9 rounded border border-[#334155] bg-[#0F172A]"
            />
            <label className="block text-xs text-[#94A3B8]">Logo URL (optional)</label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC]"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0EA5E9]" />
              <span className="text-sm font-bold">Subscription tier</span>
            </div>
            {["STARTER", "PRO_SAFETY", "OPS_ERP", "EMPIRE_ENTERPRISE_LEASE"].map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, tier: t })}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                  form.tier === t
                    ? "bg-[#0EA5E9]/20 border-[#0EA5E9] text-[#0EA5E9]"
                    : "bg-[#0F172A] border-[#334155] text-[#94A3B8]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto" />
            <p className="text-sm font-bold text-[#F8FAFC]">Tenant provisioned</p>
            <p className="text-xs text-[#94A3B8]">
              {form.name} · {form.tier} · branded with {form.colour}
            </p>
            <button
              onClick={() => navigate("/admin")}
              className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg text-sm"
            >
              Go to SaaS Admin
            </button>
          </div>
        )}

        {step < 3 && (
          <div className="flex justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="px-3 py-1.5 text-sm text-[#94A3B8] disabled:opacity-30"
            >
              Back
            </button>
            {step < 2 ? (
              <button
                onClick={next}
                disabled={step === 0 && !form.name}
                className="px-4 py-1.5 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-4 py-1.5 bg-[#10B981] text-[#0F172A] font-bold rounded-lg text-sm"
              >
                Provision
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
