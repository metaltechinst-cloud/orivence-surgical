// src/app/api/admin/versions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SUPPORTED_ENTITIES = ["HOMEPAGE", "SETTINGS"];

// Helper to safely extract IP address from headers
function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
}

// GET /api/admin/versions - Fetch persistent content version snapshots
export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Missing or invalid token" }, { status: 401 });
    }

    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Insufficient admin privileges" }, { status: 403 });
    }

    // Fetch version snapshots recorded in BackupRecord
    const versions = await db.backupRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 25
    });

    const formattedVersions = versions.map(v => {
      let meta: Record<string, any> = {};
      try {
        meta = JSON.parse(v.url || "{}");
      } catch (e) {
        meta = { summary: v.filename };
      }

      return {
        id: v.id,
        timestamp: v.createdAt.toISOString(),
        filename: v.filename,
        size: v.size,
        type: v.type,
        changedBy: meta.changedBy || "System Admin",
        summary: meta.summary || `Version Snapshot (${v.type})`,
        entity: meta.entity || "HOMEPAGE",
        snapshotJson: meta.snapshotJson || "{}"
      };
    });

    return NextResponse.json({
      success: true,
      versions: formattedVersions
    });

  } catch (error: any) {
    console.error("Fetch versions error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch version history: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// POST /api/admin/versions - Create a persistent snapshot version or Restore a previous version
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Missing or invalid token" }, { status: 401 });
    }

    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Insufficient admin privileges" }, { status: 403 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid or malformed JSON payload" }, { status: 400 });
    }

    const { action, versionId, entity, snapshotData, summary } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json({ success: false, error: "Action parameter is required ('create_snapshot' or 'restore')" }, { status: 400 });
    }

    // Action: "create_snapshot"
    if (action === "create_snapshot") {
      const targetEntity = (entity || "HOMEPAGE").toUpperCase();
      if (!SUPPORTED_ENTITIES.includes(targetEntity)) {
        return NextResponse.json({ 
          success: false, 
          error: `Unsupported entity type: '${entity}'. Supported entities are: ${SUPPORTED_ENTITIES.join(", ")}` 
        }, { status: 400 });
      }

      let snapshotString = "";
      if (typeof snapshotData === "string") {
        snapshotString = snapshotData;
      } else if (typeof snapshotData === "object" && snapshotData !== null) {
        snapshotString = JSON.stringify(snapshotData);
      } else {
        return NextResponse.json({ success: false, error: "snapshotData is required for snapshot creation" }, { status: 400 });
      }

      // Validate snapshotString is valid JSON
      try {
        JSON.parse(snapshotString);
      } catch (e) {
        return NextResponse.json({ success: false, error: "snapshotData is not valid JSON" }, { status: 400 });
      }

      const meta = {
        changedBy: decoded.username,
        summary: summary || `Snapshot created for ${targetEntity}`,
        entity: targetEntity,
        snapshotJson: snapshotString
      };

      const record = await db.backupRecord.create({
        data: {
          filename: `snapshot_${targetEntity.toLowerCase()}_${Date.now()}.json`,
          size: Buffer.byteLength(snapshotString, "utf8"),
          type: targetEntity,
          url: JSON.stringify(meta)
        }
      });

      return NextResponse.json({
        success: true,
        message: "Version snapshot recorded in Supabase PostgreSQL.",
        data: record
      }, { status: 201 });
    }

    // Action: "restore"
    if (action === "restore") {
      if (!versionId || typeof versionId !== "string") {
        return NextResponse.json({ success: false, error: "Version ID is required for restoration" }, { status: 400 });
      }

      const versionRecord = await db.backupRecord.findUnique({ where: { id: versionId } });
      if (!versionRecord) {
        return NextResponse.json({ success: false, error: "Version snapshot not found" }, { status: 404 });
      }

      let meta: Record<string, any> = {};
      try {
        meta = JSON.parse(versionRecord.url || "{}");
      } catch (e) {
        return NextResponse.json({ success: false, error: "Invalid snapshot JSON metadata format" }, { status: 400 });
      }

      const snapshotJson = meta.snapshotJson;
      const targetEntity = (meta.entity || versionRecord.type || "").toUpperCase();

      if (!SUPPORTED_ENTITIES.includes(targetEntity)) {
        return NextResponse.json({ 
          success: false, 
          error: `Restoration rejected: Target entity '${targetEntity}' is not supported. Supported entities are: ${SUPPORTED_ENTITIES.join(", ")}` 
        }, { status: 400 });
      }

      if (!snapshotJson) {
        return NextResponse.json({ success: false, error: "Snapshot payload is empty or corrupted" }, { status: 400 });
      }

      console.log(`[RESTORE START] Restoring ${targetEntity} from Version ID: ${versionId}`);

      if (targetEntity === "HOMEPAGE") {
        // Validate homepage snapshot structure
        try {
          const parsedHp = JSON.parse(snapshotJson);
          if (!parsedHp || typeof parsedHp !== "object") throw new Error("Invalid object");
        } catch (e) {
          return NextResponse.json({ success: false, error: "Homepage snapshot JSON is corrupted" }, { status: 400 });
        }

        // Restore Homepage Builder configuration
        await db.websiteSetting.upsert({
          where: { key: "homepage_builder" },
          update: { value: snapshotJson, group: "homepage", updatedAt: new Date() },
          create: { key: "homepage_builder", value: snapshotJson, group: "homepage", description: "Visual Homepage Builder Configuration" }
        });
      } else if (targetEntity === "SETTINGS") {
        // Restore Website Setting
        let parsedSet: any;
        try {
          parsedSet = JSON.parse(snapshotJson);
        } catch (e) {
          return NextResponse.json({ success: false, error: "Settings snapshot JSON is corrupted" }, { status: 400 });
        }

        if (!parsedSet.key || !parsedSet.value) {
          return NextResponse.json({ success: false, error: "Settings snapshot missing key or value properties" }, { status: 400 });
        }

        await db.websiteSetting.upsert({
          where: { key: parsedSet.key },
          update: { value: parsedSet.value, updatedAt: new Date() },
          create: { key: parsedSet.key, value: parsedSet.value, group: parsedSet.group || "general" }
        });
      }

      // Record Audit Log for Version Restore
      const clientIp = getClientIp(req);
      await db.auditLog.create({
        data: {
          userId: decoded.userId,
          username: decoded.username,
          action: "VERSION_RESTORE",
          details: JSON.stringify({ versionId, targetEntity, summary: meta.summary || versionRecord.filename }),
          ipAddress: clientIp
        }
      });

      console.log(`[RESTORE SUCCESS] Version ID ${versionId} restored to Supabase PostgreSQL.`);

      return NextResponse.json({
        success: true,
        message: `Successfully restored version "${meta.summary || versionRecord.filename}" to Supabase PostgreSQL.`
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action '${action}'. Expected 'create_snapshot' or 'restore'` }, { status: 400 });

  } catch (error: any) {
    console.error("Version snapshot / restore error:", error);
    return NextResponse.json({ success: false, error: "Version operation failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
