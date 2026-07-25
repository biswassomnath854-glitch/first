"use client";

import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  Key
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  
  // States
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state from session
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setAvatar(session.user.avatar || null);
    }
  }, [session]);

  // Handle Avatar image upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload image");

      setAvatar(data.url);
      setSuccess("Profile picture uploaded! Click 'Save Settings' to apply.");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Submit Profile update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Name cannot be blank");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Profile update failed");

      // Update next-auth session cache
      await update({
        name: data.user.name,
        avatar: data.user.avatar,
      });

      setSuccess("Profile settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Password update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password change failed");

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Account Settings">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Intro */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Profile Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Edit your personal workspace preferences, profile image, and credentials.
          </p>
        </div>

        {/* Global Notifications Banners */}
        {error && (
          <div className="flex items-center space-x-2.5 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Grid panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: Avatar Card */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col items-center justify-between text-center relative overflow-hidden shadow-sm">
            <div className="space-y-4 w-full">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Workspace Avatar
              </span>
              
              <div className="relative group w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                <img
                  className="w-full h-full object-cover"
                  src={avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop"}
                  alt="User Avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session?.user?.name || "User")}`;
                  }}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  <span>Upload</span>
                </button>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
              />

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Supports JPG, PNG or WebP files.<br />Max image size is 5MB.
              </p>
            </div>

            {/* Quick account metadata */}
            <div className="w-full pt-4 mt-6 border-t border-gray-100 dark:border-slate-800 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-400">System Role</span>
                <span className="inline-flex items-center space-x-1 text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase text-[9px] tracking-wider">
                  <Shield className="w-3 h-3 mr-0.5" />
                  {session?.user?.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-400">Join Date</span>
                <span className="text-gray-700 dark:text-slate-300">
                  {session?.user ? new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: Information forms */}
          <div className="md:col-span-2 space-y-6">
            {/* Panel 1: Profile information */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
              <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-3 mb-4">
                Personal Workspace Information
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Email Address (Read Only)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        disabled
                        value={session?.user?.email || ""}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-100 pl-10 pr-3 py-2.5 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-400 cursor-pointer disabled:opacity-50 transition-colors shadow-md shadow-emerald-500/10"
                  >
                    {loading ? "Saving settings..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>

            {/* Panel 2: Credentials reset */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
              <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-3 mb-4 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-gray-400" />
                <span>Security Credentials</span>
              </h3>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Current Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-sm cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
