// src/components/admin/UsersTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, RefreshCw, Key, Shield, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create user form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  
  // Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  
  // Permissions Matrix viewer state
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const err = await res.json();
        setFeedback({ type: "error", msg: err.error || "Failed to load admin users." });
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", msg: "Network error loading users list." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUsers([data.user, ...users]);
        setFeedback({ type: "success", msg: `Account "${data.user.username}" created with role ${data.user.role}.` });
        setShowCreateModal(false);
        setUsername("");
        setPassword("");
        setRole("VIEWER");
      } else {
        setFeedback({ type: "error", msg: data.error || "Failed to create account." });
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", msg: "Network error creating user." });
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the administrative account "${name}"?`)) return;
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        setFeedback({ type: "success", msg: `Administrative account "${name}" deleted.` });
      } else {
        setFeedback({ type: "error", msg: data.error || "Failed to delete user." });
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", msg: "Network error deleting user." });
    }
  };

  const roleDefinitions = [
    { name: "OWNER", desc: "Full root capabilities, backup restore access, user creation, sitemap compiles, settings, CRM logs." },
    { name: "ADMIN", desc: "Full root access except other administrators creation. Backup creation, website parameters configuration, sitemap compilations, settings." },
    { name: "PRODUCT_MANAGER", desc: "Catalog specifications edit capabilities, Product Studio overlays, 360 sequence uploads, CSV sheets updates." },
    { name: "CONTENT_MANAGER", desc: "Static visual content editor access, homepage section visible order controls, about/contact blocks rich-text updates." },
    { name: "SALES_MANAGER", desc: "Full CRM pipeline logs viewing, quotation spec PDFs compiler access, CRM comments timeline logging." },
    { name: "SEO_MANAGER", desc: "Global and per-product SEO metadata titles, descriptions, keyword arrays and Plausible tag parameters configuration." },
    { name: "VIEWER", desc: "Read-only access to visual charts and summary dashboards. Editing is entirely locked out." }
  ];

  return (
    <div className="flex flex-col gap-6 text-xs font-mono">
      
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-4">
        <div>
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Administrative Accounts & Role Matrix:
          </span>
          <p className="text-[10px] text-zinc-400 mt-1">Configure role privileges. Multi-Role RBAC grants strict route & database mutation filters.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMatrixModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 hover:border-black dark:hover:border-white transition-colors"
          >
            <Info className="w-4 h-4" />
            ROLE MATRIX
          </button>
          <button
            onClick={fetchUsers}
            className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg transition-colors text-zinc-500 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-950"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-luxury-sm"
          >
            <UserPlus className="w-4 h-4" />
            CREATE ACCOUNT
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs ${
          feedback.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Users table */}
      <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-luxury-sm bg-white dark:bg-zinc-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900 text-[10px] font-mono text-zinc-400 uppercase">
              <th className="p-4">Administrative Account</th>
              <th className="p-4">Role Privileges</th>
              <th className="p-4">2FA Secured Status</th>
              <th className="p-4">Created Date</th>
              <th className="p-4 text-center">Management Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-zinc-400 font-mono">
                  LOADING SECURE CONSOLE USERS...
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-200">
                    {u.username}
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      u.twoFactorEnabled 
                        ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" 
                        : "text-zinc-400 border-zinc-250 dark:border-zinc-800"
                    }`}>
                      {u.twoFactorEnabled ? "2FA SHIELD ENABLED" : "2FA UNPROTECTED"}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 text-zinc-500 hover:text-red-500 rounded-lg transition-colors bg-white dark:bg-zinc-950"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <form 
            onSubmit={handleCreateUser}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl w-full max-w-sm shadow-luxury-lg z-10 glass-panel overflow-hidden relative p-6 flex flex-col gap-4 bg-white/95 dark:bg-black/95 backdrop-blur-md"
          >
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase font-display border-b border-zinc-100 dark:border-zinc-900 pb-2">
              Create Admin User
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sales_agent"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase">Access Role Matrix *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none font-bold"
              >
                <option value="ADMIN">ADMIN (Full Console Settings)</option>
                <option value="PRODUCT_MANAGER">PRODUCT_MANAGER (Product Specs)</option>
                <option value="CONTENT_MANAGER">CONTENT_MANAGER (Homepage visual content)</option>
                <option value="SALES_MANAGER">SALES_MANAGER (Inquiries CRM)</option>
                <option value="SEO_MANAGER">SEO_MANAGER (Metadata Configuration)</option>
                <option value="VIEWER">VIEWER (Read-Only Charts)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-550"
              >
                CANCEL
              </button>
              <button 
                type="submit"
                className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded font-bold"
              >
                CREATE
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROLE MATRIX MODAL */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowMatrixModal(false)} />
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl w-full max-w-lg shadow-luxury-lg z-10 glass-panel overflow-hidden relative p-6 bg-white/95 dark:bg-black/95 backdrop-blur-md max-h-[80vh] flex flex-col">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase font-display border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-4 shrink-0">
              Access Privileges Definition Matrix
            </h3>
            <div className="overflow-y-auto pr-2 flex flex-col gap-4 flex-grow no-scrollbar">
              {roleDefinitions.map((role) => (
                <div key={role.name} className="flex flex-col gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-900 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-zinc-900 dark:text-white text-xs">{role.name}</span>
                  </div>
                  <p className="font-sans text-zinc-500 leading-relaxed text-[11px] pl-6">{role.desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMatrixModal(false)}
              className="mt-6 w-full bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded-lg text-center uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
