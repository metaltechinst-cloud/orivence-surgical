// src/components/admin/MediaPickerModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Search, FileText, Image as ImageIcon, Video, RefreshCw } from "lucide-react";

interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  allowedType?: "image" | "pdf" | "video" | "all";
}

export default function MediaPickerModal({ isOpen, onClose, onSelect, allowedType = "all" }: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      // Fetch all assets
      const res = await fetch("/api/media?folder=/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error("Failed to load picker assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter assets on client side
  const filtered = assets.filter((asset) => {
    const filenameMatch = asset.filename.toLowerCase().includes(search.toLowerCase());
    if (!filenameMatch) return false;

    if (allowedType === "image") {
      return asset.type.startsWith("image/");
    }
    if (allowedType === "pdf") {
      return asset.type.includes("pdf");
    }
    if (allowedType === "video") {
      return asset.type.startsWith("video/");
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Content */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-luxury-lg z-10 overflow-hidden relative font-mono text-xs text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase">Select Visual Asset</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Filter: {allowedType.toUpperCase()} | Click any file below to select</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-55/30 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded px-9 py-2 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-grow overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-400">
              No matching assets found in Media Library.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {filtered.map((asset) => {
                const isImage = asset.type.startsWith("image/");
                const isPdf = asset.type.includes("pdf");

                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      onSelect(asset.url);
                      onClose();
                    }}
                    className="border border-zinc-200 dark:border-zinc-850 hover:border-black dark:hover:border-white rounded-xl p-3 flex flex-col gap-2 cursor-pointer bg-zinc-50/30 dark:bg-zinc-950 transition-all hover:scale-102"
                  >
                    <div className="aspect-square w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 flex items-center justify-center overflow-hidden p-1 relative">
                      {isImage ? (
                        <img src={asset.url} alt={asset.filename} className="w-full h-full object-contain" />
                      ) : isPdf ? (
                        <FileText className="w-10 h-10 text-red-500" />
                      ) : (
                        <Video className="w-10 h-10 text-blue-500" />
                      )}
                    </div>
                    <span className="font-bold text-[10px] truncate block text-zinc-900 dark:text-zinc-200" title={asset.filename}>
                      {asset.filename}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-150 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-350 dark:border-zinc-800 rounded font-bold"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
