"use client";

import React, { useEffect, useState } from "react";
import { offlineSync, type Conflict } from "../services/offlineSync";
import { useToast } from "./Toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";

export function ConflictResolver({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const toast = useToast();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    if (open) setConflicts(offlineSync.getUnresolvedConflicts());
  }, [open]);

  const resolve = (id: string, choice: "local" | "server") => {
    offlineSync.resolveConflict(id);
    setConflicts((prev) => prev.filter((c) => c.id !== id));
    toast.success(`Conflict resolved: kept ${choice}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resolve sync conflicts ({conflicts.length})</DialogTitle>
          <DialogDescription>
            A queued offline write collided with the server version. Choose which to keep.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {conflicts.length === 0 && <p className="text-sm text-[#94A3B8]">No unresolved conflicts.</p>}
          {conflicts.map((c) => (
            <div key={c.id} className="border border-[#334155] rounded-lg p-3 space-y-2">
              <p className="text-xs font-mono text-[#94A3B8]">{c.method} {c.endpoint}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0F172A] p-2 rounded">
                  <p className="font-bold text-[#0EA5E9] mb-1">Local</p>
                  <pre className="whitespace-pre-wrap break-all text-[#94A3B8]">{JSON.stringify(c.local, null, 2)}</pre>
                </div>
                <div className="bg-[#0F172A] p-2 rounded">
                  <p className="font-bold text-[#F59E0B] mb-1">Server</p>
                  <pre className="whitespace-pre-wrap break-all text-[#94A3B8]">{JSON.stringify(c.server, null, 2)}</pre>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => resolve(c.id, "local")}>Keep local</Button>
                <Button size="sm" variant="outline" onClick={() => resolve(c.id, "server")}>Keep server</Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
