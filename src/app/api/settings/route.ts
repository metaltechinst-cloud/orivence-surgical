// src/app/api/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/settings - Fetch all website settings as a key-value map
export async function GET(req: NextRequest) {
  try {
    const settingsList = await db.websiteSetting.findMany();
    
    // Map list of entries [{key, value}] to a key-value object { [key]: value }
    const settingsMap = settingsList.reduce((acc, curr) => {
      try {
        acc[curr.key] = JSON.parse(curr.value);
      } catch (e) {
        acc[curr.key] = curr.value;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(settingsMap);
  } catch (error: any) {
    console.error("[DB READ FAIL] Fetch settings error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Database query failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// Shared settings upsert handler
async function handleUpsertSettings(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Authentication required." }, { status: 401 });
    }

    const payload = await req.json();
    
    // Support both single pair { key, value } and bulk map { [key]: value }
    let settingsData: Record<string, any> = {};
    if (payload.key !== undefined && payload.value !== undefined) {
      settingsData[payload.key] = payload.value;
    } else {
      settingsData = payload;
    }

    console.log(`[DB WRITE START] Upsert website settings keys: ${Object.keys(settingsData).join(", ")}`);

    for (const [key, value] of Object.entries(settingsData)) {
      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      
      await db.websiteSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    }

    console.log(`[DB WRITE SUCCESS] Website settings updated.`);

    // Audit Log entry
    try {
      if (decoded) {
        await db.auditLog.create({
          data: {
            userId: decoded.userId,
            username: decoded.username,
            action: "SETTINGS_UPDATE",
            details: JSON.stringify({ keys: Object.keys(settingsData) }),
            ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
          }
        });
      }
    } catch (auditErr) {
      console.warn("[DB WRITE WARNING] Audit log entry failed:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Save settings error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Failed to update settings: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// Support both PUT and POST methods
export async function PUT(req: NextRequest) {
  return handleUpsertSettings(req);
}

export async function POST(req: NextRequest) {
  return handleUpsertSettings(req);
}
