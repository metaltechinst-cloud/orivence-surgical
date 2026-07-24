// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, hashPassword, setAuthCookies, signAccessToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "orivance-surgical-super-secret-key-1827";

const DEFAULT_ACCOUNTS: Record<string, { pass: string; role: string }> = {
  owner: { pass: "ownerorivance", role: "OWNER" },
  admin: { pass: "adminorivance", role: "ADMIN" },
  editor: { pass: "editororivance", role: "EDITOR" },
  agent: { pass: "agentorivance", role: "AGENT" },
};

async function ensureDefaultAccountsExist() {
  try {
    const userCount = await db.adminUser.count();
    if (userCount === 0) {
      for (const [username, config] of Object.entries(DEFAULT_ACCOUNTS)) {
        await db.adminUser.create({
          data: {
            username,
            passwordHash: hashPassword(config.pass),
            role: config.role,
          },
        });
      }
    }
  } catch (e) {
    console.error("Auto-provision admin users fallback:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();

    // Ensure default accounts exist if database is unseeded
    await ensureDefaultAccountsExist();

    // Find admin user in database
    let admin = await db.adminUser.findUnique({
      where: { username: cleanUsername },
    });

    // If account missing but matches default credentials pattern, auto-create
    if (!admin && DEFAULT_ACCOUNTS[cleanUsername] && password === DEFAULT_ACCOUNTS[cleanUsername].pass) {
      try {
        admin = await db.adminUser.create({
          data: {
            username: cleanUsername,
            passwordHash: hashPassword(password),
            role: DEFAULT_ACCOUNTS[cleanUsername].role,
          },
        });
      } catch (e) {
        console.error("Single user auto-provision error:", e);
      }
    }

    if (!admin || !comparePassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your username and password." },
        { status: 401 }
      );
    }

    // Create Audit Log of successful login
    try {
      await db.auditLog.create({
        data: {
          userId: admin.id,
          username: admin.username,
          action: "PASSWORD_AUTH_SUCCESS",
          details: JSON.stringify({ ip: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1" }),
          ipAddress: req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1"
        }
      });
    } catch (auditErr) {
      console.error("Audit log creation error:", auditErr);
    }

    // Check if 2FA is enabled
    if (admin.twoFactorEnabled && admin.twoFactorSecret) {
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

    // Standard session login
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
