"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  Shield,
  User as UserIcon,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface UserItem {
  id: string;
  name: string | null;
  email: string;
  branch: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
  attendedCount?: number;
}

const BRANCHES = [
  "CSE",
  "EE",
  "ECE",
  "ME",
  "CE",
  "Aero",
  "VLSI",
  "AI/DS",
] as const;

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
  totalSessions: number;
}

export function UsersClient({
  initialUsers,
  currentUserId,
  totalSessions,
}: UsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Editing state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<"ADMIN" | "USER">("USER");
  const [editBranch, setEditBranch] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deleting state
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter users client-side for immediate responsiveness
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      search.trim() === "" ||
      (u.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesBranch =
      branchFilter === "ALL" ||
      (branchFilter === "NONE" ? !u.branch : u.branch === branchFilter);

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchesSearch && matchesBranch && matchesRole;
  });

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditBranch(user.branch || "");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          branch: editBranch || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, role: editRole, branch: editBranch || null }
            : u
        )
      );
      setEditingUser(null);
      showToast(`Updated ${editingUser.name || editingUser.email} successfully`);
      router.refresh();
    } catch (err: any) {
      setEditError(err.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showToast(`User ${deletingUser.name || deletingUser.email} removed`);
      setDeletingUser(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-pitch-900 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={16} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Sessions
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            View team members, adjust roles, and manage branch assignments
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-pitch-800/80 border border-white/8 px-3 py-1.5 rounded-lg w-fit">
          <span className="font-semibold text-slate-200">{filteredUsers.length}</span> of{" "}
          <span>{users.length} members</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="user-search-input"
              type="text"
              placeholder="Search by player name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-pitch-900/90 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Branch Filter */}
          <div className="w-full md:w-44">
            <select
              id="branch-filter-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-pitch-900/90 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              style={{ colorScheme: "dark" }}
            >
              <option value="ALL">All Branches</option>
              <option value="NONE">Unassigned</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-36">
            <select
              id="role-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-pitch-900/90 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              style={{ colorScheme: "dark" }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="USER">Members</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-500 text-sm">
          No users match the current search and filter criteria.
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6 bg-white/[0.02]">
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Regularity
                  </th>
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3.5 text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const regularityRate =
                    totalSessions > 0
                      ? Math.round(
                          ((user.attendedCount ?? 0) / totalSessions) * 100
                        )
                      : 0;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-white/4 last:border-0 hover:bg-white/[0.025] transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400/20 to-pitch-700 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                            {user.name?.[0]?.toUpperCase() ??
                              user.email[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-slate-100 font-medium truncate">
                                {user.name || "Anonymous Member"}
                              </p>
                              {isSelf && (
                                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-xs truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5">
                        {user.branch ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {user.branch}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Regularity: Attended / Total */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-xs">
                            {user.attendedCount ?? 0} / {totalSessions}
                          </span>
                          {totalSessions > 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                regularityRate >= 75
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : regularityRate >= 50
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-red-500/15 text-red-400"
                              }`}
                            >
                              {regularityRate}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <Badge variant={user.role === "ADMIN" ? "admin" : "user"}>
                          {user.role === "ADMIN" ? "Admin" : "Member"}
                        </Badge>
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {format(new Date(user.createdAt), "dd MMM yyyy")}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Edit Role & Branch"
                          >
                            <Edit3 size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role & Branch Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit Member: ${editingUser?.name || editingUser?.email || ""}`}
      >
        <div className="space-y-4 pt-2">
          {editError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Player Email
            </label>
            <input
              type="text"
              disabled
              value={editingUser?.email || ""}
              className="w-full px-3.5 py-2 rounded-xl bg-pitch-900 border border-white/10 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as "ADMIN" | "USER")}
              disabled={editingUser?.id === currentUserId}
              className="w-full px-3.5 py-2.5 rounded-xl bg-pitch-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              style={{ colorScheme: "dark" }}
            >
              <option value="USER">Member (Regular Player)</option>
              <option value="ADMIN">Admin (Full Control)</option>
            </select>
            {editingUser?.id === currentUserId && (
              <p className="text-[11px] text-amber-400/80 mt-1">
                You cannot change your own admin role.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Department / Branch
            </label>
            <select
              value={editBranch}
              onChange={(e) => setEditBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-pitch-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50"
              style={{ colorScheme: "dark" }}
            >
              <option value="">-- Unassigned --</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/6">
            <button
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition-all disabled:opacity-60"
            >
              {isSaving && <RefreshCw size={14} className="animate-spin" />}
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Remove Member"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-slate-300">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-slate-100">
              {deletingUser?.name || deletingUser?.email}
            </span>{" "}
            from the system?
          </p>
          <p className="text-xs text-slate-500">
            This will permanently delete their account and associated attendance
            history.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/6">
            <button
              onClick={() => setDeletingUser(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-medium text-sm transition-all disabled:opacity-60"
            >
              {isDeleting && <RefreshCw size={14} className="animate-spin" />}
              {isDeleting ? "Removing…" : "Yes, Remove"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
