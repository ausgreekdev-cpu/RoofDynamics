"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from "lucide-react";
import { offlineSync, type SyncStatus } from "../services/offlineSync";

export function OfflineIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    isSyncing: false,
    lastSyncAt: null,
  });

  useEffect(() => {
    const unsubscribe = offlineSync.onStatusChange((s) => {
      setStatus(s);
    });
    return unsubscribe;
  }, []);

  const handleSync = () => {
    offlineSync.syncPendingWrites();
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {status.isOnline ? (
        <div className="flex items-center gap-1 text-[#10B981]">
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[#EF4444]">
          <WifiOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Offline</span>
        </div>
      )}

      {status.pendingCount > 0 && (
        <div className="flex items-center gap-1 text-[#F59E0B]">
          <CloudOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{status.pendingCount} pending</span>
        </div>
      )}

      {status.isSyncing && (
        <div className="flex items-center gap-1 text-[#0EA5E9]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">Syncing...</span>
        </div>
      )}

      {!status.isOnline && status.pendingCount > 0 && (
        <button
          onClick={handleSync}
          className="px-2 py-1 bg-[#1E293B] border border-[#334155] text-[#94A3B8] rounded text-xs hover:text-[#F8FAFC] transition"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}
