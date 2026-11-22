"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { getCurrentPosition, reverseGeocode } from "../services/nativeGeo";
import { hapticNotification } from "../services/nativeHaptics";
import { calculateRoofBOM, isCoastalSuburb, COASTAL_SUBURBS } from "../utils/roofBomCalculator";
import { evaluateWACompliance } from "../utils/waComplianceEngine";
import { FeatureGate } from "../components/FeatureGate";
import { useToast } from "../components/Toast";
import {
  Plus,
  PhoneCall,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const COASTAL_SUBURB_SET = new Set(COASTAL_SUBURBS);

export default function CRMQuoting() {
  const { tenant } = useAuth();
  const toast = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("kanban");
  const [calcOpen, setCalcOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const handleDrop = async (newStatus: string) => {
    if (!draggedLeadId) return;
    const lead = leads.find((l) => l.id === draggedLeadId);
    setDraggedLeadId(null);
    setDragOverStatus(null);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === draggedLeadId ? { ...l, status: newStatus } : l)));
    try {
      await api.updateLead(draggedLeadId, { status: newStatus });
      toast.showToast("success", `${lead.firstName} ${lead.lastName} moved to ${newStatus}`);
    } catch (err: unknown) {
      setLeads((prev) => prev.map((l) => (l.id === draggedLeadId ? { ...l, status: lead.status } : l)));
      toast.showToast("error", (err as Error)?.message || "Failed to update lead status");
    }
  };

  // Calculator state
  const [planArea, setPlanArea] = useState(0);
  const [pitchDegrees, setPitchDegrees] = useState(22);
  const [roofType, setRoofType] = useState("gable" as "gable" | "hip_valley");
  const [suburb, setSuburb] = useState("");
  const [wastePercentage, setWastePercentage] = useState(7);
  const [roofHeight, setRoofHeight] = useState(0);
  const [isAsbestosRemoval, setIsAsbestosRemoval] = useState(false);
  const [asbestosArea, setAsbestosArea] = useState(0);
  const [bomResult, setBomResult] = useState<any>(null);
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchQuotes();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch {
      setLeads([
        { id: "1", firstName: "James", lastName: "Wilson", suburb: "Fremantle", status: "QUOTING", estimatedValue: 35000 },
        { id: "2", firstName: "Sarah", lastName: "McDonald", suburb: "Scarborough", status: "CONTACTED", estimatedValue: 28000 },
        { id: "3", firstName: "Robert", lastName: "Thompson", suburb: "Cottesloe", status: "NEW", estimatedValue: 42000 },
      ]);
    }
  };

  const fetchQuotes = async () => {
    try {
      const data = await api.getQuotes();
      setQuotes(data);
    } catch {
      setQuotes([]);
    }
  };

  const handleCalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      const result = calculateRoofBOM({
        planArea,
        pitchDegrees,
        roofType,
        suburb,
        wastePercentage: wastePercentage / 100,
        isCyclonicZone: false,
      });

      const compliance = evaluateWACompliance({
        quoteTotalIncGst: result.items.reduce((sum: number, i: { totalCost: number }) => sum + i.totalCost, 0) * 1.1,
        jobType: "reroofing",
        includesRoofPlumbing: false,
        roofHeight,
        isAsbestosRemoval,
        asbestosArea,
        hasBuilderRegNumber: true,
        hasPlumbingLicence: true,
        hasSWMS: false,
        hasEdgeProtection: roofHeight > 2,
        hasAsbestosLicence: false,
        hasWorkSafeNotification: false,
      });

      setBomResult(result);
      setComplianceResult(compliance);
      setCalculating(false);
    }, 300);
  };

  const handleAcceptQuote = async (quote: any) => {
    // Trigger ERP pipeline
    try {
      // 1. Update quote status
      await api.updateQuote(quote.id, { status: "ACCEPTED", acceptedAt: new Date().toISOString() });

      // 2. Create job
      const jobNumber = `JOB-${Date.now().toString().slice(-6)}`;
      await api.createJob({
        quoteId: quote.id,
        jobNumber,
        status: "PENDING",
      });

      // 3. Create BOM items
      if (bomResult) {
        for (const item of bomResult.items) {
          await api.createBOMItem({
            quoteId: quote.id,
            itemType: item.itemType,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            isCoastalGrade: item.isCoastalGrade,
          });
        }
      }

      // 4. Create deposit invoice (10%)
      const depositAmount = (quote.totalIncGst || 0) * 0.1;
      await api.createInvoice({
        jobId: "",
        quoteId: quote.id,
        invoiceNumber: `INV-DEP-${Date.now().toString().slice(-6)}`,
        milestone: "DEPOSIT_10",
        amount: depositAmount,
        gstAmount: depositAmount / 11,
        totalIncGst: depositAmount,
        status: "SENT",
      });

      setSelectedQuote(null);
      fetchQuotes();
    } catch (err: unknown) {
      toast.showToast("error", "Failed to accept quote: " + ((err as Error)?.message || "Unknown error"));
    }
  };

  const statusColors: Record<string, string> = {
    NEW: "#64748B",
    CONTACTED: "#0EA5E9",
    QUOTING: "#F59E0B",
    NEGOTIATION: "#8B5CF6",
    WON: "#10B981",
    LOST: "#EF4444",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">CRM & Quoting</h1>
          <p className="text-[#94A3B8]">Manage leads, quotes, and interactive BOM estimator</p>
        </div>
        <button
          data-tour="new-quote"
          onClick={() => setCalcOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </button>
      </div>

      <div className="flex gap-2">
        {["kanban", "quotes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:text-[#F8FAFC]"}`}
          >
            {tab === "kanban" ? <PhoneCall className="w-4 h-4 mr-2" /> : <ListIcon className="w-4 h-4 mr-2" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["NEW", "CONTACTED", "QUOTING", "NEGOTIATION", "WON", "LOST"].map((status) => (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(status);
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(status);
              }}
              className={`bg-[#1E293B] border rounded-xl p-4 flex flex-col h-full transition ${
                dragOverStatus === status ? "border-[#0EA5E9] bg-[#0EA5E9]/5" : "border-[#334155]"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase text-[#94A3B8]">{status}</span>
                <span className="text-xs font-bold" style={{ color: statusColors[status] }}>
                  {leads.filter((l: any) => l.status === status).length}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[600px] min-h-[80px]">
                {leads
                  .filter((l: any) => l.status === status)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedLeadId(lead.id);
                        e.dataTransfer.setData("text/plain", lead.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDraggedLeadId(null);
                        setDragOverStatus(null);
                      }}
                      className={`p-3 rounded bg-[#0F172A]/50 border border-[#334155]/50 cursor-grab active:cursor-grabbing hover:bg-[#0F172A]/70 transition group ${
                        draggedLeadId === lead.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-[#F8FAFC]">{lead.firstName} {lead.lastName}</span>
                        <span className="text-xs text-[#64748B]">{lead.suburb}</span>
                      </div>
                      <div className="text-xs text-[#94A3B8] mb-2">${Number(lead.estimatedValue || 0).toLocaleString()}</div>
                      {status === "QUOTING" && (
                        <button
                          onClick={() => {
                            setSelectedQuote(lead);
                            setCalcOpen(true);
                          }}
                          className="text-xs text-[#0EA5E9] hover:underline"
                        >
                          Create Quote →
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0F172A]/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Customer</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Suburb</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Area (m²)</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Pitch</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Total (inc GST)</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-[#1E293B]/50">
                    <td className="px-4 py-3 text-sm text-[#F8FAFC]">{q.customerName}</td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">{q.customerSuburb}</td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">{q.planArea}</td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">{q.pitchDegrees}°</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#F8FAFC]">${Number(q.totalIncGst || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[q.status]}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {q.status === "DRAFT" || q.status === "SENT" ? (
                        <button
                          onClick={() => handleAcceptQuote(q)}
                          className="text-xs text-[#10B981] hover:underline flex items-center gap-1"
                        >
                          Accept <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-[#64748B]">{q.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {calcOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#F8FAFC]">Interactive Roof BOM Estimator</h2>
              <button
                onClick={() => setCalcOpen(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Plan Area (m²)</label>
                  <input
                    type="number"
                    value={planArea}
                    onChange={(e) => setPlanArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                    placeholder="e.g. 200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Pitch (degrees)</label>
                  <input
                    type="number"
                    value={pitchDegrees}
                    onChange={(e) => setPitchDegrees(parseFloat(e.target.value) || 22)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Roof Type</label>
                  <select
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                  >
                    <option value="gable">Gable</option>
                    <option value="hip_valley">Hip / Valley</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Suburb</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={suburb}
                      onChange={(e) => setSuburb(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                      placeholder="e.g. Fremantle"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await getCurrentPosition();
                        if (!result.ok) { await hapticNotification("warning"); toast.showToast("warning", result.error); return; }
                        const pos = result.position;
                        const suburbName = await reverseGeocode(pos.latitude, pos.longitude);
                        if (suburbName) setSuburb(suburbName);
                        await hapticNotification("success");
                        toast.showToast("success", `Location captured: ${suburbName || `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`} (±${Math.round(pos.accuracy)}m)`);
                      }}
                      className="px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] text-xs"
                      title="Capture GPS for this site"
                    >
                      📍
                    </button>
                  </div>
                  {suburb && isCoastalSuburb(suburb) && (
                    <div className="mt-2 p-2 rounded bg-[#7F1D1D]/20 border border-[#7F1D1D]/30 text-[11px] text-[#FCA5A5]">
                      ⚠ Severe Marine Zone (&lt;1km from surf) — AS/NZS 2728 coastal corrosion upgrade
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Roof Height (m)</label>
                  <input
                    type="number"
                    value={roofHeight}
                    onChange={(e) => setRoofHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Asbestos Removal Area (m²)</label>
                  <input
                    type="number"
                    value={asbestosArea}
                    onChange={(e) => setAsbestosArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                  />
                </div>
                <button
                  onClick={handleCalculate}
                  disabled={calculating || planArea <= 0}
                  className="w-full py-3 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg disabled:opacity-50 hover:bg-[#38BDF8] transition"
                >
                  {calculating ? "Calculating..." : "Calculate BOM"}
                </button>
              </div>

              {/* BOM Results */}
              {bomResult && (
                <div className="space-y-4">
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                    <h3 className="text-sm font-bold text-[#0EA5E9] mb-3">BOM Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#64748B] text-xs">True Area</p>
                        <p className="text-[#F8FAFC] font-bold">{bomResult.trueArea} m²</p>
                      </div>
                      <div>
                        <p className="text-[#64748B] text-xs">Pitch Factor</p>
                        <p className="text-[#F8FAFC] font-bold">{bomResult.pitchFactor}</p>
                      </div>
                      <div>
                        <p className="text-[#64748B] text-xs">Sheets</p>
                        <p className="text-[#F8FAFC] font-bold">{bomResult.sheets}</p>
                      </div>
                      <div>
                        <p className="text-[#64748B] text-xs">Batten Lineal Metres</p>
                        <p className="text-[#F8FAFC] font-bold">{bomResult.battenLinealMetres}</p>
                      </div>
                      <div>
                        <p className="text-[#64748B] text-xs">Insulation Rolls</p>
                        <p className="text-[#F8FAFC] font-bold">{bomResult.insulationRolls}</p>
                      </div>
                      <div>
                        <p className="text-[#64748B] text-xs">Fasteners</p>
                        <p className="text-[#F8FAFC] font-bold">{bomResult.fasteners}</p>
                      </div>
                    </div>
                    {bomResult.coastalGrade && (
                      <div className="mt-3 p-2 rounded bg-[#7F1D1D]/20 border border-[#7F1D1D]/30 text-[11px] text-[#FCA5A5]">
                        ⚠ Coastal Grade Upgrade: Colorbond Ultra + Class 4 Stainless 316 Fasteners
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                    <h3 className="text-sm font-bold text-[#0EA5E9] mb-3">Line Items</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[#94A3B8]">
                          <th className="text-left">Item</th>
                          <th className="text-right">Qty</th>
                          <th className="text-right">Unit</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomResult.items.map((item: any, i: number) => (
                          <tr key={i} className="border-b border-[#1E293B]/30">
                            <td className="py-2 text-[#F8FAFC]">{item.itemName}</td>
                            <td className="py-2 text-right text-[#94A3B8]">{item.quantity}</td>
                            <td className="py-2 text-right text-[#94A3B8]">{item.unit}</td>
                            <td className="py-2 text-right text-[#F8FAFC]">${Number(item.totalCost).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Compliance */}
              {complianceResult && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${
                      complianceResult.passed
                        ? "bg-[#10B981]/10 border border-[#10B981]/30"
                        : "bg-[#EF4444]/10 border border-[#EF4444]/30"
                    }`}
                  >
                    <h3 className="text-sm font-bold mb-2">
                      {complianceResult.passed ? "✓ WA Compliance Passed" : "✗ WA Compliance Blocked"}
                    </h3>
                    {complianceResult.blockedReason && (
                      <p className="text-sm text-[#EF4444] mb-2">{complianceResult.blockedReason}</p>
                    )}
                    {complianceResult.requiredActions.length > 0 && (
                      <ul className="text-sm text-[#94A3B8] list-disc pl-4">
                        {complianceResult.requiredActions.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    )}
                    {complianceResult.warnings.length > 0 && (
                      <ul className="text-sm text-[#F59E0B] list-disc pl-4 mt-2">
                        {complianceResult.warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ListIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);
