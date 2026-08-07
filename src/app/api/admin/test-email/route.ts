// src/app/api/admin/test-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    const decoded = token ? verifyAccessToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { smtpHost, smtpPort, smtpUser, smtpPass, senderEmail, testRecipient } = await req.json();

    if (!smtpHost || !smtpUser || !testRecipient) {
      return NextResponse.json({ success: false, error: "Missing required SMTP parameters or recipient email." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.verify();

    // Optionally send test email
    await transporter.sendMail({
      from: senderEmail || smtpUser,
      to: testRecipient,
      subject: "ORIVENCE SURGICAL — SMTP Test Connection Successful",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #253237;">
          <h2 style="color: #253237;">ORIVENCE SURGICAL SMTP VERIFICATION</h2>
          <p>Your SMTP mail server configuration has been successfully tested and verified.</p>
          <hr style="border: 0; border-top: 1px solid #C2DFE3;" />
          <p style="font-size: 12px; color: #5C6B73;">Sent automatically from ORIVENCE Master Control Center.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: `SMTP connection verified and test email sent to ${testRecipient}!` });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return NextResponse.json({ success: false, error: "SMTP Connection Failed: " + (error?.message || String(error)) }, { status: 500 });
  }
}
