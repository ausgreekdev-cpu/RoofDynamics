"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Truck, ShieldCheck, Calendar, Wrench, DollarSign } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";

export default function AssetProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      try {
        const res = await api.request<Record<string, unknown>>(`/equipment/${id}`);
        setData(res);
      } catch (err: unknown) {
        toast.error((err as Error)?.message || "Failed to load asset");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const fields = [
    { key: "name", label: "Asset Name" },
    { key: "type", label: "Type" },
    { key: "serialNumber", label: "Serial Number" },
    { key: "status", label: "Status" },
    { key: "location", label: "Location" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "cost", label: "Purchase Cost ($)" },
    { key: "purchaseDate", label: "Purchase Date" },
  ];

  const compliance = [
    { key: "nextInspectionDue", label: "Next Inspection Due" },
    { key: "lastInspectionDate", label: "Last Inspection" },
    { key: "inspectionInterval", label: "Inspection Interval (months)" },
    { key: "certificationNumber", label: "Certification #" },
    { key: "insurancePolicy", label: "Insurance Policy" },
    { key: "insuranceExpiry", label: "Insurance Expiry" },
  ];

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC]">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-3">
        <Truck className="w-6 h-6 text-[#0EA5E9]" />
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Asset Profile</h1>
          <p className="text-sm text-[#94A3B8]">{data ? String(data.name ?? id) : id}</p>
        </div>
      </div>

      {loading && <p className="text-[#94A3B8]">Loading...</p>}

      {!loading && data && (
        <>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0EA5E9]" /> Asset Details
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
              <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Compliance & Maintenance
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
              <p>• ATO depreciation: prime cost or diminishing value method</p>
              <p>• WHS: inspection per AS/NZS 1891.4 (harnesses) / AS 2550 (cranes)</p>
              <p>• Insurance: public liability + equipment cover recommended</p>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
            <h2 className="text-sm font-bold text-[#F8FAFC] mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#F59E0B]" /> Depreciation (ATO)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-[#94A3B8]">Method</p><p className="text-sm text-[#F8FAFC]">{String(data.depreciationMethod ?? "Diminishing Value")}</p></div>
              <div><p className="text-xs text-[#94A3B8]">Effective Life (years)</p><p className="text-sm text-[#F8FAFC]">{String(data.effectiveLife ?? "5")}</p></div>
              <div><p className="text-xs text-[#94A3B8]">Depreciation Rate</p><p className="text-sm text-[#F8FAFC]">{String(data.depreciationRate ?? "20%")}</p></div>
              <div><p className="text-xs text-[#94A3B8]">Current Book Value</p><p className="text-sm text-[#F8FAFC]">${String(data.bookValue ?? "—")}</p></div>
            </div>
          </div>
        </>
      )}

      {!loading && !data && (
        <p className="text-[#EF4444]">Asset not found.</p>
      )}
    </div>
  );
}
