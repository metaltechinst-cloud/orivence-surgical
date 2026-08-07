// src/app/api/admin/homepage-builder/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface HomepageSectionItem {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  order: number;
  previewIcon?: string;
}

const DEFAULT_SECTIONS: HomepageSectionItem[] = [
  { id: "hero", name: "Hero Banner & Opening Animation", description: "Main corporate headline, CTA buttons, background watermark, and opening animation", visible: true, order: 0, previewIcon: "Sparkles" },
  { id: "about", name: "Corporate Craft & Precision", description: "Tuttlingen metallurgy background, AISI 316L specs, and 1.5µm tolerances", visible: true, order: 1, previewIcon: "Shield" },
  { id: "categories", name: "Specialized Catalog Departments", description: "Interactive category cards for Esthetician, Lash & Brow, and Surgical tools", visible: true, order: 2, previewIcon: "Grid" },
  { id: "products", name: "Featured Implements Showcase", description: "Featured surgical instrument carousel and product cards", visible: true, order: 3, previewIcon: "Package" },
  { id: "facility", name: "Manufacturing Facility & Lab", description: "Microscope inspection, calibration workshop, and cleanroom packaging gallery", visible: true, order: 4, previewIcon: "Factory" },
  { id: "album", name: "Instrument Photo Gallery", description: "High-resolution macro photography of isolation tips and satin finishes", visible: true, order: 5, previewIcon: "Image" },
  { id: "videos", name: "Manufacturing Process Video", description: "Video stream showing precision alignment, grinding, and passivation", visible: true, order: 6, previewIcon: "Video" },
  { id: "global", name: "Global B2B Logistics & Standards", description: "International air freight, laser etching, and ISO 13485 compliance details", visible: true, order: 7, previewIcon: "Globe" },
  { id: "contact", name: "Direct Quotation Inquiry Desk", description: "Direct B2B quotation form, corporate sales hotline, and business hours", visible: true, order: 8, previewIcon: "Mail" }
];

// Helper to get or auto-recover homepage_builder record
async function getHomepageBuilderConfig() {
  try {
    const existing = await db.websiteSetting.findUnique({ where: { key: "homepage_builder" } });
    if (existing && existing.value) {
      try {
        const parsed = JSON.parse(existing.value);
        if (parsed && Array.isArray(parsed.draftSections) && Array.isArray(parsed.publishedSections)) {
          return parsed;
        }
      } catch (e) {
        console.warn("[HOMEPAGE BUILDER RECOVERY] Corrupted JSON detected, auto-healing...");
      }
    }
  } catch (dbErr) {
    console.error("[HOMEPAGE BUILDER DB READ WARN]", dbErr);
  }

  const initialConfig = {
    status: "PUBLISHED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    draftSections: DEFAULT_SECTIONS,
    publishedSections: DEFAULT_SECTIONS
  };

  try {
    await db.websiteSetting.upsert({
      where: { key: "homepage_builder" },
      update: { value: JSON.stringify(initialConfig), group: "homepage", type: "json", updatedAt: new Date() },
      create: { key: "homepage_builder", value: JSON.stringify(initialConfig), group: "homepage", type: "json", description: "Visual Homepage Builder Configuration" }
    });
  } catch (upsertErr) {
    console.error("[HOMEPAGE BUILDER UPSERT ERR]", upsertErr);
  }

  return initialConfig;
}

// GET /api/admin/homepage-builder - Fetch current builder configuration
export async function GET(req: NextRequest) {
  try {
    const config = await getHomepageBuilderConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error("[HOMEPAGE BUILDER GET FAIL]:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch homepage builder config: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// POST / PUT /api/admin/homepage-builder - Save Draft or Publish homepage sections
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Valid JWT token required" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch (jsonErr) {
      return NextResponse.json({ success: false, error: "Malformed JSON or empty request body" }, { status: 400 });
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request payload object" }, { status: 400 });
    }

    const { action, sections } = payload; // action: "save_draft" | "publish"

    if (!Array.isArray(sections)) {
      return NextResponse.json({ success: false, error: "Invalid sections array: 'sections' property must be a valid array" }, { status: 400 });
    }

    // Normalize sections order index
    const normalizedSections: HomepageSectionItem[] = sections.map((sec: any, idx: number) => ({
      id: String(sec.id || `section_${idx}`),
      name: String(sec.name || sec.id || `Section ${idx + 1}`),
      description: String(sec.description || ""),
      visible: sec.visible !== false,
      order: idx,
      previewIcon: sec.previewIcon ? String(sec.previewIcon) : undefined
    }));

    const currentConfig = await getHomepageBuilderConfig();

    let newConfig = { 
      ...currentConfig,
      updatedAt: new Date().toISOString()
    };

    if (action === "publish") {
      newConfig.status = "PUBLISHED";
      newConfig.draftSections = normalizedSections;
      newConfig.publishedSections = normalizedSections;

      // Sync backward-compatible section_order & section_visibility settings
      const publishedOrder = normalizedSections.map(s => s.id);
      const publishedVisibility: Record<string, boolean> = {};
      normalizedSections.forEach(s => {
        publishedVisibility[s.id] = s.visible;
      });

      await db.websiteSetting.upsert({
        where: { key: "section_order" },
        update: { value: JSON.stringify(publishedOrder), group: "homepage", updatedAt: new Date() },
        create: { key: "section_order", value: JSON.stringify(publishedOrder), group: "homepage" }
      });

      await db.websiteSetting.upsert({
        where: { key: "section_visibility" },
        update: { value: JSON.stringify(publishedVisibility), group: "homepage", updatedAt: new Date() },
        create: { key: "section_visibility", value: JSON.stringify(publishedVisibility), group: "homepage" }
      });

    } else {
      // Save Draft action
      newConfig.status = "DRAFT";
      newConfig.draftSections = normalizedSections;
    }

    // Persist homepage_builder record in Supabase PostgreSQL DB
    await db.websiteSetting.upsert({
      where: { key: "homepage_builder" },
      update: { value: JSON.stringify(newConfig), group: "homepage", updatedAt: new Date() },
      create: { key: "homepage_builder", value: JSON.stringify(newConfig), group: "homepage", description: "Visual Homepage Builder Configuration" }
    });

    // Audit Log Entry
    try {
      await db.auditLog.create({
        data: {
          userId: decoded.userId,
          username: decoded.username,
          action: action === "publish" ? "HOMEPAGE_PUBLISH" : "HOMEPAGE_DRAFT_SAVE",
          details: JSON.stringify({ sectionCount: normalizedSections.length, action }),
          ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
        }
      });
    } catch (auditErr) {
      console.warn("[AUDIT LOG WARNING]:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: action === "publish" ? "Homepage published live successfully!" : "Homepage draft saved successfully!",
      data: newConfig
    });

  } catch (error: any) {
    console.error("[HOMEPAGE BUILDER POST FAIL]:", error);
    return NextResponse.json({ success: false, error: "Failed to update homepage builder: " + (error?.message || String(error)) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Method DELETE Not Allowed" }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, error: "Method PATCH Not Allowed" }, { status: 405 });
}
