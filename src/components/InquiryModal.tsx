// src/components/InquiryModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Send, CheckCircle, Info, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InquiryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  productName?: string;
  sku?: string;
  inline?: boolean;
}

export default function InquiryModal({
  isOpen = true,
  onClose = () => {},
  productName = "",
  sku = "",
  inline = false
}: InquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    country: "",
    email: "",
    phone: "",
    whatsapp: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedRefNo, setSubmittedRefNo] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMsg("");
      setSubmittedRefNo("");
    }
  }, [isOpen]);

  // Handle ESC key to close modal (only in modal mode)
  useEffect(() => {
    if (inline || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [inline, isOpen, handleClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetForm = () => {
    setSuccess(false);
    setErrorMsg("");
    setSubmittedRefNo("");
    setFormData({
      name: "",
      company: "",
      country: "",
      email: "",
      phone: "",
      whatsapp: "",
      message: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productName,
          sku,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      setSubmittedRefNo(data.referenceNo || "ORV-2026-000123");
      setSuccess(true);
      setFormData({
        name: "",
        company: "",
        country: "",
        email: "",
        phone: "",
        whatsapp: "",
        message: "",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Form body content shared between inline and modal views
  const renderFormBody = () => (
    <div className={inline ? "w-full" : "p-6 max-h-[75vh] overflow-y-auto no-scrollbar"}>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 p-3 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
                />
              </div>

              {/* Company */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                  Company / Clinic Name
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Healthcare facility / organization"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                  Work Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@facility.com"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
                />
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                  Country / Destination *
                </label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g. Germany, USA, UAE"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+49 (0) 123 456789"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
                />
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+49 (0) 123 456789"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
                />
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                Quotation Requirements & Specifications
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Please include details on required instrument specifications, custom finishes, or delivery schedule..."
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors resize-none font-sans"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 bg-[#253237] hover:bg-[#1a2327] dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-mono text-xs tracking-widest font-semibold py-3.5 rounded-lg disabled:opacity-50 transition-all shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                  TRANSMITTING INQUIRY...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  SUBMIT OFFICIAL INQUIRY
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center gap-4"
          >
            <CheckCircle className="w-14 h-14 text-emerald-500" />
            <div>
              <span className="text-[10px] font-mono text-emerald-600 font-bold tracking-widest uppercase block mb-1">
                REFERENCE: {submittedRefNo}
              </span>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white font-display">
                INQUIRY TRANSMITTED SUCCESSFULLY
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed font-sans">
                Your request has been registered under reference <strong className="text-zinc-900 dark:text-white font-mono">{submittedRefNo}</strong>. An Orivence Surgical product consultant will review your inquiry.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl text-left text-[11px] font-mono text-zinc-500 max-w-sm w-full flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Reference No:</span>
                <span className="text-emerald-600 font-bold">{submittedRefNo}</span>
              </div>
              {productName && (
                <div className="flex items-center justify-between">
                  <span>Product:</span>
                  <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">{productName}</span>
                </div>
              )}
              {sku && (
                <div className="flex items-center justify-between">
                  <span>SKU:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{sku}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
              <a
                href={`https://wa.me/491701234567?text=${encodeURIComponent(
                  `Hello ORIVENCE Team, I submitted quote inquiry:\n\n- Reference No: ${submittedRefNo}\n- Product: ${productName || "General Surgical Inquiry"}\n- SKU: ${sku || "N/A"}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg transition-all text-center uppercase tracking-wider flex items-center justify-center gap-2"
              >
                WHATSAPP NOW
              </a>

              {inline ? (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 border border-zinc-300 dark:border-zinc-700 py-3 rounded-lg font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  NEW INQUIRY
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border border-zinc-300 dark:border-zinc-700 py-3 rounded-lg font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all uppercase cursor-pointer"
                >
                  CLOSE
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // If inline mode is requested, render directly within container without modal wrapper
  if (inline) {
    return <div className="w-full text-left">{renderFormBody()}</div>;
  }

  // Modal dialog mode
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-modal-title"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Modal box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900">
              <div className="text-left">
                <h3
                  id="inquiry-modal-title"
                  className="text-base font-bold tracking-wide text-zinc-950 dark:text-white font-sans uppercase leading-tight"
                >
                  REQUEST QUOTATION
                </h3>
                <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase mt-1">
                  {productName ? `Product: ${productName} ${sku ? `(SKU: ${sku})` : ""}` : "Direct Clinical Inquiry"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer"
                aria-label="Close quotation request"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {renderFormBody()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
