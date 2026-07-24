// src/app/api/analytics/track/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { eventName, path, referrer, query } = await req.json();

    if (!eventName || !path) {
      return NextResponse.json({ error: "Event name and path are required" }, { status: 400 });
    }

    // Determine device from user agent
    const userAgent = req.headers.get("user-agent") || "Unknown";
    let device = "Desktop";
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
      device = "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = "Tablet";
    }

    // Determine country (e.g. from Vercel/Cloudflare headers or default)
    const country = req.headers.get("x-vercel-ip-country") || 
                    req.headers.get("cf-ipcountry") || 
                    "Local";

    const event = await db.analyticsEvent.create({
      data: {
        eventName,
        path,
        query: query || null,
        referrer: referrer || null,
        device,
        country,
      },
    });

    return NextResponse.json({ success: true, id: event.id });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
