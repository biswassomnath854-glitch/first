"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  trends: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  categoryDistribution: Array<{
    categoryName: string;
    color: string;
    amount: number;
  }>;
}

export default function DashboardCharts({ data }: { data: ChartData }) {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  // 1. Income vs Expense Trend Bar Chart Data
  const trendData = {
    labels: data.trends.map((t) => t.month),
    datasets: [
      {
        label: "Income",
        data: data.trends.map((t) => t.income),
        backgroundColor: "#10b981", // Emerald-500
        borderRadius: 6,
      },
      {
        label: "Expense",
        data: data.trends.map((t) => t.expense),
        backgroundColor: "#ef4444", // Red-500
        borderRadius: 6,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
          font: { family: "var(--font-geist-sans)" },
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        padding: 12,
        borderRadius: 8,
        titleFont: { family: "var(--font-geist-sans)", size: 13 },
        bodyFont: { family: "var(--font-geist-sans)", size: 13 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: "var(--font-geist-sans)" } },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { family: "var(--font-geist-sans)" },
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };

  // 2. Category Distribution Doughnut Chart Data
  const doughnutData = {
    labels: data.categoryDistribution.map((c) => c.categoryName),
    datasets: [
      {
        data: data.categoryDistribution.map((c) => c.amount),
        backgroundColor: data.categoryDistribution.map((c) => c.color),
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? "#0f172a" : "#ffffff",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: textColor,
          font: { family: "var(--font-geist-sans)", size: 12 },
          boxWidth: 10,
          padding: 12,
        },
      },
      tooltip: {
        padding: 12,
        borderRadius: 8,
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` Spend: $${val.toFixed(2)}`;
          },
        },
      },
    },
    cutout: "70%",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trends Bar Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl">
        <div className="mb-4">
          <h3 className="text-md font-bold text-gray-900 dark:text-white">Cashflow Trend</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Monthly cash inflow vs outflow comparison</p>
        </div>
        <div className="h-72">
          {data.trends.length > 0 ? (
            <Bar data={trendData} options={trendOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">No trend data available</div>
          )}
        </div>
      </div>

      {/* Categories Doughnut Chart */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl">
        <div className="mb-4">
          <h3 className="text-md font-bold text-gray-900 dark:text-white">Expenses by Category</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Current month's expense distribution</p>
        </div>
        <div className="h-72 flex items-center justify-center relative">
          {data.categoryDistribution.length > 0 ? (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center px-4 space-y-2">
              <span className="text-sm font-semibold text-gray-400">No expenses recorded</span>
              <span className="text-xs text-gray-500 max-w-[200px]">Add transactions for this month to see the category layout here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
