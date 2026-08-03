// src/app/api/products/duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required for duplication" }, { status: 400 });
    }

    console.log(`[DB READ START] Find product to duplicate ID: ${id}`);

    let original = await db.product.findUnique({
      where: { id },
    });

    if (!original) {
      original = await db.product.findFirst({
        where: { OR: [{ id }, { sku: id }, { slug: id }] }
      });
    }

    if (!original) {
      return NextResponse.json({ success: false, error: "Original product not found" }, { status: 404 });
    }

    const newSku = `${original.sku}-COPY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newName = `${original.name} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now()}`;

    console.log(`[DB WRITE START] Duplicate product "${original.name}" -> "${newName}"`);

    const duplicatedProduct = await db.product.create({
      data: {
        name: newName,
        slug: newSlug,
        sku: newSku,
        modelNumber: original.modelNumber,
        brand: original.brand,
        description: original.description,
        material: original.material,
        finish: original.finish,
        dimensions: original.dimensions,
        length: original.length,
        width: original.width,
        tipSize: original.tipSize,
        jawSize: original.jawSize,
        weight: original.weight,
        applications: original.applications,
        features: original.features,
        packaging: original.packaging,
        downloads: original.downloads,
        imagesJson: original.imagesJson,
        videoUrl: original.videoUrl,
        relatedProductsJson: original.relatedProductsJson,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        seoKeywords: original.seoKeywords,
        featured: original.featured,
        status: "DRAFT",
        orderIndex: original.orderIndex + 1,
        specJson: original.specJson,
        categoryId: original.categoryId,
      },
    });

    console.log(`[DB WRITE SUCCESS] Product duplicated ID: ${duplicatedProduct.id}`);
    return NextResponse.json({ success: true, data: duplicatedProduct }, { status: 201 });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Duplicate product error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Failed to duplicate product: " + (error?.message || String(error)) }, { status: 500 });
  }
}
