import { clsx } from "clsx";

interface BadgeProps {
  variant: "on-time" | "late" | "admin" | "user" | "active" | "expired";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
        {
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25":
            variant === "on-time",
          "bg-amber-500/15 text-amber-400 border border-amber-500/25":
            variant === "late",
          "bg-sky-500/15 text-sky-400 border border-sky-500/25":
            variant === "admin",
          "bg-slate-500/15 text-slate-400 border border-slate-500/25":
            variant === "user",
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 animate-pulse-slow":
            variant === "active",
          "bg-red-500/15 text-red-400 border border-red-500/25":
            variant === "expired",
        },
        className
      )}
    >
      {variant === "on-time" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}
      {variant === "late" && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
      {variant === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}
      {variant === "expired" && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      )}
      {children}
    </span>
  );
}
