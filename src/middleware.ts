// src/middleware.ts

import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "orivance-surgical-super-secret-key-1827";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "orivance-surgical-refresh-key-9982";

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

// Helper: base64url encode
function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// Helper: base64url decode
function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Helper: get CryptoKey for HMAC
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Sign JWT using Web Crypto API
async function signJWT(payload: any, secret: string, expiresInSeconds: number): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const headerPart = base64urlEncode(JSON.stringify(header));
  const payloadPart = base64urlEncode(JSON.stringify(fullPayload));
  const data = new TextEncoder().encode(headerPart + "." + payloadPart);

  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  
  const sigBytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < sigBytes.byteLength; i++) {
    binary += String.fromCharCode(sigBytes[i]);
  }
  const signaturePart = btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return headerPart + "." + payloadPart + "." + signaturePart;
}

// Verify JWT using Web Crypto API
async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const data = new TextEncoder().encode(headerPart + "." + payloadPart);

    let base64 = signaturePart.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const sigBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      sigBytes[i] = binary.charCodeAt(i);
    }

    const key = await getCryptoKey(secret);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!isValid) return null;

    const payload = JSON.parse(base64urlDecode(payloadPart));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests/min limit for API

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1";

  // 1. Rate Limiting on API routes
  if (pathname.startsWith("/api/")) {
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (!rateData || now > rateData.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      rateData.count++;
      if (rateData.count > MAX_REQUESTS_PER_WINDOW) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // 2. CSRF Origin Verification for Mutating Actions
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)
  ) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const referer = req.headers.get("referer");

    if (origin && host) {
      const originHost = origin.replace(/^https?:\/\//, "");
      if (originHost !== host && !host.startsWith(originHost)) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF verification failed: Origin mismatch." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (!origin && referer && host) {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF verification failed: Referer mismatch." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // 3. Admin Route Authentication & Protection
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPage = pathname === "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");

  if ((isAdminPage && !isLoginPage) || isAdminApi) {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const accessToken = req.cookies.get("admin_token")?.value || bearerToken;
    const refreshToken = req.cookies.get("refresh_token")?.value;

    let userPayload: TokenPayload | null = null;

    if (accessToken) {
      userPayload = await verifyJWT(accessToken, JWT_SECRET);
    }

    // Try automatic refresh if access token expired but refresh token exists
    if (!userPayload && refreshToken) {
      const refreshPayload = await verifyJWT(refreshToken, REFRESH_SECRET);
      if (refreshPayload) {
        // Sign new access token
        const newAccessToken = await signJWT({
          userId: refreshPayload.userId,
          username: refreshPayload.username,
          role: refreshPayload.role,
        }, JWT_SECRET, 15 * 60);

        let res = NextResponse.next();
        res.cookies.set("admin_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 15 * 60, // 15 mins
        });

        return res;
      }
    }

    // Gating unauthenticated users
    if (!userPayload) {
      if (isAdminPage) {
        const loginUrl = new URL("/admin/login", req.url);
        return NextResponse.redirect(loginUrl);
      } else {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized access: Authentication required." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Redirect authenticated user away from login page to dashboard
  if (isLoginPage) {
    const accessToken = req.cookies.get("admin_token")?.value;
    if (accessToken) {
      const payload = await verifyJWT(accessToken, JWT_SECRET);
      if (payload) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
