"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import {
  User,
  Mail,
  Building2,
  Shield,
  Calendar,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const BRANCHES = [
  "CSE",
  "EE",
  "ECE",
  "ME",
  "CE",
  "Aero",
  "VLSI",
  "AI/DS",
] as const;

interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  branch: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
}

interface ProfileStats {
  totalAttended: number;
  lateInLast10: number;
  totalLate: number;
}

interface ProfileClientProps {
  user: ProfileUser;
  stats: ProfileStats;
}

export function ProfileClient({ user, stats }: ProfileClientProps) {
  const router = useRouter();
  const { update } = useSession();

  const [name, setName] = useState(user.name || "");
  const [branch, setBranch] = useState(user.branch || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onTimePercentage =
    stats.totalAttended > 0
      ? Math.round(
          ((stats.totalAttended - stats.totalLate) / stats.totalAttended) * 100
        )
      : 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          branch: branch || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Trigger session refresh so Navbar updates name
      await update();
      setSuccessMsg("Profile updated successfully!");
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Player Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal details and academic department
        </p>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total Practices"
          value={stats.totalAttended}
          icon={<CheckCircle2 size={18} />}
          accent="green"
        />
        <StatCard
          label="Late (Last 10)"
          value={stats.lateInLast10}
          icon={<Clock size={18} />}
          accent={stats.lateInLast10 > 2 ? "amber" : "green"}
        />
        <StatCard
          label="On-Time Rate"
          value={`${onTimePercentage}%`}
          icon={<CheckCircle2 size={18} />}
          accent="green"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
          <Check size={18} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-white/6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl font-bold text-white shadow-lg glow-green-sm">
            {name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {name || "Player"}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} />
              Member since {format(new Date(user.createdAt), "MMMM yyyy")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Email (Read only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> College Email (Google Account)
              </span>
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-4 py-2.5 rounded-xl bg-pitch-900 border border-white/10 text-slate-400 text-sm cursor-not-allowed opacity-80"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Verified by your institution Google OAuth.
            </p>
          </div>

          {/* Role (Read only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Shield size={14} /> Assigned System Role
              </span>
            </label>
            <div className="flex items-center h-[42px] px-4 rounded-xl bg-pitch-900 border border-white/10">
              <Badge variant={user.role === "ADMIN" ? "admin" : "user"}>
                {user.role === "ADMIN" ? "Coach / Administrator" : "Team Member"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {user.role === "ADMIN"
                ? "Full privileges to create QR sessions and manage team records."
                : "Privileged to check in to practice and view personal history."}
            </p>
          </div>

          {/* Full Name (Editable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <User size={14} /> Full Name / Display Name
              </span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-pitch-900 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Branch (Editable Dropdown) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Building2 size={14} /> Academic Branch / Department
              </span>
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-pitch-900 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              style={{ colorScheme: "dark" }}
            >
              <option value="">-- Select Your Branch --</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-white/6 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-60 glow-green-sm shadow-md"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {isSaving ? "Saving Profile…" : "Save Profile Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
