import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { practiceSessions, attendances } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { differenceInMinutes } from "date-fns";

const GRACE_PERIOD_MINUTES = parseInt(
  process.env.GRACE_PERIOD_MINUTES ?? "5",
  10
);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { qrToken } = body as { qrToken?: string };

  if (!qrToken) {
    return NextResponse.json({ error: "qrToken is required" }, { status: 400 });
  }

  // Find the session
  const [practiceSession] = await db
    .select()
    .from(practiceSessions)
    .where(eq(practiceSessions.qrToken, qrToken))
    .limit(1);

  if (!practiceSession) {
    return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  }

  if (!practiceSession.isActive) {
    return NextResponse.json(
      { error: "QR expired", message: "This QR code has expired." },
      { status: 409 }
    );
  }

  // Check for duplicate scan
  const [existing] = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.userId, session.user.id),
        eq(attendances.sessionId, practiceSession.id)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      {
        error: "Already checked in",
        message: "You have already checked in for this session.",
        minutesLate: existing.minutesLate,
        isLate: existing.isLate,
        scannedAt: existing.scannedAt,
      },
      { status: 409 }
    );
  }

  // Compute lateness server-side
  const now = new Date();
  const rawMinutes = differenceInMinutes(now, practiceSession.startTime);
  const minutesLate = Math.max(0, rawMinutes);
  const isLate = minutesLate > GRACE_PERIOD_MINUTES;

  // Insert attendance record
  const [attendance] = await db
    .insert(attendances)
    .values({
      userId: session.user.id,
      sessionId: practiceSession.id,
      scannedAt: now,
      minutesLate,
      isLate,
    })
    .returning();

  const message = isLate
    ? `Checked in — ${minutesLate} min late`
    : "Checked in — on time ✓";

  return NextResponse.json({
    success: true,
    message,
    minutesLate,
    isLate,
    scannedAt: attendance.scannedAt,
  });
}
