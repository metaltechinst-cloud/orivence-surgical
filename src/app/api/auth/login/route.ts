// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, setAuthCookies, signAccessToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "orivance-surgical-super-secret-key-1827";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    // Find admin user in database
    const admin = await db.adminUser.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!admin || !comparePassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Create Audit Log of successful password check
    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: "PASSWORD_AUTH_SUCCESS",
        details: JSON.stringify({ ip: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1" }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    // Check if 2FA is enabled
    if (admin.twoFactorEnabled && admin.twoFactorSecret) {
      // Issue a temporary token valid for 5 minutes
      const tempToken = jwt.sign(
        { userId: admin.id, username: admin.username, role: admin.role, temp: true },
        JWT_SECRET,
        { expiresIn: "5m" }
      );

      return NextResponse.json({
        success: true,
        twoFactorRequired: true,
        tempToken,
        username: admin.username
      });
    }

    // Standard session login (no 2FA)
    const payload = {
      userId: admin.id,
      username: admin.username,
      role: admin.role
    };

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      token: signAccessToken(payload),
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });

    // Set double cookies
    setAuthCookies(response, payload);

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
