"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, PenLine } from "lucide-react";

interface SignaturePadProps {
  onChange?: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onChange, width = 400, height = 140 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasInk(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange?.(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border border-[#334155] bg-[#0A192F]">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full h-32 touch-none cursor-crosshair block"
          style={{ touchAction: "none" }}
        />
        {!hasInk && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[#475569]">
            <PenLine className="w-6 h-6 mb-1" />
            <span className="text-xs">Draw your signature here</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] border border-[#334155] rounded-lg transition"
      >
        <Eraser className="w-3.5 h-3.5" /> Clear
      </button>
    </div>
  );
}
