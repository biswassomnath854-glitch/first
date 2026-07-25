"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mockLink, setMockLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setMockLink(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Failed to process request");
      }

      setSuccess(resData.message);
      if (resData.resetLink) {
        setMockLink(resData.resetLink);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden select-none">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px]" />

      <div className="w-full max-w-md space-y-8 glassmorphism p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 text-white bg-slate-950/45">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-slate-800 rounded-full text-emerald-400">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Reset password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Enter your email and we'll simulate sending a reset link.
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-200 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
            
            {mockLink && (
              <div className="bg-slate-900 border border-emerald-500/20 p-5 rounded-xl text-sm space-y-3">
                <p className="font-semibold text-emerald-400 text-xs uppercase tracking-wider">
                  Development Mode Simulation:
                </p>
                <p className="text-slate-300 text-xs">
                  We intercepted a reset link. Click the button below to test resetting the password.
                </p>
                <Link
                  href={mockLink}
                  className="inline-block w-full text-center py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  Go to Reset Password Form
                </Link>
              </div>
            )}
          </div>
        )}

        {!success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/10"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
