// src/app/api/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Mapping helper for key -> group
function getGroupForKey(key: string): string {
  if (["business_info", "contact_info", "identity"].includes(key)) return "business";
  if (["social_links"].includes(key)) return "social";
  if (["branding"].includes(key)) return "branding";
  if (["header_config"].includes(key)) return "header";
  if (["footer_config"].includes(key)) return "footer";
  if (["company_info"].includes(key)) return "company";
  if (["contact_page"].includes(key)) return "contact_page";
  if (["seo_meta", "seo_settings"].includes(key)) return "seo";
  if (["analytics"].includes(key)) return "analytics";
  if (["smtp_config"].includes(key)) return "smtp";
  if (["security"].includes(key)) return "security";
  return "general";
}

// GET /api/settings - Fetch all website settings as a key-value map
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group");
    const raw = searchParams.get("raw") === "true";

    const whereClause: any = {};
    if (group) {
      whereClause.group = group;
    }

    const settingsList = await db.websiteSetting.findMany({
      where: whereClause,
      orderBy: { key: "asc" }
    });

    if (raw) {
      return NextResponse.json({ success: true, data: settingsList });
    }

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
    
    let settingsData: Record<string, any> = {};
    let customGroup = payload.group;
    let customType = payload.type || "json";
    let customDesc = payload.description;

    if (payload.key !== undefined && payload.value !== undefined) {
      settingsData[payload.key] = payload.value;
    } else {
      settingsData = payload;
    }

    console.log(`[DB WRITE START] Upsert website settings keys: ${Object.keys(settingsData).join(", ")}`);

    for (const [key, value] of Object.entries(settingsData)) {
      if (key === "group" || key === "type" || key === "description" || key === "isPublic") continue;
      
      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      const groupName = customGroup || getGroupForKey(key);
      const isJson = typeof value === "object";
      const settingType = customType || (isJson ? "json" : "string");

      await db.websiteSetting.upsert({
        where: { key },
        update: { 
          value: stringValue,
          group: groupName,
          type: settingType,
          description: customDesc || undefined,
          updatedAt: new Date()
        },
        create: { 
          key, 
          value: stringValue,
          group: groupName,
          type: settingType,
          description: customDesc || `${key} configuration setting`
        },
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
