-- ORIVENCE SURGICAL — COMPLETE SUPABASE POSTGRESQL DDL MIGRATION SCRIPT
-- Paste and Run this script in Supabase SQL Editor (Screenshot 5) to create all 11 tables instantly!

-- 1. Category Table
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "thumbnail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");

-- 2. Product Table
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "modelNumber" TEXT,
    "brand" TEXT DEFAULT 'ORIVENCE',
    "description" TEXT NOT NULL,
    "material" TEXT DEFAULT 'Surgical-grade Stainless Steel',
    "finish" TEXT DEFAULT 'Satin Electro-polished',
    "dimensions" TEXT,
    "length" TEXT,
    "width" TEXT,
    "tipSize" TEXT,
    "jawSize" TEXT,
    "weight" TEXT,
    "applications" TEXT,
    "features" TEXT,
    "packaging" TEXT,
    "downloads" TEXT,
    "imagesJson" TEXT NOT NULL,
    "videoUrl" TEXT,
    "relatedProductsJson" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "specJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");

-- 3. Inquiry Table
CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "website" TEXT,
    "country" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "message" TEXT,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "assignedAgent" TEXT,
    "followUpDate" TIMESTAMP(3),
    "activityHistory" TEXT,
    "productName" TEXT,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Inquiry_referenceNo_key" ON "Inquiry"("referenceNo");

-- 4. InquiryItem Table
CREATE TABLE IF NOT EXISTS "InquiryItem" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InquiryItem_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InquiryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. InquiryComment Table
CREATE TABLE IF NOT EXISTS "InquiryComment" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryComment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InquiryComment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. MediaAsset Table
CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" TEXT NOT NULL DEFAULT '/',
    "altText" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- 7. User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONTENT_MANAGER',
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- 8. AuditLog Table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 9. BackupRecord Table
CREATE TABLE IF NOT EXISTS "BackupRecord" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- 10. WebsiteSetting Table
CREATE TABLE IF NOT EXISTS "WebsiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteSetting_key_key" ON "WebsiteSetting"("key");

-- 11. AnalyticsEvent Table
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "path" TEXT,
    "productId" TEXT,
    "metaJson" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- Initial Master User Seed (Username: ahmad123 / Role: OWNER)
INSERT INTO "User" ("id", "username", "passwordHash", "role", "status")
VALUES (
    'user-ahmad123',
    'ahmad123',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'OWNER',
    'ACTIVE'
) ON CONFLICT ("username") DO NOTHING;
