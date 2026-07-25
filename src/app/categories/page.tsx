// src/app/categories/page.tsx

import { db } from "@/lib/db";
import Link from "next/link";

export const revalidate = 0;

export default async function CategoriesOverviewPage() {
  let categories: any[] = [];

  try {
    categories = await db.category.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { orderIndex: "asc" },
        { name: "asc" }
      ],
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  } catch (e) {
    console.error("Categories overview DB error:", e);
  }

  return (
    <main className="min-h-screen bg-[#E0FBFC] pt-32 pb-24 font-sans text-[#253237]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Title */}
        <div className="flex flex-col gap-4 mb-16 text-left">
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
            ORIVENCE SURGICAL RANGES
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#253237] font-sans">
            SURGICAL CATEGORIES
          </h1>
          <p className="text-[#5C6B73] text-sm md:text-base max-w-2xl font-medium">
            Explore our complete catalog of surgical-grade implements, precision tweezers, nippers, and beauty hardware forged for clinical excellence.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex flex-col bg-white border border-[#C2DFE3] rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 w-full bg-[#E0FBFC] rounded-xl overflow-hidden mb-6 flex items-center justify-center p-4">
                <img
                  src={cat.image || "/images/products/hero_tweezers.png"}
                  alt={cat.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#5C6B73] uppercase tracking-wider font-bold">
                  {cat._count?.products || 0} PRODUCTS AVAILABLE
                </span>
                <span className="text-xs font-mono font-bold text-[#253237] group-hover:translate-x-1 transition-transform">
                  EXPLORE →
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#253237] group-hover:text-[#5C6B73] transition-colors mb-2 font-sans">
                {cat.name}
              </h2>

              <p className="text-xs text-[#5C6B73] line-clamp-3 font-medium leading-relaxed">
                {cat.description || "Precision surgical instruments crafted for professional clinical workflows."}
              </p>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
