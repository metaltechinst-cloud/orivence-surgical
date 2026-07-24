// src/lib/security/twoFactor.ts

import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface TwoFactorSetup {
  secret: string;
  qrCodeDataUrl: string;
}

/**
 * Generates a new TOTP secret and a corresponding QR code data URL.
 * @param username The administrator's username (for display in Authenticator apps).
 */
export async function generate2FASecret(username: string): Promise<TwoFactorSetup> {
  const secret = speakeasy.generateSecret({
    name: `ORIVENCE Control Center (${username})`,
    issuer: "ORIVENCE",
  });

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || "");

  return {
    secret: secret.base32,
    qrCodeDataUrl,
  };
}

/**
 * Verifies a 6-digit TOTP token against the saved base32 secret.
 * @param secret The saved base32 secret.
 * @param token The user-submitted 6-digit code.
 */
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 time steps variance (before/after) for clock drift
  });
}
