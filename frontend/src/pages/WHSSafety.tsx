"use client";

import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { FeatureGate } from "../components/FeatureGate";
import { generateSWMSDocument } from "../utils/documentGenerator";
import { SignaturePad } from "../components/SignaturePad";
import { PhotoUploader } from "../components/PhotoUploader";
import { useToast } from "../components/Toast";
import {
  HardHat,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Image,
  Plus,
  Clock,
  ShieldCheck,
  Download,
} from "lucide-react";

export default function WHSSafety() {
  const [swmsList, setSwmsList] = useState<any[]>([]);
  const [mobileMode, setMobileMode] = useState(false);
  const [activeSWMS, setActiveSWMS] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const toast = useToast();

  const handleSaveSignature = async () => {
    if (!signature || !signerName.trim()) {
      toast.showToast("warning", "Please enter your name and draw your signature");
      return;
    }
    try {
      await api.updateSWMS(activeSWMS.id, {
        fallingFromHeightsSigned: true,
        signedBy: signerName.trim(),
        signedAt: new Date().toISOString(),
      });
      setSwmsList((prev) =>
        prev.map((s) =>
          s.id === activeSWMS.id
            ? { ...s, fallingFromHeightsSigned: true, signedBy: signerName.trim(), signedAt: new Date().toISOString() }
            : s
        )
      );
      toast.showToast("success", `SWMS signed by ${signerName}`);
      setActiveSWMS(null);
      setSignature(null);
      setSignerName("");
    } catch (err: any) {
      toast.showToast("error", err.message || "Failed to save signature");
    }
  };

  const HAZARD_CHECKLIST = [
    "Weather conditions checked (wind < 35 km/h)",
    "Edge protection installed and verified",
    "Harness inspected and serial recorded",
    "Roof access point secured",
    "Exclusion zone established below work area",
    "Emergency procedures communicated",
    "First aid kit accessible",
    "PPE worn (hard hat, high-vis, safety boots)",
  ];

  useEffect(() => {
    loadSWMS();
  }, []);

  const loadSWMS = async () => {
    try {
      const data = await api.getSWMS();
      setSwmsList(data);
    } catch {
      setSwmsList([
        { id: "1", jobId: "job-1", title: "Fremantle Residential Re-roof", roofHeight: 3.5, edgeProtectionRequired: true, edgeProtectionVerified: true, fallingFromHeightsSigned: true, signedBy: "John Smith", asbestosRemoval: false },
        { id: "2", jobId: "job-2", title: "Scarborough Gutter Replacement", roofHeight: 2.8, edgeProtectionRequired: true, edgeProtectionVerified: false, fallingFromHeightsSigned: false, signedBy: null, asbestosRemoval: false },
      ]);
    }
  };

  const handleToggleMobileMode = () => {
    setMobileMode(!mobileMode);
  };

  const handleSignSWMS = (swms: any) => {
    setActiveSWMS(swms);
  };

  return (
    <FeatureGate moduleKey="WHS_SAFETY">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">WHS Safety & Digital SWMS</h1>
            <p className="text-[#94A3B8]">Digital SWMS, pre-start checks, and field crew mobile view</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMobileMode}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${mobileMode ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155]"}`}
            >
              {mobileMode ? "Exit" : "Enter"} Field Crew Mobile Mode
            </button>
            <button
              className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New SWMS
            </button>
          </div>
        </div>

        {/* Mobile Mode Indicator */}
        {mobileMode && (
          <div className="bg-[#0A192F] border border-[#0EA5E9]/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse"></span>
              <span className="text-sm text-[#0EA5E9] font-bold">FIELD CREW MOBILE MODE ACTIVE</span>
              <span className="ml-auto text-xs text-[#475569]">Simulating smartphone on roof</span>
            </div>
          </div>
        )}

        {/* SWMS List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {swmsList.map((swms) => (
            <div key={swms.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-bold text-[#F8FAFC]">{swms.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  swms.fallingFromHeightsSigned ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#EF4444]/20 text-[#EF4444]"
                }`}>
                  {swms.fallingFromHeightsSigned ? "SIGNED" : "PENDING"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-[#94A3B8] mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Roof Height: {swms.roofHeight}m</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{swms.edgeProtectionVerified ? "✓" : "⚠"}</span>
                  <span>Edge Protection: {swms.edgeProtectionVerified ? "Verified" : "Required"}</span>
                </div>
                {swms.asbestosRemoval && (
                  <div className="flex items-center gap-2 text-[#F59E0B]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Asbestos Removal — Licence Required</span>
                  </div>
                )}
              </div>
              <div className="mt-auto">
                <button
                  onClick={() => handleSignSWMS(swms)}
                  disabled={swms.fallingFromHeightsSigned}
                  className="w-full py-2.5 bg-[#10B981] text-[#0F172A] font-bold rounded-lg text-sm disabled:opacity-50 hover:bg-[#34D399] transition"
                >
                  {swms.fallingFromHeightsSigned ? "SWMS Signed" : "Sign SWMS"}
                </button>
                <button
                  onClick={() => generateSWMSDocument({
                    tenantName: "Perth Premier Roofing & Plumbing Pty Ltd",
                    jobTitle: swms.title,
                    roofHeight: swms.roofHeight,
                    edgeProtectionRequired: swms.edgeProtectionRequired,
                    edgeProtectionVerified: swms.edgeProtectionVerified,
                    fallingFromHeightsSigned: swms.fallingFromHeightsSigned,
                    signedBy: swms.signedBy,
                    signedAt: swms.signedAt,
                    asbestosRemoval: swms.asbestosRemoval,
                    asbestosLicenceNumber: swms.asbestosLicenceNumber,
                    workSafeNotificationDate: swms.workSafeNotificationDate,
                    tipReceiptUrl: swms.tipReceiptUrl,
                    hazardChecklist: [
                      "Weather conditions checked (wind < 35 km/h)",
                      "Edge protection installed and verified",
                      "Harness inspected and serial recorded",
                      "Roof access point secured",
                      "Exclusion zone established below work area",
                      "Emergency procedures communicated",
                      "First aid kit accessible",
                      "PPE worn (hard hat, high-vis, safety boots)",
                    ],
                    harnessSerial: "HARN-001",
                  })}
                  className="w-full mt-2 py-2 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded-lg text-sm hover:text-[#F8FAFC] transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download SWMS PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pre-Start Hazard Checklist (Mobile Mode) */}
        {mobileMode && activeSWMS && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-4">Pre-Start Hazard Checklist</h2>
            <div className="space-y-3 mb-6">
              {HAZARD_CHECKLIST.map((hazard, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded bg-[#0F172A]/50 border border-[#334155]/30">
                  <input type="checkbox" className="mt-1 w-4 h-4 rounded text-[#0EA5E9] focus:ring-[#0EA5E9]" />
                  <span className="text-sm text-[#94A3B8]">{hazard}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-2">Harness Serial Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                  placeholder="e.g. HARNESS-001"
                />
              </div>

              {/* Before/After Photo Uploaders */}
              <div className="space-y-4 pt-2 border-t border-[#334155]">
                <PhotoUploader
                  jobId={activeSWMS.jobId}
                  category="before"
                />
                <PhotoUploader
                  jobId={activeSWMS.jobId}
                  category="after"
                />
              </div>

              <button
                className="w-full py-3 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
              >
                Complete Pre-Start & Sign SWMS
              </button>
            </div>
          </div>
        )}

        {/* Digital Signature Modal */}
        {activeSWMS && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-[#F8FAFC] mb-4">Digital SWMS Signature</h2>
              <p className="text-sm text-[#94A3B8] mb-4">Signing SWMS for: {activeSWMS.title}</p>
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#94A3B8] mb-2">Signer Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                />
              </div>
              <SignaturePad onChange={setSignature} />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setActiveSWMS(null); setSignature(null); setSignerName(""); }}
                  className="px-4 py-2 text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSignature}
                  className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8]"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
