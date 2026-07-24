// src/components/ProductCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    material: string;
    finish: string;
    dimensions: string;
    sku: string;
    featured?: boolean;
    imagesJson: string;
    category?: {
      name: string;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const images = JSON.parse(product.imagesJson);
  const mainImage = images[0] || "/images/products/hero_tweezers.png";

  const categoryName = product.category?.name || "Surgical Implements";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="group relative surgical-card rounded-xl overflow-hidden flex flex-col h-full bg-white border border-[#C2DFE3]"
    >
      {/* Drafting lines decoration */}
      <div className="absolute inset-0 drafting-grid opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />

      {/* Engineering corners ticks */}
      <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-[#9DB4C0]/50" />
      <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-[#9DB4C0]/50" />
      <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-[#9DB4C0]/50" />
      <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-[#9DB4C0]/50" />

      {/* Image box */}
      <div className="relative aspect-square w-full bg-gradient-to-b from-[#E0FBFC] via-white to-[#E0FBFC]/50 overflow-hidden flex items-center justify-center p-6 border-b border-[#C2DFE3]">
        <Image
          src={mainImage}
          alt={product.name}
          width={400}
          height={400}
          className="object-contain w-5/6 h-5/6 group-hover:scale-105 transition-transform duration-700 font-sans"
          priority
        />
        
        {/* Dynamic SKU / Code overlay */}
        <div className="absolute bottom-3 left-3 flex gap-1.5 items-center">
          <span className="bg-white/95 border border-[#C2DFE3] text-[#253237] text-[9px] font-mono px-2.5 py-1 rounded font-bold shadow-sm">
            CODE: {product.sku}
          </span>
          {product.featured && (
            <span className="bg-[#9DB4C0]/20 border border-[#9DB4C0] text-[#253237] text-[8px] font-mono px-2 py-1 rounded font-bold uppercase">
              FEATURED
            </span>
          )}
        </div>
      </div>

      {/* Body content */}
      <div className="p-5 flex flex-col flex-grow relative z-10 text-left bg-white font-sans">
        <span className="text-[9px] font-mono tracking-widest text-[#5C6B73] uppercase mb-1 font-bold">
          {categoryName}
        </span>
        <h3 className="text-xs font-bold tracking-wide text-[#253237] group-hover:text-[#5C6B73] transition-colors uppercase font-sans">
          {product.name}
        </h3>
        <p className="text-[11px] text-[#5C6B73] line-clamp-2 mt-2 leading-relaxed font-sans">
          {product.description}
        </p>

        {/* Details button */}
        <div className="mt-auto pt-5 flex items-center justify-between border-t border-[#C2DFE3]">
          <span className="text-[9px] font-mono text-[#5C6B73]">
            LENGTH: {product.dimensions}
          </span>
          
          <Link
            href={`/products/${product.slug}`}
            className="flex items-center gap-1 text-[11px] font-mono font-bold tracking-wider text-[#253237] group-hover:text-[#5C6B73] transition-colors"
          >
            VIEW DETAILS
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
