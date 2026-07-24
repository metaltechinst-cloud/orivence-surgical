// src/app/api/auth/2fa/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify2FAToken } from "@/lib/security/twoFactor";
import { setAuthCookies, signAccessToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "orivance-surgical-super-secret-key-1827";

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return NextResponse.json(
        { error: "Token and verification code are required." },
        { status: 400 }
      );
    }

    // Verify the temporary token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "Temporary session expired. Please log in again." },
        { status: 401 }
      );
    }

    if (!decoded.temp) {
      return NextResponse.json(
        { error: "Invalid login token type." },
        { status: 400 }
      );
    }

    // Fetch the admin user
    const admin = await db.adminUser.findUnique({
      where: { id: decoded.userId }
    });

    if (!admin || !admin.twoFactorSecret) {
      return NextResponse.json(
        { error: "Two-factor authentication is not configured for this user." },
        { status: 400 }
      );
    }

    // Validate TOTP token
    const isCodeValid = verify2FAToken(admin.twoFactorSecret, code);

    if (!isCodeValid) {
      // Create Audit Log of failed 2FA attempt
      await db.auditLog.create({
        data: {
          userId: admin.id,
          username: admin.username,
          action: "2FA_VERIFICATION_FAILED",
          details: JSON.stringify({ ip: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1" }),
          ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
        }
      });

      return NextResponse.json(
        { error: "Invalid two-factor authentication code." },
        { status: 401 }
      );
    }

    // Log success
    await db.auditLog.create({
      data: {
        userId: admin.id,
        username: admin.username,
        action: "2FA_VERIFICATION_SUCCESS",
        details: JSON.stringify({ ip: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1" }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    // Valid code, issue auth session
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

    // Set double session cookies
    setAuthCookies(response, payload);

    return response;
  } catch (error: any) {
    console.error("2FA Verify Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
