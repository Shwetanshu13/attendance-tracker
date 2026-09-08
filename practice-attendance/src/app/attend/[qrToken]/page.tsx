import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AttendClient } from "./AttendClient";
import { db } from "@/db";
import { practiceSessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check-in — Practice Attendance",
};

export default async function AttendPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const session = await auth();
  const { qrToken } = await params;

  if (!session?.user) {
    redirect(`/login?callbackUrl=/attend/${encodeURIComponent(qrToken)}`);
  }

  // Fetch session and creator info
  const [sessionRecord] = await db
    .select({
      id: practiceSessions.id,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(practiceSessions)
    .leftJoin(users, eq(practiceSessions.createdBy, users.id))
    .where(eq(practiceSessions.qrToken, qrToken))
    .limit(1);

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AttendClient
          qrToken={qrToken}
          userName={session.user.name ?? "Player"}
          creatorName={sessionRecord?.creatorName || sessionRecord?.creatorEmail || "Captain"}
        />
      </main>
    </>
  );
}
