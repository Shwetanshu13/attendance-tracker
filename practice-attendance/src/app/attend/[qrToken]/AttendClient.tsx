"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface CheckinResponse {
  success?: boolean;
  message?: string;
  minutesLate?: number;
  isLate?: boolean;
  scannedAt?: string;
  error?: string;
}

interface AttendClientProps {
  qrToken: string;
  userName: string;
  creatorName?: string | null;
}

export function AttendClient({
  qrToken,
  userName,
  creatorName,
}: AttendClientProps) {
  const [status, setStatus] = useState<
    "loading" | "success" | "already" | "expired" | "invalid" | "error"
  >("loading");
  const [result, setResult] = useState<CheckinResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function performCheckin() {
      try {
        const res = await fetch("/api/attendance/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrToken }),
        });

        const data: CheckinResponse = await res.json();
        if (!isMounted) return;

        setResult(data);

        if (res.ok && data.success) {
          setStatus("success");
        } else if (res.status === 409) {
          if (data.error === "Already checked in") {
            setStatus("already");
          } else {
            setStatus("expired");
          }
        } else if (res.status === 404) {
          setStatus("invalid");
        } else {
          setStatus("error");
        }
      } catch {
        if (isMounted) setStatus("error");
      }
    }

    performCheckin();

    return () => {
      isMounted = false;
    };
  }, [qrToken]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {status === "loading" && (
          <div className="glass rounded-3xl p-8 text-center space-y-5 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <RefreshCw className="text-emerald-400 animate-spin" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                Checking You In…
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Validating QR token and logging your attendance
              </p>
            </div>
            <div className="h-1.5 w-32 bg-emerald-500/30 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && result && (
          <div className="glass rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {result.isLate ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 glow-amber-sm">
                  <Clock size={32} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Late Arrival (+{result.minutesLate} min)
                  </span>
                  <h2 className="text-2xl font-bold text-slate-100 pt-2">
                    Checked In, {userName.split(" ")[0]}!
                  </h2>
                  <p className="text-sm text-slate-400">
                    Your attendance has been recorded. Lace up and get to the
                    field quickly!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-pitch-900/80 border border-white/8 text-left space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in Time:</span>
                    <span className="font-medium text-slate-200">
                      {result.scannedAt
                        ? format(new Date(result.scannedAt), "h:mm:ss a, dd MMM")
                        : "Just now"}
                    </span>
                  </div>
                  {creatorName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Session Captain:</span>
                      <span className="font-medium text-slate-200">{creatorName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lateness Delay:</span>
                    <span className="font-semibold text-amber-400">
                      +{result.minutesLate} minutes late
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 glow-green-sm">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    On Time ✓
                  </span>
                  <h2 className="text-2xl font-bold text-slate-100 pt-2">
                    Checked In, {userName.split(" ")[0]}!
                  </h2>
                  <p className="text-sm text-slate-400">
                    You arrived right on time for football practice. Have a great
                    session!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-pitch-900/80 border border-white/8 text-left space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in Time:</span>
                    <span className="font-medium text-emerald-400">
                      {result.scannedAt
                        ? format(new Date(result.scannedAt), "h:mm:ss a, dd MMM")
                        : "Just now"}
                    </span>
                  </div>
                  {creatorName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Session Captain:</span>
                      <span className="font-medium text-slate-200">{creatorName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-emerald-400">
                      On Time
                    </span>
                  </div>
                </div>
              </>
            )}

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all shadow-lg glow-green-sm"
            >
              Continue to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Already Checked In State */}
        {status === "already" && (
          <div className="glass rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Already Checked In
              </span>
              <h2 className="text-2xl font-bold text-slate-100 pt-2">
                You’re All Set!
              </h2>
              <p className="text-sm text-slate-400">
                You have already logged your attendance for this practice session.
              </p>
            </div>

            {result?.scannedAt && (
              <div className="p-4 rounded-2xl bg-pitch-900/80 border border-white/8 text-left space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Previously Recorded:</span>
                  <span className="font-medium text-slate-200">
                    {format(new Date(result.scannedAt), "h:mm:ss a, dd MMM")}
                  </span>
                </div>
                {creatorName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session Captain:</span>
                    <span className="font-medium text-slate-200">{creatorName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span
                    className={
                      result.isLate
                        ? "font-semibold text-amber-400"
                        : "font-semibold text-emerald-400"
                    }
                  >
                    {result.isLate
                      ? `Late (+${result.minutesLate}m)`
                      : "On Time ✓"}
                  </span>
                </div>
              </div>
            )}

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-pitch-800 hover:bg-pitch-700 border border-white/10 text-slate-100 font-semibold text-sm transition-all"
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Expired State */}
        {status === "expired" && (
          <div className="glass rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Clock size={32} />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                QR Code Expired
              </span>
              <h2 className="text-2xl font-bold text-slate-100 pt-2">
                Session Closed
              </h2>
              <p className="text-sm text-slate-400">
                This QR code has already been expired by the coach/admin. Check-in
                is no longer open for this practice session.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-pitch-800 hover:bg-pitch-700 border border-white/10 text-slate-100 font-semibold text-sm transition-all"
            >
              Return to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Invalid QR State */}
        {status === "invalid" && (
          <div className="glass rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                Invalid Code
              </span>
              <h2 className="text-2xl font-bold text-slate-100 pt-2">
                QR Not Recognized
              </h2>
              <p className="text-sm text-slate-400">
                This QR code does not correspond to any registered practice
                session. Please scan the current session code provided by the
                coach.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-pitch-800 hover:bg-pitch-700 border border-white/10 text-slate-100 font-semibold text-sm transition-all"
            >
              Return to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Generic Error */}
        {status === "error" && (
          <div className="glass rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-100">
                Check-in Error
              </h2>
              <p className="text-sm text-slate-400">
                {result?.message ||
                  result?.error ||
                  "An unexpected error occurred while processing your check-in."}
              </p>
            </div>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-pitch-800 hover:bg-pitch-700 border border-white/10 text-slate-100 font-semibold text-sm transition-all"
            >
              Return to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
