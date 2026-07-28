// src/app/api/analytics/track/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { eventName, eventType, path, referrer, query } = await req.json();

    const type = eventType || eventName || "PAGE_VIEW";
    const targetPath = path || "/";

    const userAgent = req.headers.get("user-agent") || "Unknown";
    let device = "Desktop";
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
      device = "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = "Tablet";
    }

    const country = req.headers.get("x-vercel-ip-country") || 
                    req.headers.get("cf-ipcountry") || 
                    "Local";

    const event = await db.analyticsEvent.create({
      data: {
        eventType: type,
        path: targetPath,
        metaJson: JSON.stringify({ query: query || "", referrer: referrer || "", device }),
        country,
      },
    });

    return NextResponse.json({ success: true, id: event.id });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ success: true, message: "Tracked" });
  }
}
