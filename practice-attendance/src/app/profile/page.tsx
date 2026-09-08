import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProfileClient } from "./ProfileClient";
import { db } from "@/db";
import { users, attendances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — Practice Attendance",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!dbUser) redirect("/login");

  // Fetch stats for profile view
  const userAttendances = await db
    .select({
      id: attendances.id,
      isLate: attendances.isLate,
      scannedAt: attendances.scannedAt,
    })
    .from(attendances)
    .where(eq(attendances.userId, session.user.id))
    .orderBy(desc(attendances.scannedAt));

  const totalAttended = userAttendances.length;
  const totalLate = userAttendances.filter((a) => a.isLate).length;
  const lateInLast10 = userAttendances.slice(0, 10).filter((a) => a.isLate).length;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <ProfileClient
          user={{
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            branch: dbUser.branch,
            role: dbUser.role,
            createdAt: dbUser.createdAt.toISOString(),
          }}
          stats={{
            totalAttended,
            lateInLast10,
            totalLate,
          }}
        />
      </main>
    </>
  );
}
