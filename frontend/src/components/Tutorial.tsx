"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTutorial } from "../contexts/TutorialContext";
import { Button } from "./ui/button";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Rect { top: number; left: number; width: number; height: number }

export function Tutorial() {
  const { isActive, step, stepIndex, next, back, skip, finish } = useTutorial();
  const [rect, setRect] = useState<Rect | null>(null);
  const navigate = useNavigate();

  // Navigate to the step's route, then locate and highlight its target.
  useEffect(() => {
    if (!isActive || !step) return;
    if (window.location.pathname !== step.route) {
      navigate(step.route);
    }
    // Allow the lazy route to render before measuring.
    const findTarget = () => {
      if (!step.target) { setRect(null); return; }
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    };
    const t = setTimeout(findTarget, 450);
    window.addEventListener("resize", findTarget);
    return () => { clearTimeout(t); window.removeEventListener("resize", findTarget); };
  }, [isActive, step, navigate]);

  if (!isActive || !step) return null;

  const pad = 6;
  const spotlight = rect
    ? {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Position the card below the target, or centre if no target.
  const cardTop = spotlight
    ? Math.min(spotlight.top + spotlight.height + 16, window.innerHeight - 220)
    : Math.max(80, window.innerHeight / 2 - 120);
  const cardLeft = spotlight
    ? Math.min(Math.max(16, spotlight.left), window.innerWidth - 380)
    : Math.max(16, window.innerWidth / 2 - 180);

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Guided tutorial">
      {/* Dimming overlay with a cut-out spotlight */}
      <div className="absolute inset-0 bg-black/70" onClick={skip} />
      {spotlight && (
        <div
          className="absolute pointer-events-none rounded-lg ring-2 ring-[#0EA5E9] shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
          style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        />
      )}

      {/* Tutorial card */}
      <div
        className="absolute w-[340px] bg-[#1E293B] border border-[#0EA5E9]/50 rounded-xl p-5 shadow-2xl"
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#0EA5E9] font-bold">
              Step {stepIndex + 1} of 8
            </p>
            <h3 className="text-lg font-bold text-[#F8FAFC] mt-1">{step.title}</h3>
          </div>
          <button onClick={skip} aria-label="Close tutorial" className="text-[#94A3B8] hover:text-[#F8FAFC]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#94A3B8] mb-5">{step.body}</p>

        {/* Progress dots */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-[#0EA5E9]" : "bg-[#334155]"}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={back} disabled={stepIndex === 0}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <button onClick={skip} className="ml-auto text-xs text-[#64748B] hover:text-[#F8FAFC]">
            Skip tour
          </button>
          <Button size="sm" onClick={stepIndex === 7 ? finish : next}>
            {stepIndex === 7 ? <><Check className="w-3.5 h-3.5" /> Done</> : <><ArrowRight className="w-3.5 h-3.5" /> Next</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
