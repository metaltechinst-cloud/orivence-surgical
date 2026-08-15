// src/components/admin/CommandPaletteModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, X, Package, Folders, Upload, ClipboardList, 
  Settings, FileSpreadsheet, ArrowRight, CornerDownLeft, Sparkles, Command
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string, data: any) => void;
}

export default function CommandPaletteModal({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    products: any[];
    categories: any[];
    media: any[];
    inquiries: any[];
    settings: any[];
    auditLogs: any[];
  }>({
    products: [],
    categories: [],
    media: [],
    inquiries: [],
    settings: [],
    auditLogs: []
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open command palette
          onSelectAction("OPEN_PALETTE", null);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ products: [], categories: [], media: [], inquiries: [], settings: [], auditLogs: [] });
    }
  }, [isOpen]);

  // Real-time API query
  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], categories: [], media: [], inquiries: [], settings: [], auditLogs: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`/api/search?admin=true&q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setResults({
            products: json.products || [],
            categories: json.categories || [],
            media: json.media || [],
            inquiries: json.inquiries || [],
            settings: json.settings || [],
            auditLogs: json.auditLogs || []
          });
        }
      } catch (e) {
        console.error("Global search error:", e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = 
    results.products.length + 
    results.categories.length + 
    results.media.length + 
    results.inquiries.length + 
    results.settings.length + 
    results.auditLogs.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-3xl bg-[#0b131e] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Header Bar */}
        <div className="p-4 border-b border-[#1e293b] bg-slate-900/60 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#14919b] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories, media, inquiries, audit logs... (Ctrl + K)"
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 font-mono text-sm focus:outline-none"
          />
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#14919b] border-t-transparent rounded-full animate-spin shrink-0" />
          ) : query ? (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-[10px] font-mono text-slate-400 border border-slate-700">
              <Command className="w-3 h-3" /> K
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          
          {query.trim() && totalResults === 0 && !loading && (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <Search className="w-8 h-8 text-slate-600" />
              <span className="font-mono text-xs text-slate-400">No matching database records found for "{query}"</span>
            </div>
          )}

          {!query.trim() && (
            <div className="py-10 text-center flex flex-col items-center gap-2 text-slate-500 font-mono text-xs">
              <Sparkles className="w-6 h-6 text-[#14919b]" />
              <span>Type a query to search live PostgreSQL database records.</span>
            </div>
          )}

          {/* 1. Products Section */}
          {results.products.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold text-[#14919b] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> PRODUCTS ({results.products.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {results.products.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => { onSelectAction("PRODUCT", prod); onClose(); }}
                    className="p-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] font-bold text-[#14919b]">
                        SKU
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-100 group-hover:text-[#14919b] transition-colors">{prod.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">SKU: {prod.sku} | Category: {prod.category?.name || "General"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${prod.status === "PUBLISHED" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>
                        {prod.status}
                      </span>
                      <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Categories Section */}
          {results.categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold text-[#14919b] uppercase tracking-wider flex items-center gap-1.5">
                <Folders className="w-3.5 h-3.5" /> CATEGORIES ({results.categories.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {results.categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => { onSelectAction("CATEGORY", cat); onClose(); }}
                    className="p-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Folders className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-100 group-hover:text-[#14919b] transition-colors">{cat.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">Slug: /{cat.slug}</span>
                      </div>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Inquiries Section */}
          {results.inquiries.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold text-[#14919b] uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> INQUIRIES ({results.inquiries.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {results.inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    onClick={() => { onSelectAction("INQUIRY", inq); onClose(); }}
                    className="p-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] text-amber-400 font-bold">
                        RFQ
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-100 group-hover:text-[#14919b] transition-colors">{inq.name} ({inq.referenceNo})</span>
                        <span className="font-mono text-[10px] text-slate-400">Email: {inq.email} | Product: {inq.productName}</span>
                      </div>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Media Section */}
          {results.media.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold text-[#14919b] uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> MEDIA ASSETS ({results.media.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {results.media.map((med) => (
                  <div
                    key={med.id}
                    onClick={() => { onSelectAction("MEDIA", med); onClose(); }}
                    className="p-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] text-purple-400 font-bold">
                        IMG
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-100 group-hover:text-[#14919b] transition-colors">{med.filename}</span>
                        <span className="font-mono text-[10px] text-slate-400">Folder: {med.folder} | Size: {(med.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Audit Logs Section */}
          {results.auditLogs.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold text-[#14919b] uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> AUDIT ACTIVITY ({results.auditLogs.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {results.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => { onSelectAction("AUDIT", log); onClose(); }}
                    className="p-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-slate-100 group-hover:text-[#14919b] transition-colors">{log.action}</span>
                      <span className="font-mono text-[10px] text-slate-400">By {log.username} on {new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 border-t border-[#1e293b] bg-slate-950 font-mono text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-bold border border-slate-700">ESC</kbd> to exit</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-bold border border-slate-700">Ctrl+K</kbd> anywhere</span>
          </div>
          <span className="text-[#14919b] font-bold">ORIVENCE GLOBAL SEARCH</span>
        </div>

      </div>
    </div>
  );
}
