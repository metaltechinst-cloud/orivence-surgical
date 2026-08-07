// src/components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, ChevronDown, User, ShieldCheck, ClipboardCheck, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRFQ } from "@/context/RFQContext";
import SocialIcons, { SocialLinksConfig } from "./SocialIcons";

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

  // Dynamic branding, social links, header config & WhatsApp settings
  const [branding, setBranding] = useState<{ logoText: string; logoSubtext: string; logoUrl?: string }>({
    logoText: "ORIVENCE",
    logoSubtext: "INDUSTRIAL"
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinksConfig>({});
  const [headerConfig, setHeaderConfig] = useState<{
    stickyHeader?: boolean;
    showSearch?: boolean;
    showCtaButton?: boolean;
    showWhatsappButton?: boolean;
    showLogo?: boolean;
    showNavigation?: boolean;
    showAnnouncementBar?: boolean;
    announcementText?: string;
    showTopBar?: boolean;
    showLanguageSwitcher?: boolean;
  }>({
    stickyHeader: true,
    showSearch: true,
    showCtaButton: true,
    showWhatsappButton: true,
    showLogo: true,
    showNavigation: true,
    showAnnouncementBar: true,
    announcementText: "ISO 13485 CERTIFIED SURGICAL MANUFACTURING — GLOBAL B2B DISPATCH",
    showTopBar: true,
    showLanguageSwitcher: true
  });
  const [whatsappSettings, setWhatsappSettings] = useState<{ phone?: string; defaultMessage?: string }>({});
  
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>([
    { name: "Esthetician Pro Series", slug: "esthetician-pro-series" },
    { name: "Lash & Brow Precision", slug: "lash-brow-precision" },
    { name: "Advanced Nail Tech Implements", slug: "advanced-nail-tech-implements" },
    { name: "Salon Extension Hardware", slug: "salon-extension-hardware" },
    { name: "Cosmetic Mixing Tools", slug: "cosmetic-mixing-tools" },
  ]);

  const loadHeaderSettings = async () => {
    try {
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.branding) {
          setBranding({
            logoText: settings.branding.logoText || "ORIVENCE",
            logoSubtext: settings.branding.logoSubtext || "INDUSTRIAL",
            logoUrl: settings.branding.logoUrl
          });
        }
        if (settings.social_links) {
          setSocialLinks(settings.social_links);
        }
        if (settings.header_config) {
          setHeaderConfig(prev => ({ ...prev, ...settings.header_config }));
        }
        if (settings.contact_info?.whatsapp) {
          setWhatsappSettings({ phone: settings.contact_info.whatsapp });
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
      console.error("Failed to load header settings:", e);
    }
  };

  useEffect(() => {
    loadHeaderSettings();
    document.documentElement.classList.remove("dark");

    const token = localStorage.getItem("admin_token");
    setIsAdmin(!!token);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const rfqCount = getTotalItems();
  const isSticky = headerConfig.stickyHeader !== false;

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Optional Top Bar */}
      {headerConfig.showTopBar !== false && (
        <div className="bg-[#253237] text-white text-[10px] font-mono py-1.5 px-6 border-b border-[#5C6B73]/30 hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>GERMAN SURGICAL PRECISION FORGING</span>
              <span className="text-[#9DB4C0]">|</span>
              <span>ISO 13485 CERTIFIED</span>
            </div>
            <div className="flex items-center gap-4">
              <SocialIcons links={socialLinks} targetLocation="header" iconClassName="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* Optional Announcement Bar */}
      {headerConfig.showAnnouncementBar !== false && (
        <div className="bg-[#9DB4C0] text-[#253237] font-mono text-[10px] font-bold py-1 px-4 text-center tracking-widest uppercase border-b border-[#5C6B73]/20">
          {headerConfig.announcementText || "ISO 13485 CERTIFIED SURGICAL MANUFACTURING — GLOBAL B2B DISPATCH"}
        </div>
      )}

      {/* Main Header Container */}
      <header
        className={`${isSticky ? "fixed top-0 left-0 right-0 z-40" : "relative z-40"} transition-all duration-300 ${
          scrolled
            ? "py-3 glass-header shadow-luxury-md"
            : "py-4 bg-white/90 backdrop-blur-sm border-b border-[#e2e8f0]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Brand Logo */}
          {headerConfig.showLogo !== false && (
            <Link href="/" className="flex items-center gap-3 group">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="ORIVENCE logo" className="h-8 max-w-[160px] object-contain" />
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
          )}

          {/* Desktop Navigation Links */}
          {headerConfig.showNavigation !== false && (
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href="/"
                className={`text-[13px] tracking-widest font-medium uppercase transition-colors ${
                  pathname === "/" ? "text-[#253237] font-bold" : "text-[#5C6B73] hover:text-[#253237]"
                }`}
              >
                Home
              </Link>

              {/* Categories Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button
                  className={`flex items-center gap-1 text-[13px] tracking-widest font-medium uppercase transition-colors ${
                    pathname.startsWith("/categories") ? "text-[#253237] font-bold" : "text-[#5C6B73] hover:text-[#253237]"
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
                      className="absolute top-full -left-20 w-80 mt-2 p-5 bg-white border border-[#C2DFE3] rounded-lg shadow-xl z-50 text-left"
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

              <Link href="/products" className={`text-[13px] tracking-widest font-medium uppercase transition-colors ${pathname === "/products" ? "text-[#253237] font-bold" : "text-[#5C6B73] hover:text-[#253237]"}`}>
                Products
              </Link>
              <Link href="/about" className={`text-[13px] tracking-widest font-medium uppercase transition-colors ${pathname === "/about" ? "text-[#253237] font-bold" : "text-[#5C6B73] hover:text-[#253237]"}`}>
                About
              </Link>
              <Link href="/contact" className={`text-[13px] tracking-widest font-medium uppercase transition-colors ${pathname === "/contact" ? "text-[#253237] font-bold" : "text-[#5C6B73] hover:text-[#253237]"}`}>
                Contact
              </Link>
            </nav>
          )}

          {/* Desktop Right Controls */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Search Button */}
            {headerConfig.showSearch !== false && (
              <Link href="/products" className="p-1.5 text-[#5C6B73] hover:text-[#253237] transition-colors" title="Search Catalog">
                <Search className="w-4 h-4" />
              </Link>
            )}

            {/* WhatsApp Header Button */}
            {headerConfig.showWhatsappButton !== false && whatsappSettings?.phone && (
              <a
                href={`https://wa.me/${whatsappSettings.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello ORIVENCE Team, I would like to inquire about your surgical catalog.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-600 font-mono text-[10px] font-bold hover:bg-emerald-50 transition-all"
                title="Direct WhatsApp Inquiry"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                WHATSAPP
              </a>
            )}

            {/* Compare Products */}
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

            {/* RFQ Basket CTA */}
            {headerConfig.showCtaButton !== false && (
              <Link
                href="/rfq-basket"
                className="relative p-1.5 border border-[#C2DFE3] hover:border-[#253237] hover:text-[#253237] rounded-lg transition-colors text-[#5C6B73] bg-white flex items-center gap-1.5"
                title="Quotation Basket"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="font-mono text-[10px] font-bold">RFQ</span>
                {rfqCount > 0 && (
                  <span className="bg-[#253237] text-white font-mono font-bold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                    {rfqCount}
                  </span>
                )}
              </Link>
            )}

            {/* Language Selector */}
            {headerConfig.showLanguageSwitcher !== false && (
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 text-xs font-mono font-medium text-[#5C6B73] hover:text-[#253237] uppercase"
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
                      className="absolute right-0 mt-2 bg-white border border-[#C2DFE3] rounded shadow-lg p-1 flex flex-col gap-1 z-50 min-w-[70px]"
                    >
                      {["EN", "DE", "ES"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => { setCurrentLang(lang); setLangDropdownOpen(false); }}
                          className={`text-[10px] font-mono p-1 rounded text-left ${currentLang === lang ? "bg-[#253237] text-white font-bold" : "text-[#5C6B73] hover:bg-zinc-100"}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#253237]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-[#C2DFE3] px-6 py-6 flex flex-col gap-4 text-left font-mono"
            >
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-[#253237] uppercase">Home</Link>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-[#253237] uppercase">Products</Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-[#253237] uppercase">About</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-[#253237] uppercase">Contact</Link>
              <Link href="/rfq-basket" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-emerald-600 uppercase flex items-center justify-between">
                <span>RFQ Basket</span>
                <span className="bg-[#253237] text-white text-[10px] px-2 py-0.5 rounded-full">{rfqCount}</span>
              </Link>
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <SocialIcons links={socialLinks} targetLocation="header" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
