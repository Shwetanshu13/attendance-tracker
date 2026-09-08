import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AttendClient } from "./AttendClient";
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

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AttendClient
          qrToken={qrToken}
          userName={session.user.name ?? "Player"}
        />
      </main>
    </>
  );
}
