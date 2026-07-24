// src/components/ProductClientPage.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, BadgeCheck, FileCheck, ShieldAlert, ClipboardCheck, Plus, Minus, Check } from "lucide-react";
import ProductViewer from "@/components/ProductViewer";
import InquiryModal from "@/components/InquiryModal";
import { useRFQ } from "@/context/RFQContext";

interface ProductClientPageProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    material: string;
    finish: string;
    dimensions: string;
    sku: string;
    tipSize: string;
    length: string;
    jawSize: string;
    imagesJson: string;
    specJson: string;
    category: {
      name: string;
      slug: string;
    };
  };
}

export default function ProductClientPage({ product }: ProductClientPageProps) {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const { addToRFQ } = useRFQ();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const specs = JSON.parse(product.specJson || "{}");
  const images = JSON.parse(product.imagesJson || "[]");
  const mainImage = images[0] || "/images/products/hero_tweezers.png";

  const handleAddToRFQ = () => {
    addToRFQ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      image: mainImage
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="w-full bg-[#fbfbfb] dark:bg-background-dark pt-24 pb-24 relative min-h-screen font-mono text-xs text-left">
      {/* Drafting lines bg */}
      <div className="absolute inset-0 drafting-grid opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase mb-8">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/categories/${product.category.slug}`} className="hover:text-black dark:hover:text-white transition-colors">
            {product.category.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-black dark:text-white font-semibold">{product.name}</span>
        </div>

        {/* Product Details Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Interactive Viewer */}
          <div className="lg:col-span-6">
            <ProductViewer product={product} />
          </div>

          {/* Right Column: Descriptions, Specs & Actions */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Title & SKU */}
            <div>
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 dark:text-zinc-500 uppercase block mb-1 font-bold">
                {product.category.name} Range
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white font-display uppercase leading-tight">
                {product.name}
              </h1>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-2 block font-semibold">
                ITEM SKU: {product.sku}
              </span>
            </div>

            {/* Description */}
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed font-sans">
              {product.description}
            </p>

            {/* Technical Specifications Table */}
            <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-luxury-sm bg-white dark:bg-zinc-950/80">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 px-4 py-3 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-zinc-500 uppercase">
                  Technical Specifications
                </span>
                <span className="text-[9px] font-mono text-zinc-400">
                  CALIPER QUALITY VERIFIED
                </span>
              </div>
              
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                <div className="grid grid-cols-5 p-3.5 text-xs">
                  <span className="col-span-2 text-zinc-400 font-mono text-[10px] uppercase">Catalog Code</span>
                  <span className="col-span-3 text-zinc-900 dark:text-zinc-200 font-mono font-semibold">{product.sku}</span>
                </div>

                {product.tipSize && (
                  <div className="grid grid-cols-5 p-3.5 text-xs">
                    <span className="col-span-2 text-zinc-400 font-mono text-[10px] uppercase">Tip Width</span>
                    <span className="col-span-3 text-zinc-900 dark:text-zinc-200 font-medium">{product.tipSize}</span>
                  </div>
                )}

                {product.length && (
                  <div className="grid grid-cols-5 p-3.5 text-xs">
                    <span className="col-span-2 text-zinc-400 font-mono text-[10px] uppercase">Instrument Length</span>
                    <span className="col-span-3 text-zinc-900 dark:text-zinc-200 font-medium">{product.length}</span>
                  </div>
                )}

                {product.jawSize && product.jawSize !== "N/A" && (
                  <div className="grid grid-cols-5 p-3.5 text-xs">
                    <span className="col-span-2 text-zinc-400 font-mono text-[10px] uppercase">Jaw Depth</span>
                    <span className="col-span-3 text-zinc-900 dark:text-zinc-200 font-medium">{product.jawSize}</span>
                  </div>
                )}

                {Object.entries(specs).map(([key, val]: any) => {
                  if (["Tip Size", "Length", "Jaw Size"].includes(key)) return null;
                  return (
                    <div key={key} className="grid grid-cols-5 p-3.5 text-xs">
                      <span className="col-span-2 text-zinc-400 font-mono text-[10px] uppercase">{key}</span>
                      <span className="col-span-3 text-zinc-900 dark:text-zinc-200 font-medium">{val}</span>
                    </div>
                  );
                })}
                
                <div className="grid grid-cols-5 p-3.5 text-xs">
                  <span className="col-span-2 text-zinc-400 font-mono text-[10px] uppercase">Material</span>
                  <span className="col-span-3 text-zinc-900 dark:text-zinc-200 font-medium">{product.material}</span>
                </div>

                <div className="grid grid-cols-5 p-3.5 text-xs">
                  <span className="col-span-2 text-zinc-400 font-mono text-[10px] uppercase">Finish Type</span>
                  <span className="col-span-3 text-zinc-900 dark:text-zinc-200 font-medium">{product.finish}</span>
                </div>
              </div>
            </div>

            {/* Quality Certifications */}
            <div className="flex gap-4 border-y border-zinc-200/50 dark:border-zinc-800/60 py-4 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-zinc-500" />
                100% AUTOCLAVABLE
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-zinc-500" />
                CE & ISO 13485 COMPLIANT
              </div>
            </div>

            {/* Inquiry Action Box */}
            <div className="flex flex-col gap-3 font-mono">
              <div className="flex gap-3">
                {/* Quantity select */}
                <div className="flex items-center border border-zinc-250 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-xs font-bold text-zinc-900 dark:text-white select-none">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to basket */}
                <button
                  onClick={handleAddToRFQ}
                  className="flex-grow bg-black hover:bg-zinc-850 dark:bg-white dark:text-black dark:hover:bg-zinc-100 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-luxury-md uppercase tracking-wider"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      ADDED TO BASKET
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      ADD TO QUOTATION BASKET
                    </>
                  )}
                </button>
              </div>

              {/* Direct WhatsApp and Quote options */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setInquiryOpen(true)}
                  className="flex-grow py-3.5 border border-zinc-300 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg flex items-center justify-center font-bold tracking-widest transition-all bg-white dark:bg-zinc-950 uppercase"
                >
                  REQUEST DIRECT QUOTE
                </button>

                <a
                  href={`https://wa.me/923000000000?text=${encodeURIComponent(
                    `Hello ORIVENCE Team, I am interested in inquiring about:\n\n- Product: ${product.name}\n- SKU: ${product.sku}\n- Quantity: ${quantity} unit(s)`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3.5 px-6 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold tracking-widest transition-all uppercase gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  WHATSAPP
                </a>
              </div>
              
              <div className="bg-zinc-150/40 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 p-3.5 rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                  ORIVENCE operates strictly as a B2B catalog supplier. Pricing is configured dynamically based on order volume, customized alignments, and sterilization requirements.
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Inquiry Dialog Form */}
      <InquiryModal
        isOpen={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        productName={product.name}
        sku={product.sku}
      />
    </div>
  );
}
