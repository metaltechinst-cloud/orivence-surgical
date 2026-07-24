// src/components/ProductViewer.tsx
"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Maximize2, Compass, Layers, CheckCircle, X } from "lucide-react";

interface ProductViewerProps {
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
    category?: {
      name: string;
    };
  };
}

export default function ProductViewer({ product }: ProductViewerProps) {
  const images = JSON.parse(product.imagesJson || "[]");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const mainImage = images[activeImageIndex] || "/images/products/hero_tweezers.png";

  const [mode, setMode] = useState<"zoom" | "360" | "blueprint">("zoom");
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const categoryName = product.category?.name || "Surgical Implements";

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Mode Selectors */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2">
        <button
          type="button"
          onClick={() => setMode("zoom")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
            mode === "zoom"
              ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-luxury-sm"
              : "bg-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          PRODUCT CATALOG VIEW
        </button>

        <button
          type="button"
          onClick={() => setMode("360")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
            mode === "360"
              ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-luxury-sm"
              : "bg-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          360° PERSPECTIVE
        </button>

        <button
          type="button"
          onClick={() => setMode("blueprint")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
            mode === "blueprint"
              ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-luxury-sm"
              : "bg-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          TECHNICAL SPECIFICATIONS
        </button>
      </div>

      {/* Main image container */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="relative aspect-square w-full rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/80 overflow-hidden flex items-center justify-center p-8 select-none shadow-luxury-sm"
        style={{ perspective: "1000px" }}
      >
        {/* Fine drafting line overlay grid */}
        <div className={`absolute inset-0 drafting-grid transition-opacity duration-300 ${mode === "blueprint" ? "opacity-45" : "opacity-15"}`} />

        {/* View Mode: HD Zoom */}
        {mode === "zoom" && (
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-950 group/zoom">
            <Image
              src={mainImage}
              alt={product.name}
              width={600}
              height={600}
              className="object-contain w-5/6 h-5/6 transition-transform duration-100 ease-out pointer-events-none"
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isHovering ? "scale(2.2)" : "scale(1)",
              }}
              priority
            />
            
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-xl opacity-0 group-hover/zoom:opacity-100 transition-opacity hover:scale-105 z-20"
              title="Fullscreen Image View"
            >
              <Maximize2 className="w-4 h-4 text-zinc-900 dark:text-white" />
            </button>

            {!isHovering && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 dark:bg-white/95 text-[10px] text-white dark:text-black px-4 py-2 rounded-full tracking-widest font-mono uppercase flex items-center gap-1.5 shadow-luxury-md">
                <span>Hover to Magnify Catalog Details</span>
              </div>
            )}
          </div>
        )}

        {/* View Mode: 360 Rotation */}
        {mode === "360" && (
          <div className="w-full h-full flex flex-col items-center justify-center relative bg-white dark:bg-zinc-950">
            <div 
              className="w-5/6 h-5/6 transition-transform duration-300 ease-out flex items-center justify-center"
              style={{
                transform: `rotateY(${rotation}deg) rotateX(${rotation / 6}deg)`,
                transformStyle: "preserve-3d"
              }}
            >
              <Image
                src={mainImage}
                alt={product.name}
                width={600}
                height={600}
                className="object-contain w-full h-full pointer-events-none drop-shadow-lg"
                priority
              />
            </div>
            
            {/* Slider */}
            <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-2 items-center z-10">
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                VIEWING ANGLE: {rotation}°
              </span>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
              />
            </div>
          </div>
        )}

        {/* View Mode: Dynamic Technical Overlay Blueprint */}
        {mode === "blueprint" && (
          <div className="w-full h-full relative flex items-center justify-center bg-white dark:bg-zinc-950">
            {/* Base clean catalog image */}
            <Image
              src={mainImage}
              alt={product.name}
              width={600}
              height={600}
              className="object-contain w-5/6 h-5/6 opacity-30 dark:opacity-20 pointer-events-none filter grayscale brightness-95"
              priority
            />

            {/* DYNAMIC METADATA OVERLAY (TOP LEFT, TOP RIGHT, BOTTOM) */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none text-zinc-900 dark:text-zinc-100 font-mono select-text">
              
              {/* TOP ROW */}
              <div className="flex justify-between items-start w-full">
                
                {/* TOP LEFT: Brand & Model Info */}
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[11px] font-bold tracking-[0.25em] text-zinc-950 dark:text-white uppercase leading-none font-display">
                    ORIVANCE SURGICAL
                  </span>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 mt-1 uppercase font-sans">
                    {product.name}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Range: {categoryName}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Model: {product.sku || "ORV-CAT-01"}
                  </span>
                </div>

                {/* TOP RIGHT: Dimension Specs */}
                <div className="flex flex-col gap-1 text-right items-end">
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                    Length: <span className="font-semibold text-zinc-950 dark:text-white">{product.length || product.dimensions}</span>
                  </span>
                  {product.tipSize && (
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                      Tip Size: <span className="font-semibold text-zinc-950 dark:text-white">{product.tipSize}</span>
                    </span>
                  )}
                  {product.jawSize && product.jawSize !== "N/A" && (
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                      Jaw Size: <span className="font-semibold text-zinc-950 dark:text-white">{product.jawSize}</span>
                    </span>
                  )}
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                    Alloy: <span className="font-semibold text-zinc-950 dark:text-white">{product.material.split(" ").slice(0,2).join(" ")}</span>
                  </span>
                </div>

              </div>

              {/* BOTTOM ROW: Technical Specifications Details */}
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-3 flex flex-wrap gap-x-8 gap-y-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                <div>
                  <span className="text-zinc-400 uppercase">Material:</span> {product.material}
                </div>
                <div>
                  <span className="text-zinc-400 uppercase">Surface Finish:</span> {product.finish}
                </div>
                <div>
                  <span className="text-zinc-400 uppercase">Tolerances:</span> Calliper aligned &lt; 2µm
                </div>
                <div>
                  <span className="text-zinc-400 uppercase">Sterility:</span> Autoclavable up to 134°C
                </div>
              </div>

            </div>

            {/* Dynamic drafting drawing overlay lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none text-zinc-300 dark:text-zinc-800 fill-none stroke-current">
              <line x1="50%" y1="12%" x2="50%" y2="88%" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="12%" y1="50%" x2="88%" y2="50%" strokeWidth="0.5" strokeDasharray="3 3" />
            </svg>

          </div>
        )}
      </div>

      {/* Thumbnail Gallery Navigation */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {images.map((img: string, idx: number) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white dark:bg-zinc-950 flex items-center justify-center p-1 transition-all ${
                activeImageIndex === idx 
                  ? "border-black dark:border-white scale-105" 
                  : "border-zinc-250 dark:border-zinc-850 opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`${product.name} Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Specifications list card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-lg p-3.5 bg-white dark:bg-zinc-950 flex flex-col gap-1.5 shadow-luxury-sm">
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">Material Specifications</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            {product.material}
          </span>
        </div>
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-lg p-3.5 bg-white dark:bg-zinc-950 flex flex-col gap-1.5 shadow-luxury-sm">
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">Technical Finish</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            {product.finish}
          </span>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            title="Close Fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-5xl aspect-square max-h-[85vh] flex items-center justify-center">
            <Image
              src={mainImage}
              alt={product.name}
              width={1200}
              height={1200}
              className="object-contain w-full h-full max-h-full"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
