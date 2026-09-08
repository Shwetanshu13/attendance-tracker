import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "./LoginButton";
import { Activity, Shield, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Practice Attendance",
  description: "Sign in with your NIT Delhi Google account to track practice attendance.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const { callbackUrl, error } = await searchParams;

  const errorMessages: Record<string, string> = {
    AccessDenied: "Access denied. Only @nitdelhi.ac.in accounts are allowed.",
    OAuthSignin: "Error signing in with Google. Please try again.",
    OAuthCallback: "OAuth callback error. Please try again.",
    Default: "An error occurred. Please try again.",
  };

  const errorMessage = error
    ? (errorMessages[error] ?? errorMessages.Default)
    : null;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-600/4 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo & heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 glow-green mb-4">
            <Activity size={30} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gradient mb-1">
            Practice Attendance
          </h1>
          <p className="text-slate-400 text-sm">NIT Delhi Football Team</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">
            Welcome back
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Sign in with your{" "}
            <span className="text-emerald-400">@nitdelhi.ac.in</span> account
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <LoginButton callbackUrl={callbackUrl ?? "/dashboard"} />

          <div className="mt-6 pt-6 border-t border-white/6 space-y-2">
            {[
              {
                icon: <Shield size={13} />,
                text: "College accounts only",
              },
              {
                icon: <Zap size={13} />,
                text: "QR-based instant check-in",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <span className="text-emerald-600">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
