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
  } catch (error) {
    console.error("Fetch products API error:", error);
    return NextResponse.json([], { status: 200 }); // Graceful fallback
  }
}

// POST /api/products - Create a new product
export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error("Create product API error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A product with this SKU or slug already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product: " + (error.message || "") }, { status: 400 });
  }
}

// PUT /api/products - Update an existing product
export async function PUT(req: NextRequest) {
  try {
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

    let updatedProduct;
    try {
      updatedProduct = await db.product.update({
        where: { id },
        data: updatePayload,
      });
    } catch (updateErr) {
      const existing = await db.product.findFirst({
        where: { OR: [{ id }, { sku }, { slug }] }
      });
      if (existing) {
        updatedProduct = await db.product.update({
          where: { id: existing.id },
          data: updatePayload,
        });
      } else {
        updatedProduct = await db.product.create({
          data: { id, ...updatePayload },
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error("Update product API error:", error);
    return NextResponse.json({ error: "Failed to update product: " + (error.message || "") }, { status: 400 });
  }
}

// DELETE /api/products - Delete a product
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Clean up inquiry items referencing this product to avoid FK constraint failure
    try {
      await db.inquiryItem.deleteMany({
        where: { productId: id }
      });
    } catch (inquiryItemErr) {
      console.warn("InquiryItem cleanup warning (ignored):", inquiryItemErr);
    }

    try {
      await db.product.delete({
        where: { id },
      });
    } catch (delErr) {
      await db.product.deleteMany({
        where: { OR: [{ id }, { sku: id }, { slug: id }] }
      });
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete product API error:", error);
    return NextResponse.json({ error: "Failed to delete product: " + (error.message || "") }, { status: 400 });
  }
}
