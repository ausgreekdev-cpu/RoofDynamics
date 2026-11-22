"use client";

import React, { useMemo, useState } from "react";
import { Flame, Shield } from "lucide-react";
import { balRatingFor, calculateRoofBOM } from "../../utils/roofBomCalculator";

export function BalReport() {
  const [suburb, setSuburb] = useState("");
  const [area, setArea] = useState("200");

  const bal = useMemo(() => balRatingFor(suburb || undefined), [suburb]);
  const bom = useMemo(() => {
    if (!bal) return null;
    return calculateRoofBOM({
      planArea: Number(area) || 0,
      pitchDegrees: 22,
      suburb: suburb || undefined,
      roofType: "gable",
    });
  }, [bal, suburb, area]);

  const bushfire = bal !== null;

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-[#F59E0B]" />
        <h3 className="text-sm font-bold text-[#F8FAFC]">BAL / Bushfire Report (AS 3959)</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-1">Suburb</label>
          <input
            type="text"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            placeholder="e.g. Kalamunda"
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-1">Roof plan area (m²)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
          />
        </div>
      </div>

      {suburb && (
        <div className={`p-3 rounded-lg border ${bushfire ? "bg-[#F59E0B]/10 border-[#F59E0B]/30" : "bg-[#10B981]/10 border-[#10B981]/30"}`}>
          <p className="text-sm font-bold text-[#F8FAFC]">
            {bushfire ? `BAL rating: ${bal}` : "Not bushfire prone"}
          </p>
          {bushfire && (
            <ul className="text-xs text-[#94A3B8] mt-2 space-y-1">
              <li>• Ember Guard mesh required (AS 3959)</li>
              <li>• Sarking / rigid sheet required</li>
              <li>• Class B/A licence if asbestos Super Six &gt; 10 m²</li>
            </ul>
          )}
        </div>
      )}

      {bushfire && bom && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Bushfire BOM additions</p>
          <ul className="text-xs text-[#F8FAFC] space-y-1">
            {bom.items
              .filter((i) => i.itemType === "ember_guard" || i.itemType === "sarking")
              .map((i) => (
                <li key={i.itemType} className="flex justify-between">
                  <span>{i.itemName}</span>
                  <span className="text-[#0EA5E9]">
                    {i.quantity} {i.unit} · ${i.totalCost.toFixed(0)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
