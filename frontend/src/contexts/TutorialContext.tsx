"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface TutorialStep {
  /** Route to navigate to before showing this step. */
  route: string;
  /** DOM selector of the element to highlight (optional). */
  target?: string;
  title: string;
  body: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    route: "/dashboard",
    target: '[data-tour="sidebar"]',
    title: "Welcome to RoofDynamics",
    body: "This is your roofing ERP command centre. The sidebar holds every module — we'll walk through the key ones.",
  },
  {
    route: "/dashboard",
    target: '[data-tour="run-all"]',
    title: "One-Man Empire Autopilot",
    body: "Run all four autonomous agents at once: procurement RFQs, WHS watchdog, OCR bill matching and social/SEO posts.",
  },
  {
    route: "/crm",
    target: '[data-tour="new-quote"]',
    title: "CRM & Interactive BOM Estimator",
    body: "Create quotes with the exact WA roof math — pitch factor, sheet cut lengths, battens, insulation and coastal/bushfire upgrades.",
  },
  {
    route: "/wms",
    target: '[data-tour="stock-table"]',
    title: "Warehouse & Van Inventory",
    body: "Track stock across Welshpool Yard, Hilux Ute 1 and Isuzu Truck 2. Live MRP shortage alerts and supplier RFQs live here.",
  },
  {
    route: "/pipeline",
    target: '[data-tour="pipeline-board"]',
    title: "CRM Pipeline & E-Sign",
    body: "Drag deals through stages, see the weighted forecast, and e-sign an offer to mark a job won.",
  },
  {
    route: "/measurement",
    target: '[data-tour="measurement-canvas"]',
    title: "Aerial Measurement",
    body: "Draw roof planes on the 2D canvas, then inspect them in the 3D viewer. Areas use pitch and waste factors automatically.",
  },
  {
    route: "/reports-studio",
    target: '[data-tour="report-preview"]',
    title: "Report Studio",
    body: "Preview branded PDFs live and export to Xactimate .ESX. Your white-label branding is applied automatically.",
  },
  {
    route: "/compliance",
    target: '[data-tour="compliance"]',
    title: "WA Statutory Compliance",
    body: "Track Security of Payment claims with a 15-business-day countdown and BA1/BA2 building permits.",
  },
];

interface TutorialState {
  isActive: boolean;
  stepIndex: number;
  step: TutorialStep | null;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  hasCompleted: boolean;
}

const TutorialContext = createContext<TutorialState | undefined>(undefined);
const STORAGE_KEY = "rd_tutorial_completed";

export function TutorialProvider({ children }: { children: ReactNode }) {
  // React to the auth transition (login happens *after* this provider mounts on
  // the login screen), so the first-login tour auto-starts reliably.
  const { isAuthenticated } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  // Auto-start on first authenticated session (non-blocking, after paint).
  useEffect(() => {
    if (!hasCompleted && isAuthenticated) {
      const timer = setTimeout(() => setIsActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hasCompleted, isAuthenticated]);

  const start = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= TUTORIAL_STEPS.length - 1) {
      complete();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, complete]);

  const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
  const skip = useCallback(() => {
    complete();
  }, [complete]);

  return (
    <TutorialContext.Provider value={{
      isActive,
      stepIndex,
      step: TUTORIAL_STEPS[stepIndex] || null,
      start,
      next,
      back,
      skip,
      finish: complete,
      hasCompleted,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}
