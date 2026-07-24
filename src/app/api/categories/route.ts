// src/app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/rbac";

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
  } catch (error) {
    console.error("Fetch categories API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/categories - Create category
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

    if (!hasPermission(decoded.role, "manage_products")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { name, description, image, thumbnail, status, orderIndex } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "CATEGORY_CREATE",
        details: JSON.stringify({ categoryId: newCategory.id, categoryName: newCategory.name }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error: any) {
    console.error("Create category API error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/categories - Update category
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

    if (!hasPermission(decoded.role, "manage_products")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { id, name, description, image, thumbnail, status, orderIndex } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: "Category ID and name are required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error: any) {
    console.error("Update category API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/categories - Delete category
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

    if (!hasPermission(decoded.role, "manage_products")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reassignCategoryId = searchParams.get("reassignCategoryId");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Check if category has products
    const productsCount = await db.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0 && !reassignCategoryId && !force) {
      return NextResponse.json({
        error: `Category contains ${productsCount} assigned product(s). Please specify a target category to reassign them to, or confirm force deletion.`,
        hasProducts: true,
        productsCount
      }, { status: 400 });
    }

    // Reassign products if reassignCategoryId is provided
    if (productsCount > 0 && reassignCategoryId) {
      await db.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignCategoryId }
      });
    }

    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Delete category API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
