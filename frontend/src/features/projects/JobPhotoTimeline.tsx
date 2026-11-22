"use client";

import React, { useEffect, useState } from "react";
import { Camera, MapPin, Clock } from "lucide-react";
// native file input used below

interface PhotoEntry {
  id: string;
  dataUrl: string;
  category: "before" | "after" | "progress";
  caption?: string;
  timestamp: number;
  lat?: number;
  lon?: number;
}

export function JobPhotoTimeline({ projectId }: { projectId: string }) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`rd_project_photos_${projectId}`);
      if (raw) setPhotos(JSON.parse(raw));
    } catch {
      setPhotos([]);
    }
  }, [projectId]);

  const persist = (next: PhotoEntry[]) => {
    setPhotos(next);
    try {
      localStorage.setItem(`rd_project_photos_${projectId}`, JSON.stringify(next));
    } catch {
      // ignore quota
    }
  };

  const addPhoto = (dataUrl: string, category: "before" | "after" | "progress") => {
    const entry: PhotoEntry = {
      id: `ph-${Date.now()}`,
      dataUrl,
      category,
      timestamp: Date.now(),
    };
    persist([entry, ...photos]);
  };

  const removePhoto = (id: string) => {
    persist(photos.filter((p) => p.id !== id));
  };

  const grouped = photos.reduce<Record<string, PhotoEntry[]>>((acc, p) => {
    const day = new Date(p.timestamp).toLocaleDateString();
    (acc[day] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-[#0EA5E9]" />
        <h3 className="text-sm font-bold text-[#F8FAFC]">Job Photo Timeline</h3>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => addPhoto(String(reader.result), "progress");
          reader.readAsDataURL(file);
        }}
        className="text-xs text-[#94A3B8]"
      />

      {Object.keys(grouped).length === 0 && (
        <p className="text-xs text-[#94A3B8]">No photos yet. Capture above to start the timeline.</p>
      )}

      {Object.entries(grouped).map(([day, list]) => (
        <div key={day} className="space-y-2">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{day}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {list.map((p) => (
              <div key={p.id} className="relative group bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden">
                <img src={p.dataUrl} alt={p.category} className="w-full h-32 object-cover" />
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-bold text-[#0EA5E9] uppercase">{p.category}</span>
                  <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(p.timestamp).toLocaleTimeString()}
                  </p>
                  {p.lat && (
                    <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.lat.toFixed(4)}, {p.lon?.toFixed(4)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute top-1 right-1 bg-[#EF4444]/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
