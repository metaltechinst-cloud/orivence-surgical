// src/components/admin/HomepageBuilderTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowUp, ArrowDown, Eye, EyeOff, CheckCircle2, AlertCircle, 
  Save, Send, RefreshCw, Layers, Sparkles, Shield, Grid, 
  Package, Factory, Image as ImageIcon, Video, Globe, Mail, HelpCircle 
} from "lucide-react";
import { HomepageSectionItem } from "@/app/api/admin/homepage-builder/route";

interface HomepageBuilderTabProps {
  onSaveSuccess?: () => void;
}

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Shield,
  Grid,
  Package,
  Factory,
  Image: ImageIcon,
  Video,
  Globe,
  Mail
};

export default function HomepageBuilderTab({ onSaveSuccess }: HomepageBuilderTabProps) {
  const [sections, setSections] = useState<HomepageSectionItem[]>([]);
  const [publishedSections, setPublishedSections] = useState<HomepageSectionItem[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const insertTemplate = (template: { name: string; description: string; previewIcon: string }) => {
    const id = `custom_${template.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`;
    const newSec: HomepageSectionItem = {
      id,
      name: template.name,
      description: template.description,
      visible: true,
      order: sections.length,
      previewIcon: template.previewIcon
    };
    setSections([...sections, newSec]);
    setShowTemplateModal(false);
    setFeedback({ type: "success", msg: `Template "${template.name}" inserted into homepage draft!` });
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/homepage-builder");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSections(json.data.draftSections || []);
          setPublishedSections(json.data.publishedSections || []);
          setStatus(json.data.status || "PUBLISHED");
          setUpdatedAt(json.data.updatedAt || "");
        }
      }
    } catch (e) {
      console.error("Failed to load homepage builder config:", e);
      setFeedback({ type: "error", msg: "Failed to connect to Homepage Builder API" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    // Re-index order
    updated.forEach((s, idx) => (s.order = idx));
    setSections(updated);
  };

  const moveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    // Re-index order
    updated.forEach((s, idx) => (s.order = idx));
    setSections(updated);
  };

  const toggleVisibility = (index: number) => {
    const updated = [...sections];
    updated[index].visible = !updated[index].visible;
    setSections(updated);
  };

  const handleSave = async (action: "save_draft" | "publish") => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/homepage-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, sections })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({
          type: "success",
          msg: action === "publish" ? "Homepage published live successfully!" : "Draft configuration saved to database!"
        });
        setStatus(json.data.status);
        setPublishedSections(json.data.publishedSections);
        setUpdatedAt(json.data.updatedAt);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setFeedback({ type: "error", msg: json.error || "Failed to save homepage builder." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", msg: "Server communication error." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs font-mono text-zinc-500 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
        <span>Loading Visual Homepage Builder sections...</span>
      </div>
    );
  }

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

      {/* Control Header & Action Bar */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-luxury-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
              Visual Homepage Builder & Section Layout Engine
            </h3>
          </div>
          <p className="text-[11px] text-zinc-500">
            Reorder homepage sections, toggle section visibility, and publish updates live to the public website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <span className={`w-2 h-2 rounded-full ${status === "PUBLISHED" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="font-bold text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
              STATUS: {status}
            </span>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-500/40 bg-blue-950/20 text-blue-400 hover:border-blue-500 font-bold text-xs uppercase transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + INSERT TEMPLATE
          </button>

          <button
            onClick={() => handleSave("save_draft")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-bold text-xs uppercase text-zinc-800 dark:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          <button
            onClick={() => handleSave("publish")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow-luxury-sm transition-colors disabled:opacity-50"
          >
            {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publish Live
          </button>
        </div>
      </div>

      {/* Visual Section Cards Stack */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2 text-[10px] uppercase text-zinc-400 font-bold tracking-wider">
          <span>Active Homepage Sections Layout ({sections.length} Detected)</span>
          <span>Actions & Reorder</span>
        </div>

        {sections.map((section, idx) => {
          const IconComp = (section.previewIcon && ICON_MAP[section.previewIcon]) || Layers;
          const isFirst = idx === 0;
          const isLast = idx === sections.length - 1;

          return (
            <div
              key={section.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                section.visible 
                  ? "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-luxury-sm" 
                  : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-900/60 opacity-60"
              }`}
            >
              {/* Left Side: Position badge & Icon & Info */}
              <div className="flex items-center gap-4 flex-1">
                {/* Position Index Badge */}
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                  #{idx + 1}
                </div>

                {/* Section Icon */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <IconComp className="w-4 h-4" />
                </div>

                {/* Section Name & Description */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                      {section.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      section.visible 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                    }`}>
                      {section.visible ? "VISIBLE" : "HIDDEN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Right Side: Reordering & Visibility Controls */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {/* Move Up */}
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={isFirst}
                  title="Move Up"
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={isLast}
                  title="Move Down"
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Toggle Show/Hide */}
                <button
                  type="button"
                  onClick={() => toggleVisibility(idx)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[10px] uppercase border transition-colors ${
                    section.visible 
                      ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400" 
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  {section.visible ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Show
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* REUSABLE CONTENT TEMPLATES MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b131e] border border-[#1e293b] rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-6 text-slate-100 font-mono text-xs">
            
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm uppercase text-white">Insert Reusable Content Template</h3>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              <div 
                onClick={() => insertTemplate({
                  name: "PRODUCT SECTION: Image + Text + CTA",
                  description: "Spotlight section featuring a hero product image, metallurgical details, and a direct B2B Inquiry button.",
                  previewIcon: "Package"
                })}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-blue-500 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 uppercase text-[11px]">PRODUCT SECTION</span>
                  <Package className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-slate-200 font-bold">Image + Text + CTA</span>
                <p className="text-[10px] text-slate-400 font-sans">Spotlight a key surgical instrument with high-resolution image and CTA.</p>
              </div>

              <div 
                onClick={() => insertTemplate({
                  name: "IMAGE ALBUM: Title + Description + Gallery",
                  description: "High-resolution photo album displaying micro-finish macro photography and cleanroom packaging.",
                  previewIcon: "Image"
                })}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-purple-500 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 uppercase text-[11px]">IMAGE ALBUM</span>
                  <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-slate-200 font-bold">Title + Description + Gallery</span>
                <p className="text-[10px] text-slate-400 font-sans">Visual gallery displaying isolation tip alignment and satin finishes.</p>
              </div>

              <div 
                onClick={() => insertTemplate({
                  name: "VIDEO SECTION: Video + Title + Description",
                  description: "Embedded manufacturing video demonstrating Tuttlingen grinding, passivation, and laser marking.",
                  previewIcon: "Video"
                })}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-rose-500 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 uppercase text-[11px]">VIDEO SECTION</span>
                  <Video className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-slate-200 font-bold">Video + Title + Description</span>
                <p className="text-[10px] text-slate-400 font-sans">Embedded video stream highlighting precision manufacturing steps.</p>
              </div>

              <div 
                onClick={() => insertTemplate({
                  name: "FEATURE SECTION: Icon + Heading + Description",
                  description: "Grid of technical features highlighting AISI 316L stainless steel, 1.5µm tolerances, and ISO 13485.",
                  previewIcon: "Shield"
                })}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-emerald-500 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase text-[11px]">FEATURE SECTION</span>
                  <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-slate-200 font-bold">Icon + Heading + Description</span>
                <p className="text-[10px] text-slate-400 font-sans">Bullet points of metallurgical standards and quality assurance.</p>
              </div>

              <div 
                onClick={() => insertTemplate({
                  name: "CTA SECTION: Heading + Description + Button",
                  description: "Custom B2B quotation banner prompting healthcare distributors to request custom OEM quotes.",
                  previewIcon: "Mail"
                })}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-amber-500 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase text-[11px]">CTA SECTION</span>
                  <Mail className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-slate-200 font-bold">Heading + Description + Button</span>
                <p className="text-[10px] text-slate-400 font-sans">Prominent call-to-action bar for direct bulk RFQ submission.</p>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-[#1e293b]">
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border border-slate-700 rounded font-bold hover:bg-slate-800"
              >
                CANCEL
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
