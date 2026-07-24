// src/components/ProductComparisonModal.tsx
"use client";

import React from "react";
import { X, Check, ArrowRight, ShieldCheck, Scale, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface ComparisonProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  modelNumber: string;
  material: string;
  finish: string;
  dimensions: string;
  length: string;
  width: string;
  tipSize: string;
  jawSize: string;
  weight: string;
  image?: string;
  applications?: string;
}

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ComparisonProduct[];
  onRemoveProduct: (id: string) => void;
  onClearAll: () => void;
}

export default function ProductComparisonModal({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onClearAll,
}: ProductComparisonModalProps) {
  if (!isOpen) return null;

  const specRows = [
    { label: "Model Number", key: "modelNumber" },
    { label: "SKU / Code", key: "sku" },
    { label: "Steel Alloy Material", key: "material" },
    { label: "Surface Finish", key: "finish" },
    { label: "Tip Precision Size", key: "tipSize" },
    { label: "Jaw Dimensions", key: "jawSize" },
    { label: "Total Implement Length", key: "length" },
    { label: "Implement Width", key: "width" },
    { label: "Calibrated Weight", key: "weight" },
    { label: "Dimensions", key: "dimensions" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Comparison Dialog */}
      <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl w-full max-w-6xl max-h-[90vh] shadow-luxury-2xl z-10 flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
              <Scale className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-widest text-zinc-950 dark:text-white uppercase">
                INSTRUMENT SPECIFICATION COMPARISON
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono">
                Comparing {products.length} surgical implement(s) side-by-side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {products.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[10px] font-mono text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                CLEAR ALL
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-xl text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex-grow">
          {products.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
              <Scale className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs font-mono text-zinc-500 max-w-sm">
                No implements selected for comparison. Browse the catalog and click "Add to Compare" on any product.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-4 w-48 border-b border-zinc-200 dark:border-zinc-850 font-mono text-[10px] text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/30">
                    Parameter
                  </th>
                  {products.map((p) => (
                    <th key={p.id} className="p-4 border-b border-zinc-200 dark:border-zinc-850 min-w-[220px]">
                      <div className="flex flex-col gap-3 relative group">
                        <button
                          onClick={() => onRemoveProduct(p.id)}
                          className="absolute top-0 right-0 p-1 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-400 hover:text-red-500 hover:border-red-500 transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 rounded-xl mx-auto flex items-center justify-center overflow-hidden p-2">
                          <Image
                            src={p.image || "/images/products/hero_tweezers.png"}
                            alt={p.name}
                            width={90}
                            height={90}
                            className="object-contain max-h-full"
                          />
                        </div>

                        <div className="text-center flex flex-col gap-1">
                          <span className="font-bold text-zinc-950 dark:text-white text-xs font-sans leading-tight">
                            {p.name}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {p.sku || p.modelNumber || "SKU-ORV"}
                          </span>
                        </div>

                        <Link
                          href={`/products/${p.slug}`}
                          onClick={onClose}
                          className="w-full py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg text-center font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                        >
                          VIEW IMPLEMENT
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 font-mono text-[11px]">
                {specRows.map((row) => (
                  <tr key={row.key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="p-4 font-bold text-zinc-400 uppercase tracking-wider text-[10px] bg-zinc-50/30 dark:bg-zinc-900/20">
                      {row.label}
                    </td>
                    {products.map((p) => {
                      const val = (p as any)[row.key];
                      return (
                        <td key={p.id} className="p-4 text-zinc-800 dark:text-zinc-200">
                          {val && val !== "N/A" ? (
                            <span>{val}</span>
                          ) : (
                            <span className="text-zinc-400 italic">Standard</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-between items-center text-[10px] font-mono text-zinc-400">
          <span>ORIVENCE SURGICAL PRECISION MATRIX</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            CLOSE MATRIX
          </button>
        </div>

      </div>
    </div>
  );
}
