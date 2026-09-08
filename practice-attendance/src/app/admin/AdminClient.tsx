"use client";

import { useState } from "react";
import { format } from "date-fns";
import { QrDisplay } from "@/components/QrDisplay";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  Power,
  Calendar,
  Clock,
  RefreshCw,
  Users,
  BarChart3,
  CheckCircle2,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface Session {
  id: string;
  startTime: string;
  qrToken: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  creatorName?: string | null;
  creatorEmail?: string | null;
}

interface AdminClientProps {
  initialSessions: Session[];
  initialActiveSession: Session | null;
}

export function AdminClient({
  initialSessions,
  initialActiveSession,
}: AdminClientProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeSession, setActiveSession] = useState<Session | null>(
    initialActiveSession
  );
  const [creating, setCreating] = useState(false);
  const [expiring, setExpiring] = useState(false);
  const [startTime, setStartTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const handleCreate = async () => {
    setCreating(true);
    setToastMessage(null);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: new Date(startTime).toISOString() }),
      });
      const data = await res.json();
      if (data.session) {
        const newSession: Session = {
          ...data.session,
          startTime: data.session.startTime,
          createdAt: data.session.createdAt,
          creatorName: data.session.creatorName,
          creatorEmail: data.session.creatorEmail,
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSession(newSession);

        const latenessText = data.adminAttendance?.isLate
          ? `late (+${data.adminAttendance.minutesLate}m)`
          : "On Time ✓";
        setToastMessage(
          `QR Code generated! Your attendance has been automatically logged (${latenessText}).`
        );
        setTimeout(() => setToastMessage(null), 6000);
      }
    } catch {
      alert("Failed to create session. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleExpire = async () => {
    if (!activeSession) return;
    setExpiring(true);
    try {
      await fetch(`/api/admin/sessions/${activeSession.id}`, {
        method: "PATCH",
      });
      const expired = { ...activeSession, isActive: false };
      setActiveSession(null);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? expired : s))
      );
    } catch {
      alert("Failed to expire session.");
    } finally {
      setExpiring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for Admin Attendance */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-slate-100">Session Initialized</p>
            <p className="text-xs text-emerald-300/90 mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/users"
          className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-500/20 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Users size={16} className="text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Manage Users</p>
            <p className="text-xs text-slate-500">Roles & profiles</p>
          </div>
        </Link>
        <Link
          href="/admin/attendance"
          className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-500/20 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <BarChart3 size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Attendance</p>
            <p className="text-xs text-slate-500">Records & lateness</p>
          </div>
        </Link>
      </div>

      {/* Generate QR */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Calendar size={16} className="text-emerald-400" />
          Generate Practice QR Code
        </h2>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Practice Start Time
            </span>
            <input
              id="start-time-input"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!!activeSession}
              className="w-full px-4 py-3 rounded-xl bg-pitch-800 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ colorScheme: "dark" }}
            />
          </label>

          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Crown size={13} className="text-amber-400" />
            <span>
              Generating the QR code automatically logs your attendance as present.
            </span>
          </p>

          {activeSession ? (
            <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-sm text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>
                  Active session: started at{" "}
                  {format(new Date(activeSession.startTime), "h:mm a, dd MMM")}
                </span>
              </div>
              {activeSession.creatorName && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                  By {activeSession.creatorName}
                </span>
              )}
            </div>
          ) : (
            <button
              id="generate-qr-btn"
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-60 glow-green-sm"
            >
              {creating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {creating ? "Generating & Logging Attendance…" : "Generate QR Code"}
            </button>
          )}
        </div>
      </div>

      {/* Active QR display */}
      {activeSession && (
        <div className="space-y-3">
          <QrDisplay
            url={`${baseUrl}/attend/${activeSession.qrToken}`}
            sessionDate={format(
              new Date(activeSession.startTime),
              "h:mm a, EEEE dd MMM"
            )}
            isActive={activeSession.isActive}
            creatorName={activeSession.creatorName}
          />

          <button
            id="expire-qr-btn"
            onClick={handleExpire}
            disabled={expiring}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 font-semibold text-sm transition-all disabled:opacity-60"
          >
            {expiring ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Power size={16} />
            )}
            {expiring ? "Expiring…" : "Expire QR Code"}
          </button>
        </div>
      )}

      {/* Recent sessions list */}
      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-3">
          Recent Sessions
        </h2>
        {sessions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-500 text-sm">
            No sessions yet. Generate your first QR code above.
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                      Generated By
                    </th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {format(new Date(s.startTime), "h:mm a, dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {s.creatorName ? (
                          <div className="flex items-center gap-1.5">
                            <Crown size={13} className="text-amber-400 shrink-0" />
                            <span className="font-medium text-slate-200">
                              {s.creatorName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Admin</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.isActive ? "active" : "expired"}>
                          {s.isActive ? "Active" : "Expired"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {format(new Date(s.createdAt), "dd MMM, h:mm a")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
