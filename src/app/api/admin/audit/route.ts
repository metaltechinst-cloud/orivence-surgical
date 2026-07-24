// src/app/api/admin/audit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

    // Strict security check: Only OWNER and ADMIN can see system audit logs
    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "";
    const username = searchParams.get("username") || "";
    
    // Pagination parameters
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 50));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (action) whereClause.action = action;
    if (username) whereClause.username = { contains: username };

    const logs = await db.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await db.auditLog.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
