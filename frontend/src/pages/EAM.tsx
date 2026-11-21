"use client";

import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { scheduleReminder } from "../services/nativeNotifications";
import { hapticNotification } from "../services/nativeHaptics";
import { useToast } from "../components/Toast";
import { FeatureGate } from "../components/FeatureGate";
import { InspectionCountdown } from "../components/InspectionCountdown";
import {
  Truck,
  HardHat,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export default function EAM() {
  const toast = useToast();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [harnesses, setHarnesses] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [tab, setTab] = useState("equipment");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eq, har, insp] = await Promise.all([
        api.getEquipment(),
        api.getHarnesses(),
        api.getInspections(),
      ]);
      setEquipment(eq);
      setHarnesses(har);
      setInspections(insp);
    } catch {
      setEquipment([
        { id: "1", name: "Hilux Ute 1", assetType: "UTE", serialNumber: "HT-001", status: "ACTIVE", location: "WELSHPOOL_MAIN_YARD", assignedTo: "John Smith", purchaseDate: "2023-01-15", cost: 45000 },
        { id: "2", name: "Isuzu Truck 2", assetType: "UTE", serialNumber: "IS-002", status: "ACTIVE", location: "WELSHPOOL_MAIN_YARD", assignedTo: "Mike Wilson", purchaseDate: "2022-06-10", cost: 68000 },
        { id: "3", name: "Edge Protection Rail Kit A", assetType: "EDGE_PROTECTION_RAIL_KIT", serialNumber: "EP-001", status: "ACTIVE", location: "HILUX_UTE_1", assignedTo: null, purchaseDate: "2024-03-01", cost: 3500 },
        { id: "4", name: "Nail Gun - Makita", assetType: "NAIL_GUN", serialNumber: "NG-001", status: "ACTIVE", location: "ISUZU_TRUCK_2", assignedTo: "Sarah Davis", purchaseDate: "2023-08-20", cost: 450 },
      ]);
      setHarnesses([
        { id: "1", name: "Full Body Harness - Crew 1", serialNumber: "HARN-001", status: "ACTIVE", lastInspectionDate: "2026-05-01", nextInspectionDue: "2026-11-01", assignedTo: "John Smith" },
        { id: "2", name: "Full Body Harness - Crew 2", serialNumber: "HARN-002", status: "ACTIVE", lastInspectionDate: "2026-04-15", nextInspectionDue: "2026-10-15", assignedTo: "Mike Wilson" },
        { id: "3", name: "Full Body Harness - Crew 3", serialNumber: "HARN-003", status: "ACTIVE", lastInspectionDate: "2026-03-01", nextInspectionDue: "2026-09-01", assignedTo: null },
      ]);
      setInspections([]);
    }
  };

  const overdueInspections = harnesses.filter((h) => {
    if (!h.nextInspectionDue) return false;
    return new Date(h.nextInspectionDue) < new Date();
  });

  const dueSoonInspections = harnesses.filter((h) => {
    if (!h.nextInspectionDue) return false;
    const due = new Date(h.nextInspectionDue);
    const now = new Date();
    const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  });

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  return (
    <FeatureGate moduleKey="EAM_FLEET">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Equipment, Fleet & Harness Register</h1>
            <p className="text-[#94A3B8]">Track utes, trailers, edge protection, nail guns & harnesses with AS/NZS 1891.4 inspection tags</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>

        {/* Inspection Alert Banner */}
        {(overdueInspections.length > 0 || dueSoonInspections.length > 0) && (
          <div className="bg-[#7F1D1D]/20 border border-[#7F1D1D]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#FCA5A5]" />
              <h3 className="text-sm font-bold text-[#FCA5A5]">Inspection Alerts</h3>
            </div>
            <div className="space-y-1 text-sm">
              {overdueInspections.map((h) => (
                <div key={h.serialNumber} className="flex justify-between items-center">
                  <span className="text-[#FCA5A5]">⚠ {h.serialNumber}</span>
                  <span className="text-xs bg-[#7F1D1D]/40 text-[#FCA5A5] px-2 py-0.5 rounded">OVERDUE</span>
                </div>
              ))}
              {dueSoonInspections.map((h) => (
                <div key={h.serialNumber} className="flex justify-between items-center">
                  <span className="text-[#F59E0B]">{h.serialNumber}</span>
                  <span className="text-xs bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded">Due Soon</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("equipment")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "equipment" ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:text-[#F8FAFC]"}`}
          >
            <Truck className="w-4 h-4 mr-2" /> Equipment & Fleet
          </button>
          <button
            onClick={() => setTab("harness")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "harness" ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:text-[#F8FAFC]"}`}
          >
            <HardHat className="w-4 h-4 mr-2" /> Harness Register
          </button>
          <button
            onClick={() => setTab("inspections")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "inspections" ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:text-[#F8FAFC]"}`}
          >
            <Clock className="w-4 h-4 mr-2" /> Inspections
          </button>
        </div>

        {tab === "equipment" && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0F172A]/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Asset</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Serial</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Location</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Assigned To</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Cost</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.id} className="border-b border-[#1E293B]/30">
                      <td className="px-4 py-3 text-sm text-[#F8FAFC]">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{item.assetType.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{item.serialNumber}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{item.location?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{item.assignedTo || "Unassigned"}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">${item.cost != null ? Number(item.cost).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === "ACTIVE" ? "bg-[#10B981]/20 text-[#10B981]" : item.status === "MAINTENANCE" ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[#64748A]/20 text-[#64748A]"}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "harness" && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0F172A]/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Harness</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Serial Number</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Last Inspection</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Next Due</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Countdown</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Assigned To</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {harnesses.map((h) => {
                    const overdue = h.nextInspectionDue && new Date(h.nextInspectionDue) < new Date();
                    return (
                      <tr key={h.id} className="border-b border-[#1E293B]/30">
                        <td className="px-4 py-3 text-sm text-[#F8FAFC]">{h.name}</td>
                        <td className="px-4 py-3 text-sm text-[#94A3B8]">{h.serialNumber}</td>
                        <td className="px-4 py-3 text-sm text-[#94A3B8]">{formatDate(h.lastInspectionDate)}</td>
                        <td className="px-4 py-3 text-sm text-[#F8FAFC] font-medium">
                          {formatDate(h.nextInspectionDue)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <InspectionCountdown dueDate={h.nextInspectionDue} />
                        </td>
                        <td className="px-4 py-3 text-sm text-[#94A3B8]">{h.assignedTo || "Unassigned"}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${overdue ? "bg-[#EF4444]/20 text-[#EF4444]" : "bg-[#10B981]/20 text-[#10B981]"}`}>
                            {overdue ? "OVERDUE" : "ACTIVE"}
                          </span>
                          <button
                            onClick={async () => {
                              if (!h.nextInspectionDue) return;
                              const due = new Date(h.nextInspectionDue);
                              const reminderAt = new Date(due.getTime() - 24 * 60 * 60 * 1000);
                              const ok = await scheduleReminder({
                                id: Math.abs(hashCode(h.id)),
                                title: `Harness inspection due — ${h.name}`,
                                body: `${h.serialNumber} is due for AS/NZS 1891.4 inspection on ${due.toLocaleDateString()}.`,
                                at: reminderAt,
                              });
                              if (ok) await hapticNotification("success");
                              else toast.error("Notifications not permitted");
                            }}
                            className="ml-2 text-[10px] text-[#0EA5E9] hover:underline"
                          >
                            Remind
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "inspections" && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0F172A]/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Asset</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Inspection Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Inspection Date</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Next Due</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Inspector</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.length > 0 ? inspections.map((insp) => (
                    <tr key={insp.id} className="border-b border-[#1E293B]/30">
                      <td className="px-4 py-3 text-sm text-[#F8FAFC]">{insp.equipment?.name || insp.harness?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{insp.inspectionType}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${insp.status === "PASSED" ? "bg-[#10B981]/20 text-[#10B981]" : insp.status === "FAILED" ? "bg-[#EF4444]/20 text-[#EF4444]" : "bg-[#F59E0B]/20 text-[#F59E0B]"}`}>
                          {insp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{formatDate(insp.inspectionDate)}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{formatDate(insp.nextDueDate)}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{insp.inspectorName || "—"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#64748B]">
                        No inspections recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
