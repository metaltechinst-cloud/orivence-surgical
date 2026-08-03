// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users - Get list of admin users
export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("[DB READ FAIL] Fetch admin users error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Database query failed", details: error?.message || String(error) }, { status: 500 });
  }
}

// POST /api/admin/users - Create a new admin user
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded || (decoded.role !== "OWNER" && decoded.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized: Insufficient permissions" }, { status: 401 });
    }

    const { username, password, role } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ success: false, error: "Username, password, and role are required." }, { status: 400 });
    }

    const cleanUser = username.toLowerCase().trim();

    console.log(`[DB WRITE START] Create User: "${cleanUser}" (${role})`);

    const existing = await db.user.findUnique({
      where: { username: cleanUser },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Username already exists." }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const newUser = await db.user.create({
      data: {
        username: cleanUser,
        passwordHash,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`[DB WRITE SUCCESS] User created ID: ${newUser.id}`);
    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Create admin user error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Failed to create user: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete an admin user
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded || (decoded.role !== "OWNER" && decoded.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    console.log(`[DB WRITE START] Delete User ID: ${id}`);
    await db.user.delete({ where: { id } });
    console.log(`[DB WRITE SUCCESS] User deleted ID: ${id}`);

    return NextResponse.json({ success: true, message: "User account deleted successfully." });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Delete admin user error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Delete user failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}

// PUT /api/admin/users - Update logged in admin credentials
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }
    const targetUserId = decoded.userId;

    const { username, password } = await req.json();

    const dataToUpdate: any = {};
    if (username && username.trim()) {
      dataToUpdate.username = username.toLowerCase().trim();
    }
    if (password && password.trim()) {
      dataToUpdate.passwordHash = hashPassword(password);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });
    }

    console.log(`[DB WRITE START] Update User credentials ID: ${targetUserId}`);

    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: dataToUpdate,
    });

    console.log(`[DB WRITE SUCCESS] User credentials updated ID: ${targetUserId}`);

    return NextResponse.json({
      success: true,
      message: "Credentials updated successfully.",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role
      }
    });
  } catch (error: any) {
    console.error(`[DB WRITE FAIL] Update admin user error: ${error?.message || error}`);
    return NextResponse.json({ success: false, error: "Update credentials failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
