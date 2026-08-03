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
  } catch (error: any) {
    console.error("[DB READ FAIL] Fetch media assets error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Database query failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// POST /api/media - Upload one or more media assets
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Authentication required." }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const folder = cleanFolder((formData.get("folder") as string) || "/");

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided for upload" }, { status: 400 });
    }

    const savedAssets = [];

    for (const file of files) {
      console.log(`[STORAGE START] Uploading file: "${file.name}" to folder: "${folder}"`);
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await storageProvider.uploadFile(
        buffer,
        file.name,
        file.type,
        folder
      );

      console.log(`[DB WRITE START] MediaAsset create: "${file.name}"`);
      const asset = await db.mediaAsset.create({
        data: {
          filename: file.name,
          url: uploadResult.url,
          type: file.type,
          size: uploadResult.size,
          folder: folder,
        },
      });

      console.log(`[DB WRITE SUCCESS] MediaAsset created ID: ${asset.id}`);
      savedAssets.push(asset);
    }

    return NextResponse.json({ success: true, data: savedAssets }, { status: 201 });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Media upload failed: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Media upload failed: " + (error?.message || String(error)), details: error?.message || String(error) }, { status: 500 });
  }
}

// PUT /api/media - Rename or replace file content
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = formData.get("action") as string;
      const id = formData.get("id") as string;
      const file = formData.get("file") as File;

      if (action === "replace" && id && file) {
        console.log(`[DB READ START] Find MediaAsset ID: ${id}`);
        const asset = await db.mediaAsset.findUnique({ where: { id } });
        if (!asset) {
          return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await storageProvider.replaceFile(asset.url, buffer, file.type);

        console.log(`[DB WRITE START] Replace MediaAsset ID: ${id}`);
        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: {
            size: uploadResult.size,
            type: file.type,
          },
        });
        console.log(`[DB WRITE SUCCESS] MediaAsset replaced ID: ${id}`);

        return NextResponse.json({ success: true, data: updatedAsset });
      }
    } else {
      const { action, id, newFolder, altText, title } = await req.json();

      console.log(`[DB READ START] Find MediaAsset ID: ${id}`);
      const asset = await db.mediaAsset.findUnique({ where: { id } });
      if (!asset) {
        return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
      }

      if (action === "move" && newFolder) {
        const cleanedNewFolder = cleanFolder(newFolder);
        console.log(`[DB WRITE START] Move MediaAsset ID: ${id} to ${cleanedNewFolder}`);
        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: { folder: cleanedNewFolder },
        });
        console.log(`[DB WRITE SUCCESS] MediaAsset moved ID: ${id}`);
        return NextResponse.json({ success: true, data: updatedAsset });
      }

      if (action === "updateMetadata") {
        console.log(`[DB WRITE START] Update MediaAsset metadata ID: ${id}`);
        const updatedAsset = await db.mediaAsset.update({
          where: { id },
          data: {
            altText: altText !== undefined ? altText : asset.altText,
            title: title !== undefined ? title : asset.title,
          },
        });
        console.log(`[DB WRITE SUCCESS] MediaAsset metadata updated ID: ${id}`);
        return NextResponse.json({ success: true, data: updatedAsset });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action parameters" }, { status: 400 });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Media update failed: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Update failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// DELETE /api/media - Delete a media asset
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Asset ID is required" }, { status: 400 });
    }

    console.log(`[DB WRITE START] Delete MediaAsset ID: ${id}`);
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (asset) {
      try {
        await storageProvider.deleteFile(asset.url);
      } catch (stgErr) {
        console.warn("[STORAGE WARNING] Storage provider delete failed:", stgErr);
      }
      await db.mediaAsset.delete({ where: { id } });
      console.log(`[DB WRITE SUCCESS] MediaAsset deleted ID: ${id}`);
    } else {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Asset deleted successfully." });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Media DELETE error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Delete failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
