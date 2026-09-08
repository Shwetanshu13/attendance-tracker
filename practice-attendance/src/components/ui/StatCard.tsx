import { clsx } from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "green" | "amber" | "red" | "blue";
  subtitle?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  accent = "green",
  subtitle,
  className,
}: StatCardProps) {
  const accentClasses = {
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    blue: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };

  return (
    <div
      className={clsx(
        "glass rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:border-emerald-500/20",
        className
      )}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center border ${accentClasses[accent]} flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
        {subtitle && (
          <p className="text-slate-500 text-xs mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
