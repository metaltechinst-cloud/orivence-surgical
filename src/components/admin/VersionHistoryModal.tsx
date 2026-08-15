// src/components/admin/VersionHistoryModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { History, X, RotateCcw, Clock, User, CheckCircle2, AlertTriangle, Shield, Layers } from "lucide-react";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVersionRestored: () => void;
}

export default function VersionHistoryModal({ isOpen, onClose, onVersionRestored }: VersionHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/versions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setVersions(json.versions || []);
      }
    } catch (e) {
      console.error("Fetch versions error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen]);

  const handleRestore = async (version: any) => {
    if (!confirm(`Are you sure you want to restore "${version.summary}"? Current state will be overwritten with this historical snapshot.`)) {
      return;
    }

    setRestoringId(version.id);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "restore",
          versionId: version.id
        })
      });

      if (res.ok) {
        alert(`Successfully restored historical version from ${new Date(version.timestamp).toLocaleString()}!`);
        onVersionRestored();
        onClose();
      } else {
        const json = await res.json();
        alert(`Restoration failed: ${json.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Restore error:", e);
      alert("Network error during version restoration.");
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0b131e] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100 font-mono text-xs">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-[#1e293b] bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#14919b]" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Version History & Database Restoration</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          
          <div className="p-3 bg-[#0a5c67]/20 border border-[#14919b]/30 rounded-xl text-[11px] text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#14919b] shrink-0" />
            <span>Persistent Version Stack: Restoring a historical snapshot reverts your live Supabase PostgreSQL database state instantly.</span>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-[#14919b] border-t-transparent rounded-full animate-spin mr-2" />
              <span>Loading version history stack...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono">
              No historical version snapshots created yet. Snapshots are recorded when homepage or settings changes are published.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {versions.map((ver, idx) => (
                <div 
                  key={ver.id}
                  className="p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#0a5c67] text-[#14919b] rounded text-[9px] font-bold uppercase">
                        {ver.entity}
                      </span>
                      <span className="font-bold text-slate-100 text-xs">{ver.summary}</span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[9px] font-bold">
                          CURRENT HEAD
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-sans mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(ver.timestamp).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <User className="w-3 h-3 text-slate-500" />
                        {ver.changedBy}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(ver)}
                    disabled={restoringId === ver.id}
                    className="px-3.5 py-2 border border-[#14919b]/50 hover:border-[#14919b] rounded-lg bg-[#0a5c67]/30 text-[#14919b] hover:bg-[#0a5c67]/60 text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    {restoringId === ver.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>RESTORE VERSION</span>
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-3 border-t border-[#1e293b] bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>Clicking RESTORE creates a backup of current state before applying historical data.</span>
          <button onClick={onClose} className="px-4 py-1.5 border border-slate-700 rounded font-bold hover:bg-slate-800 text-white">
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
