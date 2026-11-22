"use client";

import React, { useState } from "react";
import { MapPin, Truck } from "lucide-react";

interface CrewPin {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: "en_route" | "on_site" | "idle";
  job?: string;
}

const MOCK_CREWS: CrewPin[] = [
  { id: "c1", name: "Crew Alpha (Hilux)", lat: -31.95, lon: 115.86, status: "on_site", job: "Fremantle Re-roof" },
  { id: "c2", name: "Crew Beta (Isuzu)", lat: -32.0, lon: 115.9, status: "en_route", job: "Scarborough Repair" },
  { id: "c3", name: "Crew Gamma", lat: -31.88, lon: 115.8, status: "idle" },
];

// Simple equirectangular projection for Perth metro
function project(lat: number, lon: number) {
  const minLat = -32.2, maxLat = -31.7;
  const minLon = 115.6, maxLon = 116.1;
  const x = ((lon - minLon) / (maxLon - minLon)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return { x, y };
}

const STATUS_COLOR: Record<CrewPin["status"], string> = {
  on_site: "#10B981",
  en_route: "#0EA5E9",
  idle: "#94A3B8",
};

export function DispatchMap() {
  const [selected, setSelected] = useState<CrewPin | null>(null);
  const crews = MOCK_CREWS;

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-[#0EA5E9]" />
        <h3 className="text-sm font-bold text-[#F8FAFC]">Live Crew Dispatch Map</h3>
        <span className="text-xs text-[#94A3B8]">(Perth metro)</span>
      </div>
      <div className="relative w-full aspect-[4/3] bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* grid */}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="#1E293B" strokeWidth="0.3" />
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="#1E293B" strokeWidth="0.3" />
            </g>
          ))}
          {crews.map((c) => {
            const { x, y } = project(c.lat, c.lon);
            return (
              <g key={c.id} onClick={() => setSelected(c)} className="cursor-pointer">
                <circle cx={x} cy={y} r={2.5} fill={STATUS_COLOR[c.status]} stroke="#F8FAFC" strokeWidth="0.5" />
                <text x={x + 3} y={y + 1} fontSize="2.5" fill="#F8FAFC">{c.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> On site</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0EA5E9]" /> En route</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#94A3B8]" /> Idle</span>
      </div>
      {selected && (
        <div className="p-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm">
          <p className="font-bold text-[#F8FAFC]">{selected.name}</p>
          <p className="text-xs text-[#94A3B8]">
            {selected.lat.toFixed(4)}, {selected.lon.toFixed(4)} · {selected.status}
          </p>
          {selected.job && <p className="text-xs text-[#0EA5E9] mt-1">Job: {selected.job}</p>}
        </div>
      )}
    </div>
  );
}
