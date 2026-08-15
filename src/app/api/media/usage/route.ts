// src/app/api/media/usage/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/media/usage?id=... - Detect real asset usage across Products, Categories, and Website Settings
export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "MediaAsset ID is required" }, { status: 400 });
    }

    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ success: false, error: "MediaAsset not found" }, { status: 404 });
    }

    const targetUrl = asset.url;
    const filename = asset.filename;

    const usedIn: Array<{ type: string; name: string; details: string }> = [];

    // 1. Check Products
    const products = await db.product.findMany({
      where: {
        OR: [
          { imagesJson: { contains: targetUrl } },
          { imagesJson: { contains: filename } },
          { description: { contains: targetUrl } }
        ]
      },
      select: { id: true, name: true, sku: true }
    });

    products.forEach(p => {
      usedIn.push({
        type: "Product",
        name: p.name,
        details: `SKU: ${p.sku}`
      });
    });

    // 2. Check Categories
    const categories = await db.category.findMany({
      where: {
        OR: [
          { image: { contains: targetUrl } },
          { image: { contains: filename } },
          { thumbnail: { contains: targetUrl } },
          { thumbnail: { contains: filename } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    categories.forEach(c => {
      usedIn.push({
        type: "Category",
        name: c.name,
        details: `Slug: /${c.slug}`
      });
    });

    // 3. Check Website Settings
    const settings = await db.websiteSetting.findMany({
      where: {
        value: { contains: targetUrl }
      },
      select: { key: true, description: true }
    });

    settings.forEach(s => {
      usedIn.push({
        type: "Website Setting",
        name: s.key,
        details: s.description || "CMS Global Setting"
      });
    });

    return NextResponse.json({
      success: true,
      asset: { id: asset.id, filename: asset.filename, url: asset.url },
      isUsed: usedIn.length > 0,
      usageCount: usedIn.length,
      usedIn
    });

  } catch (error: any) {
    console.error("Media usage detection error:", error);
    return NextResponse.json({ success: false, error: "Usage detection failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
