"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, ShieldCheck, CreditCard, Calendar, FileText } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      try {
        const res = await api.request<Record<string, unknown>>(`/crew/${id}`);
        setData(res);
      } catch (err: unknown) {
        // Fallback: try hris
        try {
          const res = await api.request<Record<string, unknown>>(`/hris/${id}`);
          setData(res);
        } catch {
          toast.error((err as Error)?.message || "Failed to load employee");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const fields = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "role", label: "Role" },
    { key: "hourlyRate", label: "Hourly Rate ($)" },
    { key: "hireDate", label: "Hire Date" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
  ];

  const compliance = [
    { key: "tfnDeclared", label: "TFN Declaration (ATO)" },
    { key: "superFund", label: "Super Fund" },
    { key: "superMemberNo", label: "Super Member #" },
    { key: "whiteCard", label: "White Card #" },
    { key: "tradeLicense", label: "Trade License" },
    { key: "leaveBalance", label: "Annual Leave (hrs)" },
    { key: "sickLeave", label: "Sick Leave (hrs)" },
    { key: "longServiceLeave", label: "Long Service Leave (hrs)" },
  ];

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC]">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-[#0EA5E9]" />
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Employee Profile</h1>
          <p className="text-sm text-[#94A3B8]">{data ? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || id : id}</p>
        </div>
      </div>

      {loading && <p className="text-[#94A3B8]">Loading...</p>}

      {!loading && data && (
        <>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0EA5E9]" /> Personal & Employment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <p className="text-xs text-[#94A3B8]">{f.label}</p>
                  <p className="text-sm text-[#F8FAFC]">{data[f.key] != null ? String(data[f.key]) : "—"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Compliance & Entitlements (Fair Work Act 2009)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compliance.map((f) => (
                <div key={f.key}>
                  <p className="text-xs text-[#94A3B8]">{f.label}</p>
                  <p className="text-sm text-[#F8FAFC]">{data[f.key] != null ? String(data[f.key]) : "—"}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#334155] text-xs text-[#64748B] space-y-1">
              <p>• Super Guarantee: 12% of OTE (STP Phase 2)</p>
              <p>• MyLeave WA: 0.75% of ordinary pay (0% apprentices)</p>
              <p>• Annual leave: 4 weeks (NES) · Sick leave: 10 days · Long service: WA LSL Act</p>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#F59E0B]" /> Pay & Super
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-[#94A3B8]">Pay Frequency</p><p className="text-sm text-[#F8FAFC]">{String(data.payFrequency ?? "Weekly")}</p></div>
              <div><p className="text-xs text-[#94A3B8]">Super Fund</p><p className="text-sm text-[#F8FAFC]">{String(data.superFund ?? "—")}</p></div>
              <div><p className="text-xs text-[#94A3B8]">Bank BSB</p><p className="text-sm text-[#F8FAFC]">{String(data.bsb ?? "—")}</p></div>
              <div><p className="text-xs text-[#94A3B8]">Bank Account</p><p className="text-sm text-[#F8FAFC]">{String(data.bankAccount ?? "—")}</p></div>
            </div>
          </div>
        </>
      )}

      {!loading && !data && (
        <p className="text-[#EF4444]">Employee not found.</p>
      )}
    </div>
  );
}
