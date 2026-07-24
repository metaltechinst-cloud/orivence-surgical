// src/app/products/[slug]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductClientPage from "@/components/ProductClientPage";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 0;

export default async function ProductPage({ params }: ProductPageProps) {
  let product: any = null;

  try {
    product = await db.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    });
  } catch (e) {
    console.error("Product page DB error:", e);
  }

  if (!product) {
    notFound();
  }

  return <ProductClientPage product={product} />;
}
