"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Shield,
  User,
  LogOut,
  Activity,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/Badge";
import { clsx } from "clsx";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: <Shield size={16} />,
          },
        ]
      : []),
    {
      href: "/profile",
      label: "Profile",
      icon: <User size={16} />,
    },
  ];

  return (
    <nav className="sticky top-0 z-40 glass-dark border-b border-white/6">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-100 font-bold text-base shrink-0"
        >
          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Activity size={14} className="text-emerald-400" />
          </span>
          <span className="hidden sm:block">Practice Attendance</span>
          <span className="sm:hidden">PA</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                pathname.startsWith(link.href)
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/6"
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            id="user-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass hover:border-emerald-500/20 transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() ??
                session?.user?.email?.[0]?.toUpperCase() ??
                "?"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-none">
                {session?.user?.name?.split(" ")[0] ?? "User"}
              </p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">
                {isAdmin ? "Admin" : "Member"}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={clsx(
                "text-slate-400 transition-transform duration-200",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-xl shadow-xl z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-white/6">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {session?.user?.name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {session?.user?.email}
                  </p>
                  <div className="mt-2">
                    <Badge variant={isAdmin ? "admin" : "user"}>
                      {isAdmin ? "Admin" : "Member"}
                    </Badge>
                  </div>
                </div>

                {/* Mobile links */}
                <div className="md:hidden p-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        pathname.startsWith(link.href)
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/6"
                      )}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Sign out */}
                <div className="p-1">
                  <button
                    id="signout-btn"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
