// src/app/api/inquiries/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { sendInquiryNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/inquiries - List inquiries
export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const inquiryIdForComments = searchParams.get("inquiryId");

    if (inquiryIdForComments) {
      const comments = await db.inquiryComment.findMany({
        where: { inquiryId: inquiryIdForComments },
        orderBy: { createdAt: "asc" }
      });
      return NextResponse.json(comments);
    }

    const status = searchParams.get("status") || "";
    const country = searchParams.get("country") || "";
    const email = searchParams.get("email") || "";
    const search = searchParams.get("search") || "";
    
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 50));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (country) whereClause.country = country;
    if (email) whereClause.email = { contains: email };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { country: { contains: search } }
      ];
    }

    const inquiries = await db.inquiry.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await db.inquiry.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error: any) {
    console.error("[DB READ FAIL] Fetch inquiries API error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Database query failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// POST /api/inquiries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "comment") {
      const token = getAuthToken(req);
      const decoded = token ? verifyAccessToken(token) : null;
      if (!decoded) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const { inquiryId, text } = body;
      if (!inquiryId || !text) {
        return NextResponse.json({ success: false, error: "Inquiry ID and comment text are required" }, { status: 400 });
      }

      console.log(`[DB WRITE START] Add comment to Inquiry ID: ${inquiryId}`);

      const comment = await db.inquiryComment.create({
        data: {
          inquiryId,
          author: decoded?.username || "Admin",
          text,
        }
      });

      console.log(`[DB WRITE SUCCESS] InquiryComment created ID: ${comment.id}`);
      return NextResponse.json({ success: true, data: comment }, { status: 201 });
    }

    const { name, companyName, website, country, email, phone, whatsapp, message, items, attachments } = body;

    if (!name || !country || !email || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Required fields missing: Name, Country, Email, and Products list." },
        { status: 400 }
      );
    }

    let firstProductName = "";
    let firstProductSku = "";
    try {
      const firstProduct = await db.product.findUnique({ where: { id: items[0].productId } });
      if (firstProduct) {
        firstProductName = firstProduct.name;
        firstProductSku = firstProduct.sku;
      }
    } catch (e) {}

    const count = await db.inquiry.count();
    const referenceNo = `ORV-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;

    console.log(`[DB WRITE START] Create Inquiry ref: ${referenceNo} for ${email}`);

    const inquiry = await db.inquiry.create({
      data: {
        referenceNo,
        name,
        companyName: companyName || "",
        website: website || "",
        country,
        email,
        phone: phone || "",
        whatsapp: whatsapp || "",
        message: message || "",
        attachments: JSON.stringify(attachments || []),
        status: "NEW",
        productName: firstProductName,
        sku: firstProductSku,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1
          }))
        }
      },
      include: { items: true }
    });

    console.log(`[DB WRITE SUCCESS] Inquiry created ID: ${inquiry.id}`);

    // Asynchronously dispatch Owner Notification and Customer Confirmation (Non-blocking failure handling)
    sendInquiryNotifications({
      referenceNo,
      name,
      companyName,
      country,
      email,
      phone,
      whatsapp,
      message,
      items: items.map((i: any) => ({
        productName: i.productName || firstProductName,
        sku: i.sku || firstProductSku,
        quantity: i.quantity || 1
      }))
    }).catch(err => {
      console.error("[EMAIL DISPATCH WARNING] Non-blocking email dispatch error:", err);
    });

    return NextResponse.json({ success: true, data: inquiry, referenceNo }, { status: 201 });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Submit inquiry API error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Failed to submit inquiry: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// PATCH / PUT /api/inquiries
export async function PATCH(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, internalNotes, notes, assignedAgent } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Inquiry ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    const finalNotes = internalNotes !== undefined ? internalNotes : notes;
    if (finalNotes !== undefined) updateData.internalNotes = finalNotes;
    if (assignedAgent !== undefined) updateData.assignedAgent = assignedAgent;

    console.log(`[DB WRITE START] Update Inquiry ID: ${id}`);

    const updated = await db.inquiry.update({
      where: { id },
      data: updateData,
    });

    console.log(`[DB WRITE SUCCESS] Inquiry updated ID: ${id}`);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Update inquiry API error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Failed to update inquiry: " + (error?.message || String(error)) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

// DELETE /api/inquiries - Delete inquiry
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Inquiry ID is required" }, { status: 400 });
    }

    console.log(`[DB WRITE START] Delete Inquiry ID: ${id}`);
    await db.inquiryComment.deleteMany({ where: { inquiryId: id } });
    await db.inquiryItem.deleteMany({ where: { inquiryId: id } });
    await db.inquiry.delete({ where: { id } });
    console.log(`[DB WRITE SUCCESS] Inquiry deleted ID: ${id}`);

    return NextResponse.json({ success: true, message: "Inquiry deleted successfully." });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Delete inquiry API error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Failed to delete inquiry: " + (error?.message || String(error)) }, { status: 500 });
  }
}
