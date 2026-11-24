"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShieldCheck, AlertTriangle, Save, WifiOff, Wifi } from "lucide-react";
import { api } from "../../services/api";
import { offlineSync } from "../../services/offlineSync";
import { useToast } from "../../components/Toast";
import { SignaturePad } from "../../components/SignaturePad";
import { Button } from "../../components/ui/button";

interface ChecklistState {
  edgeProtectionRequired: boolean;
  edgeProtectionVerified: boolean;
  harnessInspectionVerified: boolean;
  fragileRoofIdentified: boolean;
  weatherAssessed: boolean;
  exclusionZonesSet: boolean;
  emergencyRescuePlan: boolean;
}

const DEFAULT_CHECKLIST: ChecklistState = {
  edgeProtectionRequired: true,
  edgeProtectionVerified: false,
  harnessInspectionVerified: false,
  fragileRoofIdentified: false,
  weatherAssessed: false,
  exclusionZonesSet: false,
  emergencyRescuePlan: false,
};

const CHECKLIST_ITEMS: { key: keyof ChecklistState; label: string; mandatory: boolean }[] = [
  { key: "edgeProtectionRequired", label: "Edge protection / scaffolding required", mandatory: true },
  { key: "edgeProtectionVerified", label: "Edge protection verified installed", mandatory: true },
  { key: "harnessInspectionVerified", label: "Fall-arrest harness & anchor inspection", mandatory: true },
  { key: "fragileRoofIdentified", label: "Fragile roof / skylight identification", mandatory: true },
  { key: "weatherAssessed", label: "Weather & wind assessment", mandatory: true },
  { key: "exclusionZonesSet", label: "Exclusion zones established", mandatory: true },
  { key: "emergencyRescuePlan", label: "Emergency rescue plan in place", mandatory: true },
];

interface SignOff {
  id: string;
  guestName: string;
  tradeLicense: string;
  signatureDataUrl: string | null;
  signedAt: string;
}

interface Props {
  projectId: string;
}

type SyncStatus = "idle" | "saving" | "saved_offline" | "syncing" | "synced" | "error";

