import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { UsersClient } from "./UsersClient";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Users — Practice Attendance",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      branch: users.branch,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const serializedUsers = allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <UsersClient
          initialUsers={serializedUsers}
          currentUserId={session.user.id}
        />
      </main>
    </>
  );
}
