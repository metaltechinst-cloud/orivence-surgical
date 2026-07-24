// src/components/admin/SettingsTab.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Settings, Mail, Lock, CheckCircle2, 
  AlertCircle, Globe, FileText, Upload, RefreshCw, Trash2, Link as LinkIcon
} from "lucide-react";
import MediaPickerModal from "./MediaPickerModal";

interface SettingsTabProps {
  initialSettings: any;
  onSave: (key: string, data: any) => Promise<void>;
}

export default function SettingsTab({ initialSettings, onSave }: SettingsTabProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Admin credentials state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credLoading, setCredLoading] = useState(false);

  // Reusable Media Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAllowedType, setPickerAllowedType] = useState<"image" | "pdf" | "video">("image");
  const [activePickerTarget, setActivePickerTarget] = useState<string>("");

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSave = async (key: string, data: any) => {
    setLoading(true);
    setFeedback(null);
    try {
      await onSave(key, data);
      setFeedback({ type: "success", msg: `${key.toUpperCase().replace(/_/g, " ")} settings saved successfully.` });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to save settings." });
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() && !newPassword.trim()) return;
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", msg: "Passwords do not match." });
      return;
    }

    setCredLoading(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername.trim() || undefined,
          password: newPassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", msg: "Admin credentials updated successfully!" });
        setNewUsername("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setFeedback({ type: "error", msg: data.error || "Failed to update credentials." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Server error updating credentials." });
    } finally {
      setCredLoading(false);
    }
  };

  // Immediate upload handler
  const triggerDirectUpload = async (file: File, targetPath: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("folder", "/");
      formData.append("file", file);

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const result = await res.json();
      const url = result.data[0].url;
      updateSettingValue(targetPath, url);
      setFeedback({ type: "success", msg: "File uploaded and linked successfully." });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to upload file." });
    } finally {
      setLoading(false);
    }
  };

  const updateSettingValue = (pathStr: string, val: any) => {
    const keys = pathStr.split(".");
    const updated = { ...settings };
    let temp = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!temp[keys[i]]) temp[keys[i]] = {};
      temp[keys[i]] = { ...temp[keys[i]] };
      temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = val;
    setSettings(updated);
  };

  const deleteSettingValue = (pathStr: string) => {
    updateSettingValue(pathStr, "");
  };

  const openPicker = (target: string, type: "image" | "pdf" | "video") => {
    setActivePickerTarget(target);
    setPickerAllowedType(type);
    setPickerOpen(true);
  };

  const handlePickerSelect = (url: string) => {
    updateSettingValue(activePickerTarget, url);
  };

  // Drag and drop helper
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropUpload = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      triggerDirectUpload(files[0], targetPath);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-mono">
      {/* LEFT SIDE: Settings forms */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
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

        {/* Brand & Hero Background Media Settings */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-zinc-400" />
            Brand Identity Settings
          </h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>Logo Text *</span>
                <input
                  type="text"
                  value={settings.branding?.logoText || ""}
                  onChange={(e) => updateSettingValue("branding.logoText", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>Logo Subtext</span>
                <input
                  type="text"
                  value={settings.branding?.logoSubtext || ""}
                  onChange={(e) => updateSettingValue("branding.logoSubtext", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white"
                />
              </div>
            </div>

            {/* Visual Logo Upload Card */}
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Corporate Brand Logo</span>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-12 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 shrink-0 overflow-hidden">
                  {settings.branding?.logoText ? (
                    <span className="text-xs font-extrabold font-display tracking-widest uppercase">{settings.branding.logoText}</span>
                  ) : (
                    <span className="text-[9px] text-zinc-400">NO LOGO</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("branding.logoText", "image")}
                    className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white"
                  >
                    CHOOSE LOGO
                  </button>
                  <label className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white cursor-pointer">
                    UPLOAD NEW
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "branding.logoText")}
                      className="hidden"
                    />
                  </label>
                  {settings.branding?.logoText && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("branding.logoText")}
                      className="px-3 py-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded font-semibold text-[10px] hover:bg-red-50"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Favicon Upload Card */}
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Website Favicon (.ico / .png)</span>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 shrink-0 overflow-hidden">
                  {settings.branding?.faviconUrl ? (
                    <img src={settings.branding.faviconUrl} alt="Favicon" className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-[9px] text-zinc-400">FAVICON</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("branding.faviconUrl", "image")}
                    className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white"
                  >
                    CHOOSE FAVICON
                  </button>
                  <label className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white cursor-pointer">
                    UPLOAD NEW
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "branding.faviconUrl")}
                      className="hidden"
                    />
                  </label>
                  {settings.branding?.faviconUrl && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("branding.faviconUrl")}
                      className="px-3 py-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded font-semibold text-[10px] hover:bg-red-50"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSave("branding", settings.branding)}
              disabled={loading}
              className="bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded mt-1 shadow-luxury-sm"
            >
              SAVE BRAND IDENTITY
            </button>
          </div>
        </div>

        {/* Homepage Hero Builder */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-zinc-400" />
            Homepage Hero Visual Builder
          </h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>Hero Title Headline</span>
                <input
                  type="text"
                  value={settings.homepage_hero?.headline || ""}
                  onChange={(e) => updateSettingValue("homepage_hero.headline", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-sans font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>Hero Subtitle Description</span>
                <input
                  type="text"
                  value={settings.homepage_hero?.subheadline || ""}
                  onChange={(e) => updateSettingValue("homepage_hero.subheadline", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>Hero Button Text</span>
                <input
                  type="text"
                  value={settings.homepage_hero?.ctaText || ""}
                  onChange={(e) => updateSettingValue("homepage_hero.ctaText", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-sans"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>Hero Button Link</span>
                <input
                  type="text"
                  value={settings.homepage_hero?.ctaLink || ""}
                  onChange={(e) => updateSettingValue("homepage_hero.ctaLink", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-sans"
                />
              </div>
            </div>

            {/* Background Image Upload Card */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropUpload(e, "homepage_hero.heroImage")}
              className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3"
            >
              <span className="font-bold text-[10px] uppercase text-zinc-500">Hero Background Image (Drag & Drop support)</span>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 shrink-0 overflow-hidden">
                  {settings.homepage_hero?.heroImage ? (
                    <img src={settings.homepage_hero.heroImage} alt="Hero image" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-zinc-400">NO BACKGROUND</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("homepage_hero.heroImage", "image")}
                    className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white"
                  >
                    CHOOSE IMAGE
                  </button>
                  <label className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white cursor-pointer">
                    UPLOAD NEW
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "homepage_hero.heroImage")}
                      className="hidden"
                    />
                  </label>
                  {settings.homepage_hero?.heroImage && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("homepage_hero.heroImage")}
                      className="px-3 py-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded font-semibold text-[10px] hover:bg-red-50"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Background Video Upload Card */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropUpload(e, "homepage_hero.heroVideo")}
              className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3"
            >
              <span className="font-bold text-[10px] uppercase text-zinc-500">Hero Background Video (Optional)</span>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 shrink-0 overflow-hidden text-center">
                  {settings.homepage_hero?.heroVideo ? (
                    <span className="text-[9px] text-zinc-800 dark:text-zinc-200 font-bold truncate p-1 max-w-[80px] block">{settings.homepage_hero.heroVideo}</span>
                  ) : (
                    <span className="text-[9px] text-zinc-400">NO VIDEO</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("homepage_hero.heroVideo", "video")}
                    className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white"
                  >
                    CHOOSE VIDEO
                  </button>
                  <label className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[10px] bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white cursor-pointer">
                    UPLOAD NEW
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "homepage_hero.heroVideo")}
                      className="hidden"
                    />
                  </label>
                  {settings.homepage_hero?.heroVideo && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("homepage_hero.heroVideo")}
                      className="px-3 py-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded font-semibold text-[10px] hover:bg-red-50"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSave("homepage_hero", settings.homepage_hero)}
              disabled={loading}
              className="bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded mt-1 shadow-luxury-sm"
            >
              SAVE HERO BUILDER
            </button>
          </div>
        </div>

        {/* Homepage Section Order & Visibility Control Center */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-zinc-400" />
            Homepage Section Order & Visibility Controls
          </h3>
          <div className="flex flex-col gap-4 font-mono text-xs">
            <span className="text-[10px] text-zinc-500 font-sans">
              Toggle visibility or adjust the sequence order of homepage sections below:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "hero", label: "Main Hero Banner" },
                { key: "about", label: "About & Craftsmanship" },
                { key: "categories", label: "Specialized Departments" },
                { key: "products", label: "Featured Showcase" },
                { key: "facility", label: "Manufacturing Facility" },
                { key: "album", label: "Instrument Album & Gallery" },
                { key: "videos", label: "Manufacturing Process Media" },
                { key: "global", label: "Commercial B2B Logistics" },
                { key: "contact", label: "Commercial Inquiry Form" }
              ].map((sec, idx) => (
                <div key={sec.key} className="p-3 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.section_visibility?.[sec.key] !== false}
                      onChange={(e) => updateSettingValue(`section_visibility.${sec.key}`, e.target.checked)}
                      className="rounded accent-black dark:accent-white"
                    />
                    <span className="font-bold text-[11px] text-zinc-900 dark:text-white uppercase">{sec.label}</span>
                  </label>

                  <span className="text-[9px] text-zinc-400">Position #{idx + 1}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSave("section_visibility", settings.section_visibility)}
              disabled={loading}
              className="bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded mt-1 shadow-luxury-sm"
            >
              SAVE SECTION VISIBILITY & ORDER
            </button>
          </div>
        </div>

        {/* Corporate PDFs Assets */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-zinc-400" />
            Corporate PDF Document Downloads
          </h3>
          <div className="flex flex-col gap-6">
            
            {/* Catalog PDF */}
            <div className="border-b border-zinc-100 dark:border-zinc-900 pb-4 flex flex-col gap-2">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Product Catalog PDF</span>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500 shrink-0" />
                <div className="overflow-hidden flex-grow">
                  <span className="font-bold text-zinc-800 dark:text-zinc-250 truncate block">
                    {settings.branding?.catalogPdf || "Not configured"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("branding.catalogPdf", "pdf")}
                    className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black"
                  >
                    CHOOSE
                  </button>
                  <label className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black cursor-pointer">
                    UPLOAD
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "branding.catalogPdf")}
                      className="hidden"
                    />
                  </label>
                  {settings.branding?.catalogPdf && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("branding.catalogPdf")}
                      className="p-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Company Profile PDF */}
            <div className="border-b border-zinc-100 dark:border-zinc-900 pb-4 flex flex-col gap-2">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Company Profile PDF</span>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500 shrink-0" />
                <div className="overflow-hidden flex-grow">
                  <span className="font-bold text-zinc-800 dark:text-zinc-250 truncate block">
                    {settings.branding?.profilePdf || "Not configured"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("branding.profilePdf", "pdf")}
                    className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black"
                  >
                    CHOOSE
                  </button>
                  <label className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black cursor-pointer">
                    UPLOAD
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "branding.profilePdf")}
                      className="hidden"
                    />
                  </label>
                  {settings.branding?.profilePdf && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("branding.profilePdf")}
                      className="p-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Brochure PDF */}
            <div className="border-b border-zinc-100 dark:border-zinc-900 pb-4 flex flex-col gap-2">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Brochure PDF</span>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500 shrink-0" />
                <div className="overflow-hidden flex-grow">
                  <span className="font-bold text-zinc-800 dark:text-zinc-250 truncate block">
                    {settings.branding?.brochurePdf || "Not configured"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("branding.brochurePdf", "pdf")}
                    className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black"
                  >
                    CHOOSE
                  </button>
                  <label className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black cursor-pointer">
                    UPLOAD
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "branding.brochurePdf")}
                      className="hidden"
                    />
                  </label>
                  {settings.branding?.brochurePdf && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("branding.brochurePdf")}
                      className="p-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Certificates PDF */}
            <div className="border-b border-zinc-100 dark:border-zinc-900 pb-4 flex flex-col gap-2">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Certificates PDF</span>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500 shrink-0" />
                <div className="overflow-hidden flex-grow">
                  <span className="font-bold text-zinc-800 dark:text-zinc-250 truncate block">
                    {settings.branding?.certificatesPdf || "Not configured"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openPicker("branding.certificatesPdf", "pdf")}
                    className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black"
                  >
                    CHOOSE
                  </button>
                  <label className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-semibold text-[9px] bg-white dark:bg-zinc-900 hover:border-black cursor-pointer">
                    UPLOAD
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "branding.certificatesPdf")}
                      className="hidden"
                    />
                  </label>
                  {settings.branding?.certificatesPdf && (
                    <button
                      type="button"
                      onClick={() => deleteSettingValue("branding.certificatesPdf")}
                      className="p-1.5 border border-red-200 dark:border-red-950 text-red-500 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Document Visibility Controls */}
            <div className="pt-2 border-t border-zinc-150 dark:border-zinc-900 flex flex-col gap-3">
              <span className="font-bold text-[10px] uppercase text-zinc-500 font-mono">Document Visibility & Access Controls</span>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-zinc-400">Profile Visibility</span>
                  <select
                    value={settings.branding?.profileVisibility || "public"}
                    onChange={(e) => updateSettingValue("branding.profileVisibility", e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-xs text-black dark:text-white font-mono"
                  >
                    <option value="public">Public (Direct Download)</option>
                    <option value="inquiry_required">Available After Inquiry</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-zinc-400">Brochure Visibility</span>
                  <select
                    value={settings.branding?.brochureVisibility || "public"}
                    onChange={(e) => updateSettingValue("branding.brochureVisibility", e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-xs text-black dark:text-white font-mono"
                  >
                    <option value="public">Public (Direct Download)</option>
                    <option value="inquiry_required">Available After Inquiry</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-zinc-400">Certificates Visibility</span>
                  <select
                    value={settings.branding?.certificatesVisibility || "public"}
                    onChange={(e) => updateSettingValue("branding.certificatesVisibility", e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-xs text-black dark:text-white font-mono"
                  >
                    <option value="public">Public (Direct Download)</option>
                    <option value="inquiry_required">Available After Inquiry</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSave("branding", settings.branding)}
              disabled={loading}
              className="bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded mt-1 shadow-luxury-sm"
            >
              SAVE COMPANY DOCUMENTS & ACCESS CONTROLS
            </button>
          </div>
        </div>

        {/* Contact Info & Socials */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-zinc-400" />
            Contact & Social Media Channels
          </h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>Corporate Email *</span>
                <input
                  type="email"
                  value={settings.contact_info?.email || ""}
                  onChange={(e) => updateSettingValue("contact_info.email", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>Phone Number *</span>
                <input
                  type="text"
                  value={settings.contact_info?.phone || ""}
                  onChange={(e) => updateSettingValue("contact_info.phone", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>WhatsApp Hotline Number</span>
                <input
                  type="text"
                  value={settings.contact_info?.whatsapp || ""}
                  onChange={(e) => updateSettingValue("contact_info.whatsapp", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>Address Location</span>
                <input
                  type="text"
                  value={settings.contact_info?.address || ""}
                  onChange={(e) => updateSettingValue("contact_info.address", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span>Instagram Link</span>
                <input
                  type="text"
                  value={settings.seo_settings?.socialLinks?.instagram || ""}
                  onChange={(e) => updateSettingValue("seo_settings.socialLinks.instagram", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>YouTube Link</span>
                <input
                  type="text"
                  value={settings.seo_settings?.socialLinks?.youtube || ""}
                  onChange={(e) => updateSettingValue("seo_settings.socialLinks.youtube", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>LinkedIn Link</span>
                <input
                  type="text"
                  value={settings.seo_settings?.socialLinks?.linkedin || ""}
                  onChange={(e) => updateSettingValue("seo_settings.socialLinks.linkedin", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-mono"
                />
              </div>
            </div>

            <button
              onClick={() => {
                handleSave("contact_info", settings.contact_info);
                handleSave("seo_settings", settings.seo_settings);
              }}
              disabled={loading}
              className="bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded mt-1 shadow-luxury-sm"
            >
              SAVE CONTACT & SOCIALS
            </button>
          </div>
        </div>

        {/* WhatsApp & Integration Settings */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-500" />
            WhatsApp Integration & Animation Controls
          </h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>WhatsApp Dedicated Number</span>
                <input
                  type="text"
                  value={settings.whatsapp_settings?.phone || ""}
                  onChange={(e) => updateSettingValue("whatsapp_settings.phone", e.target.value)}
                  placeholder="+923000000000"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>Default Initial Message</span>
                <input
                  type="text"
                  value={settings.whatsapp_settings?.defaultMessage || ""}
                  onChange={(e) => updateSettingValue("whatsapp_settings.defaultMessage", e.target.value)}
                  placeholder="Hello ORIVENCE Team..."
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-black dark:text-white font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 font-mono text-[10px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsapp_settings?.enableHeader !== false}
                  onChange={(e) => updateSettingValue("whatsapp_settings.enableHeader", e.target.checked)}
                  className="rounded accent-black dark:accent-white"
                />
                <span>Enable Header WhatsApp Button</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsapp_settings?.enableFloating !== false}
                  onChange={(e) => updateSettingValue("whatsapp_settings.enableFloating", e.target.checked)}
                  className="rounded accent-black dark:accent-white"
                />
                <span>Enable Floating WhatsApp Button</span>
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-400">Animation Intensity</span>
                <select
                  value={settings.animation_settings?.intensity || "normal"}
                  onChange={(e) => updateSettingValue("animation_settings.intensity", e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1 text-xs text-black dark:text-white"
                >
                  <option value="high">High (Full Motion)</option>
                  <option value="normal">Normal (Balanced)</option>
                  <option value="reduced">Reduced (Performance Mode)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                handleSave("whatsapp_settings", settings.whatsapp_settings);
                handleSave("animation_settings", settings.animation_settings);
              }}
              disabled={loading}
              className="bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded mt-1 shadow-luxury-sm"
            >
              SAVE INTEGRATION & ANIMATION SETTINGS
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Admin Profile & Credentials Settings */}
      <div className="lg:col-span-4">
        <div className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-luxury-sm bg-white dark:bg-zinc-950 sticky top-24 flex flex-col gap-5">
          <h3 className="text-xs font-mono font-bold tracking-widest uppercase mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-zinc-400" />
            Admin Credentials
          </h3>

          <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Use this form to securely update the portal username and password. Passes securely to database with hashing.
            </p>

            <div className="flex flex-col gap-1.5">
              <span>New Admin Username</span>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="admin"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2.5 text-xs text-black dark:text-white font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span>New Security Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2.5 text-xs text-black dark:text-white font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2.5 text-xs text-black dark:text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={credLoading || (!newUsername.trim() && !newPassword.trim())}
              className="bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white py-3 rounded-lg font-bold font-mono disabled:opacity-50 transition-all shadow-luxury-md"
            >
              {credLoading ? "UPDATING SECURE SYS..." : "UPDATE CREDENTIALS"}
            </button>
          </form>
        </div>
      </div>

      {/* Reuse Picker Modal */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        allowedType={pickerAllowedType}
        onSelect={handlePickerSelect}
      />

    </div>
  );
}
