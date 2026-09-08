import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances, users, practiceSessions } from "@/db/schema";
import { eq, gte, lte, and, desc, sql, count } from "drizzle-orm";
import { differenceInMinutes } from "date-fns";

const GRACE_PERIOD_MINUTES = parseInt(
  process.env.GRACE_PERIOD_MINUTES ?? "5",
  10,
);

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

  // Count total practice sessions in the filtered window
  const [totalSessionsResult] = await db
    .select({ count: count() })
    .from(practiceSessions)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined);
  const totalPracticeSessions = Number(totalSessionsResult?.count ?? 0);

  if (view === "lateness") {
    // Per-user regularity and lateness aggregates
    const rows = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        branch: users.branch,
        attendedSessions: count(attendances.id),
        totalPracticeSessions: sql<number>`${totalPracticeSessions}`,
        lateCount: sql<number>`cast(coalesce(sum(case when ${attendances.isLate} then 1 else 0 end), 0) as int)`,
        avgMinutesLate: sql<number>`round(coalesce(avg(${attendances.minutesLate}), 0)::numeric, 1)`,
      })
      .from(attendances)
      .innerJoin(users, eq(attendances.userId, users.id))
      .innerJoin(
        practiceSessions,
        eq(attendances.sessionId, practiceSessions.id),
      )
      .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
      .groupBy(users.id, users.name, users.email, users.branch)
      .orderBy(
        desc(count(attendances.id)),
        sql`cast(sum(case when ${attendances.isLate} then 1 else 0 end) as int) DESC`,
      );

    return NextResponse.json({ rows, totalPracticeSessions });
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
    .innerJoin(practiceSessions, eq(attendances.sessionId, practiceSessions.id))
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .orderBy(desc(practiceSessions.startTime));

  return NextResponse.json({ rows, totalPracticeSessions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    userId?: string;
    sessionId?: string;
    attendanceId?: string;
    scannedAt?: string;
  };

  if (!body.userId || !body.sessionId) {
    return NextResponse.json(
      { error: "userId and sessionId are required" },
      { status: 400 },
    );
  }

  const [targetUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, body.userId))
    .limit(1);
  const [targetSession] = await db
    .select({ id: practiceSessions.id, startTime: practiceSessions.startTime })
    .from(practiceSessions)
    .where(eq(practiceSessions.id, body.sessionId))
    .limit(1);

  if (!targetUser || !targetSession) {
    return NextResponse.json(
      { error: "User or session not found" },
      { status: 404 },
    );
  }

  const scannedAt = body.scannedAt ? new Date(body.scannedAt) : new Date();
  if (Number.isNaN(scannedAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid check-in time" },
      { status: 400 },
    );
  }

  const minutesLate = Math.max(
    0,
    differenceInMinutes(scannedAt, targetSession.startTime),
  );
  const isLate = minutesLate > GRACE_PERIOD_MINUTES;

  if (body.attendanceId) {
    const [conflictingAttendance] = await db
      .select({ id: attendances.id })
      .from(attendances)
      .where(
        and(
          eq(attendances.userId, body.userId),
          eq(attendances.sessionId, body.sessionId),
        ),
      )
      .limit(1);

    if (
      conflictingAttendance &&
      conflictingAttendance.id !== body.attendanceId
    ) {
      return NextResponse.json(
        { error: "This user already has attendance for the selected session" },
        { status: 409 },
      );
    }

    const [updated] = await db
      .update(attendances)
      .set({
        userId: body.userId,
        sessionId: body.sessionId,
        scannedAt,
        minutesLate,
        isLate,
      })
      .where(eq(attendances.id, body.attendanceId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ attendance: updated });
  }

  const [existing] = await db
    .select({ id: attendances.id })
    .from(attendances)
    .where(
      and(
        eq(attendances.userId, body.userId),
        eq(attendances.sessionId, body.sessionId),
      ),
    )
    .limit(1);

  const [attendance] = existing
    ? await db
        .update(attendances)
        .set({ scannedAt, minutesLate, isLate })
        .where(eq(attendances.id, existing.id))
        .returning()
    : await db
        .insert(attendances)
        .values({
          userId: body.userId,
          sessionId: body.sessionId,
          scannedAt,
          minutesLate,
          isLate,
        })
        .returning();

  return NextResponse.json({ attendance }, { status: existing ? 200 : 201 });
}
