// src/app/categories/[slug]/page.tsx

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CategoryClientPage from "@/components/CategoryClientPage";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 0;

export default async function CategoryPage({ params }: CategoryPageProps) {
  let category: any = null;

  try {
    category = await db.category.findUnique({
      where: { slug: params.slug },
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
  } catch (e) {
    console.error("Category page DB error:", e);
  }

  if (!category) {
    notFound();
  }

  // Convert to format required by Client Page
  const categoryWithProducts = {
    id: category.id,
    name: category.name,
    description: category.description,
    slug: category.slug,
    products: (category.products || []).map((p: any) => ({
      ...p,
      category: {
        name: category.name,
        slug: category.slug
      }
    }))
  };

  return <CategoryClientPage category={categoryWithProducts} />;
}
