import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  let allUsers;
  if (search) {
    allUsers = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      )
      .orderBy(desc(users.createdAt));
  } else {
    allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  return NextResponse.json({ users: allUsers });
}
