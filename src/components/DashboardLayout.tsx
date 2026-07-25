"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { Bell } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800/80 sticky top-0 z-30 no-print">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Icon (Simulated) */}
            <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Dark/Light Mode Theme Toggle */}
            <ThemeToggle />

            {/* Vertical Divider */}
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-800" />

            {/* User Profile Info */}
            <div className="flex items-center space-x-3">
              <img
                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                src={session?.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face"}
                alt="User Avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session?.user?.name || "User")}`;
                }}
              />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{session?.user?.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{session?.user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
