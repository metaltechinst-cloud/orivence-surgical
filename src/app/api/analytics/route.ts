// src/app/api/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!hasPermission(decoded.role, "view_dashboard")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    // 1. General counts
    const pageViewsCount = await db.analyticsEvent.count({
      where: { eventName: "page_view" },
    });

    const searchCount = await db.analyticsEvent.count({
      where: { eventName: "search" },
    });

    const inquiriesCount = await db.inquiry.count();

    const pdfDownloadsCount = await db.analyticsEvent.count({
      where: { eventName: "pdf_download" },
    });

    // 2. Device Breakdown
    const deviceGroups = await db.analyticsEvent.groupBy({
      by: ["device"],
      _count: {
        id: true,
      },
    });
    const deviceStats = deviceGroups.map(g => ({
      name: g.device || "Unknown",
      value: g._count.id,
    }));

    // 3. Country Breakdown
    const countryGroups = await db.analyticsEvent.groupBy({
      by: ["country"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });
    const countryStats = countryGroups.map(g => ({
      name: g.country || "Local",
      value: g._count.id,
    }));

    // 4. Top Viewed Products (paths starting with "/products/")
    const productViews = await db.analyticsEvent.groupBy({
      by: ["path"],
      where: {
        path: { startsWith: "/products/" },
        eventName: "page_view",
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });
    const topViewedProducts = productViews.map(p => ({
      slug: p.path.replace("/products/", ""),
      views: p._count.id,
    }));

    // 5. Top Inquired Products (from Inquiry table)
    const inquiryProducts = await db.inquiry.groupBy({
      by: ["productName"],
      where: {
        productName: { not: "" },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });
    const topInquiryProducts = inquiryProducts.map(p => ({
      name: p.productName,
      inquiries: p._count.id,
    }));

    // 6. Search Keywords Breakdown
    const searchKeywords = await db.analyticsEvent.groupBy({
      by: ["query"],
      where: {
        eventName: "search",
        query: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 15,
    });
    const topKeywords = searchKeywords.map(k => ({
      keyword: k.query || "",
      count: k._count.id,
    }));

    // 7. Recent Page view counts (by day, last 7 days)
    // For SQLite, group by date is easiest by fetching last 1000 events and doing Javascript aggregation
    const recentViews = await db.analyticsEvent.findMany({
      where: {
        eventName: "page_view",
      },
      select: {
        timestamp: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 5000,
    });

    const dailyViewsMap: Record<string, number> = {};
    recentViews.forEach(v => {
      const dateStr = v.timestamp.toISOString().split("T")[0];
      dailyViewsMap[dateStr] = (dailyViewsMap[dateStr] || 0) + 1;
    });

    const dailyViews = Object.entries(dailyViewsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days

    // Calculate Conversion Rate
    const conversionRate = pageViewsCount > 0 
      ? Number(((inquiriesCount / pageViewsCount) * 100).toFixed(2)) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          pageViews: pageViewsCount,
          searches: searchCount,
          inquiries: inquiriesCount,
          pdfDownloads: pdfDownloadsCount,
          conversionRate,
        },
        deviceStats,
        countryStats,
        topViewedProducts,
        topInquiryProducts,
        topKeywords,
        dailyViews,
      },
    });
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
