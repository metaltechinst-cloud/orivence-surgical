// src/components/HomeClientPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, CheckCircle2, Globe, Shield, Crosshair, Award, 
  Users2, Mail, Phone, MessageSquare, ShieldCheck, FileText, Scale 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProductCard from "@/components/ProductCard";
import InquiryModal from "@/components/InquiryModal";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ProductComparisonModal, { ComparisonProduct } from "@/components/ProductComparisonModal";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  thumbnail: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: string;
  finish: string;
  dimensions: string;
  sku: string;
  modelNumber?: string;
  length?: string;
  width?: string;
  tipSize?: string;
  jawSize?: string;
  weight?: string;
  imagesJson: string;
  specJson: string;
  category: {
    name: string;
  };
}

interface HomeClientPageProps {
  categories: Category[];
  featuredProducts: Product[];
}

export default function HomeClientPage({ categories, featuredProducts }: HomeClientPageProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState("General Corporate Catalog Request");
  const [selectedSkuForInquiry, setSelectedSkuForInquiry] = useState("");
  
  // Product comparison state
  const [comparisonProducts, setComparisonProducts] = useState<ComparisonProduct[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // Contacts states
  const [contactForm, setContactForm] = useState({ name: "", email: "", country: "", message: "" });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Dynamic Settings (loaded from API)
  const [settings, setSettings] = useState<any>({
    homepage_hero: {
      headline: "MICRON-LEVEL SURGICAL ALIGNMENT",
      subheadline: "Aesthetic implements forged for elite dermatologists, lash masters, and clinical beauty technicians.",
      ctaText: "ACQUIRE CATALOG",
      ctaLink: "#contact-section",
      heroImage: "/images/products/hero_tweezers.png"
    },
    contact_info: {
      email: "sales@orivance.de",
      phone: "+49 (0) 7461 992-0",
      whatsapp: "+923000000000",
      address: "Tuttlingen Industrial Zone, Germany",
      hours: "08:00 - 18:00 CET"
    },
    whatsapp_settings: {
      phone: "+923000000000",
      defaultMessage: "Hello ORIVENCE Team, I am interested in inquiring about your surgical catalog.",
      enableHeader: true,
      enableFloating: true
    },
    section_visibility: {
      hero: true,
      about: true,
      categories: true,
      products: true,
      global: true,
      contact: true
    },
    section_order: ["hero", "about", "categories", "products", "global", "contact"]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings((prev: any) => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error("Failed to load home settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.country || !contactForm.message) return;

    setContactLoading(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          country: contactForm.country,
          message: contactForm.message,
          items: [{ productId: featuredProducts[0]?.id || "catalog", quantity: 1 }]
        })
      });

      if (res.ok) {
        setContactSuccess(true);
        setContactForm({ name: "", email: "", country: "", message: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContactLoading(false);
    }
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparisonProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const sectionOrder = settings.section_order || ["hero", "about", "categories", "products", "global", "contact"];
  const sectionVisibility = settings.section_visibility || {};

  const renderSection = (sectionKey: string) => {
    if (sectionVisibility[sectionKey] === false) return null;

    switch (sectionKey) {
      case "hero":
        return (
          <section key="hero" className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-gradient-to-br from-[#E0FBFC] via-white to-[#C2DFE3]/30">
            {showWelcome && (
              <WelcomeScreen onComplete={() => setShowWelcome(false)} />
            )}

            <div className="absolute inset-0 drafting-grid opacity-30 pointer-events-none z-[1]" />
            {/* Giant Orivence Surgical Logo Watermark in Background */}
            <div className="absolute top-1/2 left-1/2 w-[550px] md:w-[750px] h-[550px] md:h-[750px] opacity-[0.06] pointer-events-none z-[1] select-none animate-watermark-spin">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full stroke-[#253237] fill-none"
                strokeWidth="0.6"
              >
                <circle cx="50" cy="50" r="40" />
                <circle cx="50" cy="50" r="44" strokeDasharray="1 3" />
                <polygon points="50,18 82,50 50,82 18,50" />
                <line x1="50" y1="5" x2="50" y2="95" />
                <line x1="5" y1="50" x2="95" y2="50" />
                <circle cx="50" cy="50" r="2.5" className="fill-[#253237] stroke-none" />
              </svg>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 font-sans">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-6 text-left"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C2DFE3] bg-[#E0FBFC] w-fit shadow-luxury-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest text-[#253237] uppercase font-bold">
                    GERMAN MANUFACTURING STANDARDS
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#253237] font-sans leading-[1.1]">
                  {settings.homepage_hero?.headline || "THIS IS THE UPDATED ORIVENCE WEBSITE"}
                </h1>

                <p className="text-[#5C6B73] text-sm md:text-base leading-relaxed max-w-xl font-sans font-medium">
                  {settings.homepage_hero?.subheadline || "Aesthetic implements forged for elite dermatologists, lash masters, and clinical beauty technicians."}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4 font-sans">
                  <button
                    onClick={() => {
                      setSelectedProductForInquiry("General Corporate Catalog Request");
                      setSelectedSkuForInquiry("");
                      setInquiryModalOpen(true);
                    }}
                    className="px-8 py-4 bg-[#253237] hover:bg-[#5C6B73] text-white font-sans text-xs tracking-widest font-bold rounded-xl transition-all shadow-luxury-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                  >
                    {settings.homepage_hero?.ctaText || "ACQUIRE CATALOG"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#products-section"
                    className="px-8 py-4 border border-[#C2DFE3] hover:border-[#253237] font-sans text-xs tracking-widest font-bold rounded-xl transition-all text-[#253237] bg-white hover:bg-[#E0FBFC]"
                  >
                    EXPLORE RANGE
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-square flex items-center justify-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-teal-glow pointer-events-none rounded-full" />
                
                <Image
                  src={settings.homepage_hero?.heroImage || "/images/products/hero_tweezers.png"}
                  alt="Orivence Instrument Catalog"
                  width={500}
                  height={500}
                  className="object-contain w-5/6 h-5/6 z-10 drop-shadow-2xl animate-float-slow pointer-events-none select-none"
                  priority
                />
              </motion.div>
            </div>
          </section>
        );

      case "about":
        return (
          <section key="about" id="about-section" className="py-24 bg-[#E0FBFC] border-t border-[#C2DFE3] relative">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left font-sans">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                  ABOUT ORIVENCE SURGICAL
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                  TUTTLINGEN FORGE CRAFTSMANSHIP
                </h2>
                <p className="text-[#5C6B73] text-xs md:text-sm leading-relaxed font-sans font-medium">
                  Originating from Germany's surgical hub, Orivence manufactures ultra-precise aesthetic implements. Our tweezers, forceps, and nippers undergo microscope calibration to achieve 1.5µm tip alignment limits.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                <div className="p-6 surgical-card rounded-2xl flex flex-col gap-2 bg-white border border-[#C2DFE3]">
                  <Shield className="w-6 h-6 text-[#5C6B73] mb-2" />
                  <span className="text-2xl font-bold text-[#253237]">AISI 316L</span>
                  <span className="text-[10px] text-[#5C6B73] uppercase tracking-widest font-bold">Surgical Alloy</span>
                </div>
                <div className="p-6 surgical-card rounded-2xl flex flex-col gap-2 bg-white border border-[#C2DFE3]">
                  <Crosshair className="w-6 h-6 text-[#5C6B73] mb-2" />
                  <span className="text-2xl font-bold text-[#253237]">1.5 µm</span>
                  <span className="text-[10px] text-[#5C6B73] uppercase tracking-widest font-bold">Micron Tolerance</span>
                </div>
                <div className="p-6 surgical-card rounded-2xl flex flex-col gap-2 bg-white border border-[#C2DFE3]">
                  <Award className="w-6 h-6 text-[#5C6B73] mb-2" />
                  <span className="text-2xl font-bold text-[#253237]">ISO 13485</span>
                  <span className="text-[10px] text-[#5C6B73] uppercase tracking-widest font-bold">Compliant Audit</span>
                </div>
              </div>
            </div>
          </section>
        );

      case "categories":
        return (
          <section key="categories" id="categories-section" className="py-24 bg-white border-t border-[#C2DFE3] relative">
            <div className="max-w-7xl mx-auto px-6 font-sans">
              <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6 text-left">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                    SPECIALIZED DEPARTMENTS
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                    EXPLORE DEPARTMENTS
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group surgical-card rounded-2xl overflow-hidden flex flex-col text-left border border-[#C2DFE3] bg-white"
                  >
                    <div className="aspect-[4/3] w-full bg-[#E0FBFC] relative overflow-hidden">
                      <Image
                        src={cat.thumbnail || cat.image || "/images/products/hero_tweezers.png"}
                        alt={cat.name}
                        width={400}
                        height={300}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 font-sans"
                      />
                    </div>
                    <div className="p-6 flex flex-col gap-2 font-sans">
                      <h3 className="text-sm font-bold tracking-widest text-[#253237] uppercase group-hover:text-[#5C6B73] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#5C6B73] line-clamp-2 font-sans font-medium">
                        {cat.description || "Precision surgical instruments crafted for professional clinical workflows."}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case "products":
        return (
          <section key="products" id="products-section" className="py-24 bg-[#E0FBFC] border-t border-[#C2DFE3] relative">
            <div className="max-w-7xl mx-auto px-6 font-sans">
              <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6 text-left">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                    FEATURED SHOWCASE
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                    PREMIUM INSTRUMENTS
                  </h2>
                </div>
                <p className="text-[#5C6B73] text-xs md:text-sm max-w-md font-sans font-medium">
                  A select group of our most requested catalog implements. Calibrated and prepared for commercial delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          </section>
        );

      case "facility":
        return (
          <section key="facility" id="facility-section" className="py-24 bg-white border-t border-[#C2DFE3] relative text-left font-sans">
            <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                  OUR MANUFACTURING FACILITY
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                  {settings.facility_section?.title || "TUTTLINGEN CRAFTSMANSHIP & LABORATORY"}
                </h2>
                <p className="text-[#5C6B73] text-xs md:text-sm max-w-xl font-sans font-medium">
                  {settings.facility_section?.description || "Explore our precision calibration workshop, microscope inspection stations, and sealed sterilization facilities."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(settings.facility_section?.images || [
                  { url: "/images/products/hero_tweezers.png", title: "Microscope Calibration Station" },
                  { url: "/images/products/hero_tweezers.png", title: "Surgical Alloy Tempering Chamber" },
                  { url: "/images/products/hero_tweezers.png", title: "Cleanroom Export Packaging" }
                ]).map((item: any, idx: number) => (
                  <div key={idx} className="surgical-card rounded-2xl overflow-hidden p-4 flex flex-col gap-3 border border-[#C2DFE3] bg-white">
                    <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-[#E0FBFC]">
                      <Image src={item.url || "/images/products/hero_tweezers.png"} alt={item.title || "Facility Image"} fill className="object-cover font-sans" />
                    </div>
                    <span className="font-sans text-xs font-bold text-[#253237] uppercase">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "album":
        return (
          <section key="album" id="album-section" className="py-24 bg-[#E0FBFC] border-t border-[#C2DFE3] relative text-left font-sans">
            <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                  INSTRUMENT ALBUM & GALLERY
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                  {settings.album_section?.title || "SURGICAL IMPLEMENT PHOTOGRAPHY"}
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(settings.album_section?.photos || [
                  { url: "/images/products/hero_tweezers.png", caption: "Micro-Precision Isolate Tip" },
                  { url: "/images/products/hero_tweezers.png", caption: "Electro-Polished Satin Surface" },
                  { url: "/images/products/hero_tweezers.png", caption: "High-Tension Forceps Jaw" },
                  { url: "/images/products/hero_tweezers.png", caption: "Laser-Etched Serial Coding" }
                ]).map((photo: any, idx: number) => (
                  <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-[#C2DFE3] bg-white">
                    <Image src={photo.url || "/images/products/hero_tweezers.png"} alt={photo.caption || "Album photo"} fill className="object-cover group-hover:scale-105 transition-transform duration-500 font-sans" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#253237]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                      <span className="text-[10px] font-mono text-white font-bold uppercase">{photo.caption}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "videos":
        return (
          <section key="videos" id="videos-section" className="py-24 bg-white border-t border-[#C2DFE3] relative text-left font-sans">
            <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                  MANUFACTURING PROCESS MEDIA
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                  {settings.videos_section?.title || "PRECISION ALIGNMENT IN MOTION"}
                </h2>
              </div>

              <div className="aspect-video w-full max-w-4xl mx-auto border border-[#C2DFE3] rounded-2xl overflow-hidden bg-[#E0FBFC] relative flex items-center justify-center">
                {settings.videos_section?.videoUrl ? (
                  <video
                    src={settings.videos_section.videoUrl}
                    controls
                    autoPlay={settings.videos_section.autoplay || false}
                    loop={settings.videos_section.loop || false}
                    muted={settings.videos_section.muted || true}
                    className="w-full h-full object-cover font-sans"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-[#5C6B73]">
                    <Image src="/images/products/hero_tweezers.png" alt="Video fallback" width={400} height={250} className="object-contain opacity-50 font-sans" />
                    <span className="font-mono text-xs uppercase">Process Video Stream Active</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case "global":
        return (
          <section key="global" id="global-section" className="py-24 bg-[#E0FBFC] border-t border-[#C2DFE3] relative text-left font-sans">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                    COMMERCIAL LOGISTICS & COMPLIANCE
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                    GLOBAL B2B SUPPLY CAPABILITIES
                  </h2>
                </div>
                <p className="text-[#5C6B73] text-xs md:text-sm max-w-md font-sans font-medium">
                  Direct commercial distribution, custom OEM branding, and international freight logistics for clinics, distributors, and esthetic academies worldwide.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 surgical-card rounded-2xl flex flex-col gap-4 bg-white border border-[#C2DFE3]">
                  <div className="p-3 border border-[#C2DFE3] rounded-xl w-fit bg-[#E0FBFC]">
                    <ShieldCheck className="w-6 h-6 text-[#5C6B73]" />
                  </div>
                  <h3 className="font-bold text-sm text-[#253237] font-sans uppercase tracking-wider">
                    Microscope-Verified Precision
                  </h3>
                  <p className="text-xs text-[#5C6B73] leading-relaxed font-sans font-medium">
                    Every implement tip is microscope-inspected to enforce sub-2µm alignment tolerances before sealed export packaging.
                  </p>
                </div>

                <div className="p-8 surgical-card rounded-2xl flex flex-col gap-4 bg-white border border-[#C2DFE3]">
                  <div className="p-3 border border-[#C2DFE3] rounded-xl w-fit bg-[#E0FBFC]">
                    <Globe className="w-6 h-6 text-[#5C6B73]" />
                  </div>
                  <h3 className="font-bold text-sm text-[#253237] font-sans uppercase tracking-wider">
                    International Air Freight
                  </h3>
                  <p className="text-xs text-[#5C6B73] leading-relaxed font-sans font-medium">
                    Streamlined international customs handling and door-to-door express air dispatch to clinical buyers globally.
                  </p>
                </div>

                <div className="p-8 surgical-card rounded-2xl flex flex-col gap-4 bg-white border border-[#C2DFE3]">
                  <div className="p-3 border border-[#C2DFE3] rounded-xl w-fit bg-[#E0FBFC]">
                    <FileText className="w-6 h-6 text-[#5C6B73]" />
                  </div>
                  <h3 className="font-bold text-sm text-[#253237] font-sans uppercase tracking-wider">
                    Custom Laser Engraving
                  </h3>
                  <p className="text-xs text-[#5C6B73] leading-relaxed font-sans font-medium">
                    Precision micro-laser etching for corporate branding, clinic logos, custom serials, and SKU catalog coding.
                  </p>
                </div>
              </div>
            </div>
          </section>
        );

      case "contact":
        return (
          <section key="contact" id="contact-section" className="py-24 bg-white border-t border-[#C2DFE3] relative font-sans">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              <div className="flex flex-col gap-8 text-left">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
                    INQUIRY DESK
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#253237] font-sans">
                    REQUEST COMMERCIAL QUOTATIONS
                  </h2>
                  <p className="text-[#5C6B73] text-xs md:text-sm leading-relaxed max-w-md font-sans font-medium">
                    To inquire about custom sizes, catalog supply, laser engraving, or custom tensioning calibrations, reach out to our representatives.
                  </p>
                </div>

                <div className="flex flex-col gap-6 font-mono text-xs text-[#5C6B73]">
                  <div className="flex items-start gap-4">
                    <Mail className="w-5 h-5 text-[#5C6B73] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#5C6B73] uppercase">Corporate Sales Division</span>
                      <a href={`mailto:${settings.contact_info?.email || "sales@orivance.de"}`} className="block text-sm font-semibold text-[#253237] mt-1 hover:text-[#5C6B73] transition-colors">
                        {settings.contact_info?.email || "sales@orivance.de"}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="w-5 h-5 text-[#5C6B73] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#5C6B73] uppercase">Corporate Hotline</span>
                      <a href={`tel:${(settings.contact_info?.phone || "").replace(/[^0-9+]/g, "")}`} className="block text-sm font-semibold text-[#253237] mt-1 hover:text-[#5C6B73] transition-colors">
                        {settings.contact_info?.phone || "+49 (0) 7461 992-0"}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MessageSquare className="w-5 h-5 text-[#5C6B73] shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#5C6B73] uppercase">Surgical Center Hours</span>
                      <span className="block text-xs font-semibold text-[#253237] mt-1">
                        {settings.contact_info?.hours || "08:00 - 18:00 CET"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="surgical-card p-8 rounded-2xl relative text-left bg-white border border-[#C2DFE3]">
                <h3 className="text-xs font-bold tracking-widest text-[#253237] uppercase font-sans mb-6">
                  Submit Catalog Quote Request
                </h3>

                {contactSuccess ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <h4 className="text-xs font-bold text-[#253237]">Inquiry Sent Successfully</h4>
                    <p className="text-xs text-[#5C6B73] max-w-xs leading-relaxed font-sans font-medium">
                      Thank you. Your request is registered under Orivance Global Sales. A representative will contact you with a formal quote.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="flex flex-col gap-4 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[10px]">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[#5C6B73] uppercase font-bold">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Name"
                          className="bg-[#E0FBFC]/50 border border-[#C2DFE3] rounded px-3 py-2 text-xs text-[#253237] focus:outline-none focus:border-[#5C6B73] font-sans"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[#5C6B73] uppercase font-bold">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="Email"
                          className="bg-[#E0FBFC]/50 border border-[#C2DFE3] rounded px-3 py-2 text-xs text-[#253237] focus:outline-none focus:border-[#5C6B73] font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                      <label className="text-[#5C6B73] uppercase font-bold">Country *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.country}
                        onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                        placeholder="Country"
                        className="bg-[#E0FBFC]/50 border border-[#C2DFE3] rounded px-3 py-2 text-xs text-[#253237] focus:outline-none focus:border-[#5C6B73] font-sans"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                      <label className="text-[#5C6B73] uppercase font-bold">Requirements Message *</label>
                      <textarea
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        rows={4}
                        placeholder="Detail the catalog ranges or bulk item quantities you require..."
                        className="bg-[#E0FBFC]/50 border border-[#C2DFE3] rounded px-3 py-2 text-xs text-[#253237] focus:outline-none focus:border-[#5C6B73] resize-none font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="bg-[#253237] hover:bg-[#5C6B73] text-white font-sans text-xs tracking-widest font-bold py-3.5 rounded-lg flex items-center justify-center gap-1.5 shadow-luxury-md disabled:opacity-50 transition-all"
                    >
                      {contactLoading ? "TRANSMITTING..." : "SUBMIT INQUIRY"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#253237] flex flex-col font-sans">
      
      {/* Sections rendering based on order and visibility */}
      {sectionOrder.map((sectionKey: string) => renderSection(sectionKey))}

      {/* Floating WhatsApp trigger */}
      <FloatingWhatsApp
        phone={settings.whatsapp_settings?.phone || settings.contact_info?.whatsapp}
        defaultMessage={settings.whatsapp_settings?.defaultMessage}
        enabled={settings.whatsapp_settings?.enableFloating !== false}
      />

      {/* Product Comparison Modal */}
      <ProductComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        products={comparisonProducts}
        onRemoveProduct={handleRemoveFromCompare}
        onClearAll={() => setComparisonProducts([])}
      />

      {/* Catalog Quote Modal */}
      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        productName={selectedProductForInquiry}
        sku={selectedSkuForInquiry}
      />
    </div>
  );
}
