// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/rbac";

// GET /api/products - Get all products, optionally filtered by category
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const featuredOnly = searchParams.get("featured") === "true";
  const isAdmin = searchParams.get("admin") === "true";

  try {
    const whereClause: any = {};
    if (categorySlug) {
      whereClause.category = { slug: categorySlug };
    }
    if (featuredOnly) {
      whereClause.featured = true;
    }
    if (!isAdmin) {
      whereClause.status = "PUBLISHED";
      whereClause.category = {
        ...whereClause.category,
        status: "PUBLISHED"
      };
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: { name: true, slug: true, status: true },
        },
      },
      orderBy: [
        { orderIndex: "asc" },
        { name: "asc" }
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Fetch products API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/products - Create a new product (Owner, Admin, or Product Manager only)
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

    const body = await req.json();
    const {
      name,
      description,
      material,
      finish,
      dimensions,
      sku,
      modelNumber,
      brand,
      length,
      width,
      tipSize,
      jawSize,
      weight,
      applications,
      features,
      packaging,
      downloads,
      imagesJson,
      videoUrl,
      relatedProductsJson,
      seoTitle,
      seoDescription,
      seoKeywords,
      featured,
      status,
      orderIndex,
      categoryId,
      specJson
    } = body;

    if (!name || !description || !categoryId || !sku) {
      return NextResponse.json({ error: "Missing required fields (Name, SKU, Description, Category)" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newProduct = await db.product.create({
      data: {
        name,
        slug,
        sku,
        modelNumber: modelNumber || "",
        brand: brand || "ORIVENCE",
        description,
        material: material || "Surgical-grade Stainless Steel",
        finish: finish || "Satin Electro-polished",
        dimensions: dimensions || "",
        length: length || "",
        width: width || "",
        tipSize: tipSize || "",
        jawSize: jawSize || "",
        weight: weight || "",
        applications: typeof applications === "object" ? JSON.stringify(applications) : String(applications || "[]"),
        features: typeof features === "object" ? JSON.stringify(features) : String(features || "[]"),
        packaging: packaging || "",
        downloads: typeof downloads === "object" ? JSON.stringify(downloads) : String(downloads || "[]"),
        imagesJson: typeof imagesJson === "object" ? JSON.stringify(imagesJson) : String(imagesJson || "[]"),
        videoUrl: videoUrl || "",
        relatedProductsJson: typeof relatedProductsJson === "object" ? JSON.stringify(relatedProductsJson) : String(relatedProductsJson || "[]"),
        seoTitle: seoTitle || "",
        seoDescription: seoDescription || "",
        seoKeywords: seoKeywords || "",
        featured: !!featured,
        status: status || "PUBLISHED",
        orderIndex: parseInt(orderIndex) || 0,
        specJson: typeof specJson === "object" ? JSON.stringify(specJson) : String(specJson || "{}"),
        categoryId,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "PRODUCT_CREATE",
        details: JSON.stringify({ id: newProduct.id, sku: newProduct.sku, name: newProduct.name }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error("Create product API error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A product with this SKU or slug already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/products - Update an existing product (Owner, Admin, or Product Manager only)
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

    const body = await req.json();
    const {
      id,
      name,
      description,
      material,
      finish,
      dimensions,
      sku,
      modelNumber,
      brand,
      length,
      width,
      tipSize,
      jawSize,
      weight,
      applications,
      features,
      packaging,
      downloads,
      imagesJson,
      videoUrl,
      relatedProductsJson,
      seoTitle,
      seoDescription,
      seoKeywords,
      featured,
      status,
      orderIndex,
      categoryId,
      specJson
    } = body;

    if (!id || !name || !description || !categoryId || !sku) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        name,
        slug,
        sku,
        modelNumber: modelNumber || "",
        brand: brand || "ORIVENCE",
        description,
        material: material || "Surgical-grade Stainless Steel",
        finish: finish || "Satin Electro-polished",
        dimensions: dimensions || "",
        length: length || "",
        width: width || "",
        tipSize: tipSize || "",
        jawSize: jawSize || "",
        weight: weight || "",
        applications: typeof applications === "object" ? JSON.stringify(applications) : String(applications || "[]"),
        features: typeof features === "object" ? JSON.stringify(features) : String(features || "[]"),
        packaging: packaging || "",
        downloads: typeof downloads === "object" ? JSON.stringify(downloads) : String(downloads || "[]"),
        imagesJson: typeof imagesJson === "object" ? JSON.stringify(imagesJson) : String(imagesJson || "[]"),
        videoUrl: videoUrl || "",
        relatedProductsJson: typeof relatedProductsJson === "object" ? JSON.stringify(relatedProductsJson) : String(relatedProductsJson || "[]"),
        seoTitle: seoTitle || "",
        seoDescription: seoDescription || "",
        seoKeywords: seoKeywords || "",
        featured: !!featured,
        status: status || "PUBLISHED",
        orderIndex: parseInt(orderIndex) || 0,
        specJson: typeof specJson === "object" ? JSON.stringify(specJson) : String(specJson || "{}"),
        categoryId,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "PRODUCT_UPDATE",
        details: JSON.stringify({ id: updatedProduct.id, sku: updatedProduct.sku }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("Update product API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/products - Delete a product (Owner, Admin, or Product Manager only)
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

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const deleted = await db.product.delete({
      where: { id },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "PRODUCT_DELETE",
        details: JSON.stringify({ id: deleted.id, sku: deleted.sku, name: deleted.name }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
