// src/app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully."
  });

  clearAuthCookies(response);
  return response;
}

export async function GET(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully."
  });

  clearAuthCookies(response);
  return response;
}
