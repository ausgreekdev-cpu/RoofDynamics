"use client";

import React, { useState } from "react";
import { Sparkles, Download } from "lucide-react";
import { aiAgentService } from "../../services/aiAgentService";
import { useToast } from "../../components/Toast";

export function QuoteDrafter() {
  const toast = useToast();
  const [leadName, setLeadName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [planArea, setPlanArea] = useState("100");
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await aiAgentService.runQuoteDrafterAgent({
        lead: { name: leadName, suburb },
        measurement: { planArea: Number(planArea), pitch: 22 },
      });
      setDraft(result.data.quoteText);
      toast.success("Quote drafted");
    } catch (e: any) {
      toast.error(e?.message || "Draft failed");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!draft) return;
    const blob = new Blob([draft], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quote-draft.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
        <h3 className="text-sm font-bold text-[#F8FAFC]">AI Quote Drafter</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={leadName}
          onChange={(e) => setLeadName(e.target.value)}
          placeholder="Customer name"
          className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
        />
        <input
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          placeholder="Suburb"
          className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
        />
        <input
          value={planArea}
          onChange={(e) => setPlanArea(e.target.value)}
          placeholder="Plan area m²"
          type="number"
          className="px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
        />
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg text-sm hover:bg-[#38BDF8] transition disabled:opacity-50"
      >
        {loading ? "Drafting…" : "Draft quote with AI"}
      </button>
      {draft && (
        <div className="space-y-2">
          <pre className="text-xs text-[#94A3B8] whitespace-pre-wrap bg-[#0F172A] p-3 rounded-lg border border-[#334155] max-h-64 overflow-y-auto">
            {draft}
          </pre>
          <button
            onClick={download}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#1E293B] border border-[#334155] rounded text-[#94A3B8] hover:text-[#F8FAFC]"
          >
            <Download className="w-3 h-3" /> Download draft
          </button>
        </div>
      )}
    </div>
  );
}
