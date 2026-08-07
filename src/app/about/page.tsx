// src/app/about/page.tsx

import Link from "next/link";
import { db } from "@/lib/db";
import { ShieldCheck, Award, Microscope, Globe, CheckCircle2, History, Factory, FileCheck, Quote } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "About Us | Orivence Surgical Precision Implements",
  description: "Learn about Orivence Surgical - German surgical precision, ISO 13485 certified manufacturing, and global distribution of clinical instruments."
};

export default async function AboutPage() {
  let companyInfo = {
    mission: "Engineered to empower surgeons and clinical specialists through micron-aligned stainless steel instruments.",
    vision: "To be the global gold standard in surgical instrument manufacturing and custom OEM solutions.",
    aboutText: "Founded with a commitment to engineering excellence, Orivence Surgical produces professional-grade surgical instruments, micro-tweezers, and clinical hardware for surgeons, medical clinics, and aesthetic dermatologists worldwide.",
    history: "Established in 1998 in Tuttlingen, Germany as a master metallurgy forge for clinical shears and scalpels.",
    qualityPolicy: "Zero-deflection jaw alignment, optical laser verification, and 100% passivation for rust resistance.",
    certifications: "ISO 13485, CE Mark, FDA Registered",
    standards: "DIN EN ISO 7153-1 Surgical Stainless Steel",
    awards: "European MedTech Industry Award Winner",
    ceoMessage: "Our mission is unyielding: to craft surgical tools so precise that they feel like a natural extension of the surgeon's hands."
  };

  try {
    const setting = await db.websiteSetting.findUnique({ where: { key: "company_info" } });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      companyInfo = { ...companyInfo, ...parsed };
    }
  } catch (e) {
    console.error("About page settings query error:", e);
  }

  return (
    <main className="min-h-screen bg-[#E0FBFC] pt-32 pb-24 font-sans text-[#253237]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Hero Section */}
        <div className="flex flex-col gap-4 mb-16 text-left">
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
            CRAFT & CLINICAL PRECISION
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#253237] font-sans">
            ABOUT ORIVENCE SURGICAL
          </h1>
          <p className="text-[#5C6B73] text-sm md:text-base max-w-3xl font-medium leading-relaxed">
            {companyInfo.aboutText}
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-8 flex flex-col gap-3 shadow-sm text-left">
            <span className="text-xs font-mono font-bold tracking-widest text-[#5C6B73] uppercase">OUR MISSION</span>
            <h3 className="text-xl font-bold text-[#253237]">Clinical Excellence & Micron Accuracy</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed font-medium">{companyInfo.mission}</p>
          </div>

          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-8 flex flex-col gap-3 shadow-sm text-left">
            <span className="text-xs font-mono font-bold tracking-widest text-[#5C6B73] uppercase">OUR VISION</span>
            <h3 className="text-xl font-bold text-[#253237]">Global Benchmark in Surgical Tools</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed font-medium">{companyInfo.vision}</p>
          </div>
        </div>

        {/* History & Quality Policy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {companyInfo.history && (
            <div className="bg-white border border-[#C2DFE3] rounded-2xl p-8 flex flex-col gap-3 shadow-sm text-left">
              <span className="text-xs font-mono font-bold tracking-widest text-[#5C6B73] uppercase flex items-center gap-2">
                <History className="w-4 h-4" /> COMPANY HISTORY
              </span>
              <p className="text-xs text-[#5C6B73] leading-relaxed font-medium">{companyInfo.history}</p>
            </div>
          )}

          {companyInfo.qualityPolicy && (
            <div className="bg-white border border-[#C2DFE3] rounded-2xl p-8 flex flex-col gap-3 shadow-sm text-left">
              <span className="text-xs font-mono font-bold tracking-widest text-[#5C6B73] uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> QUALITY POLICY
              </span>
              <p className="text-xs text-[#5C6B73] leading-relaxed font-medium">{companyInfo.qualityPolicy}</p>
            </div>
          )}
        </div>

        {/* CEO Message Banner if defined */}
        {companyInfo.ceoMessage && (
          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-8 mb-16 shadow-sm flex items-start gap-4 text-left">
            <Quote className="w-8 h-8 text-[#9DB4C0] shrink-0 mt-1" />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono font-bold text-[#5C6B73] uppercase tracking-widest">EXECUTIVE DIRECTIVE</span>
              <p className="text-sm italic text-[#253237] font-medium leading-relaxed">"{companyInfo.ceoMessage}"</p>
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 text-left">
          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0FBFC] flex items-center justify-center text-[#253237]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#253237]">Certifications</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed font-mono">
              {companyInfo.certifications || "ISO 13485, CE Mark, FDA Registered"}
            </p>
          </div>

          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0FBFC] flex items-center justify-center text-[#253237]">
              <Microscope className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#253237]">Standards</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed font-mono">
              {companyInfo.standards || "DIN EN ISO 7153-1 Surgical Steel"}
            </p>
          </div>

          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0FBFC] flex items-center justify-center text-[#253237]">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#253237]">Recognition</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed font-mono">
              {companyInfo.awards || "European MedTech Industry Award Winner"}
            </p>
          </div>

          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0FBFC] flex items-center justify-center text-[#253237]">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#253237]">Global Distribution</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed font-medium">
              Supplying OEM & branded surgical implements to hospitals, distributors, and clinics worldwide.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-[#253237] text-white rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 text-left">
            <h2 className="text-2xl md:text-3xl font-bold">Interested in Custom Surgical Manufacturing?</h2>
            <p className="text-xs md:text-sm text-[#C2DFE3]">Contact our engineering team for custom OEM orders, private label branding, and technical specifications.</p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 bg-[#C2DFE3] hover:bg-white text-[#253237] font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0"
          >
            REQUEST B2B QUOTATION
          </Link>
        </div>

      </div>
    </main>
  );
}
