"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  PlusCircle,
  TrendingDown,
  Tag,
  AlertCircle
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface Budget {
  id: string;
  limit: number;
  categoryId: string;
  category: Category;
  month: string;
  currentSpend: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Date Picker (Monthly, e.g. "2026-07")
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query month standard: "2026-07-01"
      const queryMonth = `${selectedMonth}-01`;
      const res = await fetch(`/api/budgets?month=${queryMonth}`);
      if (!res.ok) throw new Error("Failed to load budgets");
      const data = await res.json();
      setBudgets(data);
    } catch (err: any) {
      setError(err.message || "Could not retrieve budgets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?type=EXPENSE");
      if (!res.ok) throw new Error("Failed to load expense categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCategoryId || !formLimit) {
      setFormError("Category and Limit are required");
      return;
    }

    const limitVal = parseFloat(formLimit);
    if (isNaN(limitVal) || limitVal < 0) {
      setFormError("Limit must be a positive number");
      return;
    }

    try {
      const queryMonth = `${selectedMonth}-01`;
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formCategoryId,
          limit: limitVal,
          month: queryMonth,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save budget");
      }

      setIsModalOpen(false);
      setFormCategoryId("");
      setFormLimit("");
      fetchBudgets();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this budget limit?")) return;

    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete budget limit");
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  // Convert "2026-07" to "July 2026"
  const formatMonthYearLabel = (monthStr: string) => {
    const d = new Date(`${monthStr}-02`); // Avoid timezone offsets
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Calculate totals
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpend = budgets.reduce((sum, b) => sum + b.currentSpend, 0);
  const totalRemaining = totalLimit - totalSpend;
  const overallPercentage = totalLimit > 0 ? (totalSpend / totalLimit) * 100 : 0;

  return (
    <DashboardLayout title="Budgets">
      <div className="space-y-6">
        {/* Top Header controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Category Budgets
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Control your spending by assigning monthly limits to categories.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Month Picker */}
            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-gray-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>
            
            <button
              onClick={() => {
                setFormError(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Set Limit</span>
            </button>
          </div>
        </div>

        {/* Overall Month Summary Banner */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl">
            <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 pb-4 md:pb-0 md:pr-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Budget Period</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{formatMonthYearLabel(selectedMonth)}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Aggregated target limits</p>
            </div>
            
            <div className="px-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Limit</p>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(totalLimit)}</h3>
              <span className="text-[10px] text-gray-400">Target allowancecap</span>
            </div>

            <div className="px-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(totalSpend)}</h3>
              <span className="text-[10px] text-gray-400">
                {overallPercentage.toFixed(0)}% allowance exhausted
              </span>
            </div>

            <div className="px-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Remaining</p>
              <h3 className={`text-xl font-extrabold ${totalRemaining >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatCurrency(totalRemaining)}
              </h3>
              <span className="text-[10px] text-gray-400">
                {totalRemaining >= 0 ? "Under overall budget" : "Overdrawn"}
              </span>
            </div>
          </div>
        )}

        {/* Budgets List (Grid or List style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 p-12 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm text-gray-500 dark:text-slate-400">Loading budget allowances...</span>
            </div>
          ) : error ? (
            <div className="col-span-2 bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center">
              <p className="font-semibold">{error}</p>
            </div>
          ) : budgets.length > 0 ? (
            budgets.map((budget) => {
              const remaining = budget.limit - budget.currentSpend;
              const percent = budget.limit > 0 ? (budget.currentSpend / budget.limit) * 100 : 0;
              const isOver = percent > 100;
              const isWarning = percent >= 75 && percent <= 100;

              let barColor = "bg-emerald-500";
              if (isOver) barColor = "bg-red-500";
              else if (isWarning) barColor = "bg-amber-500";

              return (
                <div
                  key={budget.id}
                  className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Category Badge Indicator */}
                      <div
                        className="p-3 rounded-xl text-white flex items-center justify-center"
                        style={{ backgroundColor: budget.category.color || "#6b7280" }}
                      >
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{budget.category.name}</h4>
                        <span className="text-[10px] text-gray-400">Expense Limit</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Spending Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-500 dark:text-slate-400">
                        Spent: {formatCurrency(budget.currentSpend)}
                      </span>
                      <span className="text-gray-700 dark:text-slate-300">
                        Limit: {formatCurrency(budget.limit)}
                      </span>
                    </div>

                    {/* Outer Bar */}
                    <div className="w-full h-3.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      {/* Status Text */}
                      <div>
                        {isOver ? (
                          <span className="flex items-center space-x-1.5 text-red-500 font-bold animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Overspent by {formatCurrency(Math.abs(remaining))}</span>
                          </span>
                        ) : isWarning ? (
                          <span className="flex items-center space-x-1.5 text-amber-500 font-semibold">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>Approaching limit (Remaining: {formatCurrency(remaining)})</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1.5 text-emerald-500 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Within budget (Remaining: {formatCurrency(remaining)})</span>
                          </span>
                        )}
                      </div>

                      {/* Percentage Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOver
                            ? "bg-red-500/10 text-red-500"
                            : isWarning
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 p-16 text-center text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-3">
              <TrendingDown className="w-12 h-12 text-gray-300 dark:text-slate-700" />
              <p className="font-semibold text-sm">No category budgets set for this month</p>
              <p className="text-xs max-w-xs">Click "Set Limit" to define a monthly allowance and track your spending habits.</p>
            </div>
          )}
        </div>

        {/* Modal: Set/Update Budget */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600/75 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 text-gray-900 dark:text-white transition-all">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Set Spending Limit</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Target Period Alert */}
                <div className="flex items-start space-x-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-xs text-blue-200">
                  <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                  <span>
                    Setting budget for: <strong className="text-blue-300">{formatMonthYearLabel(selectedMonth)}</strong>
                  </span>
                </div>

                {/* Select Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Expense Category
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Limit amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Limit Allowance ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="E.g. 500"
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-400 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    Set Limit Cap
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
