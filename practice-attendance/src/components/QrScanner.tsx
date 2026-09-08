"use client";

import { useState } from "react";
import { Camera, AlertCircle } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QrScannerProps {
  onScan: (qrToken: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (hasScanned || !detectedCodes || detectedCodes.length === 0) return;
    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;

    // Extract qrToken from a URL like https://app.com/attend/[token] or /attend/[token]
    const match = rawValue.match(/\/attend\/([^/?#]+)/);
    const token = match ? match[1] : rawValue.trim();

    setHasScanned(true);
    onScan(token);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 text-slate-300">
        <Camera size={18} className="text-emerald-400" />
        <span className="text-sm font-medium">Point camera at practice QR code</span>
      </div>

      {error ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="w-full rounded-2xl overflow-hidden bg-black aspect-square relative border border-white/10 shadow-inner">
          <Scanner
            onScan={handleScan}
            onError={(err) => {
              console.warn("Scanner error:", err);
              setError("Camera access is required to scan QR code.");
            }}
            styles={{
              container: { width: "100%", height: "100%" },
              video: { width: "100%", height: "100%", objectFit: "cover" },
            }}
          />
        </div>
      )}

      {!error && (
        <p className="text-center text-xs text-slate-500">
          Make sure the QR code is centered and well-lit
        </p>
      )}
    </div>
  );
}
