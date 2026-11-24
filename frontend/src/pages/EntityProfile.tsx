"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, User, Truck, Package, Wrench, FileText, MapPin, Calendar, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";

interface EntityConfig {
  title: string;
  icon: React.ReactNode;
  endpoint: (id: string) => string;
  fields: { key: string; label: string }[];
}

const CONFIGS: Record<string, EntityConfig> = {
  project: {
    title: "Project",
    icon: <Building2 className="w-6 h-6 text-[#0EA5E9]" />,
    endpoint: (id) => `/projects/${id}`,
    fields: [
      { key: "name", label: "Project Name" },
      { key: "customerName", label: "Customer" },
      { key: "customerEmail", label: "Email" },
      { key: "address", label: "Address" },
      { key: "suburb", label: "Suburb" },
      { key: "state", label: "State" },
      { key: "postcode", label: "Postcode" },
      { key: "status", label: "Status" },
      { key: "coastalZone", label: "Coastal Zone" },
      { key: "pitchDegrees", label: "Pitch (°)" },
      { key: "planArea", label: "Plan Area (m²)" },
      { key: "notes", label: "Notes" },
    ],
  },
  lead: {
    title: "Lead",
    icon: <User className="w-6 h-6 text-[#0EA5E9]" />,
    endpoint: (id) => `/leads/${id}`,
    fields: [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "suburb", label: "Suburb" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "estimatedValue", label: "Estimated Value" },
      { key: "notes", label: "Notes" },
    ],
  },
  quote: {
    title: "Quote",
    icon: <FileText className="w-6 h-6 text-[#0EA5E9]" />,
    endpoint: (id) => `/quotes/${id}`,
    fields: [
      { key: "quoteNumber", label: "Quote #" },
      { key: "status", label: "Status" },
      { key: "totalIncGst", label: "Total (inc GST)" },
      { key: "createdAt", label: "Created" },
    ],
  },
  equipment: {
    title: "Equipment",
    icon: <Wrench className="w-6 h-6 text-[#0EA5E9]" />,
    endpoint: (id) => `/equipment/${id}`,
    fields: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "serialNumber", label: "Serial #" },
      { key: "status", label: "Status" },
      { key: "nextInspectionDue", label: "Next Inspection" },
    ],
  },
  stock: {
    title: "Stock Item",
    icon: <Package className="w-6 h-6 text-[#0EA5E9]" />,
    endpoint: (id) => `/stock-items/${id}`,
    fields: [
      { key: "sku", label: "SKU" },
      { key: "name", label: "Name" },
      { key: "location", label: "Location" },
      { key: "quantityOnHand", label: "On Hand" },
      { key: "quantityReserved", label: "Reserved" },
      { key: "reorderPoint", label: "Reorder Point" },
      { key: "unitCost", label: "Unit Cost" },
      { key: "supplier", label: "Supplier" },
    ],
  },
};

export default function EntityProfile() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const config = type ? CONFIGS[type] : undefined;

  useEffect(() => {
    if (!id || !config) { setLoading(false); return; }
    (async () => {
      try {
        const res = await api.request<Record<string, unknown>>(config.endpoint(id));
        setData(res);
      } catch (err: unknown) {
        toast.error((err as Error)?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, config, toast]);

  if (!config) {
    return (
      <div className="p-6 text-[#F8FAFC]">
        <p>Unknown entity type: {type}</p>
        <button onClick={() => navigate(-1)} className="text-[#0EA5E9] hover:underline mt-2">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC]">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">{config.title} Profile</h1>
          <p className="text-sm text-[#94A3B8]">{data ? String(data[config.fields[0]?.key] ?? id) : id}</p>
        </div>
      </div>

      {loading && <p className="text-[#94A3B8]">Loading...</p>}

      {!loading && data && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.fields.map((f) => (
              <div key={f.key}>
                <p className="text-xs text-[#94A3B8]">{f.label}</p>
                <p className="text-sm text-[#F8FAFC]">{data[f.key] != null ? String(data[f.key]) : "—"}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#334155]">
            <p className="text-xs text-[#64748B]">
              <MapPin className="w-3 h-3 inline mr-1" />
              ID: {id}
            </p>
          </div>
        </div>
      )}

      {!loading && !data && (
        <p className="text-[#EF4444]">Entity not found.</p>
      )}
    </div>
  );
}
