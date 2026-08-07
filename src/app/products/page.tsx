// src/app/products/page.tsx

import { db } from "@/lib/db";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

export const revalidate = 0;

export default async function ProductsCatalogPage() {
  let products: any[] = [];
  let categories: any[] = [];

  try {
    products = await db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    });

    categories = await db.category.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, name: true, slug: true }
    });
  } catch (e) {
    console.error("Products page DB fetch error:", e);
  }

  return (
    <main className="min-h-screen bg-[#E0FBFC] pt-32 pb-24 font-sans text-[#253237]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Title Header */}
        <div className="flex flex-col gap-4 mb-12 text-left">
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
            ORIVENCE SURGICAL CATALOG
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#253237] font-sans">
            ALL SURGICAL PRODUCTS
          </h1>
          <p className="text-[#5C6B73] text-sm md:text-base max-w-2xl font-medium">
            Browse our complete line of surgical-grade stainless steel implements, forceps, tweezers, and clinical instruments.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/products"
            className="px-4 py-2 bg-[#253237] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
          >
            ALL PRODUCTS ({products.length})
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="px-4 py-2 bg-white border border-[#C2DFE3] text-[#253237] hover:bg-[#253237] hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white border border-[#C2DFE3] rounded-2xl p-12 text-center text-[#5C6B73]">
            <p className="font-bold text-lg mb-2">No published products found in catalog.</p>
            <p className="text-sm">Add products through the admin control center to populate the public website catalog.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
