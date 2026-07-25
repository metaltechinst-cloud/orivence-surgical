// src/app/categories/[slug]/page.tsx

import { db } from "@/lib/db";
import CategoryClientPage from "@/components/CategoryClientPage";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 0;

export default async function CategoryPage({ params }: CategoryPageProps) {
  let category: any = null;
  const cleanSlug = params.slug;

  try {
    category = await db.category.findUnique({
      where: { slug: cleanSlug },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            material: true,
            finish: true,
            dimensions: true,
            sku: true,
            imagesJson: true,
            tipSize: true,
            length: true,
            width: true,
            jawSize: true,
          },
          orderBy: [
            { orderIndex: "asc" },
            { name: "asc" }
          ]
        }
      }
    });

    if (!category) {
      category = await db.category.findFirst({
        where: {
          OR: [
            { id: cleanSlug },
            { slug: cleanSlug },
            { name: { contains: cleanSlug.replace(/-/g, " ") } }
          ]
        },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              material: true,
              finish: true,
              dimensions: true,
              sku: true,
              imagesJson: true,
              tipSize: true,
              length: true,
              width: true,
              jawSize: true,
            },
            orderBy: [
              { orderIndex: "asc" },
              { name: "asc" }
            ]
          }
        }
      });
    }
  } catch (e) {
    console.error("Category page DB error:", e);
  }

  // Graceful fallback if category doesn't exist
  const categoryWithProducts = {
    id: category?.id || "cat-fallback",
    name: category?.name || cleanSlug.replace(/-/g, " ").toUpperCase(),
    description: category?.description || "Precision surgical instruments crafted for professional clinical workflows.",
    slug: category?.slug || cleanSlug,
    products: (category?.products || []).map((p: any) => ({
      ...p,
      category: {
        name: category?.name || "Surgical Implements",
        slug: category?.slug || cleanSlug
      }
    }))
  };

  return <CategoryClientPage category={categoryWithProducts} />;
}
