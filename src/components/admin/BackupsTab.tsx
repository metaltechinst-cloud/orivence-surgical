// src/components/admin/BackupsTab.tsx

import React, { useState, useEffect } from "react";
import { Database, Plus, Trash2, RefreshCw, Download, ShieldAlert, CheckCircle2 } from "lucide-react";

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

export default function BackupsTab() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/backups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      } else {
        const errData = await res.json();
        setFeedback({ type: "error", msg: errData.error || "Failed to load backups list." });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", msg: "Network error loading backups." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setActionLoading("create");
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBackups([data.backup, ...backups]);
        setFeedback({ type: "success", msg: `Backup ${data.backup.filename} created successfully.` });
      } else {
        setFeedback({ type: "error", msg: data.error || "Failed to trigger backup creation." });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", msg: "Network error creating backup." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`WARNING: Restoring will overwrite the current database and uploads folder with ${filename}. Are you sure you want to proceed?`)) {
      return;
    }
    setActionLoading(`restore_${filename}`);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/backups", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", msg: "System state restored successfully. Reloading settings..." });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setFeedback({ type: "error", msg: data.error || "Failed to restore backup." });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", msg: "Network error during restore process." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to permanently delete the backup file ${filename}?`)) {
      return;
    }
    setActionLoading(`delete_${filename}`);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/backups?filename=${filename}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBackups(backups.filter(b => b.filename !== filename));
        setFeedback({ type: "success", msg: "Backup file deleted successfully." });
      } else {
        setFeedback({ type: "error", msg: data.error || "Failed to delete backup." });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", msg: "Network error deleting backup." });
    } finally {
      setActionLoading(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Database & Assets Backup Manager:
          </span>
          <p className="text-[10px] text-zinc-400 mt-1">Daily backups run automatically. Restore compiles database structure & public media assets instantly.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBackups}
            className="p-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg transition-colors text-zinc-500 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-950"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading !== null}
            className="flex items-center gap-1.5 bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-mono text-xs tracking-wider font-semibold px-4 py-2.5 rounded-lg transition-all shadow-luxury-sm"
          >
            <Plus className="w-4 h-4" />
            {actionLoading === "create" ? "CREATING BACKUP..." : "CREATE BACKUP"}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs ${
          feedback.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0" /> : <ShieldAlert className="w-4.5 h-4.5 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Backups List Table */}
      <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-luxury-sm bg-white dark:bg-zinc-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900 text-[10px] font-mono text-zinc-400 uppercase">
              <th className="p-4">Backup File Archive</th>
              <th className="p-4">Size</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4 text-center">System Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {loading && backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-zinc-400 font-mono">
                  LOADING SYSTEM FILES...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-zinc-400 font-mono">
                  NO BACKUP ARCHIVES FOUND. CREATE AN INITIAL BACKUP TO SECURE STATE.
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.filename} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <td className="p-4 font-mono font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-zinc-400 shrink-0" />
                    {b.filename}
                  </td>
                  <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">
                    {formatSize(b.size)}
                  </td>
                  <td className="p-4 text-zinc-500">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRestoreBackup(b.filename)}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-500 font-mono text-[10px] font-bold rounded-lg transition-colors bg-white dark:bg-zinc-950"
                    >
                      RESTORE
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(b.filename)}
                      disabled={actionLoading !== null}
                      className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 text-zinc-500 hover:text-red-500 rounded-lg transition-colors bg-white dark:bg-zinc-950"
                      title="Delete Backup"
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

    </div>
  );
}
