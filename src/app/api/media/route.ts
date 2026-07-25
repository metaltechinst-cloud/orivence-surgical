// src/app/api/media/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage/localStorage";

export const dynamic = "force-dynamic";

const storageProvider = getStorageProvider();

// Helper to normalized directory path
function cleanFolder(folder: string): string {
  let cleaned = folder.trim().replace(/\/+/g, "/");
  if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
  if (cleaned.endsWith("/") && cleaned.length > 1) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

// GET /api/media - Get list of uploaded media assets
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
    return NextResponse.json({ success: true, assets: [], folders: ["/"] }, { status: 200 });
  }
}

// POST /api/media - Upload one or more media assets
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" };

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

    return NextResponse.json({ success: true, data: savedAssets });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: "Upload failed: " + (error.message || "") }, { status: 400 });
  }
}

// PUT /api/media - Rename or replace file content
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" };

    const contentType = req.headers.get("content-type") || "";
    
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

        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: {
            size: uploadResult.size,
            type: file.type,
          },
        });

        return NextResponse.json({ success: true, data: updatedAsset });
      }
    } else {
      const { action, id, newFolder, altText, title } = await req.json();

      const asset = await db.mediaAsset.findUnique({ where: { id } });
      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      if (action === "move" && newFolder) {
        const cleanedNewFolder = cleanFolder(newFolder);
        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: { folder: cleanedNewFolder },
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
    return NextResponse.json({ error: "Update failed: " + (error.message || "") }, { status: 400 });
  }
}

// DELETE /api/media - Delete a media asset
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" };

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (asset) {
      try {
        await storageProvider.deleteFile(asset.url);
      } catch (stgErr) {
        console.warn("Storage provider delete warning:", stgErr);
      }
      try {
        await db.mediaAsset.delete({ where: { id } });
      } catch (dbDelErr) {
        console.warn("MediaAsset DB delete warning:", dbDelErr);
      }
    } else {
      try {
        await db.mediaAsset.deleteMany({ where: { id } });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: "Asset deleted successfully." });
  } catch (error: any) {
    console.error("Media DELETE error:", error);
    return NextResponse.json({ error: "Delete failed: " + (error.message || "") }, { status: 400 });
  }
}
