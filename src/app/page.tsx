// src/app/page.tsx
import { db } from "@/lib/db";
import HomeClientPage from "@/components/HomeClientPage";

export const revalidate = 0; // Force server re-evaluation to load dynamic additions

export default async function HomePage() {
  let categories: any[] = [];
  let featuredProducts: any[] = [];

  try {
    // Fetch only PUBLISHED categories ordered by orderIndex
    categories = await db.category.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { orderIndex: "asc" },
        { name: "asc" }
      ],
    });

    // Fetch only PUBLISHED featured products whose categories are also PUBLISHED
    featuredProducts = await db.product.findMany({
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
  } catch (e) {
    console.error("HomePage server data fetch fallback activated:", e);
  }

  return (
    <HomeClientPage 
      categories={categories} 
      featuredProducts={featuredProducts} 
    />
  );
}