export function WhsSwmsPanel({ projectId }: Props) {
  const toast = useToast();
  const [checklist, setChecklist] = useState<ChecklistState>({ ...DEFAULT_CHECKLIST });
  const [hazardNotes, setHazardNotes] = useState("");
  const [controlMeasures, setControlMeasures] = useState("");
  const [roofHeight, setRoofHeight] = useState("6.5");
  const [signOffs, setSignOffs] = useState<SignOff[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentLicense, setCurrentLicense] = useState("");
  const [currentSig, setCurrentSig] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); if (syncStatus === "saved_offline") flush(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncStatus]);

  const allChecked = CHECKLIST_ITEMS.every((item) => checklist[item.key]);

  const addSignOff = () => {
    if (!currentName.trim()) { toast.error("Crew member name is required"); return; }
    if (!currentSig) { toast.error("Signature is required"); return; }
    const entry: SignOff = {
      id: `so-${Date.now()}`,
      guestName: currentName.trim(),
      tradeLicense: currentLicense.trim(),
      signatureDataUrl: currentSig,
      signedAt: new Date().toISOString(),
    };
    setSignOffs((prev) => [...prev, entry]);
    setCurrentName("");
    setCurrentLicense("");
    setCurrentSig(null);
    toast.success("Signature captured");
  };

  const removeSignOff = (id: string) => {
    setSignOffs((prev) => prev.filter((s) => s.id !== id));
  };

  const flush = useCallback(async () => {
    if (signOffs.length === 0) return;
    setSyncStatus("syncing");
    const clientMutationId = `swms-${projectId}-${Date.now()}`;
    const payload = {
      clientMutationId,
      checklist,
      signOffs: signOffs.map((s) => ({
        guestName: s.guestName,
        tradeLicense: s.tradeLicense,
        signatureDataUrl: s.signatureDataUrl,
        signedAt: s.signedAt,
        clientMutationId: `so-${s.id}`,
      })),
      hazardNotes,
      controlMeasures,
      roofHeight,
      gpsLat: null,
      gpsLon: null,
    };
    try {
      if (isOnline) {
        await api.request(`/projects/${projectId}/whs-swms/sync`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSyncStatus("synced");
        toast.success("SWMS synced to server");
      } else {
        await offlineSync.queueWrite({
          method: "POST",
          endpoint: `/projects/${projectId}/whs-swms/sync`,
          body: payload,
        });
        setSyncStatus("saved_offline");
        toast.info("Saved offline — will sync when online");
      }
    } catch (err: unknown) {
      // Network failure → queue offline
      try {
        await offlineSync.queueWrite({
          method: "POST",
          endpoint: `/projects/${projectId}/whs-swms/sync`,
          body: payload,
        });
        setSyncStatus("saved_offline");
        toast.warning("Saved offline — will sync when online");
      } catch {
        setSyncStatus("error");
        toast.error((err as Error)?.message || "Sync failed");
      }
    }
  }, [projectId, checklist, signOffs, hazardNotes, controlMeasures, roofHeight, isOnline, toast]);

  const statusBadge = () => {
    switch (syncStatus) {
      case "saved_offline":
        return <span className="px-2 py-1 rounded text-xs font-bold bg-[#F59E0B]/20 text-[#F59E0B]">Saved Offline — Pending Sync</span>;
      case "syncing":
        return <span className="px-2 py-1 rounded text-xs font-bold bg-[#0EA5E9]/20 text-[#0EA5E9]">Syncing...</span>;
      case "synced":
        return <span className="px-2 py-1 rounded text-xs font-bold bg-[#10B981]/20 text-[#10B981]">Synced</span>;
      case "error":
        return <span className="px-2 py-1 rounded text-xs font-bold bg-[#EF4444]/20 text-[#EF4444]">Sync Error</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Compliance gate banner */}
      {!allChecked && (
        <div className="flex items-center gap-2 p-3 bg-[#7F1D1D]/20 border border-[#7F1D1D]/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-[#FCA5A5]" />
          <p className="text-sm text-[#FCA5A5]">
            Working at Heights SWMS incomplete — all mandatory controls must be checked before sign-off.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" />
          <h3 className="text-sm font-bold text-[#F8FAFC]">Working at Heights WHS &amp; SWMS Sign-Off</h3>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          {!isOnline && <WifiOff className="w-4 h-4 text-[#F59E0B]" />}
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <label key={item.key} className="flex items-center gap-3 p-2 bg-[#0F172A] border border-[#334155] rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={checklist[item.key]}
              onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
              className="w-4 h-4 accent-[#0EA5E9]"
            />
            <span className="text-sm text-[#F8FAFC]">{item.label}</span>
            {item.mandatory && <span className="text-[10px] text-[#EF4444] ml-auto">Required</span>}
          </label>
        ))}
      </div>

      {/* Hazard notes & control measures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Hazard notes</label>
          <textarea
            value={hazardNotes}
            onChange={(e) => setHazardNotes(e.target.value)}
            placeholder="Site-specific hazards..."
            rows={3}
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Control measures</label>
          <textarea
            value={controlMeasures}
            onChange={(e) => setControlMeasures(e.target.value)}
            placeholder="Control measures applied..."
            rows={3}
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
          />
        </div>
      </div>

      {/* Roof height */}
      <div className="max-w-xs">
        <label className="block text-xs text-[#94A3B8] mb-1">Roof height (m)</label>
        <input
          type="number"
          value={roofHeight}
          onChange={(e) => setRoofHeight(e.target.value)}
          className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
        />
      </div>

      {/* Signature capture */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Crew Sign-Off</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder="Crew member name"
            className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
          />
          <input
            value={currentLicense}
            onChange={(e) => setCurrentLicense(e.target.value)}
            placeholder="Trade license / White Card #"
            className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
          />
        </div>
        <SignaturePad onChange={setCurrentSig} />
        <Button onClick={addSignOff} disabled={!currentSig || !currentName.trim()} size="sm">
          Add Signature
        </Button>
      </div>

      {/* Captured signatures */}
      {signOffs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Captured Signatures ({signOffs.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {signOffs.map((s) => (
              <div key={s.id} className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#F8FAFC]">{s.guestName}</span>
                  <button onClick={() => removeSignOff(s.id)} className="text-xs text-[#EF4444] hover:underline">Remove</button>
                </div>
                <p className="text-xs text-[#94A3B8]">{s.tradeLicense || "No license"}</p>
                <p className="text-xs text-[#64748B]">{new Date(s.signedAt).toLocaleString()}</p>
                {s.signatureDataUrl && (
                  <img src={s.signatureDataUrl} alt="Signature" className="w-full h-16 object-contain bg-[#1E293B] rounded border border-[#334155]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync button */}
      <div className="flex justify-end">
        <Button
          onClick={flush}
          disabled={!allChecked || signOffs.length === 0}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {isOnline ? "Sign Off & Sync" : "Save Offline"}
        </Button>
      </div>
    </div>
  );
}