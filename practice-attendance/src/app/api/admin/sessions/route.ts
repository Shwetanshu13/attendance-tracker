import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { practiceSessions, attendances, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { differenceInMinutes } from "date-fns";

const GRACE_PERIOD_MINUTES = parseInt(
  process.env.GRACE_PERIOD_MINUTES ?? "5",
  10
);

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await db
    .select({
      id: practiceSessions.id,
      startTime: practiceSessions.startTime,
      qrToken: practiceSessions.qrToken,
      isActive: practiceSessions.isActive,
      createdBy: practiceSessions.createdBy,
      createdAt: practiceSessions.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(practiceSessions)
    .leftJoin(users, eq(practiceSessions.createdBy, users.id))
    .orderBy(desc(practiceSessions.startTime));

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { startTime } = body as { startTime?: string };

  const parsedStartTime = startTime ? new Date(startTime) : new Date();
  const qrToken = crypto.randomUUID();

  // 1. Create the practice session
  const [newSession] = await db
    .insert(practiceSessions)
    .values({
      startTime: parsedStartTime,
      qrToken,
      isActive: true,
      createdBy: session.user.id,
    })
    .returning();

  // 2. Automatically log attendance for the admin (captain / vice-captain) who generated the QR
  const now = new Date();
  const rawMinutes = differenceInMinutes(now, parsedStartTime);
  const minutesLate = Math.max(0, rawMinutes);
  const isLate = minutesLate > GRACE_PERIOD_MINUTES;

  const [adminAttendance] = await db
    .insert(attendances)
    .values({
      userId: session.user.id,
      sessionId: newSession.id,
      scannedAt: now,
      minutesLate,
      isLate,
    })
    .returning();

  return NextResponse.json(
    {
      session: {
        ...newSession,
        creatorName: session.user.name ?? "Admin",
        creatorEmail: session.user.email,
      },
      adminAttendance,
    },
    { status: 201 }
  );
}
