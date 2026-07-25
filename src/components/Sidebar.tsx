"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  PieChart,
  Target,
  FileBarChart,
  User,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  TrendingUp
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
    { name: "Budgets", href: "/budgets", icon: PieChart },
    { name: "Savings Goals", href: "/goals", icon: Target },
    { name: "Reports", href: "/reports", icon: FileBarChart },
    { name: "Profile", href: "/profile", icon: User },
    ...(isAdmin ? [{ name: "Admin Panel", href: "/admin", icon: ShieldAlert }] : []),
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Mobile Top Navbar Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 no-print">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">ApexFinance</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-md text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-gray-600/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white dark:bg-slate-900 focus:outline-none h-full transition-transform duration-300">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brand Header */}
            <div className="flex items-center space-x-2 px-6 py-6 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">
                ApexFinance
              </span>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                        : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer User Info & Logout */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                <img
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                  src={session?.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face"}
                  alt="User Avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session?.user?.name || "User")}`;
                  }}
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {session?.user?.name || "Loading..."}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all focus:outline-none"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shrink-0 h-screen sticky top-0 no-print">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-6 py-6 border-b border-gray-100 dark:border-slate-800/80">
          <div className="p-2 bg-emerald-500 rounded-xl text-white">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">
            ApexFinance
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            // Highlight overview only on exact match, others on startsWith
            const isReallyActive = item.href === "/dashboard" ? pathname === "/dashboard" : isActive;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isReallyActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/15 font-semibold"
                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100/50 dark:border-slate-800/50">
            <img
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
              src={session?.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face"}
              alt="User Avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session?.user?.name || "User")}`;
              }}
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {session?.user?.name || "Loading..."}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 focus:outline-none"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
