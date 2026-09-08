import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances, practiceSessions, users } from "@/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await db
    .select({
      id: attendances.id,
      scannedAt: attendances.scannedAt,
      minutesLate: attendances.minutesLate,
      isLate: attendances.isLate,
      sessionStartTime: practiceSessions.startTime,
      sessionIsActive: practiceSessions.isActive,
    })
    .from(attendances)
    .innerJoin(
      practiceSessions,
      eq(attendances.sessionId, practiceSessions.id)
    )
    .where(eq(attendances.userId, session.user.id))
    .orderBy(desc(practiceSessions.startTime));

  // Summary: count late arrivals in last 10 sessions
  const last10 = history.slice(0, 10);
  const lateInLast10 = last10.filter((r) => r.isLate).length;

  return NextResponse.json({ history, lateInLast10 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, branch } = body as {
    name?: string;
    branch?: string;
  };

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (branch !== undefined) updateData.branch = branch;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, session.user.id))
    .returning();

  return NextResponse.json({ user: updated });
}
