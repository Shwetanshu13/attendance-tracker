import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances, users, practiceSessions } from "@/db/schema";
import { eq, gte, lte, and, desc, sql, count, avg } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const view = searchParams.get("view") ?? "all"; // "all" | "lateness"

  const dateFilters = [];
  if (from) dateFilters.push(gte(practiceSessions.startTime, new Date(from)));
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilters.push(lte(practiceSessions.startTime, toDate));
  }

  if (view === "lateness") {
    // Per-user lateness aggregates
    const rows = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        branch: users.branch,
        totalSessions: count(attendances.id),
        lateCount: sql<number>`cast(sum(case when ${attendances.isLate} then 1 else 0 end) as int)`,
        avgMinutesLate: sql<number>`round(avg(${attendances.minutesLate})::numeric, 1)`,
      })
      .from(attendances)
      .innerJoin(users, eq(attendances.userId, users.id))
      .innerJoin(
        practiceSessions,
        eq(attendances.sessionId, practiceSessions.id)
      )
      .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
      .groupBy(users.id, users.name, users.email, users.branch)
      .orderBy(
        sql`cast(sum(case when ${attendances.isLate} then 1 else 0 end) as int) DESC`
      );

    return NextResponse.json({ rows });
  }

  // All attendance records with user + session info
  const rows = await db
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
    .innerJoin(
      practiceSessions,
      eq(attendances.sessionId, practiceSessions.id)
    )
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .orderBy(desc(practiceSessions.startTime));

  return NextResponse.json({ rows });
}
