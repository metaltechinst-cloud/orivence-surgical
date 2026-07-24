// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://orivance.com";

  let categories: any[] = [];
  let products: any[] = [];

  try {
    categories = await db.category.findMany();
    products = await db.product.findMany();
  } catch (e) {
    console.error("Sitemap dynamic database fetch error (falling back):", e);
  }

  const categoryEntries = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productEntries = products.map((prod) => ({
    url: `${baseUrl}/products/${prod.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
