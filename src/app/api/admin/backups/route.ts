// src/app/api/admin/backups/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export const dynamic = "force-dynamic";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Helper to ensure backups directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// GET /api/admin/backups - List available backups
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

    // Only OWNER and ADMIN roles are authorized
    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    ensureBackupDir();

    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(f => f.endsWith(".zip"))
      .map(filename => {
        const filePath = path.join(BACKUP_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error("Fetch backups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/backups - Create a new backup
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    ensureBackupDir();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:]/g, "")
      .split(".")[0];
    const filename = `backup_${timestamp}.zip`;
    const backupPath = path.join(BACKUP_DIR, filename);

    // Create Zip archive
    const zip = new AdmZip();

    // 1. Add database file (make sure it exists)
    if (fs.existsSync(DB_PATH)) {
      zip.addLocalFile(DB_PATH);
    }

    // 2. Add uploads directory (make sure it exists)
    if (fs.existsSync(UPLOADS_DIR)) {
      zip.addLocalFolder(UPLOADS_DIR, "uploads");
    }

    // Write zip to disk
    zip.writeZip(backupPath);

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "BACKUP_CREATE",
        details: JSON.stringify({ filename }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Backup created successfully.",
      backup: {
        filename,
        size: fs.statSync(backupPath).size,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Create backup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/backups - Restore from backup
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

    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "Backup filename is required." }, { status: 400 });
    }

    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: "Backup file not found." }, { status: 404 });
    }

    // DISCONNECT PRISMA CLIENT BEFORE REPLACING DATABASE
    await db.$disconnect();

    try {
      const zip = new AdmZip(backupPath);

      // Extract DB file (adm-zip extracts to target path)
      const zipEntries = zip.getEntries();
      
      // Look for dev.db entry
      const dbEntry = zipEntries.find(entry => entry.entryName === "dev.db");
      if (dbEntry) {
        // Extract database file directly replacing the existing SQLite file
        const dbFolder = path.dirname(DB_PATH);
        zip.extractEntryTo(dbEntry, dbFolder, false, true);
      }

      // Look for uploads folder and extract
      const hasUploads = zipEntries.some(entry => entry.entryName.startsWith("uploads/"));
      if (hasUploads) {
        // Extract uploads directory to public folder (overwriting files)
        zip.extractEntryTo("uploads/", path.join(process.cwd(), "public"), true, true);
      }
    } catch (zipErr: any) {
      console.error("Zip extraction failed:", zipErr);
      // RE-CONNECT DB ANYWAY TO NOT LEAVE THE SERVER CRASHED
      await db.$connect();
      return NextResponse.json({ error: "Failed to extract backup archive." }, { status: 500 });
    }

    // RE-CONNECT DB
    await db.$connect();

    // Audit log (written to newly restored database)
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "BACKUP_RESTORE",
        details: JSON.stringify({ filename }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database and media files restored successfully.",
    });
  } catch (error) {
    console.error("Restore backup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/backups - Delete a backup file
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "BACKUP_DELETE",
        details: JSON.stringify({ filename }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, message: "Backup file deleted." });
  } catch (error) {
    console.error("Delete backup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
