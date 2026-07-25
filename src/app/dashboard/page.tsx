"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardCharts from "@/components/DashboardCharts";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ArrowRight,
  PlusCircle,
  Calendar,
  Tag
} from "lucide-react";

interface DashboardStats {
  summary: {
    totalBalance: number;
    currentMonthIncome: number;
    incomeChangePct: number;
    currentMonthExpense: number;
    expenseChangePct: number;
    savings: {
      target: number;
      current: number;
      percentage: number;
    };
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    date: string;
    description: string | null;
    category: {
      name: string;
      color: string | null;
      icon: string | null;
    };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch("/api/dashboard/stats");
        if (!statsRes.ok) throw new Error("Failed to load dashboard statistics");
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch charts
        const chartsRes = await fetch("/api/dashboard/charts");
        if (!chartsRes.ok) throw new Error("Failed to load dashboard chart data");
        const chartsPayload = await chartsRes.json();
        setChartsData(chartsPayload);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred while fetching dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
          {/* Skeleton Chart */}
          <div className="h-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-2xl text-center space-y-4">
          <p className="font-semibold">Failed to load dashboard details</p>
          <p className="text-sm">{error || "Check your database connection and try reloading the page."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, recentTransactions } = stats;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Quick Welcome & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Financial Overview
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Here is how your accounts are performing this month.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href="/transactions"
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Manage Transactions</span>
            </Link>
          </div>
        </div>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Net Worth / Total Balance */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Balance</span>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {formatCurrency(summary.totalBalance)}
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">All-time net cash positioning</p>
            </div>
          </div>

          {/* Card 2: Income */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Income This Month</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {formatCurrency(summary.currentMonthIncome)}
              </h3>
              <div className="flex items-center text-xs">
                {summary.incomeChangePct >= 0 ? (
                  <span className="flex items-center text-emerald-500 font-semibold mr-1.5">
                    <ArrowUpRight className="w-4 h-4 mr-0.5 shrink-0" />
                    {summary.incomeChangePct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center text-red-500 font-semibold mr-1.5">
                    <ArrowDownRight className="w-4 h-4 mr-0.5 shrink-0" />
                    {Math.abs(summary.incomeChangePct).toFixed(1)}%
                  </span>
                )}
                <span className="text-gray-400 dark:text-slate-500">vs last month</span>
              </div>
            </div>
          </div>

          {/* Card 3: Expenses */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Expenses This Month</span>
              <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {formatCurrency(summary.currentMonthExpense)}
              </h3>
              <div className="flex items-center text-xs">
                {summary.expenseChangePct <= 0 ? (
                  <span className="flex items-center text-emerald-500 font-semibold mr-1.5">
                    <ArrowDownRight className="w-4 h-4 mr-0.5 shrink-0" />
                    {Math.abs(summary.expenseChangePct).toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center text-red-500 font-semibold mr-1.5">
                    <ArrowUpRight className="w-4 h-4 mr-0.5 shrink-0" />
                    {summary.expenseChangePct.toFixed(1)}%
                  </span>
                )}
                <span className="text-gray-400 dark:text-slate-500">vs last month</span>
              </div>
            </div>
          </div>

          {/* Card 4: Savings Progress */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Savings Goals</span>
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {formatCurrency(summary.savings.current)}
                </h3>
                <span className="text-xs text-gray-400 dark:text-slate-400">
                  of {formatCurrency(summary.savings.target)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(summary.savings.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {chartsData && <DashboardCharts data={chartsData} />}

        {/* Bottom Section: Recent Transactions */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800/70 flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Your last 5 income/expense events</p>
            </div>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center space-x-1 transition-colors"
            >
              <span>See all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-slate-800/60">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const isIncome = transaction.type === "INCOME";
                return (
                  <div
                    key={transaction.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      {/* Category Badge Icon */}
                      <div
                        className="p-3.5 rounded-xl shrink-0 text-white flex items-center justify-center"
                        style={{ backgroundColor: transaction.category.color || "#6b7280" }}
                      >
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-950 dark:text-slate-100 truncate">
                          {transaction.description || transaction.category.name}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800">
                            {transaction.category.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          isIncome ? "text-emerald-500" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </p>
                      <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-sm text-gray-400">
                No recent transactions. Go to the Transactions tab to add some.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
