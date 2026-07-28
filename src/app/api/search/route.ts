// src/app/api/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({ success: true, products: [] });
    }

    const cleanQuery = q.trim();

    // Query products
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery } },
          { sku: { contains: cleanQuery } },
          { modelNumber: { contains: cleanQuery } },
          { material: { contains: cleanQuery } },
          { finish: { contains: cleanQuery } },
          { tipSize: { contains: cleanQuery } },
          { description: { contains: cleanQuery } },
        ],
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      take: 50,
    });

    // Track search query in analytics asynchronously
    try {
      const country = req.headers.get("x-vercel-ip-country") || "Local";
      const userAgent = req.headers.get("user-agent") || "Unknown";
      let device = "Desktop";
      if (/Mobi|Android|iPhone/i.test(userAgent)) {
        device = "Mobile";
      } else if (/Tablet|iPad/i.test(userAgent)) {
        device = "Tablet";
      }

      await db.analyticsEvent.create({
        data: {
          eventType: "search",
          path: "/search",
          metaJson: JSON.stringify({ query: cleanQuery, device }),
          country,
        },
      });
    } catch (e) {
      console.error("Failed to log search event to analytics:", e);
    }

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
