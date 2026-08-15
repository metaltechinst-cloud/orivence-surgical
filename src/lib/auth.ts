// src/lib/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "orivance-surgical-super-secret-key-1827";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "orivance-surgical-refresh-key-9982";

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  temp?: boolean;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function setAuthCookies(res: NextResponse, payload: TokenPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookies.set("admin_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return res;
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return res;
}

export function getAuthToken(req: NextRequest): string | null {
  // Check authorization header first
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.substring(7).trim();
    if (bearer && bearer !== "null" && bearer !== "undefined" && bearer !== "authenticated") {
      return bearer;
    }
  }
  
  // Check cookie next
  const cookie = req.cookies.get("admin_token");
  if (cookie && cookie.value && cookie.value !== "null" && cookie.value !== "undefined") {
    return cookie.value;
  }
  
  return null;
}
