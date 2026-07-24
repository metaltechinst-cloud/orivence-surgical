// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users - Get list of admin users (OWNER only)
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

    // Role verification: Only OWNER can manage or view admin users list
    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: OWNER access only" }, { status: 403 });
    }

    const users = await db.adminUser.findMany({
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users - Create a new admin user (OWNER only)
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

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: OWNER access only" }, { status: 403 });
    }

    const { username, password, role } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: "Username, password, and role are required." }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.adminUser.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Username already exists." }, { status: 400 });
    }

    // Create user
    const passwordHash = hashPassword(password);
    const newUser = await db.adminUser.create({
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

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "ADMIN_USER_CREATE",
        details: JSON.stringify({ createdUsername: newUser.username, role: newUser.role }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Create admin user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete an admin user (OWNER only)
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

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: OWNER access only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent OWNER from deleting themselves
    if (id === decoded.userId) {
      return NextResponse.json({ error: "Cannot delete your own OWNER account." }, { status: 400 });
    }

    const userToDelete = await db.adminUser.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Execute delete
    await db.adminUser.delete({
      where: { id },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "ADMIN_USER_DELETE",
        details: JSON.stringify({ deletedUsername: userToDelete.username, role: userToDelete.role }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({ success: true, message: "User account deleted successfully." });
  } catch (error) {
    console.error("Delete admin user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/users - Update logged in admin credentials
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

    const updatedUser = await db.adminUser.update({
      where: { id: decoded.userId },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: "Credentials updated successfully.",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Update admin user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

