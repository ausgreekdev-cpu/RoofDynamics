"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />,
  error: <AlertTriangle className="w-5 h-5 text-[#EF4444]" />,
  warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
  info: <Info className="w-5 h-5 text-[#0EA5E9]" />,
};

const bgColors: Record<ToastType, string> = {
  success: "bg-[#10B981]/10 border-[#10B981]/30",
  error: "bg-[#EF4444]/10 border-[#EF4444]/30",
  warning: "bg-[#F59E0B]/10 border-[#F59E0B]/30",
  info: "bg-[#0EA5E9]/10 border-[#0EA5E9]/30",
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${bgColors[toast.type]} backdrop-blur-sm shadow-xl animate-slide-in`}
        >
          {icons[toast.type]}
          <p className="text-sm text-[#F8FAFC] flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-[#64748B] hover:text-[#F8FAFC] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
