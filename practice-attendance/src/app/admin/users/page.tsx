import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { UsersClient } from "./UsersClient";
import { db } from "@/db";
import { users, attendances, practiceSessions } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Users — Practice Attendance",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  // Total practice sessions conducted
  const [totalSessionsResult] = await db
    .select({ count: count() })
    .from(practiceSessions);
  const totalPracticeSessions = Number(totalSessionsResult?.count ?? 0);

  // Users with their individual attended sessions count
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      branch: users.branch,
      role: users.role,
      createdAt: users.createdAt,
      attendedCount: count(attendances.id),
    })
    .from(users)
    .leftJoin(attendances, eq(users.id, attendances.userId))
    .groupBy(
      users.id,
      users.name,
      users.email,
      users.branch,
      users.role,
      users.createdAt
    )
    .orderBy(desc(users.createdAt));

  const serializedUsers = allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    attendedCount: Number(u.attendedCount),
  }));

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <UsersClient
          initialUsers={serializedUsers}
          currentUserId={session.user.id}
          totalSessions={totalPracticeSessions}
        />
      </main>
    </>
  );
}
