import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  Shield,
  PieChart,
  Target,
  ArrowRight,
  DollarSign,
  Smartphone,
  ChevronRight
} from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If already logged in, redirect straight to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-emerald-500/30">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-[-25%] left-[-25%] w-[70%] h-[70%] rounded-full bg-emerald-500/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-25%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[160px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-md z-30">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/10">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">ApexFinance</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/15"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-12 py-20 md:py-32 max-w-4xl mx-auto space-y-8 relative z-15">
        <div className="inline-flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs text-slate-300 hover:border-slate-700 transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Production Ready FinTech Workspace</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-white">
          Take absolute control of your{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            financial future.
          </span>
        </h1>

        <p className="text-md md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          ApexFinance provides smart income and expense tracking, custom category budgets, saving targets progress meters, and dynamic spreadsheet reporting.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/15 hover:translate-y-[-1px] active:translate-y-[0px] transition-all cursor-pointer"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-300 hover:text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            <span>Demo Log In</span>
          </Link>
        </div>
      </main>

      {/* Core Features Grid */}
      <section className="border-t border-slate-900 bg-slate-900/20 py-20 px-6 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Equipped with Core Premium Features</h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
              Everything you need to govern your personal finances or business statements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl inline-block">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Smart Trackers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log income stream and expense outflows instantly. Upload photos of receipt bills for audits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl inline-block">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Enforced Budgets</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Establish monthly allowance limits per category. Visual alarms turn amber and red if over limits.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl inline-block">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Saving Targets</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log saving targets. Make deposit additions and withdrawal adjustments with dynamic deadline counters.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl inline-block">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Statement Exports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter by parameters and export statements to CSV spreadsheet, Excel worksheets, or print layout PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 md:px-12 text-center text-xs text-slate-500 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
        <p>© 2026 ApexFinance Expense Tracker. Built with Next.js 15 & Prisma ORM.</p>
        <div className="flex items-center space-x-4">
          <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded uppercase tracking-wider">
            Production Release
          </span>
        </div>
      </footer>
    </div>
  );
}
