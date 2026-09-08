import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { attendances, practiceSessions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { DashboardClient } from "./DashboardClient";
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Shield,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Practice Attendance",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  // Fetch own attendance history
  const history = await db
    .select({
      id: attendances.id,
      scannedAt: attendances.scannedAt,
      minutesLate: attendances.minutesLate,
      isLate: attendances.isLate,
      sessionStartTime: practiceSessions.startTime,
    })
    .from(attendances)
    .innerJoin(practiceSessions, eq(attendances.sessionId, practiceSessions.id))
    .where(eq(attendances.userId, session.user.id))
    .orderBy(desc(practiceSessions.startTime))
    .limit(20);

  const last10 = history.slice(0, 10);
  const lateInLast10 = last10.filter((r) => r.isLate).length;
  const onTimeInLast10 = last10.length - lateInLast10;

  // Get user profile for branch
  const [userProfile] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  // Admin: total session count
  let totalSessions = 0;
  let totalAttendance = 0;
  if (isAdmin) {
    const [sessCount] = await db
      .select({ count: practiceSessions.id })
      .from(practiceSessions);
    const [attCount] = await db
      .select({ count: attendances.id })
      .from(attendances);
    totalSessions = Number((sessCount as any)?.count ?? 0);
    totalAttendance = Number((attCount as any)?.count ?? 0);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Hey,{" "}
            <span className="text-gradient">
              {session.user.name?.split(" ")[0] ?? "Player"} 👋
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {userProfile?.branch
              ? `${userProfile.branch} • `
              : ""}
            {isAdmin ? "Admin Dashboard" : "Your attendance overview"}
          </p>
        </div>

        {/* Admin quick links */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin"
              className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <Calendar size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">
                  Manage Sessions
                </p>
                <p className="text-slate-500 text-xs">Generate QR codes</p>
              </div>
            </Link>
            <Link
              href="/admin/attendance"
              className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-500/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                <BarChart3 size={18} className="text-sky-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">
                  Attendance Log
                </p>
                <p className="text-slate-500 text-xs">View all records</p>
              </div>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Sessions Attended"
            value={history.length}
            icon={<CheckCircle2 size={18} />}
            accent="green"
          />
          <StatCard
            label="Late (last 10)"
            value={lateInLast10}
            icon={<Clock size={18} />}
            accent={lateInLast10 > 3 ? "amber" : "green"}
          />
          <StatCard
            label="On Time (last 10)"
            value={onTimeInLast10}
            icon={<TrendingUp size={18} />}
            accent="green"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* Scan QR button */}
        <DashboardClient />

        {/* Attendance history */}
        <section>
          <h2 className="text-base font-semibold text-slate-200 mb-3">
            Recent Attendance
          </h2>
          {history.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-500 text-sm">
              No attendance records yet. Scan a QR code at your next practice!
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Session
                      </th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Scanned at
                      </th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        Min Late
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, i) => (
                      <tr
                        key={row.id}
                        className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-200 font-medium">
                          {format(
                            new Date(row.sessionStartTime),
                            "dd MMM yyyy"
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {format(new Date(row.scannedAt), "h:mm a")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.isLate ? "late" : "on-time"}>
                            {row.isLate ? "Late" : "On time"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              row.minutesLate > 0
                                ? "text-amber-400 font-medium"
                                : "text-slate-500"
                            }
                          >
                            {row.minutesLate > 0 ? `+${row.minutesLate}` : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
