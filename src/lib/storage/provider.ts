// src/lib/storage/provider.ts

export interface UploadResult {
  url: string;
  size: number;
}

export interface StorageProvider {
  /**
   * Uploads a file to the storage back-end.
   * @param fileBuffer The file contents in a buffer.
   * @param filename The original filename.
   * @param mimeType The file mime type.
   * @param folder Optional virtual directory (e.g. "/products").
   */
  uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folder?: string
  ): Promise<UploadResult>;

  /**
   * Deletes a file from the storage back-end based on its URL.
   * @param fileUrl The URL of the file to delete.
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * Replaces an existing file's contents while maintaining the same path/URL.
   * @param fileUrl The existing file URL.
   * @param fileBuffer The new file contents in a buffer.
   * @param mimeType The file mime type.
   */
  replaceFile(
    fileUrl: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<UploadResult>;
}
