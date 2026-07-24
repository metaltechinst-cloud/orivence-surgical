// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getAuthToken(req);

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    },
  });
}
