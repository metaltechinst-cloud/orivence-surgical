// src/app/api/auth/2fa/setup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import { generate2FASecret, verify2FAToken } from "@/lib/security/twoFactor";

export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const setup = await generate2FASecret(decoded.username);

    return NextResponse.json({
      success: true,
      secret: setup.secret,
      qrCodeDataUrl: setup.qrCodeDataUrl,
    });
  } catch (error: any) {
    console.error("2FA Setup GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { secret, code } = await req.json();

    if (!secret || !code) {
      return NextResponse.json(
        { error: "Secret and code are required." },
        { status: 400 }
      );
    }

    // Verify first token
    const isCodeValid = verify2FAToken(secret, code);

    if (!isCodeValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please scan again." },
        { status: 400 }
      );
    }

    // Save to user DB and enable
    await db.adminUser.update({
      where: { id: decoded.userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    });

    // Create Audit Log entry
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "2FA_ACTIVATED",
        details: JSON.stringify({ ip: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1" }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been enabled successfully.",
    });
  } catch (error: any) {
    console.error("2FA Setup POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Support disabling 2FA via DELETE
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make sure only OWNER or ADMIN can disable 2FA
    if (decoded.role !== "OWNER" && decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.adminUser.update({
      where: { id: decoded.userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });

    // Create Audit Log entry
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        username: decoded.username,
        action: "2FA_DEACTIVATED",
        details: JSON.stringify({ ip: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1" }),
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been disabled.",
    });
  } catch (error: any) {
    console.error("2FA Disable Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
