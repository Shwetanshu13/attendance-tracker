"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/Modal";
import { Camera, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const QrScanner = dynamic(
  () => import("@/components/QrScanner").then((m) => m.QrScanner),
  { ssr: false }
);

type CheckInResult = {
  success?: boolean;
  error?: string;
  message?: string;
  minutesLate?: number;
  isLate?: boolean;
};

export function DashboardClient() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (qrToken: string) => {
    setScannerOpen(false);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyCheckedIn = result?.error === "Already checked in";
  const isExpired = result?.error === "QR expired";

  return (
    <div className="space-y-3">
      <button
        id="scan-qr-btn"
        onClick={() => {
          setResult(null);
          setScannerOpen(true);
        }}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold text-base transition-all duration-150 glow-green disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Camera size={20} />
        )}
        {loading ? "Checking in…" : "Scan QR to Check In"}
      </button>

      {/* Result display */}
      {result && (
        <div
          className={`rounded-2xl p-4 flex items-start gap-3 border text-sm ${
            result.success
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
              : isAlreadyCheckedIn
              ? "bg-sky-500/10 border-sky-500/25 text-sky-300"
              : "bg-red-500/10 border-red-500/25 text-red-300"
          }`}
        >
          {result.success ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          ) : isAlreadyCheckedIn ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-sky-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
          )}
          <div>
            <p className="font-semibold">{result.message ?? result.error}</p>
            {result.success && result.minutesLate !== undefined && (
              <p className="text-xs mt-1 opacity-70">
                {result.isLate
                  ? `${result.minutesLate} minutes after start`
                  : "Within grace period"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scanner modal */}
      <Modal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Scan QR Code"
      >
        <QrScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      </Modal>
    </div>
  );
}
