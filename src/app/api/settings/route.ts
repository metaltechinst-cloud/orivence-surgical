// src/app/api/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/rbac";

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings - Bulk update website settings (Owner, Admin, or Content Manager only)
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify role permissions using RBAC helper
    if (!hasPermission(decoded.role, "manage_settings")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

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

    // Create Audit Log entry
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "SETTINGS_UPDATE",
        details: JSON.stringify({ keys: Object.keys(settingsData) }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
