// src/app/page.tsx
import { db } from "@/lib/db";
import HomeClientPage from "@/components/HomeClientPage";

export const revalidate = 0; // Force server re-evaluation to load dynamic additions

export default async function HomePage() {
  // Fetch only PUBLISHED categories ordered by orderIndex
  const categories = await db.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [
      { orderIndex: "asc" },
      { name: "asc" }
    ],
  });

  // Fetch only PUBLISHED featured products whose categories are also PUBLISHED
  const featuredProducts = await db.product.findMany({
    where: { 
      featured: true,
      status: "PUBLISHED",
      category: {
        status: "PUBLISHED"
      }
    },
    include: {
      category: {
        select: { name: true, slug: true, status: true },
      },
    },
    orderBy: [
      { orderIndex: "asc" },
      { name: "asc" }
    ],
  });

  return (
    <HomeClientPage 
      categories={categories} 
      featuredProducts={featuredProducts} 
    />
  );
}
