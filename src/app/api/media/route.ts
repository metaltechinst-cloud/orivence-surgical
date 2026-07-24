// src/app/api/media/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/rbac";
import { getStorageProvider } from "@/lib/storage/localStorage";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const storageProvider = getStorageProvider();

// Helper to normalized directory path
function cleanFolder(folder: string): string {
  let cleaned = folder.trim().replace(/\/+/g, "/");
  if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
  if (cleaned.endsWith("/") && cleaned.length > 1) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

// GET /api/media - Get list of uploaded media assets, supports search and folder filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = cleanFolder(searchParams.get("folder") || "/");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const whereClause: any = {};

    if (folder) {
      whereClause.folder = folder;
    }
    if (search) {
      whereClause.filename = { contains: search };
    }
    if (type) {
      whereClause.type = { startsWith: type };
    }

    const assets = await db.mediaAsset.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Also get all distinct folders in the media library for folder selection UI
    const allAssets = await db.mediaAsset.findMany({
      select: { folder: true },
      distinct: ["folder"],
    });
    const folderList = allAssets.map(a => a.folder);
    if (!folderList.includes("/")) {
      folderList.push("/");
    }

    return NextResponse.json({
      success: true,
      assets,
      folders: folderList.sort()
    });
  } catch (error) {
    console.error("Fetch media assets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/media - Upload one or more media assets (Multi-part FormData upload)
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

    if (!hasPermission(decoded.role, "manage_settings")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const folder = cleanFolder((formData.get("folder") as string) || "/");

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const savedAssets = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await storageProvider.uploadFile(
        buffer,
        file.name,
        file.type,
        folder
      );

      const asset = await db.mediaAsset.create({
        data: {
          filename: file.name,
          url: uploadResult.url,
          type: file.type,
          size: uploadResult.size,
          folder: folder,
        },
      });

      savedAssets.push(asset);
    }

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "MEDIA_UPLOAD",
        details: JSON.stringify({ count: savedAssets.length, folder }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, data: savedAssets });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/media - Rename or replace file content
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

    if (!hasPermission(decoded.role, "manage_settings")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    
    // Check if body is FormData (for replacement upload) or JSON (for rename/move)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = formData.get("action") as string;
      const id = formData.get("id") as string;
      const file = formData.get("file") as File;

      if (action === "replace" && id && file) {
        const asset = await db.mediaAsset.findUnique({ where: { id } });
        if (!asset) {
          return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await storageProvider.replaceFile(asset.url, buffer, file.type);

        // Update asset size in DB
        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: {
            size: uploadResult.size,
            type: file.type,
          },
        });

        // Audit log
        await db.auditLog.create({
          data: {
            userId: decoded.userId,
            username: decoded.username,
            action: "MEDIA_REPLACE",
            details: JSON.stringify({ id, filename: asset.filename }),
            ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
          },
        });

        return NextResponse.json({ success: true, data: updatedAsset });
      }
    } else {
      // JSON payload for rename, move or metadata update
      const { action, id, newFilename, newFolder, altText, title } = await req.json();

      const asset = await db.mediaAsset.findUnique({ where: { id } });
      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      if (action === "rename" && newFilename) {
        // Physical rename
        const oldPath = path.join(process.cwd(), "public", asset.url);
        
        // Compute new URL
        const directoryUrl = asset.url.slice(0, asset.url.lastIndexOf("/"));
        const ext = path.extname(asset.filename);
        let cleanedNewName = newFilename.replace(/\s+/g, "_");
        if (!cleanedNewName.endsWith(ext)) {
          cleanedNewName += ext;
        }

        const newUrl = `${directoryUrl}/${cleanedNewName}`;
        const newPath = path.join(process.cwd(), "public", newUrl);

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }

        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: {
            filename: cleanedNewName,
            url: newUrl,
          },
        });

        // Audit log
        await db.auditLog.create({
          data: {
            userId: decoded.userId,
            username: decoded.username,
            action: "MEDIA_RENAME",
            details: JSON.stringify({ id, oldName: asset.filename, newName: cleanedNewName }),
            ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
          },
        });

        return NextResponse.json({ success: true, data: updatedAsset });
      }

      if (action === "move" && newFolder) {
        const cleanedNewFolder = cleanFolder(newFolder);
        
        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: {
            folder: cleanedNewFolder,
          },
        });

        return NextResponse.json({ success: true, data: updatedAsset });
      }

      if (action === "updateMetadata") {
        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: {
            altText: altText !== undefined ? altText : asset.altText,
            title: title !== undefined ? title : asset.title,
          },
        });

        return NextResponse.json({ success: true, data: updatedAsset });
      }
    }

    return NextResponse.json({ error: "Invalid action parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Media PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/media - Delete a media asset with dependency checking
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

    if (!hasPermission(decoded.role, "manage_settings")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const checkOnly = searchParams.get("checkOnly") === "true";
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Dependency check across Products, Categories, and Settings
    const usages: { type: string; name: string }[] = [];

    // 1. Check Products
    const products = await db.product.findMany();
    for (const p of products) {
      if (p.imagesJson && (p.imagesJson.includes(asset.url) || p.imagesJson.includes(asset.filename))) {
        usages.push({ type: "Product Image", name: `${p.name} (${p.sku})` });
      }
      if (p.downloads && (p.downloads.includes(asset.url) || p.downloads.includes(asset.filename))) {
        usages.push({ type: "Product PDF Attachment", name: `${p.name} (${p.sku})` });
      }
    }

    // 2. Check Categories
    const categories = await db.category.findMany();
    for (const c of categories) {
      if (c.image === asset.url || c.thumbnail === asset.url) {
        usages.push({ type: "Category Image", name: c.name });
      }
    }

    // 3. Check Website Settings (Logos, Hero assets, Favicon, Documents)
    const settings = await db.websiteSetting.findMany();
    for (const s of settings) {
      if (s.value && s.value.includes(asset.url)) {
        usages.push({ type: "Website Setting / Branding", name: s.key });
      }
    }

    if (checkOnly) {
      return NextResponse.json({
        success: true,
        inUse: usages.length > 0,
        usages
      });
    }

    if (usages.length > 0 && !force) {
      return NextResponse.json({
        error: "Asset is currently in use",
        inUse: true,
        usages,
        message: `Warning: This asset is currently used in ${usages.length} location(s).`
      }, { status: 409 });
    }

    // Physical deletion
    await storageProvider.deleteFile(asset.url);

    // DB deletion
    await db.mediaAsset.delete({ where: { id } });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "MEDIA_DELETE",
        details: JSON.stringify({ id, filename: asset.filename, forced: force }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, message: "Asset deleted successfully." });
  } catch (error: any) {
    console.error("Media DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
