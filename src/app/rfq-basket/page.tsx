// src/app/rfq-basket/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ClipboardCheck, Trash2, Plus, Minus, ArrowRight, 
  Upload, CheckCircle, AlertCircle, RefreshCw, FileText
} from "lucide-react";
import { useRFQ } from "@/context/RFQContext";

export default function RFQBasketPage() {
  const { items, updateQuantity, removeFromRFQ, clearRFQ } = useRFQ();
  
  // Form fields
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  
  // Attachments upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadedFilenames, setUploadedFilenames] = useState<string[]>([]);
  
  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    setErrorMsg("");
    const token = localStorage.getItem("admin_token"); // Upload is public for RFQ, but let's send standard request
    const formData = new FormData();
    formData.append("folder", "/inquiry-attachments");
    formData.append("file", files[0]);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.assets && data.assets.length > 0) {
        setAttachments([...attachments, data.assets[0].url]);
        setUploadedFilenames([...uploadedFilenames, files[0].name]);
      } else {
        setErrorMsg("Failed to upload attachment. Ensure file size is within limits.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error uploading attachment.");
    } finally {
      setUploadingFile(false);
    }
  };

  const [submittedRefNo, setSubmittedRefNo] = useState<string>("");

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg("Your quotation basket is empty.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");

    const payload = {
      name,
      companyName,
      website,
      country,
      email,
      phone,
      whatsapp,
      message,
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      attachments
    };

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedRefNo(data.referenceNo || "ORV-2026-000123");
        setSuccess(true);
        clearRFQ();
      } else {
        setErrorMsg(data.error || "Failed to submit inquiry.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error submitting quote request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const whatsappMsg = `Hello ORIVENCE Team, I have submitted an RFQ Quote Request:\n\n` +
      `- Reference No: ${submittedRefNo}\n` +
      `- Customer: ${name}\n` +
      `- Company: ${companyName || "N/A"}\n` +
      `- Country: ${country}\n` +
      `- Message: ${message || "N/A"}\n\n` +
      `Please review and send formal quotation details.`;

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-background-light dark:bg-background-dark font-mono text-xs text-left">
        <div className="max-w-md w-full border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-8 rounded-2xl shadow-luxury-lg text-center flex flex-col items-center gap-5 glass-panel">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase block mb-1">
              INQUIRY REFERENCE: {submittedRefNo}
            </span>
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
              RFQ TRANSMITTED SUCCESSFULLY
            </h2>
            <p className="text-[10px] text-zinc-400 mt-2 font-sans leading-relaxed">
              Your request for quotation has been registered under reference <strong className="text-zinc-900 dark:text-white font-mono">{submittedRefNo}</strong> in our B2B pipeline. A sales engineer will reach out within 24 business hours.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <a
              href={`https://wa.me/923000000000?text=${encodeURIComponent(whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all text-center uppercase tracking-wider flex items-center justify-center gap-2 shadow-luxury-md"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              SEND RFQ VIA WHATSAPP NOW
            </a>

            <Link
              href="/"
              className="w-full py-3 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white text-zinc-800 dark:text-zinc-200 rounded-lg font-bold transition-all text-center uppercase tracking-wider block"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 font-mono text-xs text-left">
      
      {/* Page Title Header */}
      <div className="flex flex-col gap-2 mb-10 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <span className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4" />
          B2B Portal Division
        </span>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white uppercase font-display tracking-widest">
          Quotation Basket
        </h1>
        <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
          ORIVENCE operates strictly on a Request for Quote (RFQ) configuration. Build your specifications basket, request pricing matrices, and coordinate custom implement parameters.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 border border-zinc-200 dark:border-zinc-900 rounded-2xl text-center bg-white dark:bg-zinc-950/20 flex flex-col items-center gap-4">
          <span className="text-zinc-400">YOUR QUOTATION BASKET IS CURRENTLY EMPTY.</span>
          <Link
            href="/"
            className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            BROWSE PRODUCT CATALOG
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Basket Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 bg-white dark:bg-zinc-950/30 flex flex-col gap-4">
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest border-b border-zinc-150 dark:border-zinc-900 pb-2">
                Selected Implements ({items.length})
              </span>
              
              <div className="divide-y divide-zinc-200 dark:divide-zinc-900 flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pt-4 first:pt-0 items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="w-16 aspect-square bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                          src={item.image || "/images/products/hero_tweezers.png"}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="object-contain max-h-[85%] max-w-[85%]"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-zinc-900 dark:text-white block truncate uppercase text-[11px]" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">SKU: {item.sku}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 font-mono">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-zinc-900 dark:text-white select-none">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromRFQ(item.id)}
                        className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 text-zinc-500 hover:text-red-500 rounded bg-white dark:bg-zinc-950 transition-colors"
                        title="Remove implement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Submission form */}
          <div className="lg:col-span-5">
            <form 
              onSubmit={handleSubmitRFQ}
              className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm flex flex-col gap-4"
            >
              <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-1 pb-2 border-b border-zinc-150 dark:border-zinc-900">
                Inquiry Details Form
              </h3>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded text-red-600 dark:text-red-400 flex items-start gap-2 text-[10px]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span>Corporate Contact Name *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Julian Voss"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span>Company / Clinic</span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Voss Dermatology"
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span>Country *</span>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Germany"
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span>Corporate Email *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span>Contact Phone</span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49..."
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span>WhatsApp Link</span>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+49..."
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span>Inquiry Specifications & Calibrations Notes</span>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail any custom tip alignment, logo etching requirements, or package configurations..."
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs resize-none font-sans"
                />
              </div>

              {/* Document upload attachments */}
              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <span className="text-[10px] text-zinc-400 uppercase">Attach Blueprints or clinic requirements (PDF/ZIP/IMG)</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById("file_attach")?.click()}
                    disabled={uploadingFile}
                    className="flex items-center gap-1.5 px-3 py-2 border border-zinc-250 dark:border-zinc-850 hover:border-black dark:hover:border-white rounded-lg transition-colors font-mono text-xs bg-white dark:bg-zinc-950 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingFile ? "UPLOADING..." : "UPLOAD ATTACHMENT"}
                  </button>
                  <input
                    type="file"
                    id="file_attach"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="flex-grow overflow-hidden truncate">
                    {uploadedFilenames.length > 0 ? (
                      <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-red-500" />
                        {uploadedFilenames.join(", ")}
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-500">No attachments uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 tracking-widest transition-all shadow-luxury-md font-mono"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    TRANSMITTING RFQ PIPELINE...
                  </>
                ) : (
                  <>
                    SUBMIT QUOTATION REQUEST
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}
