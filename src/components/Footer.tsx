// src/components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import SocialIcons, { SocialLinksConfig } from "./SocialIcons";

export default function Footer() {
  const pathname = usePathname();
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  
  const [branding, setBranding] = useState<{ logoText: string; logoSubtext: string; logoUrl?: string; footerLogoUrl?: string }>({
    logoText: "ORIVENCE",
    logoSubtext: "INDUSTRIAL"
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinksConfig>({});
  const [footerConfig, setFooterConfig] = useState<{
    description?: string;
    copyright?: string;
    showQuickLinks?: boolean;
    showCategoryLinks?: boolean;
    showLegalLinks?: boolean;
    showNewsletter?: boolean;
    showSocialIcons?: boolean;
    showContact?: boolean;
    logoUrl?: string;
  }>({
    description: "Crafting premium surgical implements with micron-level tolerance. Forged in Tuttlingen, trusted by medical specialists globally.",
    copyright: `© ${new Date().getFullYear()} ORIVENCE SURGICAL. All rights reserved.`,
    showQuickLinks: true,
    showCategoryLinks: true,
    showLegalLinks: true,
    showNewsletter: true,
    showSocialIcons: true,
    showContact: true
  });
  
  const [contacts, setContacts] = useState({
    phone: "+49 (7461) 9876-0",
    whatsapp: "+49 170 1234567",
    email: "inquiry@orivence.de",
    address: "MedTech Park 4B, 78532 Tuttlingen, Germany"
  });

  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>([
    { name: "Esthetician Pro Series", slug: "esthetician-pro-series" },
    { name: "Lash & Brow Precision", slug: "lash-brow-precision" },
    { name: "Advanced Nail Tech Implements", slug: "advanced-nail-tech-implements" },
    { name: "Salon Extension Hardware", slug: "salon-extension-hardware" },
    { name: "Cosmetic Mixing Tools", slug: "cosmetic-mixing-tools" },
  ]);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.contact_info) {
            setContacts(prev => ({ ...prev, ...data.contact_info }));
          }
          if (data.branding) {
            setBranding({
              logoText: data.branding.logoText || "ORIVENCE",
              logoSubtext: data.branding.logoSubtext || "INDUSTRIAL",
              logoUrl: data.branding.logoUrl,
              footerLogoUrl: data.branding.footerLogoUrl
            });
          }
          if (data.social_links) {
            setSocialLinks(data.social_links);
          }
          if (data.footer_config) {
            setFooterConfig(prev => ({ ...prev, ...data.footer_config }));
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
        console.error("Footer settings sync error:", e);
      }
    };
    fetchFooterData();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput) {
      setSubscribed(true);
      setEmailInput("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const logoSource = footerConfig.logoUrl || branding.footerLogoUrl || branding.logoUrl;

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-[#253237] text-[#C2DFE3] pt-16 pb-10 border-t border-[#5C6B73]/30 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-radial from-[#9DB4C0]/10 to-transparent opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10 text-left">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-5 md:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            {logoSource ? (
              <img 
                src={logoSource} 
                alt="ORIVENCE logo" 
                className="h-8 max-w-[150px] object-contain" 
                onError={() => setBranding(prev => ({ ...prev, logoUrl: undefined, footerLogoUrl: undefined }))}
              />
            ) : (
              <>
                <svg
                  viewBox="0 0 100 100"
                  className="w-8 h-8 stroke-white fill-none"
                  strokeWidth="1.5"
                >
                  <circle cx="50" cy="50" r="40" className="opacity-20" />
                  <polygon points="50,18 82,50 50,82 18,50" className="opacity-50" />
                  <line x1="50" y1="10" x2="50" y2="90" />
                  <line x1="10" y1="50" x2="90" y2="50" />
                  <circle cx="50" cy="50" r="3" className="fill-white" />
                </svg>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg tracking-[0.25em] text-white uppercase leading-none">
                    {branding.logoText}
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.4em] text-[#9DB4C0] uppercase mt-0.5 leading-none">
                    {branding.logoSubtext}
                  </span>
                </div>
              </>
            )}
          </Link>

          <p className="text-xs text-[#C2DFE3] leading-relaxed font-sans font-medium">
            {footerConfig.description || "Crafting premium surgical implements with micron-level tolerance. Forged in Tuttlingen, trusted by medical specialists globally."}
          </p>

          {/* Social Icons in Footer */}
          {footerConfig.showSocialIcons !== false && (
            <div className="pt-1">
              <SocialIcons links={socialLinks} targetLocation="footer" iconClassName="w-4 h-4 text-white hover:text-[#9DB4C0]" />
            </div>
          )}

          <div className="flex items-center gap-3 text-xs font-sans pt-1">
            <span className="text-[#9DB4C0] text-[10px] font-mono">STANDARDS:</span>
            <span className="text-white border border-[#5C6B73] px-2 py-0.5 rounded text-[10px] font-bold font-mono">ISO 13485</span>
            <span className="text-white border border-[#5C6B73] px-2 py-0.5 rounded text-[10px] font-bold font-mono">CE MARK</span>
          </div>
        </div>

        {/* Quick Links Column */}
        {footerConfig.showQuickLinks !== false && (
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono tracking-widest text-white uppercase border-b border-[#5C6B73]/40 pb-2">
              Quick Navigation
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs font-mono">
              <li>
                <Link href="/" className="hover:text-white transition-colors uppercase">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors uppercase">
                  Surgical Catalog
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white transition-colors uppercase">
                  Product Categories
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors uppercase">
                  Company Profile
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors uppercase">
                  Global Contacts
                </Link>
              </li>
              <li>
                <Link href="/rfq-basket" className="hover:text-white transition-colors uppercase">
                  RFQ Basket
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Category Links Column */}
        {footerConfig.showCategoryLinks !== false && (
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono tracking-widest text-white uppercase border-b border-[#5C6B73]/40 pb-2">
              Catalog Divisions
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs font-mono">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className="hover:text-white transition-colors uppercase">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Global Contacts Column */}
        {footerConfig.showContact !== false && (
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-sans tracking-widest text-white font-bold uppercase border-b border-[#5C6B73]/40 pb-2">
              Inquiries & Contact
            </h4>
            <ul className="flex flex-col gap-3 text-xs font-sans">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#9DB4C0] shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans text-xs text-[#C2DFE3]">
                  {contacts.address}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#9DB4C0] shrink-0" />
                <a href={`mailto:${contacts.email}`} className="hover:text-white transition-colors font-sans text-xs text-[#C2DFE3]">
                  {contacts.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#9DB4C0] shrink-0" />
                <a href={`tel:${contacts.phone.replace(/[^0-9+]/g, "")}`} className="hover:text-white transition-colors text-[#C2DFE3]">
                  {contacts.phone}
                </a>
              </li>
            </ul>
          </div>
        )}

        {/* Newsletter Column */}
        {footerConfig.showNewsletter !== false && (
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-sans tracking-widest text-white font-bold uppercase border-b border-[#5C6B73]/40 pb-2">
              Corporate Bulletins
            </h4>
            <p className="text-xs text-[#C2DFE3] leading-relaxed font-sans">
              Subscribe to receive corporate inventory releases, custom calibrations, and material specs.
            </p>
            <form onSubmit={handleSubscribe} className="relative mt-1">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="corporate@domain.com"
                required
                className="w-full bg-[#253237] border border-[#5C6B73] rounded px-3.5 py-2.5 text-xs text-white placeholder-[#9DB4C0] focus:outline-none focus:border-[#9DB4C0] pr-10 font-sans"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#9DB4C0] hover:bg-[#5C6B73] text-[#253237] hover:text-white rounded transition-colors flex items-center justify-center font-bold"
                aria-label="Subscribe email"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            {subscribed && (
              <span className="text-[10px] text-emerald-400 font-sans font-bold">
                Subscription registered.
              </span>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-[#5C6B73]/40 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-sans text-[#9DB4C0]">
        <div>
          {footerConfig.copyright || `© ${new Date().getFullYear()} ORIVENCE SURGICAL. All rights reserved.`}
        </div>
        {footerConfig.showLegalLinks !== false && (
          <div className="flex flex-wrap gap-6 justify-center md:justify-end">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Use
            </Link>
            <span className="text-[#5C6B73]">|</span>
            <span className="text-[#C2DFE3]">Corporate Catalog Division</span>
          </div>
        )}
      </div>
    </footer>
  );
}
