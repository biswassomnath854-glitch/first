"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  ChevronRight,
  TrendingUp,
  X,
  AlertCircle,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  
  // Forms state
  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formCurrent, setFormCurrent] = useState("0");
  const [formDeadline, setFormDeadline] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositType, setDepositType] = useState<"ADD" | "WITHDRAW">("ADD");
  
  const [formError, setFormError] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      const data = await res.json();
      setGoals(data);
    } catch (err: any) {
      setError(err.message || "Failed to load savings goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName || !formTarget) {
      setFormError("Name and Target amount are required");
      return;
    }

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          targetAmount: parseFloat(formTarget),
          currentAmount: parseFloat(formCurrent || "0"),
          deadline: formDeadline || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create goal");
      }

      setIsAddModalOpen(false);
      resetForm();
      fetchGoals();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    }
  };

  const openEditModal = (g: SavingGoal) => {
    setSelectedGoal(g);
    setFormName(g.name);
    setFormTarget(g.targetAmount.toString());
    setFormCurrent(g.currentAmount.toString());
    setFormDeadline(g.deadline ? new Date(g.deadline).toISOString().split("T")[0] : "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setFormError(null);

    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          targetAmount: parseFloat(formTarget),
          currentAmount: parseFloat(formCurrent),
          deadline: formDeadline || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update goal");
      }

      setIsEditModalOpen(false);
      resetForm();
      fetchGoals();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    }
  };

  const openDepositModal = (g: SavingGoal, type: "ADD" | "WITHDRAW") => {
    setSelectedGoal(g);
    setDepositType(type);
    setDepositAmount("");
    setFormError(null);
    setIsDepositModalOpen(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setFormError(null);

    const adjustmentVal = parseFloat(depositAmount);
    if (isNaN(adjustmentVal) || adjustmentVal <= 0) {
      setFormError("Please enter a valid positive amount");
      return;
    }

    let nextCurrent = selectedGoal.currentAmount;
    if (depositType === "ADD") {
      nextCurrent += adjustmentVal;
    } else {
      nextCurrent -= adjustmentVal;
      if (nextCurrent < 0) {
        setFormError("Cannot withdraw more than current savings amount");
        return;
      }
    }

    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedGoal.name,
          targetAmount: selectedGoal.targetAmount,
          currentAmount: nextCurrent,
          deadline: selectedGoal.deadline,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to adjust balance");
      }

      setIsDepositModalOpen(false);
      resetForm();
      fetchGoals();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this saving goal?")) return;

    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete goal");
      fetchGoals();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormTarget("");
    setFormCurrent("0");
    setFormDeadline("");
    setDepositAmount("");
    setFormError(null);
    setSelectedGoal(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const calculateDaysRemaining = (deadlineStr: string | null) => {
    if (!deadlineStr) return null;
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <DashboardLayout title="Savings Goals">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Goals & Savings Tracker
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Define your financial goals, record deposit events, and visualize your saving progression.
            </p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 p-12 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm text-gray-500 dark:text-slate-400">Loading savings goals...</span>
            </div>
          ) : error ? (
            <div className="col-span-3 bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center">
              <p className="font-semibold">{error}</p>
            </div>
          ) : goals.length > 0 ? (
            goals.map((goal) => {
              const remaining = goal.targetAmount - goal.currentAmount;
              const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const daysRemaining = calculateDaysRemaining(goal.deadline);
              const isCompleted = percent >= 100;

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Card top */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/10 rounded-xl">
                          <PiggyBank className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                            {goal.name}
                          </h4>
                          {goal.deadline ? (
                            <span className="text-[10px] text-gray-400 flex items-center mt-0.5">
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">No deadline</span>
                          )}
                        </div>
                      </div>

                      {/* Options controls */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(goal)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg focus:outline-none cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg focus:outline-none cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between text-xs font-semibold">
                        <span className="text-gray-500 dark:text-slate-400">
                          Saved: {formatCurrency(goal.currentAmount)}
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold">
                          Target: {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-500" : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(percent, 100)}%`,
                            backgroundColor: isCompleted ? "#10b981" : "#3b82f6"
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400">
                        <span>
                          {isCompleted
                            ? "Goal Reached! 🎉"
                            : `${formatCurrency(remaining)} remaining`}
                        </span>
                        <span>{percent.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Goal Actions (Add / Remove savings) */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80 space-y-3 mt-auto">
                    {daysRemaining !== null && (
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 text-center font-medium">
                        {daysRemaining > 0 ? (
                          <span>⏳ {daysRemaining} days left to target</span>
                        ) : daysRemaining === 0 ? (
                          <span className="text-amber-500">⏳ Deadline is today!</span>
                        ) : (
                          <span className="text-red-500">⚠️ Past deadline</span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => openDepositModal(goal, "ADD")}
                        className="flex items-center justify-center space-x-1 py-2 px-3 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 rounded-xl text-xs font-bold transition-colors cursor-pointer focus:outline-none"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Deposit</span>
                      </button>
                      <button
                        disabled={goal.currentAmount <= 0}
                        onClick={() => openDepositModal(goal, "WITHDRAW")}
                        className="flex items-center justify-center space-x-1 py-2 px-3 border border-red-500/10 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors cursor-pointer focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Withdraw</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 p-16 text-center text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-3">
              <Target className="w-12 h-12 text-gray-300 dark:text-slate-700" />
              <p className="font-semibold text-sm">No active savings goals found</p>
              <p className="text-xs max-w-xs">Create a new savings target (like buying a car, laptop, or holiday) and check your progression.</p>
            </div>
          )}
        </div>

        {/* Modal: Create Goal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600/75 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 text-gray-900 dark:text-white transition-all">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Create Savings Goal</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. New Macbook Pro"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Target Amount ($)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Initial Deposit ($)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formCurrent}
                      onChange={(e) => setFormCurrent(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Target Deadline Date
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-400 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Goal */}
        {isEditModalOpen && selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600/75 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 text-gray-900 dark:text-white transition-all">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Edit Savings Goal</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. emergency fund"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Target Amount ($)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Current Saved ($)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={formCurrent}
                      onChange={(e) => setFormCurrent(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Target Deadline Date
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-400 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Deposit / Withdraw Funds */}
        {isDepositModalOpen && selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600/75 backdrop-blur-sm" onClick={() => setIsDepositModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 text-gray-900 dark:text-white transition-all">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  {depositType === "ADD" ? "Deposit to Goal" : "Withdraw from Goal"}
                </h3>
                <button onClick={() => setIsDepositModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-slate-950 p-3.5 border border-gray-200 dark:border-slate-800/80 rounded-xl space-y-1 text-xs">
                  <p className="text-gray-500 dark:text-slate-400">
                    Goal: <span className="font-bold text-gray-900 dark:text-white">{selectedGoal.name}</span>
                  </p>
                  <p className="text-gray-500 dark:text-slate-400">
                    Current Balance: <strong className="text-gray-900 dark:text-white">{formatCurrency(selectedGoal.currentAmount)}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDepositModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 text-white font-bold rounded-xl text-sm cursor-pointer shadow-md ${
                      depositType === "ADD"
                        ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10"
                        : "bg-red-500 hover:bg-red-400 shadow-red-500/10"
                    }`}
                  >
                    Confirm {depositType === "ADD" ? "Deposit" : "Withdrawal"}
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
