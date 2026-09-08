import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AttendanceClient } from "./AttendanceClient";
import { db } from "@/db";
import { attendances, users, practiceSessions } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance Logs — Practice Attendance",
};

export default async function AdminAttendancePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const [totalSessionsResult] = await db
    .select({ count: count() })
    .from(practiceSessions);
  const totalPracticeSessions = Number(totalSessionsResult?.count ?? 0);

  const initialRows = await db
    .select({
      id: attendances.id,
      scannedAt: attendances.scannedAt,
      minutesLate: attendances.minutesLate,
      isLate: attendances.isLate,
      userName: users.name,
      userEmail: users.email,
      userBranch: users.branch,
      sessionId: practiceSessions.id,
      sessionStartTime: practiceSessions.startTime,
      sessionIsActive: practiceSessions.isActive,
    })
    .from(attendances)
    .innerJoin(users, eq(attendances.userId, users.id))
    .innerJoin(practiceSessions, eq(attendances.sessionId, practiceSessions.id))
    .orderBy(desc(practiceSessions.startTime))
    .limit(100);

  const serializedRows = initialRows.map((r) => ({
    ...r,
    scannedAt: r.scannedAt.toISOString(),
    sessionStartTime: r.sessionStartTime.toISOString(),
  }));

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AttendanceClient
          initialRecords={serializedRows}
          initialTotalSessions={totalPracticeSessions}
        />
      </main>
    </>
  );
}
