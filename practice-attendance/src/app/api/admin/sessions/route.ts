import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { practiceSessions } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await db
    .select()
    .from(practiceSessions)
    .orderBy(desc(practiceSessions.startTime));

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { startTime } = body as { startTime?: string };

  const parsedStartTime = startTime ? new Date(startTime) : new Date();

  const qrToken = crypto.randomUUID();

  const [newSession] = await db
    .insert(practiceSessions)
    .values({
      startTime: parsedStartTime,
      qrToken,
      isActive: true,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json({ session: newSession }, { status: 201 });
}
