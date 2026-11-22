"use client";

import React, { useState } from "react";
import { FileText, ShieldCheck, CreditCard, CheckCircle2 } from "lucide-react";
import { useToast } from "../components/Toast";

export default function CustomerPortal() {
  const toast = useToast();
  const [approved, setApproved] = useState(false);

  const approve = () => {
    setApproved(true);
    toast.success("Quote approved — we'll be in touch");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0EA5E9] rounded-lg flex items-center justify-center text-[#0F172A] font-bold">RD</div>
        <div>
          <h1 className="text-xl font-bold">Customer Portal</h1>
          <p className="text-xs text-[#94A3B8]">Perth Premier Roofing & Plumbing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
          <FileText className="w-5 h-5 text-[#0EA5E9]" />
          <p className="text-sm font-bold">Your Quote</p>
          <p className="text-xs text-[#94A3B8]">Colorbond re-roof · Fremantle · $18,450 (inc GST)</p>
          <button
            onClick={approve}
            disabled={approved}
            className="mt-2 px-3 py-1.5 text-xs bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg disabled:opacity-50"
          >
            {approved ? "Approved ✓" : "Approve quote"}
          </button>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
          <ShieldCheck className="w-5 h-5 text-[#10B981]" />
          <p className="text-sm font-bold">Safety (SWMS)</p>
          <p className="text-xs text-[#94A3B8]">Signed SWMS on file · Harness inspection current</p>
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-2">
          <CreditCard className="w-5 h-5 text-[#F59E0B]" />
          <p className="text-sm font-bold">Payment Schedule</p>
          <p className="text-xs text-[#94A3B8]">Deposit 6.5% paid · Balance on completion</p>
        </div>
      </div>

      <p className="text-[10px] text-[#546A84] text-center">
        RoofDynamics — Powered by AusGreek Developments
      </p>
    </div>
  );
}
