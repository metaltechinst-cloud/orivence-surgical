// src/components/CategoryClientPage.tsx
"use client";

import React, { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X, ArrowUpDown, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: string;
  finish: string;
  dimensions: string;
  sku: string;
  imagesJson: string;
  tipSize: string;
  length: string;
  width: string;
  jawSize: string;
  category?: {
    name: string;
    slug: string;
  };
}

interface CategoryClientPageProps {
  category: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    products: Product[];
  };
}

export default function CategoryClientPage({ category }: CategoryClientPageProps) {
  const [search, setSearch] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedLengths, setSelectedLengths] = useState<string[]>([]);
  const [selectedTipSizes, setSelectedTipSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("default");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extract unique filters from product list
  const filterOptions = useMemo(() => {
    const materials = new Set<string>();
    const finishes = new Set<string>();
    const lengths = new Set<string>();
    const tipSizes = new Set<string>();

    category.products.forEach((p) => {
      if (p.material) materials.add(p.material.trim());
      if (p.finish) finishes.add(p.finish.trim());
      if (p.length) lengths.add(p.length.trim());
      if (p.tipSize) tipSizes.add(p.tipSize.trim());
    });

    return {
      materials: Array.from(materials).sort(),
      finishes: Array.from(finishes).sort(),
      lengths: Array.from(lengths).sort(),
      tipSizes: Array.from(tipSizes).sort(),
    };
  }, [category.products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...category.products];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Material filter
    if (selectedMaterials.length > 0) {
      result = result.filter((p) => selectedMaterials.includes(p.material.trim()));
    }

    // Finish filter
    if (selectedFinishes.length > 0) {
      result = result.filter((p) => selectedFinishes.includes(p.finish.trim()));
    }

    // Length filter
    if (selectedLengths.length > 0) {
      result = result.filter((p) => selectedLengths.includes(p.length.trim()));
    }

    // Tip size filter
    if (selectedTipSizes.length > 0) {
      result = result.filter((p) => selectedTipSizes.includes(p.tipSize.trim()));
    }

    // Sort sorting
    if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "sku") {
      result.sort((a, b) => a.sku.localeCompare(b.sku));
    }

    return result;
  }, [category.products, search, selectedMaterials, selectedFinishes, selectedLengths, selectedTipSizes, sortBy]);

  const toggleFilter = (type: "material" | "finish" | "length" | "tipSize", value: string) => {
    if (type === "material") {
      setSelectedMaterials(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
    } else if (type === "finish") {
      setSelectedFinishes(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
    } else if (type === "length") {
      setSelectedLengths(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
    } else if (type === "tipSize") {
      setSelectedTipSizes(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedMaterials([]);
    setSelectedFinishes([]);
    setSelectedLengths([]);
    setSelectedTipSizes([]);
    setSearch("");
  };

  const isAnyFilterActive = 
    selectedMaterials.length > 0 || 
    selectedFinishes.length > 0 || 
    selectedLengths.length > 0 || 
    selectedTipSizes.length > 0 || 
    search !== "";

  return (
    <div className="w-full bg-[#fbfbfb] dark:bg-background-dark pt-24 pb-24 relative min-h-screen font-mono text-xs text-left">
      <div className="absolute inset-0 drafting-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase mb-8">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-650">Categories</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-black dark:text-white font-semibold">{category.name}</span>
        </div>

        {/* Category Header Title */}
        <div className="max-w-3xl flex flex-col gap-4 mb-12">
          <span className="text-[10px] tracking-[0.3em] text-zinc-400 dark:text-zinc-500 uppercase font-bold">
            TUTTLINGEN SPEC CATALOG
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white uppercase font-display">
            {category.name}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-450 text-[11px] leading-relaxed font-sans max-w-xl">
            {category.description}
          </p>
        </div>

        {/* Filters and Search Bar Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-200 dark:border-zinc-900">
          
          {/* Global search */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search specifications or codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg px-9 py-2 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex lg:hidden items-center gap-1.5 px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-zinc-950"
            >
              <SlidersHorizontal className="w-4 h-4" />
              FILTERS
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-2.5 py-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="default">Default sorting</option>
                <option value="name-asc">Alphabetical: A-Z</option>
                <option value="name-desc">Alphabetical: Z-A</option>
                <option value="sku">Filter by Code SKU</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid: Filters Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP SIDEBAR FILTERS PANEL */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-24">
            
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-2">
              <span className="font-bold text-zinc-950 dark:text-white uppercase tracking-wider">FILTERING SCHEMA</span>
              {isAnyFilterActive && (
                <button onClick={clearAllFilters} className="text-[10px] text-zinc-400 hover:text-red-500 font-bold underline">
                  RESET
                </button>
              )}
            </div>

            {/* Material Filter */}
            {filterOptions.materials.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">MATERIAL</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.materials.map((m) => (
                    <label key={m} className="flex items-center gap-2.5 cursor-pointer select-none text-[11px] text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(m)}
                        onChange={() => toggleFilter("material", m)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black cursor-pointer"
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Finish Filter */}
            {filterOptions.finishes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">FINISH</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.finishes.map((f) => (
                    <label key={f} className="flex items-center gap-2.5 cursor-pointer select-none text-[11px] text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={selectedFinishes.includes(f)}
                        onChange={() => toggleFilter("finish", f)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black cursor-pointer"
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Length Filter */}
            {filterOptions.lengths.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">LENGTH SPEC</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.lengths.map((l) => (
                    <label key={l} className="flex items-center gap-2.5 cursor-pointer select-none text-[11px] text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={selectedLengths.includes(l)}
                        onChange={() => toggleFilter("length", l)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black cursor-pointer"
                      />
                      <span>{l}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tip Size Filter */}
            {filterOptions.tipSizes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">TIP SIZE SPEC</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.tipSizes.map((t) => (
                    <label key={t} className="flex items-center gap-2.5 cursor-pointer select-none text-[11px] text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={selectedTipSizes.includes(t)}
                        onChange={() => toggleFilter("tipSize", t)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black cursor-pointer"
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* PRODUCTS LIST GRID */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* Active Filters Summary Bar */}
            {isAnyFilterActive && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase font-mono mr-1">Active filters:</span>
                
                {search && (
                  <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[10px]">
                    Search: "{search}"
                    <button onClick={() => setSearch("")} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedMaterials.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[10px]">
                    {m}
                    <button onClick={() => toggleFilter("material", m)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {selectedFinishes.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[10px]">
                    {f}
                    <button onClick={() => toggleFilter("finish", f)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {selectedLengths.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[10px]">
                    {l}
                    <button onClick={() => toggleFilter("length", l)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {selectedTipSizes.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[10px]">
                    Tip: {t}
                    <button onClick={() => toggleFilter("tipSize", t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}

                <button onClick={clearAllFilters} className="text-[10px] text-red-500 font-bold ml-auto pl-2 underline">
                  Clear All
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl py-24 text-center bg-white dark:bg-zinc-950/20">
                <span className="text-xs text-zinc-400 uppercase block">
                  No calibrated instruments matching specified criteria.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MOBILE DRAWER FILTERS PANEL */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowMobileFilters(false)} />
          <div className="bg-white dark:bg-zinc-950 w-full max-w-xs h-full relative z-10 p-6 shadow-luxury-lg flex flex-col gap-6 overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-3">
              <span className="font-bold text-zinc-950 dark:text-white uppercase tracking-wider">FILTER CRITERIA</span>
              <button onClick={() => setShowMobileFilters(false)} className="text-zinc-500 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Material Filter */}
            {filterOptions.materials.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">MATERIAL</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.materials.map((m) => (
                    <label key={m} className="flex items-center gap-2.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(m)}
                        onChange={() => toggleFilter("material", m)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black"
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Finish Filter */}
            {filterOptions.finishes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">FINISH</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.finishes.map((f) => (
                    <label key={f} className="flex items-center gap-2.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedFinishes.includes(f)}
                        onChange={() => toggleFilter("finish", f)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black"
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Length Filter */}
            {filterOptions.lengths.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">LENGTH SPEC</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.lengths.map((l) => (
                    <label key={l} className="flex items-center gap-2.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedLengths.includes(l)}
                        onChange={() => toggleFilter("length", l)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black"
                      />
                      <span>{l}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tip Size Filter */}
            {filterOptions.tipSizes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-bold">TIP SIZE SPEC</span>
                <div className="flex flex-col gap-1.5">
                  {filterOptions.tipSizes.map((t) => (
                    <label key={t} className="flex items-center gap-2.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedTipSizes.includes(t)}
                        onChange={() => toggleFilter("tipSize", t)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 accent-black"
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                clearAllFilters();
                setShowMobileFilters(false);
              }}
              className="mt-4 w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-250 py-2.5 rounded-lg text-center font-bold font-mono text-[10px]"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
