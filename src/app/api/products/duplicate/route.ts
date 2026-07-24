// src/app/api/products/duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/rbac";

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!hasPermission(decoded.role, "manage_products")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Product ID is required for duplication" }, { status: 400 });
    }

    const original = await db.product.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: "Original product not found" }, { status: 404 });
    }

    const newSku = `${original.sku}-COPY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newName = `${original.name} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now()}`;

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
        status: "DRAFT", // Safe initial status for duplicates
        orderIndex: original.orderIndex + 1,
        specJson: original.specJson,
        categoryId: original.categoryId,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "PRODUCT_DUPLICATE",
        details: JSON.stringify({ originalId: original.id, newId: duplicatedProduct.id, newSku }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, data: duplicatedProduct });
  } catch (error: any) {
    console.error("Duplicate product API error:", error);
    return NextResponse.json({ error: "Internal server error during product duplication" }, { status: 500 });
  }
}
