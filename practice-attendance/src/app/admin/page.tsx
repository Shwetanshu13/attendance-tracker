import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AdminClient } from "./AdminClient";
import { db } from "@/db";
import { practiceSessions, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Practice Attendance",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

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
    .orderBy(desc(practiceSessions.startTime))
    .limit(10);

  const activeSession = sessions.find((s) => s.isActive) ?? null;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate QR codes and manage team practice sessions
          </p>
        </div>

        <AdminClient
          initialSessions={sessions.map((s) => ({
            ...s,
            startTime: s.startTime.toISOString(),
            createdAt: s.createdAt.toISOString(),
            creatorName: s.creatorName,
            creatorEmail: s.creatorEmail,
          }))}
          initialActiveSession={
            activeSession
              ? {
                  ...activeSession,
                  startTime: activeSession.startTime.toISOString(),
                  createdAt: activeSession.createdAt.toISOString(),
                  creatorName: activeSession.creatorName,
                  creatorEmail: activeSession.creatorEmail,
                }
              : null
          }
        />
      </main>
    </>
  );
}
