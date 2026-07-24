// src/components/admin/AuditTab.tsx

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, FileSpreadsheet, Eye } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchUsername, setSearchUsername] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const url = `/api/admin/audit?page=${pageNum}&limit=25&username=${searchUsername}&action=${filterAction}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filterAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionColor = (action: string) => {
    if (action.includes("FAIL") || action.includes("WARN")) return "text-red-500 bg-red-500/5 border-red-500/20";
    if (action.includes("SUCCESS") || action.includes("RESTORE") || action.includes("ACTIVATE")) return "text-emerald-500 bg-emerald-500/5 border-emerald-500/20";
    if (action.includes("DELETE")) return "text-red-400 bg-red-400/5 border-red-400/20";
    if (action.includes("UPDATE")) return "text-yellow-500 bg-yellow-500/5 border-yellow-500/20";
    return "text-zinc-500 bg-zinc-500/5 border-zinc-500/20";
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Controls & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 max-w-2xl w-full">
          {/* Username search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-9 py-2 text-xs text-black dark:text-white focus:outline-none"
            />
          </div>

          {/* Action Select filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-3 py-2 text-xs text-black dark:text-white focus:outline-none font-mono"
          >
            <option value="">All Actions</option>
            <option value="PASSWORD_AUTH_SUCCESS">PASSWORD_AUTH_SUCCESS</option>
            <option value="2FA_VERIFICATION_SUCCESS">2FA_VERIFICATION_SUCCESS</option>
            <option value="2FA_VERIFICATION_FAILED">2FA_VERIFICATION_FAILED</option>
            <option value="2FA_ACTIVATED">2FA_ACTIVATED</option>
            <option value="2FA_DEACTIVATED">2FA_DEACTIVATED</option>
            <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
            <option value="MEDIA_UPLOAD">MEDIA_UPLOAD</option>
            <option value="MEDIA_RENAME">MEDIA_RENAME</option>
            <option value="MEDIA_DELETE">MEDIA_DELETE</option>
            <option value="BACKUP_CREATE">BACKUP_CREATE</option>
            <option value="BACKUP_RESTORE">BACKUP_RESTORE</option>
            <option value="BACKUP_DELETE">BACKUP_DELETE</option>
          </select>

          <button
            type="submit"
            className="bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-mono text-xs tracking-wider px-4 py-2.5 rounded-lg"
          >
            SEARCH
          </button>
        </form>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs(page)}
            className="p-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg transition-colors text-zinc-500 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-950"
            title="Refresh logs list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-luxury-sm bg-white dark:bg-zinc-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900 text-[10px] font-mono text-zinc-400 uppercase">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Admin Account</th>
              <th className="p-4">Action Event</th>
              <th className="p-4">Client IP</th>
              <th className="p-4 text-center">Detail payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-zinc-400 font-mono">
                  RETRIEVING SECURITY LOGS...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-zinc-400 font-mono">
                  NO AUDIT EVENTS FOUND MATCHING SPECIFIED CRITERIA.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <td className="p-4 font-mono text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-200">
                    {log.username || "System Server"}
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white font-mono text-[9px] rounded-lg transition-colors bg-white dark:bg-zinc-950"
                    >
                      <Eye className="w-3 h-3" />
                      VIEW JSON
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            onClick={() => fetchLogs(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-xs disabled:opacity-30"
          >
            PREV
          </button>
          <span className="text-xs font-mono text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchLogs(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-xs disabled:opacity-30"
          >
            NEXT
          </button>
        </div>
      )}

      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedLog(null)} />
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl max-w-lg w-full p-6 shadow-luxury-lg z-10 font-mono text-xs relative overflow-hidden">
            <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase mb-3">Audit Log Payload</h4>
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg overflow-x-auto text-[10px] text-zinc-700 dark:text-zinc-300 leading-relaxed border border-zinc-200 dark:border-zinc-800 max-h-[50vh]">
              <pre>{JSON.stringify(JSON.parse(selectedLog.details), null, 2)}</pre>
            </div>
            <button
              onClick={() => setSelectedLog(null)}
              className="mt-4 w-full bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2 rounded text-center uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
