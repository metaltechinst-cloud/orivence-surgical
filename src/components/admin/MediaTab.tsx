// src/components/admin/MediaTab.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Folder, File, Upload, Trash2, Search, Edit2, 
  FolderPlus, RefreshCw, FileText, ArrowLeft, Image as ImageIcon,
  CheckCircle, AlertCircle, Copy, Check, Eye, Tag
} from "lucide-react";
import Image from "next/image";

interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  folder: string;
  altText?: string;
  title?: string;
  createdAt: string;
}

export default function MediaTab() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<string[]>(["/"]);
  const [currentFolder, setCurrentFolder] = useState<string>("/");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Selection & SEO Metadata
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [currentAlt, setCurrentAlt] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Actions Modals / States
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameAsset, setRenameAsset] = useState<MediaAsset | null>(null);
  const [newFilename, setNewFilename] = useState("");
  const [replacingAsset, setReplacingAsset] = useState<MediaAsset | null>(null);
  
  // Drag and Drop
  const [dragOver, setDragOver] = useState(false);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const url = `/api/media?folder=${encodeURIComponent(currentFolder)}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        if (data.folders) {
          setFolders(data.folders);
        }
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [currentFolder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets();
  };

  const handleSelectAsset = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setCurrentAlt(asset.altText || "");
    setCurrentTitle(asset.title || "");
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const token = localStorage.getItem("admin_token");
    const formData = new FormData();
    formData.append("folder", currentFolder);
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        fetchAssets();
      } else {
        alert("Upload failed. Ensure images are valid formats.");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error.");
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (file: File) => {
    if (!replacingAsset) return;
    setUploading(true);
    const token = localStorage.getItem("admin_token");
    const formData = new FormData();
    formData.append("action", "replace");
    formData.append("id", replacingAsset.id);
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setReplacingAsset(null);
        setSelectedAsset(null);
        fetchAssets();
      } else {
        alert("Replacement failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Replacement error.");
    } finally {
      setUploading(false);
    }
  };

  const [deleteWarning, setDeleteWarning] = useState<{ asset: MediaAsset; usages: { type: string; name: string }[] } | null>(null);

  const handleDelete = async (asset: MediaAsset, force = false) => {
    const token = localStorage.getItem("admin_token");

    if (!force) {
      // Check for dependencies first via /api/media/usage
      try {
        const checkRes = await fetch(`/api/media/usage?id=${asset.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (data.isUsed && data.usedIn?.length > 0) {
            setDeleteWarning({ asset, usages: data.usedIn });
            return;
          }
        }
      } catch (err) {
        console.error("Dependency check error:", err);
      }

      if (!confirm(`Are you sure you want to permanently delete "${asset.filename}"?`)) return;
    }

    try {
      const res = await fetch(`/api/media?id=${asset.id}&force=${force ? "true" : "false"}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteWarning(null);
        setSelectedAsset(null);
        fetchAssets();
      } else {
        alert("Delete failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameAsset || !newFilename.trim()) return;
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/media", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "rename",
          id: renameAsset.id,
          newFilename: newFilename.trim()
        })
      });
      if (res.ok) {
        setRenameAsset(null);
        setNewFilename("");
        setSelectedAsset(null);
        fetchAssets();
      } else {
        alert("Rename failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMetadata = async () => {
    if (!selectedAsset) return;
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/media", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "updateMetadata",
          id: selectedAsset.id,
          altText: currentAlt,
          title: currentTitle
        })
      });
      if (res.ok) {
        alert("Image SEO metadata saved successfully.");
        // update selected asset in state
        setSelectedAsset({
          ...selectedAsset,
          altText: currentAlt,
          title: currentTitle
        });
        fetchAssets();
      } else {
        alert("Failed to save metadata.");
      }
    } catch (err) {
      console.error("Save metadata error:", err);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    let cleaned = newFolderName.trim().replace(/\/+/g, "/");
    if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
    
    if (!folders.includes(cleaned)) {
      setFolders([...folders, cleaned].sort());
    }
    setCurrentFolder(cleaned);
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(window.location.origin + text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getSubfolders = () => {
    const prefix = currentFolder === "/" ? "/" : currentFolder + "/";
    const setOfSubs = new Set<string>();
    
    folders.forEach(f => {
      if (f === currentFolder) return;
      if (f.startsWith(prefix)) {
        const remainder = f.slice(prefix.length);
        const nextSlash = remainder.indexOf("/");
        const sub = nextSlash === -1 ? remainder : remainder.slice(0, nextSlash);
        if (sub) {
          setOfSubs.add(prefix + sub);
        }
      }
    });

    return Array.from(setOfSubs);
  };

  const subfolders = getSubfolders();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-mono">
      {/* LEFT SIDE: Folder navigation and files grid */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Navigation / controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            {currentFolder !== "/" && (
              <button 
                onClick={() => {
                  const parts = currentFolder.split("/");
                  parts.pop();
                  const parent = parts.join("/") || "/";
                  setCurrentFolder(parent);
                }}
                className="p-1 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase">Current Virtual Directory</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{currentFolder}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 hover:border-black dark:hover:border-white transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              NEW FOLDER
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white rounded-lg font-semibold transition-all shadow-luxury-sm"
            >
              <Upload className="w-4 h-4" />
              UPLOAD FILE
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              onChange={(e) => handleUpload(e.target.files)} 
              className="hidden" 
            />
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search assets in current folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-9 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:border-black dark:hover:border-white transition-colors"
          >
            SEARCH
          </button>
        </form>

        {/* Drag Over Area / Grid */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className={`min-h-[400px] border-2 border-dashed rounded-2xl p-6 transition-all relative ${
            dragOver ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/20" : "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/20"
          }`}
        >
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 z-10 rounded-2xl">
              <div className="text-center font-bold text-sm">DROP FILES TO UPLOAD TO {currentFolder}</div>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Virtual Folders Grid */}
              {subfolders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest">Directories</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {subfolders.map((f) => {
                      const name = f.slice(f.lastIndexOf("/") + 1);
                      return (
                        <div
                          key={f}
                          onClick={() => setCurrentFolder(f)}
                          className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 hover:border-black dark:hover:border-white cursor-pointer transition-colors"
                        >
                          <Folder className="w-5 h-5 text-zinc-400 fill-zinc-400/15" />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media Files Grid */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest">Files ({assets.length})</span>
                {assets.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400">
                    No files found in folder {currentFolder}. Drag & drop files here to upload.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {assets.map((asset) => {
                      const isPdf = asset.type.includes("pdf");
                      return (
                        <div
                          key={asset.id}
                          onClick={() => handleSelectAsset(asset)}
                          className={`border rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all bg-white dark:bg-zinc-950/45 ${
                            selectedAsset?.id === asset.id 
                              ? "border-black dark:border-white shadow-luxury-md" 
                              : "border-zinc-200 dark:border-zinc-850 hover:border-zinc-400 dark:hover:border-zinc-800"
                          }`}
                        >
                          <div className="aspect-square w-full bg-zinc-50 dark:bg-zinc-900/30 rounded-lg flex items-center justify-center border border-zinc-100 dark:border-zinc-900 relative overflow-hidden">
                            {isPdf ? (
                              <FileText className="w-14 h-14 text-red-500" />
                            ) : (
                              <Image
                                src={asset.url}
                                alt={asset.altText || asset.filename}
                                width={160}
                                height={160}
                                className="object-contain max-h-[85%] max-w-[85%] transition-transform hover:scale-105 duration-300"
                              />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-zinc-900 dark:text-zinc-200 block truncate" title={asset.filename}>
                              {asset.filename}
                            </span>
                            <div className="flex justify-between text-[9px] text-zinc-400 mt-1.5 font-mono">
                              <span>{formatBytes(asset.size)}</span>
                              <span>{asset.type.split("/")[1].toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Detail Inspector & Actions */}
      <div className="lg:col-span-4">
        <div className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-luxury-sm bg-white dark:bg-zinc-950 sticky top-24">
          {selectedAsset ? (
            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                Asset Inspector
              </h3>

              <div className="aspect-square w-full bg-zinc-50 dark:bg-zinc-900/30 rounded-xl flex items-center justify-center border border-zinc-150 dark:border-zinc-900 overflow-hidden relative">
                {selectedAsset.type.includes("pdf") ? (
                  <FileText className="w-20 h-20 text-red-500" />
                ) : (
                  <Image
                    src={selectedAsset.url}
                    alt={selectedAsset.altText || selectedAsset.filename}
                    width={250}
                    height={250}
                    className="object-contain max-h-[90%] max-w-[90%]"
                  />
                )}
              </div>

              {/* SEO & Image Alt Text Fields */}
              <div className="border border-zinc-200 dark:border-zinc-900 p-3.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" />
                  SEO Image Attributes
                </span>
                
                <div className="flex flex-col gap-1.5">
                  <span>Image Alt Text</span>
                  <input
                    type="text"
                    value={currentAlt}
                    onChange={(e) => setCurrentAlt(e.target.value)}
                    placeholder="e.g. Orivance isolation tweezers model TS-15"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-black dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span>Image Title Attribute</span>
                  <input
                    type="text"
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    placeholder="e.g. Calibrated Surgical Tweezers"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-black dark:text-white"
                  />
                </div>

                <button
                  onClick={handleSaveMetadata}
                  className="w-full py-1.5 bg-black dark:bg-white text-white dark:text-black rounded font-bold hover:opacity-90 font-mono transition-opacity"
                >
                  SAVE SEO ATTRIBUTES
                </button>
              </div>

              <div className="flex flex-col gap-3 font-sans text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase">Filename</span>
                  <span className="font-semibold text-zinc-900 dark:text-white break-all">{selectedAsset.filename}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase">File Size</span>
                    <span className="font-semibold text-zinc-900 dark:text-white font-mono">{formatBytes(selectedAsset.size)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase">Mime Type</span>
                    <span className="font-semibold text-zinc-900 dark:text-white font-mono">{selectedAsset.type}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase">Asset URL Path</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={selectedAsset.url}
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 flex-grow focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedAsset.url, selectedAsset.id)}
                      className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded bg-white dark:bg-zinc-950 transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === selectedAsset.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={selectedAsset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded bg-white dark:bg-zinc-950 transition-colors"
                      title="Preview in new tab"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900 font-mono">
                <button
                  onClick={() => {
                    setRenameAsset(selectedAsset);
                    setNewFilename(selectedAsset.filename);
                  }}
                  className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg flex items-center justify-center gap-2 transition-all font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  RENAME FILE
                </button>
                <button
                  onClick={() => {
                    setReplacingAsset(selectedAsset);
                    replaceInputRef.current?.click();
                  }}
                  className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg flex items-center justify-center gap-2 transition-all font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  REPLACE ASSET FILE
                </button>
                <input 
                  type="file" 
                  ref={replaceInputRef} 
                  onChange={(e) => e.target.files && handleReplace(e.target.files[0])} 
                  className="hidden" 
                />
                <button
                  onClick={() => handleDelete(selectedAsset)}
                  className="w-full py-2.5 border border-red-500/20 hover:border-red-500 text-red-500 rounded-lg flex items-center justify-center gap-2 transition-all font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  DELETE PERMANENTLY
                </button>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              Select an asset from the media library grid to inspect its details and execute file operations.
            </div>
          )}
        </div>
      </div>

      {/* NEW FOLDER MODAL */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNewFolderModal(false)} />
          <form 
            onSubmit={handleCreateFolder}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl w-full max-w-sm shadow-luxury-lg z-10 glass-panel overflow-hidden relative p-6 flex flex-col gap-4"
          >
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase font-display border-b border-zinc-100 dark:border-zinc-900 pb-2">
              Create Virtual Directory
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase">Folder Path *</label>
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. tweezers/isolation"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setShowNewFolderModal(false)}
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

      {/* RENAME MODAL */}
      {renameAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setRenameAsset(null)} />
          <form 
            onSubmit={handleRenameSubmit}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl w-full max-w-sm shadow-luxury-lg z-10 glass-panel overflow-hidden relative p-6 flex flex-col gap-4"
          >
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase font-display border-b border-zinc-100 dark:border-zinc-900 pb-2">
              Rename File
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase">New Filename *</label>
              <input
                type="text"
                required
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                placeholder="filename"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setRenameAsset(null)}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded text-zinc-550"
              >
                CANCEL
              </button>
              <button 
                type="submit"
                className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded font-bold"
              >
                RENAME
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DEPENDENCY WARNING MODAL */}
      {deleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeleteWarning(null)} />
          <div className="bg-white dark:bg-zinc-950 border border-red-500/30 rounded-2xl w-full max-w-md shadow-luxury-lg z-10 p-6 flex flex-col gap-4 relative font-sans">
            <div className="flex items-center gap-3 text-red-500 font-mono font-bold text-sm">
              <AlertCircle className="w-6 h-6" />
              <span>ASSET IN USE — DEPENDENCY WARNING</span>
            </div>
            
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              The asset <strong className="text-zinc-900 dark:text-white font-mono">{deleteWarning.asset.filename}</strong> is currently referenced in <strong className="text-red-500">{deleteWarning.usages.length} location(s)</strong> across your catalog:
            </p>

            <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-2 font-mono text-[11px]">
              {deleteWarning.usages.map((u, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-none">
                  <span className="text-zinc-400">{u.type}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{u.name}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-zinc-400 italic">
              Deleting this file may result in broken images or missing documents on your live website.
            </p>

            <div className="flex justify-end gap-3 mt-2 font-mono">
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold hover:border-black dark:hover:border-white transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteWarning.asset, true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-luxury-sm"
              >
                DELETE ANYWAY (FORCE)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for replacement */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <RefreshCw className="w-10 h-10 animate-spin text-white mb-2" />
          <span className="text-white text-sm font-bold tracking-widest font-mono">PROCESSING MEDIA ASSET...</span>
        </div>
      )}
    </div>
  );
}
