"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  TrendingDown,
  Activity,
} from "lucide-react";
import Link from "next/link";

export interface AttendanceRecord {
  id: string;
  scannedAt: string;
  minutesLate: number;
  isLate: boolean;
  userName: string | null;
  userEmail: string;
  userBranch: string | null;
  sessionId: string;
  sessionStartTime: string;
  sessionIsActive: boolean;
}

export interface RegularityRecord {
  userId: string;
  name: string | null;
  email: string;
  branch: string | null;
  attendedSessions: number;
  totalPracticeSessions: number;
  lateCount: number;
  avgMinutesLate: number;
}

interface AttendanceClientProps {
  initialRecords: AttendanceRecord[];
  initialTotalSessions: number;
}

export function AttendanceClient({
  initialRecords,
  initialTotalSessions,
}: AttendanceClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "late">("all");
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [totalPracticeSessions, setTotalPracticeSessions] = useState(
    initialTotalSessions
  );
  const [regularityRecords, setRegularityRecords] = useState<RegularityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ON_TIME" | "LATE">("ALL");

  // Date filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isRefetching, setIsRefetching] = useState(false);

  // Fetch updated data on date filter change
  const fetchFilteredData = async () => {
    setIsRefetching(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      // Fetch all records
      const resAll = await fetch(`/api/admin/attendance?${params.toString()}`);
      const dataAll = await resAll.json();
      if (dataAll.rows) {
        setRecords(
          dataAll.rows.map((r: any) => ({
            ...r,
            scannedAt: new Date(r.scannedAt).toISOString(),
            sessionStartTime: new Date(r.sessionStartTime).toISOString(),
          }))
        );
      }
      if (dataAll.totalPracticeSessions !== undefined) {
        setTotalPracticeSessions(dataAll.totalPracticeSessions);
      }

      // Fetch regularity & lateness summary
      params.append("view", "lateness");
      const resLate = await fetch(`/api/admin/attendance?${params.toString()}`);
      const dataLate = await resLate.json();
      if (dataLate.rows) {
        setRegularityRecords(dataLate.rows);
      }
      if (dataLate.totalPracticeSessions !== undefined) {
        setTotalPracticeSessions(dataLate.totalPracticeSessions);
      }
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    } finally {
      setIsRefetching(false);
    }
  };

  // Load regularity records on initial mount
  useEffect(() => {
    if (regularityRecords.length === 0) {
      fetchFilteredData();
    }
  }, []);

  // Filtered All Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        search.trim() === "" ||
        (r.userName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        r.userEmail.toLowerCase().includes(search.toLowerCase());

      const matchesBranch =
        branchFilter === "ALL" ||
        (branchFilter === "NONE" ? !r.userBranch : r.userBranch === branchFilter);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ON_TIME" && !r.isLate) ||
        (statusFilter === "LATE" && r.isLate);

      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [records, search, branchFilter, statusFilter]);

  // Filtered Regularity Records
  const filteredRegularity = useMemo(() => {
    return regularityRecords.filter((r) => {
      const matchesSearch =
        search.trim() === "" ||
        (r.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        r.email.toLowerCase().includes(search.toLowerCase());

      const matchesBranch =
        branchFilter === "ALL" ||
        (branchFilter === "NONE" ? !r.branch : r.branch === branchFilter);

      return matchesSearch && matchesBranch;
    });
  }, [regularityRecords, search, branchFilter]);

  // Aggregated Stats
  const totalCount = records.length;
  const lateCount = records.filter((r) => r.isLate).length;
  const onTimeCount = totalCount - lateCount;
  const onTimeRate =
    totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 100;

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === "all") {
      const headers = [
        "Session Date",
        "Player Name",
        "Player Email",
        "Branch",
        "Check-in Time",
        "Status",
        "Minutes Late",
      ];
      const rows = filteredRecords.map((r) => [
        `"${format(new Date(r.sessionStartTime), "yyyy-MM-dd HH:mm")}"`,
        `"${r.userName || "N/A"}"`,
        `"${r.userEmail}"`,
        `"${r.userBranch || "Unassigned"}"`,
        `"${format(new Date(r.scannedAt), "yyyy-MM-dd HH:mm:ss")}"`,
        `"${r.isLate ? "Late" : "On Time"}"`,
        r.minutesLate,
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `attendance_records_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        "Player Name",
        "Player Email",
        "Branch",
        "Sessions Attended",
        "Total Sessions Conducted",
        "Attendance Rate (%)",
        "Times Late",
        "Late Rate (%)",
        "Avg Min Late",
      ];
      const rows = filteredRegularity.map((r) => {
        const total = r.totalPracticeSessions || totalPracticeSessions || 0;
        const regRate = total > 0 ? Math.round((r.attendedSessions / total) * 100) : 0;
        const lateRate =
          r.attendedSessions > 0
            ? Math.round((r.lateCount / r.attendedSessions) * 100)
            : 0;
        return [
          `"${r.name || "N/A"}"`,
          `"${r.email}"`,
          `"${r.branch || "Unassigned"}"`,
          r.attendedSessions,
          total,
          `${regRate}%`,
          r.lateCount,
          `${lateRate}%`,
          r.avgMinutesLate,
        ];
      });
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `regularity_and_lateness_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Sessions
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">
            Attendance Logs & Student Regularity
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Audit practice check-ins, measure attendance rates, and identify chronic tardiness
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pitch-800 hover:bg-pitch-700 border border-white/10 text-slate-200 hover:text-white text-xs font-medium transition-all shadow-sm w-fit"
        >
          <Download size={14} className="text-emerald-400" />
          Export {activeTab === "all" ? "Logs (CSV)" : "Regularity & Lateness (CSV)"}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Check-ins"
          value={totalCount}
          subtitle={`${totalPracticeSessions} practice sessions held`}
          icon={<CheckCircle2 size={18} />}
          accent="green"
        />
        <StatCard
          label="Sessions Held"
          value={totalPracticeSessions}
          subtitle={
            totalPracticeSessions > 0
              ? `${(totalCount / totalPracticeSessions).toFixed(1)} players avg / session`
              : "No sessions"
          }
          icon={<Activity size={18} />}
          accent="blue"
        />
        <StatCard
          label="On-Time Rate"
          value={`${onTimeRate}%`}
          subtitle={`${onTimeCount} on-time check-ins`}
          icon={<TrendingDown size={18} />}
          accent={onTimeRate >= 80 ? "green" : "amber"}
        />
        <StatCard
          label="Late Arrivals"
          value={lateCount}
          subtitle={
            regularityRecords[0] && regularityRecords[0].lateCount > 0
              ? `Top late: ${regularityRecords[0].name?.split(" ")[0] ?? "Player"} (${regularityRecords[0].lateCount}x)`
              : "Zero delays flagged 🎉"
          }
          icon={<Clock size={18} />}
          accent={lateCount > 0 ? "amber" : "green"}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "all"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Practice Check-ins
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("late")}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === "late"
              ? "text-amber-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Regularity & Lateness Analysis
          {regularityRecords.filter((r) => r.lateCount > 1).length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              {regularityRecords.filter((r) => r.lateCount > 1).length} flagged
            </span>
          )}
          {activeTab === "late" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Filter by player name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-pitch-900/90 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Branch Filter */}
          <div className="w-full md:w-40">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-pitch-900/90 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50"
              style={{ colorScheme: "dark" }}
            >
              <option value="ALL">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="EE">EE</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
              <option value="CE">CE</option>
              <option value="Aero">Aero</option>
              <option value="VLSI">VLSI</option>
              <option value="AI/DS">AI/DS</option>
              <option value="NONE">Unassigned</option>
            </select>
          </div>

          {/* Status filter (Only in All Records tab) */}
          {activeTab === "all" && (
            <div className="w-full md:w-36">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | "ON_TIME" | "LATE")
                }
                className="w-full px-3 py-2 rounded-xl bg-pitch-900/90 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50"
                style={{ colorScheme: "dark" }}
              >
                <option value="ALL">All Status</option>
                <option value="ON_TIME">On Time Only</option>
                <option value="LATE">Late Only</option>
              </select>
            </div>
          )}
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/6 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter size={12} /> Practice Date:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-pitch-900 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-pitch-900 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
              style={{ colorScheme: "dark" }}
            />
          </div>

          <button
            onClick={fetchFilteredData}
            disabled={isRefetching}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 font-medium text-xs transition-colors disabled:opacity-50"
          >
            {isRefetching ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Apply Dates
          </button>

          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
                setTimeout(fetchFilteredData, 0);
              }}
              className="text-slate-500 hover:text-slate-300 underline text-xs"
            >
              Reset dates
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: All Records Table */}
      {activeTab === "all" && (
        <section>
          {filteredRecords.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-500 text-sm">
              No attendance records match your current filters.
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6 bg-white/[0.02]">
                      <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Practice Session
                      </th>
                      <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Player
                      </th>
                      <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Lateness
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-white/4 last:border-0 hover:bg-white/[0.025] transition-colors"
                      >
                        <td className="px-5 py-3.5 text-slate-200 font-medium">
                          {format(
                            new Date(r.sessionStartTime),
                            "dd MMM yyyy, h:mm a"
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-100 font-medium leading-none">
                            {r.userName || "Player"}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {r.userEmail}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          {r.userBranch ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {r.userBranch}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">
                          {format(new Date(r.scannedAt), "h:mm:ss a")}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={r.isLate ? "late" : "on-time"}>
                            {r.isLate ? "Late" : "On Time"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium">
                          {r.minutesLate > 0 ? (
                            <span className="text-amber-400">
                              +{r.minutesLate} min
                            </span>
                          ) : (
                            <span className="text-slate-500">0 min</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Regularity & Lateness Analysis Table */}
      {activeTab === "late" && (
        <section>
          {filteredRegularity.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-500 text-sm">
              No attendance data available for the selected criteria.
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6 bg-white/[0.02]">
                      <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Player
                      </th>
                      <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="text-center px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Regularity (Attended / Total)
                      </th>
                      <th className="text-center px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Times Late
                      </th>
                      <th className="text-center px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Punctuality
                      </th>
                      <th className="text-right px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Avg Delay
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegularity.map((row) => {
                      const total =
                        row.totalPracticeSessions || totalPracticeSessions || 0;
                      const regRatio =
                        total > 0
                          ? Math.round((row.attendedSessions / total) * 100)
                          : 0;
                      const lateRatio =
                        row.attendedSessions > 0
                          ? Math.round(
                              (row.lateCount / row.attendedSessions) * 100
                            )
                          : 0;
                      const isHighLate = row.lateCount >= 3 || lateRatio >= 50;

                      return (
                        <tr
                          key={row.userId}
                          className="border-b border-white/4 last:border-0 hover:bg-white/[0.025] transition-colors"
                        >
                          {/* Name */}
                          <td className="px-5 py-3.5">
                            <p className="text-slate-100 font-medium leading-none">
                              {row.name || "Player"}
                            </p>
                            <p className="text-slate-500 text-xs mt-0.5">
                              {row.email}
                            </p>
                          </td>

                          {/* Branch */}
                          <td className="px-5 py-3.5">
                            {row.branch ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                {row.branch}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">—</span>
                            )}
                          </td>

                          {/* Regularity: Sessions Attended / Total */}
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold text-slate-200">
                                {row.attendedSessions} / {total}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-14 h-1.5 rounded-full bg-pitch-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      regRatio >= 75
                                        ? "bg-emerald-400"
                                        : regRatio >= 50
                                        ? "bg-amber-400"
                                        : "bg-red-400"
                                    }`}
                                    style={{ width: `${Math.min(regRatio, 100)}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[11px] font-semibold ${
                                    regRatio >= 75
                                      ? "text-emerald-400"
                                      : regRatio >= 50
                                      ? "text-amber-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {regRatio}%
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Times Late */}
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                row.lateCount === 0
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : isHighLate
                                  ? "bg-red-500/15 text-red-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {row.lateCount}
                            </span>
                          </td>

                          {/* Punctuality percentage */}
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs text-slate-300 font-medium">
                                {100 - lateRatio}% on time
                              </span>
                            </div>
                          </td>

                          {/* Avg delay */}
                          <td className="px-5 py-3.5 text-right font-medium text-slate-300">
                            {row.avgMinutesLate > 0
                              ? `${row.avgMinutesLate} min`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
