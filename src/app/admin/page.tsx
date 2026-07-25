"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Trash2,
  UserCheck,
  ShieldAlert,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from "lucide-react";

interface AdminStats {
  metrics: {
    totalUsers: number;
    totalIncomes: number;
    totalExpenses: number;
    totalTransactions: number;
    totalIncomeVolume: number;
    totalExpenseVolume: number;
    recentUsersGrowth: number;
  };
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  avatar: string | null;
  createdAt: string;
  transactionsCount: number;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch admin stats metrics
      const statsRes = await fetch("/api/admin/stats");
      if (!statsRes.ok) {
        if (statsRes.status === 403) throw new Error("Access Forbidden: Admin authorization required");
        throw new Error("Failed to load platform analytics");
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch user list
      const usersRes = await fetch("/api/admin/users");
      if (!usersRes.ok) throw new Error("Failed to load system users list");
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading admin workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") {
      router.replace("/dashboard");
    } else {
      fetchAdminData();
    }
  }, [session, router]);

  // Handle changing user roles
  const handleToggleRole = async (userId: string, currentRole: "USER" | "ADMIN") => {
    setError(null);
    setSuccess(null);

    const nextRole = currentRole === "USER" ? "ADMIN" : "USER";
    
    if (userId === session?.user?.id) {
      setError("Cannot demote your own admin account.");
      return;
    }

    if (!window.confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");

      setSuccess(data.message);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  // Handle deleting users
  const handleDeleteUser = async (userId: string) => {
    setError(null);
    setSuccess(null);

    if (userId === session?.user?.id) {
      setError("Cannot delete your own admin account.");
      return;
    }

    if (!window.confirm("WARNING: Are you sure you want to delete this user? All their transactions, categories, budgets, and savings goals will be permanently deleted.")) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");

      setSuccess(data.message);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  if (loading) {
    return (
      <DashboardLayout title="System Administration">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout title="System Administration">
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-2xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <p className="font-semibold">Access Denied / Loading Error</p>
          <p className="text-sm">{error || "Admin credentials check failed."}</p>
        </div>
      </DashboardLayout>
    );
  }

  const { metrics } = stats;

  return (
    <DashboardLayout title="System Administration">
      <div className="space-y-6">
        {/* Title and stats intro */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Admin Console Workspace
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Monitor Platform health statistics, global volumes, and manage user memberships.
          </p>
        </div>

        {/* Action alerts */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1: Total Platform Users */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Platform Users</span>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{metrics.totalUsers}</h3>
              <p className="text-[10px] text-gray-400">+{metrics.recentUsersGrowth} users joined past 30 days</p>
            </div>
          </div>

          {/* Metric 2: Total Recorded Actions */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Transactions Logged</span>
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{metrics.totalTransactions}</h3>
              <p className="text-[10px] text-gray-400">
                {metrics.totalIncomes} incomes, {metrics.totalExpenses} expenses
              </p>
            </div>
          </div>

          {/* Metric 3: Total Income Volume */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Inflow Vol. (All-Time)</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-emerald-500 tracking-tight">{formatCurrency(metrics.totalIncomeVolume)}</h3>
              <p className="text-[10px] text-gray-400">Accumulated deposits</p>
            </div>
          </div>

          {/* Metric 4: Total Expense Volume */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Outflow Vol. (All-Time)</span>
              <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-red-500 tracking-tight">{formatCurrency(metrics.totalExpenseVolume)}</h3>
              <p className="text-[10px] text-gray-400">Accumulated expenditures</p>
            </div>
          </div>
        </div>

        {/* Users Management Section */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800/70">
            <h3 className="text-md font-bold text-gray-900 dark:text-white">Registered Workspace Members</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">View user metadata metrics, promote to Administrator, or delete accounts.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/30 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase border-b border-gray-200 dark:border-slate-800">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-center">Transactions</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
                {users.map((u) => {
                  const isSelf = u.id === session?.user?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      {/* User Profile */}
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <img
                          src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80"}
                          alt={u.name || "User Avatar"}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || "User")}`;
                          }}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-950 dark:text-slate-100 flex items-center">
                            <span>{u.name || "Workspace Member"}</span>
                            {isSelf && (
                              <span className="ml-2 text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-500"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Join Date */}
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </span>
                      </td>

                      {/* Transactions count */}
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-800 dark:text-slate-300">
                        <span className="flex items-center justify-center space-x-1">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
                          <span>{u.transactionsCount}</span>
                        </span>
                      </td>

                      {/* Admin actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-3.5">
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none cursor-pointer"
                            title={u.role === "ADMIN" ? "Demote user to standard account" : "Promote user to Administrator"}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none cursor-pointer"
                            title="Delete user account permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
