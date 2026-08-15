// src/app/api/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const adminMode = searchParams.get("admin") === "true";

    if (!q.trim()) {
      return NextResponse.json({ 
        success: true, 
        products: [], 
        categories: [], 
        media: [], 
        inquiries: [], 
        settings: [], 
        auditLogs: [] 
      });
    }

    const cleanQuery = q.trim();

    // 1. Products Search
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
          select: { name: true, slug: true },
        },
      },
      take: 20,
    });

    // If public user, return products early
    if (!adminMode) {
      return NextResponse.json({ success: true, products });
    }

    // 2. Admin Search: Verify token for sensitive data
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    const isAdmin = decoded && (decoded.role === "OWNER" || decoded.role === "ADMIN");

    let categories: any[] = [];
    let media: any[] = [];
    let inquiries: any[] = [];
    let settings: any[] = [];
    let auditLogs: any[] = [];

    if (isAdmin) {
      const [catData, mediaData, inqData, setData, auditData] = await Promise.all([
        db.category.findMany({
          where: {
            OR: [
              { name: { contains: cleanQuery } },
              { slug: { contains: cleanQuery } },
              { description: { contains: cleanQuery } }
            ]
          },
          take: 10
        }),
        db.mediaAsset.findMany({
          where: {
            OR: [
              { filename: { contains: cleanQuery } },
              { altText: { contains: cleanQuery } },
              { title: { contains: cleanQuery } },
              { folder: { contains: cleanQuery } }
            ]
          },
          take: 10
        }),
        db.inquiry.findMany({
          where: {
            OR: [
              { referenceNo: { contains: cleanQuery } },
              { name: { contains: cleanQuery } },
              { companyName: { contains: cleanQuery } },
              { email: { contains: cleanQuery } },
              { productName: { contains: cleanQuery } },
              { sku: { contains: cleanQuery } }
            ]
          },
          take: 10
        }),
        db.websiteSetting.findMany({
          where: {
            OR: [
              { key: { contains: cleanQuery } },
              { description: { contains: cleanQuery } },
              { group: { contains: cleanQuery } }
            ]
          },
          take: 10
        }),
        db.auditLog.findMany({
          where: {
            OR: [
              { action: { contains: cleanQuery } },
              { username: { contains: cleanQuery } },
              { details: { contains: cleanQuery } }
            ]
          },
          take: 10,
          orderBy: { createdAt: "desc" }
        })
      ]);

      categories = catData;
      media = mediaData;
      inquiries = inqData;
      settings = setData;
      auditLogs = auditData;
    }

    return NextResponse.json({
      success: true,
      products,
      categories,
      media,
      inquiries,
      settings,
      auditLogs
    });

  } catch (error) {
    console.error("Global Search API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
