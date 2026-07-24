// src/lib/storage/supabaseStorage.ts

import { StorageProvider, UploadResult } from "./provider";

export class SupabaseStorageProvider implements StorageProvider {
  private supabaseUrl: string;
  private supabaseKey: string;
  private bucketName: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || "orivence-media";
  }

  private cleanFolderPath(folder: string): string {
    return folder.replace(/^\/+|\/+$/g, "");
  }

  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = "/"
  ): Promise<UploadResult> {
    const cleanFolder = this.cleanFolderPath(folder);
    const timestamp = Date.now();
    const safeFilename = `${timestamp}_${filename.replace(/\s+/g, "_")}`;
    const filePath = cleanFolder ? `${cleanFolder}/${safeFilename}` : safeFilename;

    const endpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.supabaseKey}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase storage upload failed: ${res.statusText} - ${errText}`);
    }

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;

    return {
      url: publicUrl,
      size: fileBuffer.length,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const urlPattern = `/storage/v1/object/public/${this.bucketName}/`;
    if (!fileUrl.includes(urlPattern)) return;

    const filePath = fileUrl.split(urlPattern)[1];
    if (!filePath) return;

    const endpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`;

    await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.supabaseKey}`,
      },
    });
  }

  async replaceFile(
    fileUrl: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<UploadResult> {
    const urlPattern = `/storage/v1/object/public/${this.bucketName}/`;
    if (!fileUrl.includes(urlPattern)) {
      throw new Error("Invalid Supabase storage file URL");
    }

    const filePath = fileUrl.split(urlPattern)[1];
    const endpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`;

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.supabaseKey}`,
        "Content-Type": mimeType,
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase storage replace failed: ${res.statusText} - ${errText}`);
    }

    return {
      url: fileUrl,
      size: fileBuffer.length,
    };
  }
}
