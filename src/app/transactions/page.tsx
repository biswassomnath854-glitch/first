"use client";

import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Upload,
  X,
  Eye,
  AlertCircle,
  ArrowRightLeft
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  description: string | null;
  receiptImage: string | null;
  categoryId: string;
  category: Category;
}

export default function TransactionsPage() {
  // Lists
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Loading & State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptViewerUrl, setReceiptViewerUrl] = useState<string | null>(null);

  // Form State
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formReceiptImage, setFormReceiptImage] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch transactions and categories
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type,
        ...(search ? { search } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });

      const res = await fetch(`/api/transactions?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const data = await res.json();
      setTransactions(data.transactions);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading transactions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
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
    fetchTransactions();
  }, [page, type, categoryId, startDate, endDate]);

  // Handle Search Input Change (Debounced triggers would be ideal, but direct submission or triggers on Enter work well)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setType("ALL");
    setCategoryId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Receipt image uploading
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Only image files are allowed for receipts");
      return;
    }

    setUploadingReceipt(true);
    setFormError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      
      setFormReceiptImage(data.url);
    } catch (err: any) {
      setFormError(err.message || "Receipt upload failed. Please try again.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Add transaction
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formAmount || !formCategoryId || !formDate) {
      setFormError("Amount, Category, and Date are required");
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(formAmount),
          type: formType,
          categoryId: formCategoryId,
          date: formDate,
          description: formDescription,
          receiptImage: formType === "EXPENSE" ? formReceiptImage : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create transaction");
      }

      setIsAddModalOpen(false);
      resetForm();
      fetchTransactions();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    }
  };

  // Edit transaction dialog open
  const openEditModal = (t: Transaction) => {
    setSelectedTransaction(t);
    setFormAmount(t.amount.toString());
    setFormType(t.type);
    setFormCategoryId(t.categoryId);
    setFormDate(new Date(t.date).toISOString().split("T")[0]);
    setFormDescription(t.description || "");
    setFormReceiptImage(t.receiptImage);
    setIsEditModalOpen(true);
  };

  // Edit transaction submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    setFormError(null);

    try {
      const res = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(formAmount),
          type: formType,
          categoryId: formCategoryId,
          date: formDate,
          description: formDescription,
          receiptImage: formType === "EXPENSE" ? formReceiptImage : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update transaction");
      }

      setIsEditModalOpen(false);
      resetForm();
      fetchTransactions();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete transaction");
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  const resetForm = () => {
    setFormAmount("");
    setFormType("EXPENSE");
    setFormCategoryId(categories.find(c => c.type === "EXPENSE")?.id || "");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormReceiptImage(null);
    setFormError(null);
    setSelectedTransaction(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  return (
    <DashboardLayout title="Transactions">
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Transactions History
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Manage, search, and filter your incomes and expenses.
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
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search descriptions, category names..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-500 text-white font-semibold rounded-xl text-sm hover:bg-emerald-400 cursor-pointer transition-colors"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Filter by Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="ALL">All Types</option>
                <option value="INCOME">Incomes (+)</option>
                <option value="EXPENSE">Expenses (-)</option>
              </select>
            </div>

            {/* Filter by Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Start Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Filter End Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full py-2.5 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Listing */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm text-gray-500 dark:text-slate-400">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 space-y-4">
              <AlertCircle className="w-10 h-10 mx-auto" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : transactions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/40 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-4">Transaction</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Receipt</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
                    {transactions.map((t) => {
                      const isIncome = t.type === "INCOME";
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {t.description || t.category.name}
                            </p>
                            <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                              {t.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: t.category.color || "#6b7280" }}
                            >
                              <Tag className="w-3 h-3" />
                              <span>{t.category.name}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{new Date(t.date).toLocaleDateString()}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {t.receiptImage ? (
                              <button
                                onClick={() => setReceiptViewerUrl(t.receiptImage)}
                                className="text-emerald-500 hover:text-emerald-400 flex items-center space-x-1 font-semibold focus:outline-none cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-bold ${isIncome ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}>
                              {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded transition-colors focus:outline-none cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors focus:outline-none cursor-pointer"
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

              {/* Mobile Card List View */}
              <div className="block sm:hidden divide-y divide-gray-100 dark:divide-slate-800/60">
                {transactions.map((t) => {
                  const isIncome = t.type === "INCOME";
                  return (
                    <div key={t.id} className="p-4 space-y-3 hover:bg-gray-50/30 dark:hover:bg-slate-800/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-gray-950 dark:text-white">
                            {t.description || t.category.name}
                          </h4>
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                            {t.type}
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${isIncome ? "text-emerald-500" : "text-gray-950 dark:text-white"}`}>
                          {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                        <span
                          className="px-2 py-0.5 rounded-full text-white font-semibold text-[10px]"
                          style={{ backgroundColor: t.category.color || "#6b7280" }}
                        >
                          {t.category.name}
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(t.date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800/60 pt-2.5">
                        <div>
                          {t.receiptImage ? (
                            <button
                              onClick={() => setReceiptViewerUrl(t.receiptImage)}
                              className="text-xs text-emerald-500 hover:underline flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No Receipt</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <button onClick={() => openEditModal(t)} className="text-gray-400 hover:text-white">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(t.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800/70 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)} of {totalCount} records
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-gray-600 dark:text-slate-300 focus:outline-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-gray-600 dark:text-slate-300 focus:outline-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-16 text-center text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-3">
              <ArrowRightLeft className="w-12 h-12 text-gray-300 dark:text-slate-700" />
              <p className="font-semibold text-sm">No transactions found</p>
              <p className="text-xs max-w-xs">Try clearing filters or click "Add Transaction" to enter items.</p>
            </div>
          )}
        </div>

        {/* Modal: Add Transaction */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600/75 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 text-gray-900 dark:text-white transition-all">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Add Transaction</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Amount and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Type
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => {
                        const newType = e.target.value as "INCOME" | "EXPENSE";
                        setFormType(newType);
                        setFormCategoryId(categories.find(c => c.type === newType)?.id || "");
                      }}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="EXPENSE">Expense (-)</option>
                      <option value="INCOME">Income (+)</option>
                    </select>
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
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter((c) => c.type === formType)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Groceries at Walmart"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Upload Receipt (Only for expenses) */}
                {formType === "EXPENSE" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Receipt Image
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingReceipt}
                        className="flex items-center space-x-1.5 px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 text-gray-600 dark:text-slate-300"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingReceipt ? "Uploading..." : "Upload Receipt"}</span>
                      </button>

                      {formReceiptImage && (
                        <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/10">
                          <FileImage className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">Uploaded</span>
                          <button
                            type="button"
                            onClick={() => setFormReceiptImage(null)}
                            className="text-emerald-400 hover:text-emerald-200 focus:outline-none ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
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
                    Save Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Transaction */}
        {isEditModalOpen && selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600/75 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 text-gray-900 dark:text-white transition-all">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Edit Transaction</h3>
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

                {/* Amount and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Type
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => {
                        const newType = e.target.value as "INCOME" | "EXPENSE";
                        setFormType(newType);
                        setFormCategoryId(categories.find(c => c.type === newType)?.id || "");
                      }}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="EXPENSE">Expense (-)</option>
                      <option value="INCOME">Income (+)</option>
                    </select>
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
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter((c) => c.type === formType)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Restaurant Lunch"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Upload Receipt (Only for expenses) */}
                {formType === "EXPENSE" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Receipt Image
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingReceipt}
                        className="flex items-center space-x-1.5 px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 text-gray-600 dark:text-slate-300"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingReceipt ? "Uploading..." : "Upload Receipt"}</span>
                      </button>

                      {formReceiptImage && (
                        <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/10">
                          <FileImage className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">Uploaded</span>
                          <button
                            type="button"
                            onClick={() => setFormReceiptImage(null)}
                            className="text-emerald-400 hover:text-emerald-200 focus:outline-none ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
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

        {/* Modal: View Receipt Image */}
        {receiptViewerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
            <button
              onClick={() => setReceiptViewerUrl(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-full focus:outline-none cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-xl bg-slate-900 p-2 shadow-2xl relative">
              <img
                src={receiptViewerUrl}
                alt="Receipt Attachment"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
