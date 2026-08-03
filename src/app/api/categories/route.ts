// src/app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/categories - Fetch all categories
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get("admin") === "true";

  try {
    const whereClause: any = {};
    if (!isAdmin) {
      whereClause.status = "PUBLISHED";
    }

    const categories = await db.category.findMany({
      where: whereClause,
      orderBy: [
        { orderIndex: "asc" },
        { name: "asc" }
      ],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("[DB READ FAIL] Fetch categories API error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Database query failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// POST /api/categories - Create category
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Authentication required." }, { status: 401 });
    }

    const { name, description, image, thumbnail, status, orderIndex } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    console.log(`[DB WRITE START] Create Category: "${name}"`);

    const newCategory = await db.category.create({
      data: {
        name,
        slug,
        description: description || "",
        image: image || "/images/products/hero_tweezers.png",
        thumbnail: thumbnail || "",
        status: status || "PUBLISHED",
        orderIndex: parseInt(orderIndex) || 0,
      },
    });

    console.log(`[DB WRITE SUCCESS] Category created ID: ${newCategory.id}`);
    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Create category API error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Database write failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// PUT /api/categories - Update category
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Authentication required." }, { status: 401 });
    }

    const { id, name, description, image, thumbnail, status, orderIndex } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ success: false, error: "Category ID and name are required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    console.log(`[DB WRITE START] Update Category ID: ${id}`);

    const updatedCategory = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || "",
        image: image || "/images/products/hero_tweezers.png",
        thumbnail: thumbnail || "",
        status: status || "PUBLISHED",
        orderIndex: parseInt(orderIndex) || 0,
      },
    });

    console.log(`[DB WRITE SUCCESS] Category updated ID: ${id}`);
    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Update category API error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Database write failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// DELETE /api/categories - Delete category
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reassignCategoryId = searchParams.get("reassignCategoryId");

    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    console.log(`[DB WRITE START] Delete Category ID: ${id}`);

    // 1. Reassign or clean up products to avoid Foreign Key constraint failure
    if (reassignCategoryId) {
      console.log(`[DB WRITE START] Reassign products from Category ${id} to ${reassignCategoryId}`);
      await db.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignCategoryId }
      });
      console.log(`[DB WRITE SUCCESS] Products reassigned.`);
    } else {
      console.log(`[DB WRITE START] Cleanup products for Category ${id}`);
      await db.product.deleteMany({
        where: { categoryId: id }
      });
    }

    // 2. Delete Category
    await db.category.delete({
      where: { id },
    });

    console.log(`[DB WRITE SUCCESS] Category deleted ID: ${id}`);
    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Delete category API error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Database write failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
