"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface InspectionCountdownProps {
  dueDate?: string;
  compact?: boolean;
}

function timeRemaining(dueDate: string) {
  const diff = new Date(dueDate).getTime() - Date.now();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((abs % (1000 * 60)) / 1000);
  return { overdue: diff < 0, days, hours, minutes, seconds };
}

export function InspectionCountdown({ dueDate, compact }: InspectionCountdownProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!dueDate) {
    return <span className="text-xs text-[#64748B]">No due date</span>;
  }

  const t = timeRemaining(dueDate);
  const urgent = !t.overdue && t.days <= 30;

  if (compact) {
    return (
      <span className={`text-xs font-bold ${t.overdue ? "text-[#EF4444]" : urgent ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
        {t.overdue ? `OVERDUE ${t.days}d` : `${t.days}d remaining`}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded ${t.overdue ? "bg-[#EF4444]/10" : urgent ? "bg-[#F59E0B]/10" : "bg-[#10B981]/10"}`}>
      {t.overdue ? <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" /> : urgent ? <Clock className="w-3.5 h-3.5 text-[#F59E0B]" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
      <span className={`text-xs font-mono font-bold ${t.overdue ? "text-[#EF4444]" : urgent ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
        {t.overdue ? "-" : ""}{t.days}d {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:{String(t.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
