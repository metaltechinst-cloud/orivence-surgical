// src/app/api/inquiries/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/rbac";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

// GET /api/inquiries - List inquiries with filtering, search, pagination
export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify role permissions using RBAC helper
    if (!hasPermission(decoded.role, "manage_inquiries")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const inquiryIdForComments = searchParams.get("inquiryId");

    // 1. Return comments for a specific inquiry
    if (inquiryIdForComments) {
      const comments = await db.inquiryComment.findMany({
        where: { inquiryId: inquiryIdForComments },
        orderBy: { createdAt: "asc" }
      });
      return NextResponse.json(comments);
    }

    // 2. Return list of inquiries with filtering and pagination
    const status = searchParams.get("status") || "";
    const country = searchParams.get("country") || "";
    const email = searchParams.get("email") || "";
    const search = searchParams.get("search") || "";
    
    // Pagination parameters
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
      include: {
        items: true,
      },
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
  } catch (error) {
    console.error("Fetch inquiries API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper to generate a concurrency-safe unique reference number (Format: ORV-YYYY-XXXXXX)
async function generateUniqueReferenceNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.inquiry.count();
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const sequence = String(count + 1 + attempt).padStart(6, "0");
    const candidate = `ORV-${year}-${sequence}`;
    const existing = await db.inquiry.findUnique({ where: { referenceNo: candidate } });
    if (!existing) {
      return candidate;
    }
  }

  // Fallback: random 6-digit number if sequential candidates collide
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `ORV-${year}-${randomNum}`;
}

// POST /api/inquiries - Submit public multi-product RFQ OR add internal comment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Add internal comment to inquiry (guarded)
    if (body.action === "comment") {
      const token = getAuthToken(req);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (!hasPermission(decoded.role, "manage_inquiries")) {
        return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
      }

      const { inquiryId, text } = body;
      if (!inquiryId || !text) {
        return NextResponse.json({ error: "Inquiry ID and comment text are required" }, { status: 400 });
      }

      const comment = await db.inquiryComment.create({
        data: {
          inquiryId,
          author: decoded.username,
          text,
        }
      });

      // Audit log entry
      await db.auditLog.create({
        data: {
          userId: decoded.userId,
          username: decoded.username,
          action: "CRM_COMMENT_ADD",
          details: JSON.stringify({ inquiryId, commentId: comment.id }),
          ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
        }
      });

      return NextResponse.json({ success: true, data: comment });
    }

    // 2. Public RFQ Inquiry submission
    const {
      name,
      companyName,
      website,
      country,
      email,
      phone,
      whatsapp,
      message,
      items, // Array of { productId, quantity }
      attachments // Array of file URLs
    } = body;

    if (!name || !country || !email || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Required fields are missing: Name, Country, Email, and Products list are mandatory." },
        { status: 400 }
      );
    }

    // Resolve first product details for backward compatibility
    let firstProductName = "";
    let firstProductSku = "";
    try {
      const firstProduct = await db.product.findUnique({ where: { id: items[0].productId } });
      if (firstProduct) {
        firstProductName = firstProduct.name;
        firstProductSku = firstProduct.sku;
      }
    } catch (e) {
      // ignore
    }

    const referenceNo = await generateUniqueReferenceNo();

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
        activityHistory: JSON.stringify([
          { timestamp: new Date().toISOString(), author: "System", event: `Inquiry submitted with Reference ${referenceNo}` }
        ]),
        productName: firstProductName,
        sku: firstProductSku,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1
          }))
        }
      },
      include: {
        items: true
      }
    });

    // 3. Send SMTP Emails (retrieves SMTP configs from DB settings)
    const settingsList = await db.websiteSetting.findMany({
      where: { key: "smtp_settings" }
    });
    
    let smtpConfig: any = null;
    if (settingsList.length > 0) {
      try {
        smtpConfig = JSON.parse(settingsList[0].value);
      } catch (e) {
        // ignore
      }
    }

    let emailSent = false;
    if (smtpConfig && smtpConfig.host && smtpConfig.username && smtpConfig.password) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: Number(smtpConfig.port) || 465,
          secure: Number(smtpConfig.port) === 465,
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password,
          },
        });

        // HTML mail for admin
        const mailOptionsAdmin = {
          from: `"ORIVENCE Web Portal" <${smtpConfig.username}>`,
          to: smtpConfig.notifyEmail || smtpConfig.username,
          subject: `[RFQ ALERT ${referenceNo}] New Multi-Product Inquiry from ${name} (${country})`,
          html: `
            <h2>ORIVENCE B2B RFQ Notification (${referenceNo})</h2>
            <p><strong>Reference Number:</strong> ${referenceNo}</p>
            <p><strong>Customer Name:</strong> ${name}</p>
            <p><strong>Company:</strong> ${companyName || "N/A"}</p>
            <p><strong>Website:</strong> ${website || "N/A"}</p>
            <p><strong>Country:</strong> ${country}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "N/A"}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp || "N/A"}</p>
            <p><strong>Message:</strong> ${message || "N/A"}</p>
            <hr />
            <h3>Requested Implements:</h3>
            <ul>
              ${items.map((it: any) => `<li>Product ID: ${it.productId} - Quantity: ${it.quantity}</li>`).join("")}
            </ul>
            <p>Go to the Orivence Control Center to view files and generate quotes.</p>
          `,
        };

        await transporter.sendMail(mailOptionsAdmin);
        emailSent = true;
      } catch (emailErr) {
        console.error("Nodemailer failed to transmit RFQ notification:", emailErr);
      }
    }

    return NextResponse.json({ success: true, data: inquiry, referenceNo });
  } catch (error) {
    console.error("Submit inquiry API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/inquiries - Update inquiry status, assigned agent, follow-up date, or internal notes (guarded)
export async function PATCH(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!hasPermission(decoded.role, "manage_inquiries")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { id, status, internalNotes, notes, assignedAgent, followUpDate } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Inquiry ID is required" }, { status: 400 });
    }

    const existing = await db.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const updateData: any = {};
    const historyEvents: any[] = [];
    try {
      if (existing.activityHistory) {
        historyEvents.push(...JSON.parse(existing.activityHistory));
      }
    } catch (e) {
      // ignore
    }

    if (status && status !== existing.status) {
      updateData.status = status;
      historyEvents.push({
        timestamp: new Date().toISOString(),
        author: decoded.username,
        event: `Status changed from ${existing.status} to ${status}`
      });
    }

    const finalNotes = internalNotes !== undefined ? internalNotes : notes;
    if (finalNotes !== undefined && finalNotes !== existing.internalNotes) {
      updateData.internalNotes = finalNotes;
      historyEvents.push({
        timestamp: new Date().toISOString(),
        author: decoded.username,
        event: `Internal notes updated`
      });
    }

    if (assignedAgent !== undefined && assignedAgent !== existing.assignedAgent) {
      updateData.assignedAgent = assignedAgent;
      historyEvents.push({
        timestamp: new Date().toISOString(),
        author: decoded.username,
        event: `Assigned agent updated to ${assignedAgent || "Unassigned"}`
      });
    }

    if (followUpDate !== undefined) {
      updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
      historyEvents.push({
        timestamp: new Date().toISOString(),
        author: decoded.username,
        event: `Follow-up date set to ${followUpDate || "None"}`
      });
    }

    updateData.activityHistory = JSON.stringify(historyEvents);

    const updated = await db.inquiry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update inquiry status API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

