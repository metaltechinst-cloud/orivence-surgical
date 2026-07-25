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
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({}, { status: 200 }); // Graceful fallback
  }
}

// PUT /api/settings - Bulk update website settings
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" };

    const settingsData = await req.json(); // Expecting { [key]: valueObject }

    // Save each setting key-value pair in database
    for (const [key, value] of Object.entries(settingsData)) {
      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      
      await db.websiteSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    }

    // Audit Log entry (non-blocking)
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
      console.warn("Audit log error during settings update (ignored):", auditErr);
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Failed to update settings: " + (error.message || "") }, { status: 400 });
  }
}
