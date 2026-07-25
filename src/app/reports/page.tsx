"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Tag
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";

interface Category {
  name: string;
  color: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  description: string | null;
  category: Category;
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter presets
  const [preset, setPreset] = useState<"WEEK" | "MONTH" | "YEAR" | "CUSTOM">("MONTH");
  
  // Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination for the view list
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Set default dates based on preset
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === "WEEK") {
      // Start of current week (Sunday)
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "MONTH") {
      // Current Month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (preset === "YEAR") {
      // Current Year
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      // Custom range: leave unchanged or set to past 30 days
      start.setDate(now.getDate() - 30);
      end = now;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setPage(1);
  }, [preset]);

  // Fetch report data
  const fetchReportData = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all transactions in the date range without a page limit to calculate summaries
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        limit: "2000", // Large limit to get all relevant data
        page: "1",
      });

      const res = await fetch(`/api/transactions?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load report data");
      
      const data = await res.json();
      setTransactions(data.transactions);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  // Calculate summaries
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Aggregate Category Expense Breakdown
  const categorySummary: { [key: string]: { amount: number; color: string } } = {};
  transactions
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const name = t.category.name;
      const color = t.category.color || "#6b7280";
      if (!categorySummary[name]) {
        categorySummary[name] = { amount: 0, color };
      }
      categorySummary[name].amount += t.amount;
    });

  const sortedCategories = Object.keys(categorySummary)
    .map((name) => ({
      name,
      amount: categorySummary[name].amount,
      color: categorySummary[name].color,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group transactions by date for Chart (Income vs Expense comparison over days)
  const chartGroup: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach((t) => {
    const dateLabel = new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!chartGroup[dateLabel]) {
      chartGroup[dateLabel] = { income: 0, expense: 0 };
    }
    if (t.type === "INCOME") {
      chartGroup[dateLabel].income += t.amount;
    } else {
      chartGroup[dateLabel].expense += t.amount;
    }
  });

  // Sort dates chronological
  const sortedDates = Object.keys(chartGroup).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const chartData = {
    labels: sortedDates,
    datasets: [
      {
        label: "Income",
        data: sortedDates.map((d) => chartGroup[d].income),
        backgroundColor: "#10b981",
        borderRadius: 4,
      },
      {
        label: "Expense",
        data: sortedDates.map((d) => chartGroup[d].expense),
        backgroundColor: "#ef4444",
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { family: "var(--font-geist-sans)", size: 11 },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { family: "var(--font-geist-sans)" } },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#94a3b8", font: { family: "var(--font-geist-sans)" } },
      },
    },
  };

  // Pagination for transaction detail table
  const paginatedTransactions = transactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  // EXPORT METRICS: CSV
  const handleExportCSV = () => {
    const headers = "ID,Date,Description,Type,Category,Amount\n";
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${new Date(t.date).toLocaleDateString()}","${
            t.description || t.category.name
          }","${t.type}","${t.category.name}",${t.amount}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ApexFinance_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT METRICS: EXCEL
  const handleExportExcel = () => {
    const formattedData = transactions.map((t) => ({
      Transaction_ID: t.id,
      Date: new Date(t.date).toLocaleDateString(),
      Description: t.description || t.category.name,
      Type: t.type,
      Category: t.category.name,
      Amount: t.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `ApexFinance_Report_${startDate}_to_${endDate}.xlsx`);
  };

  // EXPORT METRICS: PDF (Trigger Print)
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <DashboardLayout title="Financial Reports">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Reports & Statement
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Analyze cashflow distributions, savings rates, and download transactional files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Buttons */}
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-colors focus:outline-none cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Filters and Preset Selectors */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4 no-print">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Preset Buttons */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800">
              <button
                onClick={() => setPreset("WEEK")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  preset === "WEEK"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPreset("MONTH")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  preset === "MONTH"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPreset("YEAR")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  preset === "YEAR"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setPreset("CUSTOM")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  preset === "CUSTOM"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Custom Range
              </button>
            </div>

            {/* Custom Dates Inputs */}
            <div className="flex items-center space-x-3">
              <div>
                <input
                  type="date"
                  value={startDate}
                  disabled={preset !== "CUSTOM"}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
              <span className="text-gray-400 text-xs">to</span>
              <div>
                <input
                  type="date"
                  value={endDate}
                  disabled={preset !== "CUSTOM"}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Printable Title Block */}
        <div className="hidden print-only text-center border-b border-gray-300 pb-5">
          <h1 className="text-3xl font-extrabold">ApexFinance Account Statement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Report Statement Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Report Financial Summary Metrics */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print-card p-6 bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 rounded-2xl">
            {/* Total Income */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Inflow (Income)</span>
              <h3 className="text-xl font-extrabold text-emerald-500">{formatCurrency(totalIncome)}</h3>
              <p className="text-[10px] text-gray-400">Total cash earned in period</p>
            </div>
            {/* Total Expense */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Outflow (Expenses)</span>
              <h3 className="text-xl font-extrabold text-red-500">{formatCurrency(totalExpense)}</h3>
              <p className="text-[10px] text-gray-400">Total cash spent in period</p>
            </div>
            {/* Net Savings */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Net Surplus / Savings</span>
              <h3 className={`text-xl font-extrabold ${netSavings >= 0 ? "text-blue-500" : "text-amber-500"}`}>
                {formatCurrency(netSavings)}
              </h3>
              <p className="text-[10px] text-gray-400">Cash remaining after spend</p>
            </div>
            {/* Savings Rate */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Savings Rate (%)</span>
              <h3 className="text-xl font-extrabold text-purple-500">{savingsRate.toFixed(1)}%</h3>
              <p className="text-[10px] text-gray-400">Percentage of income saved</p>
            </div>
          </div>
        )}

        {/* Charts & Breakdown Display */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl print-card">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Cashflow Trend</h3>
              <div className="h-64 relative">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Category Expenses Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl print-card">
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Category Expenditures</h3>
              
              <div className="space-y-3.5 max-h-64 overflow-y-auto">
                {sortedCategories.length > 0 ? (
                  sortedCategories.map((cat) => {
                    const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 dark:text-slate-200 flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span>{cat.name}</span>
                          </span>
                          <span className="font-bold text-gray-950 dark:text-slate-50">
                            {formatCurrency(cat.amount)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-gray-500">No expenses recorded in this period.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table list for printout */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm print-card">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800/70">
            <h3 className="text-md font-bold text-gray-900 dark:text-white">Transaction Logs</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Full listing of transactions for this period</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm text-gray-500">Retrieving statement logs...</span>
            </div>
          ) : transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/30 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800/50">
                    {paginatedTransactions.map((t) => {
                      const isIncome = t.type === "INCOME";
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/10 text-sm">
                          <td className="px-6 py-3 text-gray-500 dark:text-slate-400">
                            {new Date(t.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">
                            {t.description || t.category.name}
                          </td>
                          <td className="px-6 py-3">
                            <span className="flex items-center space-x-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: t.category.color || "#6b7280" }}
                              />
                              <span>{t.category.name}</span>
                            </span>
                          </td>
                          <td className="px-6 py-3 uppercase text-xs font-bold tracking-wider">
                            <span className={isIncome ? "text-emerald-500" : "text-gray-400 dark:text-slate-500"}>
                              {t.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-bold">
                            <span className={isIncome ? "text-emerald-500" : "text-gray-950 dark:text-slate-100"}>
                              {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls for screen rendering */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800/70 flex items-center justify-between no-print">
                  <span className="text-xs text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="p-1 border border-gray-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-gray-600 dark:text-slate-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="p-1 border border-gray-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-gray-600 dark:text-slate-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500">
              No transactions recorded for the selected date range.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
