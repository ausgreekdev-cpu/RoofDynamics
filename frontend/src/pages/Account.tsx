"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Bell, Palette, LogOut, Key } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/Toast";
import { api } from "../services/api";

export default function Account() {
  const { user, tenant, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateUser({ name });
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F8FAFC]">My Account</h1>
        <p className="text-sm text-[#94A3B8]">Manage your profile, security, and preferences.</p>
      </div>

      {/* Profile */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <User className="w-4 h-4 text-[#0EA5E9]" /> Profile
        </h2>
        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Email</label>
          <input
            value={user?.email ?? ""}
            disabled
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#94A3B8] text-sm cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Role</label>
          <p className="text-sm text-[#F8FAFC]">{user?.role ?? "—"}</p>
        </div>
        <div>
          <label className="block text-xs text-[#94A3B8] mb-1">Tenant</label>
          <p className="text-sm text-[#F8FAFC]">{tenant?.name ?? "—"}</p>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>

      {/* Security */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0EA5E9]" /> Security
        </h2>
        <p className="text-xs text-[#94A3B8]">Change your password to keep your account secure.</p>
        <button
          onClick={() => toast.info("Password change coming soon")}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#1E293B] border border-[#334155] rounded text-[#94A3B8] hover:text-[#F8FAFC]"
        >
          <Key className="w-3 h-3" /> Change Password
        </button>
      </div>

      {/* Preferences */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#0EA5E9]" /> Preferences
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#F8FAFC]">Theme</p>
            <p className="text-xs text-[#94A3B8]">Dark / Light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-lg text-sm bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]"
          >
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#0EA5E9]" /> Notifications
        </h2>
        <p className="text-xs text-[#94A3B8]">Manage notification preferences in Settings → Notifications.</p>
        <button
          onClick={() => navigate("/settings")}
          className="text-xs text-[#0EA5E9] hover:underline"
        >
          Go to Settings
        </button>
      </div>

      {/* Sign out */}
      <div className="bg-[#1E293B] border border-[#EF4444]/30 rounded-xl p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-[#EF4444]/20 text-[#EF4444] font-bold rounded-lg text-sm hover:bg-[#EF4444]/30 transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
