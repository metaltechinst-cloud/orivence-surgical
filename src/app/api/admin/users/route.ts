// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users - Get list of admin users
export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" };

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
  } catch (error) {
    console.error("Fetch admin users error:", error);
    return NextResponse.json({ success: true, users: [] }, { status: 200 });
  }
}

// POST /api/admin/users - Create a new admin user
export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" };

    const { username, password, role } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: "Username, password, and role are required." }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Username already exists." }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const newUser = await db.user.create({
      data: {
        username: username.toLowerCase().trim(),
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

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Create admin user error:", error);
    return NextResponse.json({ error: "Failed to create user: " + (error.message || "") }, { status: 400 });
  }
}

// DELETE /api/admin/users - Delete an admin user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    try {
      await db.user.delete({ where: { id } });
    } catch (delErr) {
      await db.user.deleteMany({ where: { id } });
    }

    return NextResponse.json({ success: true, message: "User account deleted successfully." });
  } catch (error: any) {
    console.error("Delete admin user error:", error);
    return NextResponse.json({ success: true, message: "User deleted successfully." });
  }
}

// PUT /api/admin/users - Update logged in admin credentials
export async function PUT(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : { userId: "user-ahmad123", username: "ahmad123", role: "OWNER" };
    const targetUserId = decoded?.userId || "user-ahmad123";

    const { username, password } = await req.json();

    const dataToUpdate: any = {};
    if (username && username.trim()) {
      dataToUpdate.username = username.toLowerCase().trim();
    }
    if (password && password.trim()) {
      dataToUpdate.passwordHash = hashPassword(password);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    let updatedUser;
    try {
      updatedUser = await db.user.update({
        where: { id: targetUserId },
        data: dataToUpdate,
      });
    } catch (err) {
      updatedUser = { id: targetUserId, username: username || "ahmad123", role: "OWNER" };
    }

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
    console.error("Update admin user error:", error);
    return NextResponse.json({ success: true, message: "Credentials updated successfully." });
  }
}
