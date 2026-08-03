// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
  } catch (error: any) {
    console.error("[DB READ FAIL] Fetch products API error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Database query failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid or missing token" }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "Missing required fields (Name, SKU, Description, Category)" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    console.log(`[DB WRITE START] Create Product: "${name}" (SKU: ${sku})`);

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

    console.log(`[DB WRITE SUCCESS] Product created ID: ${newProduct.id}`);
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Create Product failed: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Database write failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// PUT /api/products - Update an existing product
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid or missing token" }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "Missing required fields for update" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const updatePayload = {
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
    };

    console.log(`[DB WRITE START] Update Product ID: ${id}`);

    const updatedProduct = await db.product.update({
      where: { id },
      data: updatePayload,
    });

    console.log(`[DB WRITE SUCCESS] Product updated ID: ${id}`);
    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Update Product failed: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Database write failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// DELETE /api/products - Delete a product
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid or missing token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    console.log(`[DB WRITE START] Delete Product ID: ${id}`);

    await db.inquiryItem.deleteMany({
      where: { productId: id }
    });

    await db.product.delete({
      where: { id },
    });

    console.log(`[DB WRITE SUCCESS] Product deleted ID: ${id}`);
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Delete Product failed: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Database write failed", details: error?.message || String(error) }, { status: 500 });
  }
}
