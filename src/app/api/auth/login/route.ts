// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, hashPassword, setAuthCookies, signAccessToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "orivance-surgical-super-secret-key-1827";

// Fail-safe emergency accounts map — guaranteed to work on Vercel even if database is offline or unseeded
const FALLBACK_ACCOUNTS: Record<string, { pass: string; role: string; id: string }> = {
  ahmad123: { pass: "Ahmad1234", role: "OWNER", id: "user-ahmad123" },
  owner: { pass: "ownerorivance", role: "OWNER", id: "user-owner" },
  admin: { pass: "adminorivance", role: "ADMIN", id: "user-admin" },
  editor: { pass: "editororivance", role: "EDITOR", id: "user-editor" },
  agent: { pass: "agentorivance", role: "AGENT", id: "user-agent" },
};

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
    const fallbackMatch = FALLBACK_ACCOUNTS[cleanUsername];

    // 1. Direct Fail-Safe Authentication Check for Master Accounts
    if (fallbackMatch && password === fallbackMatch.pass) {
      const payload = {
        userId: fallbackMatch.id,
        username: cleanUsername,
        role: fallbackMatch.role
      };

      const response = NextResponse.json({
        success: true,
        authenticated: true,
        token: signAccessToken(payload),
        user: {
          id: fallbackMatch.id,
          username: cleanUsername,
          role: fallbackMatch.role
        }
      });

      setAuthCookies(response, payload);

      // Best-effort database background sync (non-blocking)
      try {
        const existing = await db.adminUser.findUnique({ where: { username: cleanUsername } });
        if (!existing) {
          await db.adminUser.create({
            data: {
              id: fallbackMatch.id,
              username: cleanUsername,
              passwordHash: hashPassword(password),
              role: fallbackMatch.role,
            }
          });
        }
      } catch (dbErr) {
        console.warn("DB sync warning during fallback auth (ignored):", dbErr);
      }

      return response;
    }

    // 2. Database Lookup for Custom Registered Admin Accounts
    let admin = null;
    try {
      admin = await db.adminUser.findUnique({
        where: { username: cleanUsername },
      });
    } catch (e) {
      console.error("Database user lookup error:", e);
    }

    if (!admin || !comparePassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your username and password." },
        { status: 401 }
      );
    }

    // Standard session login for database user
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
