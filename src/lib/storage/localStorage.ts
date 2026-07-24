// src/lib/storage/localStorage.ts

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { StorageProvider, UploadResult } from "./provider";

export class LocalStorageProvider implements StorageProvider {
  private baseUploadDir: string;
  private urlPrefix: string;

  constructor() {
    // Resolve upload dir relative to workspace root (Cwd)
    this.baseUploadDir = path.join(process.cwd(), "public", "uploads");
    this.urlPrefix = "/uploads";

    // Ensure base upload directory exists
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  private cleanFolderPath(folder: string): string {
    // Replace leading/trailing slashes and make relative
    return folder.replace(/^\/+|\/+$/g, "");
  }

  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = "/"
  ): Promise<UploadResult> {
    const cleanFolder = this.cleanFolderPath(folder);
    const targetDir = path.join(this.baseUploadDir, cleanFolder);

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let finalFilename = `${Date.now()}_${filename.replace(/\s+/g, "_")}`;
    let processedBuffer = fileBuffer;

    // Optimize images (exclude SVGs/GIFs)
    if (
      mimeType.startsWith("image/") &&
      !mimeType.includes("svg") &&
      !mimeType.includes("gif")
    ) {
      try {
        processedBuffer = await sharp(fileBuffer)
          .resize({ width: 3840, height: 2160, fit: "inside", withoutEnlargement: true }) // Up to 4K
          .webp({ quality: 85 })
          .toBuffer();
        
        // Change extension to webp
        const ext = path.extname(finalFilename);
        finalFilename = finalFilename.slice(0, -ext.length) + ".webp";
      } catch (err) {
        console.error("Sharp image optimization failed, saving raw file instead:", err);
      }
    }

    const filePath = path.join(targetDir, finalFilename);
    await fs.promises.writeFile(filePath, processedBuffer);

    const relativeUrl = cleanFolder
      ? `${this.urlPrefix}/${cleanFolder}/${finalFilename}`
      : `${this.urlPrefix}/${finalFilename}`;

    return {
      url: relativeUrl,
      size: processedBuffer.length,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith(this.urlPrefix)) {
      return; // Do not delete files outside uploads folder
    }

    const relativePath = fileUrl.slice(this.urlPrefix.length);
    const filePath = path.join(this.baseUploadDir, relativePath);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async replaceFile(
    fileUrl: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<UploadResult> {
    if (!fileUrl.startsWith(this.urlPrefix)) {
      throw new Error("Cannot replace file outside of local uploads directory.");
    }

    const relativePath = fileUrl.slice(this.urlPrefix.length);
    const filePath = path.join(this.baseUploadDir, relativePath);

    // Ensure the parent directory exists
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    let processedBuffer = fileBuffer;

    // Optimize images (exclude SVGs/GIFs) if it's an image
    if (
      mimeType.startsWith("image/") &&
      !mimeType.includes("svg") &&
      !mimeType.includes("gif")
    ) {
      try {
        processedBuffer = await sharp(fileBuffer)
          .resize({ width: 3840, height: 2160, fit: "inside", withoutEnlargement: true }) // Up to 4K
          .webp({ quality: 85 })
          .toBuffer();
      } catch (err) {
        console.error("Sharp image replace optimization failed, replacing raw file:", err);
      }
    }

    await fs.promises.writeFile(filePath, processedBuffer);

    return {
      url: fileUrl,
      size: processedBuffer.length,
    };
  }
}

// Singleton storage instance exporter
import { SupabaseStorageProvider } from "./supabaseStorage";

let activeProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!activeProvider) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      activeProvider = new SupabaseStorageProvider();
    } else {
      activeProvider = new LocalStorageProvider();
    }
  }
  return activeProvider;
}

