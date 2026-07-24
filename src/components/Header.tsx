// src/components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, ChevronDown, User, ShieldCheck, ClipboardCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRFQ } from "@/context/RFQContext";

interface HeaderProps {
  onOpenCompare?: () => void;
  compareCount?: number;
}

export default function Header({ onOpenCompare, compareCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const { getTotalItems } = useRFQ();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("EN");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install ORIVENCE App on your phone/computer:\n\n1. On Android/Chrome: Click browser menu (⋮) -> 'Add to Home screen' or 'Install App'\n2. On iPhone/Safari: Tap Share button (⎋) -> 'Add to Home Screen'");
    }
  };

  // Dynamic branding, WhatsApp & categories state
  const [branding, setBranding] = useState({ logoText: "ORIVENCE", logoSubtext: "INDUSTRIAL" });
  const [whatsappSettings, setWhatsappSettings] = useState<{
    phone?: string;
    defaultMessage?: string;
    enableHeader?: boolean;
    enableProductPage?: boolean;
    enableRfqBasket?: boolean;
    enableFloating?: boolean;
  }>({});
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>([
    { name: "Esthetician Pro Series", slug: "esthetician-pro-series" },
    { name: "Lash & Brow Precision", slug: "lash-brow-precision" },
    { name: "Advanced Nail Tech Implements", slug: "advanced-nail-tech-implements" },
    { name: "Salon Extension Hardware", slug: "salon-extension-hardware" },
    { name: "Cosmetic Mixing Tools", slug: "cosmetic-mixing-tools" },
  ]);

  const loadBrandingAndCategories = async () => {
    try {
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.branding) {
          setBranding({
            logoText: settings.branding.logoText || "ORIVENCE",
            logoSubtext: settings.branding.logoSubtext || "INDUSTRIAL"
          });
        }
        if (settings.whatsapp_settings) {
          setWhatsappSettings(settings.whatsapp_settings);
        }
      }

      const categoriesRes = await fetch("/api/categories");
      if (categoriesRes.ok) {
        const cats = await categoriesRes.json();
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats.map(c => ({ name: c.name, slug: c.slug })));
        }
      }
    } catch (e) {
      console.error("Failed to load header data:", e);
    }
  };

  useEffect(() => {
    loadBrandingAndCategories();

    // Always remove dark class — we are white-only
    document.documentElement.classList.remove("dark");

    const token = localStorage.getItem("admin_token");
    setIsAdmin(!!token);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLangChange = (lang: string) => {
    setCurrentLang(lang);
    setLangDropdownOpen(false);
  };

  const rfqCount = getTotalItems();

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "py-3 glass-header shadow-luxury-md"
            : "py-5 bg-white/80 backdrop-blur-sm border-b border-[#e2e8f0]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo Brand Link */}
          <Link href="/" className="flex items-center gap-3 group">
            {branding.logoText.startsWith("/") || branding.logoText.startsWith("http") ? (
              <img src={branding.logoText} alt="ORIVENCE logo" className="h-8 max-w-[150px] object-contain" />
            ) : (
              <>
                <svg
                  viewBox="0 0 100 100"
                  className="w-8 h-8 stroke-[#0b192c] fill-none group-hover:rotate-45 transition-transform duration-500"
                  strokeWidth="1.5"
                >
                  <circle cx="50" cy="50" r="40" className="opacity-20" />
                  <polygon points="50,18 82,50 50,82 18,50" className="opacity-50" />
                  <line x1="50" y1="10" x2="50" y2="90" />
                  <line x1="10" y1="50" x2="90" y2="50" />
                  <circle cx="50" cy="50" r="3" className="fill-[#253237]" />
                </svg>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-base md:text-lg tracking-[0.25em] text-[#253237] uppercase leading-none">
                    {branding.logoText}
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.4em] text-[#5C6B73] uppercase mt-0.5 leading-none">
                    {branding.logoSubtext}
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/"
              className={`text-[13px] tracking-widest font-medium uppercase transition-colors ${
                pathname === "/"
                  ? "text-[#253237]"
                  : "text-[#5C6B73] hover:text-[#253237]"
              }`}
            >
              Home
            </Link>

            {/* Categories Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button
                className={`flex items-center gap-1 text-[13px] tracking-widest font-medium uppercase transition-colors ${
                  pathname.startsWith("/categories")
                    ? "text-[#253237]"
                    : "text-[#5C6B73] hover:text-[#253237]"
                }`}
              >
                Categories <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              <AnimatePresence>
                {megaMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full -left-20 w-80 mt-2 p-5 bg-white border border-[#C2DFE3] rounded-lg shadow-xl z-50"
                  >
                    <div className="mb-3 text-[10px] tracking-widest font-mono text-[#5C6B73] uppercase border-b border-[#E0FBFC] pb-2">
                      Surgical Ranges
                    </div>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                      {categories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/categories/${cat.slug}`}
                          className="text-xs font-medium text-[#5C6B73] hover:text-[#253237] p-2 rounded hover:bg-[#E0FBFC] transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/#products-section"
              className="text-[13px] tracking-widest font-medium uppercase text-[#5C6B73] hover:text-[#253237]"
            >
              Products
            </Link>
            <Link
              href="/#about-section"
              className="text-[13px] tracking-widest font-medium uppercase text-[#5C6B73] hover:text-[#253237]"
            >
              About
            </Link>
            <Link
              href="/#contact-section"
              className="text-[13px] tracking-widest font-medium uppercase text-[#5C6B73] hover:text-[#253237]"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Right Controls */}
          <div className="hidden lg:flex items-center gap-6">
            
            {/* WhatsApp Header Button if enabled */}
            {whatsappSettings?.enableHeader && whatsappSettings?.phone && (
              <a
                href={`https://wa.me/${whatsappSettings.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappSettings.defaultMessage || "Hello ORIVENCE Team, I would like to inquire about your surgical catalog.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-600 font-mono text-[10px] font-bold hover:bg-emerald-50 transition-all"
                title="Direct WhatsApp Inquiry"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                WHATSAPP
              </a>
            )}

            {/* Compare Drawer Indicator */}
            {onOpenCompare && (
              <button
                onClick={onOpenCompare}
                className="relative p-1.5 border border-[#C2DFE3] hover:border-[#253237] hover:text-[#253237] rounded-lg transition-colors text-[#5C6B73] bg-white"
                title="Compare Products"
              >
                <span className="font-mono text-[10px] font-bold tracking-wider">COMPARE</span>
                {compareCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#253237] text-white font-mono font-bold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                    {compareCount}
                  </span>
                )}
              </button>
            )}

            {/* RFQ Basket indicator */}
            <Link
              href="/rfq-basket"
              className="relative p-1.5 border border-[#C2DFE3] hover:border-[#253237] hover:text-[#253237] rounded-lg transition-colors text-[#5C6B73] bg-white"
              title="Quotation Basket"
            >
              <ClipboardCheck className="w-4 h-4" />
              {rfqCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#253237] text-white font-mono font-bold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center animate-pulse">
                  {rfqCount}
                </span>
              )}
            </Link>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#5C6B73] hover:text-[#253237] uppercase"
              >
                <Globe className="w-3.5 h-3.5" />
                {currentLang}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 mt-2 bg-white border border-[#C2DFE3] rounded shadow-lg p-1.5 flex flex-col gap-1 z-50 min-w-[80px]"
                  >
                    {["EN", "DE", "ES"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLangChange(lang)}
                        className={`text-left px-3 py-1.5 text-[11px] font-mono rounded hover:bg-[#E0FBFC] transition-colors ${
                          currentLang === lang
                            ? "text-[#253237] font-bold"
                            : "text-[#5C6B73]"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Install App Button */}
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-1 text-[11px] font-mono tracking-wider font-bold bg-[#253237] text-white px-3 py-1.5 rounded-full hover:bg-[#5C6B73] transition-all shadow-sm"
              title="Install ORIVENCE App"
            >
              <img src="/icon-192.png" alt="Orivence App" className="w-3.5 h-3.5 rounded-full object-cover" />
              <span>INSTALL APP</span>
            </button>

            {/* Admin Login/Dashboard Link */}
            <Link
              href={isAdmin ? "/admin/dashboard" : "/admin/login"}
              className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider font-semibold border border-[#C2DFE3] px-3.5 py-1.5 rounded-full hover:bg-[#253237] hover:text-white hover:border-[#253237] text-[#253237] transition-all duration-300"
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  DASHBOARD
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  PORTAL
                </>
              )}
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-4">
            
            {/* Mobile Basket indicator */}
            <Link
              href="/rfq-basket"
              className="relative p-1.5 border border-[#e2e8f0] rounded-lg text-slate-500 bg-white"
            >
              <ClipboardCheck className="w-4 h-4" />
              {rfqCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#0b192c] text-white font-mono font-bold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {rfqCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#0b192c] p-1"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[60px] bottom-0 bg-white z-30 px-6 py-8 flex flex-col gap-6 lg:hidden overflow-y-auto"
          >
            <div className="flex flex-col gap-5">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-display tracking-widest font-semibold text-[#0b192c] uppercase"
              >
                Home
              </Link>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] tracking-widest font-mono text-slate-400 uppercase">
                  Categories
                </span>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-slate-600 hover:text-[#0b192c] ml-2"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <Link
                href="/#products-section"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-display tracking-widest font-semibold text-[#0b192c] uppercase"
              >
                Products
              </Link>
              <Link
                href="/#about-section"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-display tracking-widest font-semibold text-[#0b192c] uppercase"
              >
                About
              </Link>
              <Link
                href="/#contact-section"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-display tracking-widest font-semibold text-[#0b192c] uppercase"
              >
                Contact
              </Link>
              
              <div className="border-t border-[#e2e8f0] pt-4 mt-2">
                <Link
                  href={isAdmin ? "/admin/dashboard" : "/admin/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0b192c] text-white font-mono font-bold text-xs tracking-wider rounded-lg"
                >
                  {isAdmin ? "GO TO ADMIN CONSOLE" : "ADMIN CONSOLE LOGIN"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
