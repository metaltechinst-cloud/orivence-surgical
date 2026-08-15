// src/components/admin/SettingsTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, PhoneCall, Share2, Palette, Info, LayoutTemplate, 
  Search, Mail, ShieldAlert, CheckCircle2, AlertCircle, 
  Upload, Trash2, Globe, Send, RefreshCw, Lock, Link as LinkIcon, Plus, Trash, BarChart3, Eye, Layers
} from "lucide-react";
import MediaPickerModal from "./MediaPickerModal";
import HomepageBuilderTab from "./HomepageBuilderTab";

interface SettingsTabProps {
  initialSettings: any;
  onSave: (key: string, data: any) => Promise<void>;
}

export default function SettingsTab({ initialSettings, onSave }: SettingsTabProps) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [activeTab, setActiveTab] = useState<
    "business" | "social" | "branding" | "company" | "contact_page" | "footer" | "header" | "seo" | "analytics" | "smtp" | "security" | "homepage"
  >("business");
  
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Search filter for settings
  const [searchTerm, setSearchTerm] = useState("");

  // SMTP Test Email state
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [smtpTesting, setSmtpTesting] = useState(false);

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
    setSettings(initialSettings || {});
  }, [initialSettings]);

  const updateSettingValue = (pathStr: string, val: any) => {
    const keys = pathStr.split(".");
    const updated = JSON.parse(JSON.stringify(settings || {}));
    let temp = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!temp[keys[i]]) temp[keys[i]] = {};
      temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = val;
    setSettings(updated);
  };

  const handleSaveGroup = async (key: string, data: any, customGroup?: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      await onSave(key, data || {});
      setFeedback({ type: "success", msg: `${key.toUpperCase().replace(/_/g, " ")} saved successfully!` });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to save settings." });
    } finally {
      setLoading(false);
    }
  };

  const triggerDirectUpload = async (file: File, targetPath: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("folder", "/branding");
      formData.append("file", file);

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      const url = result.data[0].url;
      updateSettingValue(targetPath, url);
      setFeedback({ type: "success", msg: "Asset uploaded and linked successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to upload file." });
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (target: string, type: "image" | "pdf" | "video") => {
    setActivePickerTarget(target);
    setPickerAllowedType(type);
    setPickerOpen(true);
  };

  const handlePickerSelect = (url: string) => {
    updateSettingValue(activePickerTarget, url);
  };

  const handleTestSmtp = async () => {
    if (!testEmailRecipient.trim()) {
      setFeedback({ type: "error", msg: "Please enter a test recipient email address." });
      return;
    }
    setSmtpTesting(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...settings.smtp_config,
          testRecipient: testEmailRecipient.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", msg: data.message });
      } else {
        setFeedback({ type: "error", msg: data.error || "SMTP verification failed." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Server error testing SMTP configuration." });
    } finally {
      setSmtpTesting(false);
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

  const navTabs = [
    { id: "business", label: "Identity & Business", icon: Building2 },
    { id: "social", label: "Social Media", icon: Share2 },
    { id: "branding", label: "Branding & Logos", icon: Palette },
    { id: "company", label: "Company & About", icon: Info },
    { id: "contact_page", label: "Contact Page", icon: PhoneCall },
    { id: "homepage", label: "Homepage Builder", icon: Layers },
    { id: "footer", label: "Footer Builder", icon: LayoutTemplate },
    { id: "header", label: "Header Builder", icon: Globe },
    { id: "seo", label: "SEO & Meta", icon: Search },
    { id: "analytics", label: "Analytics & Scripts", icon: BarChart3 },
    { id: "smtp", label: "Email / SMTP", icon: Mail },
    { id: "security", label: "Security & Admins", icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col gap-6 text-xs font-mono text-zinc-800 dark:text-zinc-200">
      
      {/* Top Banner Alert Feedback */}
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

      {/* Control Bar: Search & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search Master Control Center settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE PERSISTENCE ACTIVE
          </span>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 no-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                active 
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-luxury-sm"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BUSINESS IDENTITY & CONTACT */}
      {activeTab === "business" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Corporate Website Identity Manager (24 Complete Fields)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Company Legal Name</label>
              <input
                type="text"
                value={settings.business_info?.companyName || "ORIVENCE SURGICAL GMBH"}
                onChange={(e) => updateSettingValue("business_info.companyName", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Brand Name</label>
              <input
                type="text"
                value={settings.business_info?.brandName || "ORIVENCE"}
                onChange={(e) => updateSettingValue("business_info.brandName", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Corporate Tagline</label>
              <input
                type="text"
                value={settings.business_info?.tagline || "GERMAN SURGICAL PRECISION IMPLEMENTS"}
                onChange={(e) => updateSettingValue("business_info.tagline", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Primary Telephone</label>
              <input
                type="text"
                value={settings.contact_info?.phone || "+49 (7461) 9876-0"}
                onChange={(e) => updateSettingValue("contact_info.phone", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Mobile Phone</label>
              <input
                type="text"
                value={settings.contact_info?.mobile || "+49 170 9876543"}
                onChange={(e) => updateSettingValue("contact_info.mobile", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">WhatsApp Hotline</label>
              <input
                type="text"
                value={settings.contact_info?.whatsapp || "+49 170 1234567"}
                onChange={(e) => updateSettingValue("contact_info.whatsapp", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Primary Inquiries Email</label>
              <input
                type="email"
                value={settings.contact_info?.email || "inquiry@orivence.de"}
                onChange={(e) => updateSettingValue("contact_info.email", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Support Email</label>
              <input
                type="email"
                value={settings.contact_info?.supportEmail || "support@orivence.de"}
                onChange={(e) => updateSettingValue("contact_info.supportEmail", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Privacy & Compliance Email</label>
              <input
                type="email"
                value={settings.contact_info?.privacyEmail || "privacy@orivence.de"}
                onChange={(e) => updateSettingValue("contact_info.privacyEmail", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Facility Address</label>
              <input
                type="text"
                value={settings.contact_info?.address || "MedTech Park 4B, 78532 Tuttlingen, Germany"}
                onChange={(e) => updateSettingValue("contact_info.address", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Short Corporate Summary</label>
              <input
                type="text"
                value={settings.business_info?.shortDescription || "German manufacturer of surgical implements & micro-tweezers complying with ISO 13485."}
                onChange={(e) => updateSettingValue("business_info.shortDescription", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Business Hours</label>
              <input
                type="text"
                value={settings.contact_info?.businessHours || "Mon - Fri: 08:00 - 17:00 (CET)"}
                onChange={(e) => updateSettingValue("contact_info.businessHours", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Commercial Registration No.</label>
              <input
                type="text"
                value={settings.business_info?.registrationNumber || "HRB 765432 (Amtsgericht Stuttgart)"}
                onChange={(e) => updateSettingValue("business_info.registrationNumber", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">VAT ID / USt-IdNr.</label>
              <input
                type="text"
                value={settings.business_info?.vatNumber || "DE 987654321"}
                onChange={(e) => updateSettingValue("business_info.vatNumber", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Tax Registration Number</label>
              <input
                type="text"
                value={settings.business_info?.taxNumber || "21/456/78901"}
                onChange={(e) => updateSettingValue("business_info.taxNumber", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={async () => {
                await handleSaveGroup("business_info", settings.business_info);
                await handleSaveGroup("contact_info", settings.contact_info);
              }}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE WEBSITE IDENTITY
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL MEDIA MANAGER */}
      {activeTab === "social" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-500" />
            Social Media Platform Manager (8 Platforms)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: "facebook", name: "Facebook" },
              { id: "instagram", name: "Instagram" },
              { id: "linkedin", name: "LinkedIn" },
              { id: "youtube", name: "YouTube" },
              { id: "twitter", name: "X (Twitter)" },
              { id: "tiktok", name: "TikTok" },
              { id: "pinterest", name: "Pinterest" },
              { id: "threads", name: "Threads" }
            ].map((platform) => {
              const item = settings.social_links?.[platform.id] || {};
              return (
                <div key={platform.id} className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase">{platform.name}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-zinc-500 uppercase">{item.enabled !== false ? "ENABLED" : "DISABLED"}</span>
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) => updateSettingValue(`social_links.${platform.id}.enabled`, e.target.checked)}
                        className="rounded"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    placeholder={`https://${platform.id}.com/orivencesurgical`}
                    value={item.url || ""}
                    onChange={(e) => updateSettingValue(`social_links.${platform.id}.url`, e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.showInFooter !== false}
                          onChange={(e) => updateSettingValue(`social_links.${platform.id}.showInFooter`, e.target.checked)}
                        />
                        Footer
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.showInHeader !== false}
                          onChange={(e) => updateSettingValue(`social_links.${platform.id}.showInHeader`, e.target.checked)}
                        />
                        Header
                      </label>
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.openNewTab !== false}
                        onChange={(e) => updateSettingValue(`social_links.${platform.id}.openNewTab`, e.target.checked)}
                      />
                      New Tab
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("social_links", settings.social_links)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE SOCIAL MEDIA LINKS
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BRANDING */}
      {activeTab === "branding" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-500" />
            Corporate Branding & Logo Management (10 Asset Slots)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Header Logo Text</label>
              <input
                type="text"
                value={settings.branding?.logoText || "ORIVENCE"}
                onChange={(e) => updateSettingValue("branding.logoText", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Logo Subtext</label>
              <input
                type="text"
                value={settings.branding?.logoSubtext || "SURGICAL"}
                onChange={(e) => updateSettingValue("branding.logoSubtext", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
          </div>

          {/* 10 Branding Upload Slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { id: "logoUrl", label: "Main Brand Logo" },
              { id: "lightLogoUrl", label: "Light Logo (Dark Mode)" },
              { id: "darkLogoUrl", label: "Dark Logo (Light Mode)" },
              { id: "footerLogoUrl", label: "Footer Logo" },
              { id: "welcomeLogoUrl", label: "Welcome Screen Logo" },
              { id: "loadingLogoUrl", label: "Loading Screen Logo" },
              { id: "faviconUrl", label: "Favicon (.ico/.png)" },
              { id: "appleTouchIconUrl", label: "Apple Touch Icon" },
              { id: "ogImageUrl", label: "Open Graph Image" },
              { id: "twitterCardUrl", label: "Twitter Card Image" }
            ].map((slot) => {
              const currentUrl = settings.branding?.[slot.id];
              return (
                <div key={slot.id} className="border border-dashed border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex flex-col gap-2">
                  <span className="font-bold text-[10px] uppercase text-zinc-500 truncate">{slot.label}</span>
                  <div className="w-full h-16 border border-zinc-200 dark:border-zinc-800 rounded flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 overflow-hidden relative">
                    {currentUrl ? (
                      <img src={currentUrl} alt={slot.label} className="max-h-full max-w-full object-contain p-1" />
                    ) : (
                      <span className="text-[9px] text-zinc-400">NO IMAGE</span>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={currentUrl || ""}
                    onChange={(e) => updateSettingValue(`branding.${slot.id}`, e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-[10px]"
                  />
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => openPicker(`branding.${slot.id}`, "image")} className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-bold text-[9px] uppercase">Picker</button>
                    <label className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-bold text-[9px] uppercase cursor-pointer text-center">
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], `branding.${slot.id}`)} className="hidden" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("branding", settings.branding)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE BRANDING
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY & ABOUT */}
      {activeTab === "company" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-500" />
            Company Profile, Mission, Vision & Quality Policy
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">About Company Story & Background</label>
              <textarea
                rows={4}
                value={settings.company_info?.aboutText || ""}
                onChange={(e) => updateSettingValue("company_info.aboutText", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Corporate Mission Statement</label>
              <textarea
                rows={3}
                value={settings.company_info?.mission || ""}
                onChange={(e) => updateSettingValue("company_info.mission", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Corporate Vision Statement</label>
              <textarea
                rows={3}
                value={settings.company_info?.vision || ""}
                onChange={(e) => updateSettingValue("company_info.vision", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Quality Policy & Tolerances</label>
              <input
                type="text"
                value={settings.company_info?.qualityPolicy || ""}
                onChange={(e) => updateSettingValue("company_info.qualityPolicy", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Certifications & Standards</label>
              <input
                type="text"
                value={settings.company_info?.certifications || "ISO 13485:2016, CE Medical Mark, FDA Registered"}
                onChange={(e) => updateSettingValue("company_info.certifications", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("company_info", settings.company_info)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE COMPANY DETAILS
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: CONTACT PAGE BUILDER */}
      {activeTab === "contact_page" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-500" />
            Contact Page Layout & Information Hotline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Contact Hotline Phone</label>
              <input
                type="text"
                value={settings.contact_page?.phone || ""}
                onChange={(e) => updateSettingValue("contact_page.phone", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Contact Email Address</label>
              <input
                type="email"
                value={settings.contact_page?.email || ""}
                onChange={(e) => updateSettingValue("contact_page.email", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">WhatsApp Sales Direct</label>
              <input
                type="text"
                value={settings.contact_page?.whatsapp || ""}
                onChange={(e) => updateSettingValue("contact_page.whatsapp", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Emergency Desk Contact</label>
              <input
                type="text"
                value={settings.contact_page?.emergencyContact || ""}
                onChange={(e) => updateSettingValue("contact_page.emergencyContact", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Headquarters Address</label>
              <input
                type="text"
                value={settings.contact_page?.address || ""}
                onChange={(e) => updateSettingValue("contact_page.address", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("contact_page", settings.contact_page)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE CONTACT PAGE SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: HOMEPAGE VISUAL BUILDER */}
      {activeTab === "homepage" && (
        <HomepageBuilderTab />
      )}

      {/* TAB 7: HEADER BUILDER */}
      {activeTab === "header" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            Public Navigation Header Builder & Announcement Bar
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Announcement Bar Text</label>
              <input
                type="text"
                value={settings.header_config?.announcementText || "ISO 13485 CERTIFIED SURGICAL MANUFACTURING — GLOBAL B2B DISPATCH"}
                onChange={(e) => updateSettingValue("header_config.announcementText", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            {[
              { id: "stickyHeader", label: "Enable Sticky Navigation Header" },
              { id: "showAnnouncementBar", label: "Display Top Announcement Banner" },
              { id: "showTopBar", label: "Display Top Certification & Social Bar" },
              { id: "showSearch", label: "Display Search Icon / Input" },
              { id: "showCtaButton", label: "Display B2B RFQ Inquiry Button" },
              { id: "showWhatsappButton", label: "Display Quick WhatsApp Button" },
              { id: "showLanguageSwitcher", label: "Display Language Selector" }
            ].map(opt => (
              <div key={opt.id} className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                <span className="font-bold text-xs">{opt.label}</span>
                <input
                  type="checkbox"
                  checked={settings.header_config?.[opt.id] !== false}
                  onChange={(e) => updateSettingValue(`header_config.${opt.id}`, e.target.checked)}
                  className="rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("header_config", settings.header_config)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE HEADER CONFIGURATION
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: FOOTER BUILDER */}
      {activeTab === "footer" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-500" />
            Website Footer Builder & Copyright Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Footer Logo Slot */}
            <div className="md:col-span-2 border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-2 bg-zinc-50/50 dark:bg-zinc-900/50">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Footer Logo (Custom Brand Logo)</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-40 h-16 border border-zinc-200 dark:border-zinc-800 rounded flex items-center justify-center bg-zinc-900 overflow-hidden relative shrink-0">
                  {settings.footer_config?.logoUrl || settings.branding?.footerLogoUrl || settings.branding?.logoUrl ? (
                    <img
                      src={settings.footer_config?.logoUrl || settings.branding?.footerLogoUrl || settings.branding?.logoUrl}
                      alt="Footer Logo Preview"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-[9px] text-zinc-400 font-mono">DEFAULT LOGO</span>
                  )}
                </div>
                <div className="flex-1 w-full flex flex-col gap-2">
                  <input
                    type="url"
                    placeholder="https://... (or leave blank to use Main Brand Logo)"
                    value={settings.footer_config?.logoUrl || ""}
                    onChange={(e) => updateSettingValue("footer_config.logoUrl", e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPicker("footer_config.logoUrl", "image")}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded font-bold text-[10px] uppercase transition-colors"
                    >
                      Media Picker
                    </button>
                    <label className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded font-bold text-[10px] uppercase cursor-pointer text-center transition-colors">
                      Direct Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "footer_config.logoUrl")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Footer Corporate Summary Description</label>
              <textarea
                rows={3}
                value={settings.footer_config?.description || ""}
                onChange={(e) => updateSettingValue("footer_config.description", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Copyright Notice Text</label>
              <input
                type="text"
                value={settings.footer_config?.copyright || `© ${new Date().getFullYear()} ORIVENCE SURGICAL. All rights reserved.`}
                onChange={(e) => updateSettingValue("footer_config.copyright", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            {[
              { id: "showQuickLinks", label: "Display Quick Navigation Links" },
              { id: "showCategoryLinks", label: "Display Product Categories Links" },
              { id: "showLegalLinks", label: "Display Privacy & Legal Links" },
              { id: "showNewsletter", label: "Display Newsletter Subscription Form" },
              { id: "showSocialIcons", label: "Display Social Media Icons" },
              { id: "showContact", label: "Display Contact & Location Block" }
            ].map(opt => (
              <div key={opt.id} className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                <span className="font-bold text-xs">{opt.label}</span>
                <input
                  type="checkbox"
                  checked={settings.footer_config?.[opt.id] !== false}
                  onChange={(e) => updateSettingValue(`footer_config.${opt.id}`, e.target.checked)}
                  className="rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("footer_config", settings.footer_config)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase hover:opacity-90 transition-opacity"
            >
              SAVE FOOTER CONFIGURATION
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: SEO & META */}
      {activeTab === "seo" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-500" />
            SEO, Meta Tags, Canonical URLs & Search Console Verification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Default Meta Title</label>
              <input
                type="text"
                value={settings.seo_meta?.defaultTitle || "ORIVENCE SURGICAL | German Surgical Precision Implements"}
                onChange={(e) => updateSettingValue("seo_meta.defaultTitle", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Canonical Website URL</label>
              <input
                type="url"
                value={settings.seo_meta?.canonicalUrl || "https://orivencesurgical.com"}
                onChange={(e) => updateSettingValue("seo_meta.canonicalUrl", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Default Meta Description</label>
              <textarea
                rows={3}
                value={settings.seo_meta?.defaultDescription || "Manufacturer of ISO 13485 surgical tools, medical tweezers, micro-scissors, and aesthetic implements."}
                onChange={(e) => updateSettingValue("seo_meta.defaultDescription", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">SEO Keywords (Comma Separated)</label>
              <input
                type="text"
                value={settings.seo_meta?.keywords || "Orivence Surgical, Medical grade tweezers, Surgical scissors, ISO 13485, German surgical steel"}
                onChange={(e) => updateSettingValue("seo_meta.keywords", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Google Search Console Verification Code</label>
              <input
                type="text"
                placeholder="google-site-verification=..."
                value={settings.seo_meta?.googleSearchConsoleVerification || ""}
                onChange={(e) => updateSettingValue("seo_meta.googleSearchConsoleVerification", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Bing Webmaster Verification Code</label>
              <input
                type="text"
                placeholder="msvalidate.01=..."
                value={settings.seo_meta?.bingWebmasterVerification || ""}
                onChange={(e) => updateSettingValue("seo_meta.bingWebmasterVerification", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("seo_meta", settings.seo_meta)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE SEO & META
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: ANALYTICS & SCRIPTS */}
      {activeTab === "analytics" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Analytics Integration (Google Analytics, GTM, Meta Pixel, Clarity)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Google Analytics Tracking ID (G-XXXXXXXX)</label>
              <input
                type="text"
                placeholder="G-ORIVENCE123"
                value={settings.analytics?.gaMeasurementId || ""}
                onChange={(e) => updateSettingValue("analytics.gaMeasurementId", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Google Tag Manager Container ID (GTM-XXXXXXX)</label>
              <input
                type="text"
                placeholder="GTM-XXXXXXX"
                value={settings.analytics?.gtmContainerId || ""}
                onChange={(e) => updateSettingValue("analytics.gtmContainerId", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Meta / Facebook Pixel ID</label>
              <input
                type="text"
                placeholder="123456789012345"
                value={settings.analytics?.metaPixelId || ""}
                onChange={(e) => updateSettingValue("analytics.metaPixelId", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Microsoft Clarity Project ID</label>
              <input
                type="text"
                placeholder="clarity_project_id"
                value={settings.analytics?.clarityProjectId || ""}
                onChange={(e) => updateSettingValue("analytics.clarityProjectId", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Google Search Console Verification Token</label>
              <input
                type="text"
                placeholder="google_site_verification_token"
                value={settings.analytics?.googleConsoleVerification || ""}
                onChange={(e) => updateSettingValue("analytics.googleConsoleVerification", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Bing Webmaster Verification Code</label>
              <input
                type="text"
                placeholder="msvalidate_01_code"
                value={settings.analytics?.bingWebmasterVerification || ""}
                onChange={(e) => updateSettingValue("analytics.bingWebmasterVerification", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("analytics", settings.analytics)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE ANALYTICS & SCRIPTS
            </button>
          </div>
        </div>
      )}

      {/* TAB 10: EMAIL & SMTP */}
      {activeTab === "smtp" && (
        <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-500" />
            Email Server (SMTP) & Quotation Dispatch
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">SMTP Host Server</label>
              <input
                type="text"
                placeholder="smtp.orivence.de"
                value={settings.smtp_config?.smtpHost || ""}
                onChange={(e) => updateSettingValue("smtp_config.smtpHost", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">SMTP Port (587 / 465)</label>
              <input
                type="text"
                placeholder="587"
                value={settings.smtp_config?.smtpPort || "587"}
                onChange={(e) => updateSettingValue("smtp_config.smtpPort", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">SMTP Username</label>
              <input
                type="text"
                placeholder="smtp-user@orivence.de"
                value={settings.smtp_config?.smtpUser || ""}
                onChange={(e) => updateSettingValue("smtp_config.smtpUser", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">SMTP Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={settings.smtp_config?.smtpPass || ""}
                onChange={(e) => updateSettingValue("smtp_config.smtpPass", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Sender Name</label>
              <input
                type="text"
                placeholder="ORIVENCE SURGICAL"
                value={settings.smtp_config?.senderName || "ORIVENCE SURGICAL"}
                onChange={(e) => updateSettingValue("smtp_config.senderName", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[10px] uppercase text-zinc-500">Sender Email</label>
              <input
                type="email"
                placeholder="noreply@orivence.de"
                value={settings.smtp_config?.senderEmail || "noreply@orivence.de"}
                onChange={(e) => updateSettingValue("smtp_config.senderEmail", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
            </div>
          </div>

          {/* Test Email Section */}
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
            <span className="font-bold text-xs uppercase">Send Live Test Email</span>
            <div className="flex items-center gap-3">
              <input
                type="email"
                placeholder="recipient@example.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
              />
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={smtpTesting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded text-xs uppercase flex items-center gap-1.5"
              >
                {smtpTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                SEND TEST
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={() => handleSaveGroup("smtp_config", settings.smtp_config)}
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
            >
              SAVE SMTP SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* TAB 12: SECURITY & ADMIN CREDENTIALS */}
      {activeTab === "security" && (
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm flex flex-col gap-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              Update Administrator Master Password & Credentials
            </h3>

            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-zinc-500">New Username</label>
                  <input
                    type="text"
                    placeholder="New admin username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-zinc-500">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-zinc-500">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={credLoading}
                  className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase"
                >
                  {credLoading ? "UPDATING..." : "UPDATE CREDENTIALS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal Component */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        allowedType={pickerAllowedType}
      />
    </div>
  );
}
