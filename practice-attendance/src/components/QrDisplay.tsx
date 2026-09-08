"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface QrDisplayProps {
  url: string;
  sessionDate: string;
  isActive: boolean;
}

export function QrDisplay({ url, sessionDate, isActive }: QrDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenCanvas, setFullscreenCanvas] =
    useState<HTMLCanvasElement | null>(null);

  const generateQR = async (canvas: HTMLCanvasElement, size: number) => {
    await QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 2,
      color: {
        dark: "#0a0f0d",
        light: "#f0fdf4",
      },
      errorCorrectionLevel: "M",
    });
  };

  useEffect(() => {
    if (canvasRef.current) {
      generateQR(canvasRef.current, 280);
    }
  }, [url]);

  const handleFullscreen = async () => {
    setIsFullscreen(true);
    setTimeout(async () => {
      const canvas = document.getElementById(
        "fullscreen-qr-canvas"
      ) as HTMLCanvasElement | null;
      if (canvas) {
        await generateQR(canvas, 520);
        setFullscreenCanvas(canvas);
      }
    }, 50);
  };

  return (
    <>
      <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-slate-300">
          <QrCode size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">QR Code</span>
          {isActive ? (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Expired
            </span>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-[#f0fdf4] shadow-inner glow-green-sm">
          <canvas ref={canvasRef} className="block rounded-lg" />
        </div>

        <p className="text-xs text-slate-500 text-center">
          Practice started at{" "}
          <span className="text-slate-300 font-medium">{sessionDate}</span>
        </p>

        <button
          id="fullscreen-qr-btn"
          onClick={handleFullscreen}
          disabled={!isActive}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Maximize2 size={14} />
          Show fullscreen
        </button>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-[#f0fdf4] flex flex-col items-center justify-center gap-6 p-8"
          onClick={() => setIsFullscreen(false)}
        >
          <p className="text-[#0a0f0d] text-lg font-bold text-center">
            Scan to check in — {sessionDate}
          </p>
          <canvas
            id="fullscreen-qr-canvas"
            className="block rounded-2xl shadow-2xl"
          />
          <p className="text-[#1a2a1e] text-sm opacity-60">
            Tap anywhere to close
          </p>
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0a0f0d]/10 text-[#0a0f0d]"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
          >
            <Minimize2 size={20} />
          </button>
        </div>
      )}
    </>
  );
}
