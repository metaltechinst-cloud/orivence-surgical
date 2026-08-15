// src/lib/email.ts

import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export interface InquiryEmailData {
  referenceNo: string;
  name: string;
  companyName?: string;
  country: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  message?: string;
  items: Array<{ productName?: string; sku?: string; quantity: number }>;
}

// 1. Helper to fetch live SMTP configuration
export async function getSMTPConfig() {
  try {
    const dbSmtp = await db.websiteSetting.findUnique({ where: { key: "smtp_config" } });
    if (dbSmtp && dbSmtp.value) {
      const config = JSON.parse(dbSmtp.value);
      if (config.smtpHost && config.smtpUser) {
        return config;
      }
    }
  } catch (e) {
    console.warn("[SMTP CONFIG WARNING] Could not fetch SMTP config from DB:", e);
  }

  // Fallback to process.env
  return {
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: process.env.SMTP_PORT || "587",
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    senderName: process.env.SMTP_SENDER_NAME || "ORIVENCE SURGICAL",
    senderEmail: process.env.SMTP_SENDER_EMAIL || "noreply@orivencesurgical.com"
  };
}

// 2. Helper to get Nodemailer Transporter
export async function getTransporter(overrideConfig?: any) {
  const config = overrideConfig || (await getSMTPConfig());
  if (!config.smtpHost || !config.smtpUser) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort) || 587,
    secure: Number(config.smtpPort) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });
}

// 3. Send Inquiry Notifications (Owner Alert + Customer Confirmation) with Failure Handling
export async function sendInquiryNotifications(data: InquiryEmailData): Promise<{ ownerSent: boolean; customerSent: boolean; error?: string }> {
  let ownerSent = false;
  let customerSent = false;

  try {
    const config = await getSMTPConfig();
    const transporter = await getTransporter(config);

    if (!transporter) {
      console.warn("[EMAIL NOTICE] SMTP not configured. Skipping automated email dispatches.");
      return { ownerSent: false, customerSent: false, error: "SMTP unconfigured" };
    }

    const fromAddress = `"${config.senderName || 'ORIVENCE SURGICAL'}" <${config.senderEmail || config.smtpUser}>`;

    // Fetch owner notification recipient
    let ownerEmail = config.senderEmail || "inquiry@orivence.de";
    try {
      const dbContact = await db.websiteSetting.findUnique({ where: { key: "contact_info" } });
      if (dbContact) {
        const contact = JSON.parse(dbContact.value);
        if (contact.email) ownerEmail = contact.email;
      }
    } catch (e) {}

    // A. OWNER NOTIFICATION EMAIL
    try {
      const itemsListHtml = data.items.map(i => `<li><strong>${i.productName || 'Surgical Implement'}</strong> (SKU: ${i.sku || 'N/A'}) &mdash; Qty: ${i.quantity}</li>`).join('');

      await transporter.sendMail({
        from: fromAddress,
        to: ownerEmail,
        subject: `[NEW INQUIRY] Ref #${data.referenceNo} — ${data.name} (${data.country})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #253237; line-height: 1.6;">
            <h2 style="color: #0a5c67; border-b: 2px solid #0a5c67; padding-bottom: 8px;">NEW SURGICAL INQUIRY RECEIVED</h2>
            <p><strong>Reference #:</strong> ${data.referenceNo}</p>
            <p><strong>Customer Name:</strong> ${data.name}</p>
            <p><strong>Company:</strong> ${data.companyName || 'N/A'}</p>
            <p><strong>Country:</strong> ${data.country}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone / WhatsApp:</strong> ${data.phone || data.whatsapp || 'N/A'}</p>
            <p><strong>Message / Special Requirements:</strong></p>
            <blockquote style="background: #f8fafc; padding: 12px; border-left: 4px solid #0a5c67;">${data.message || 'No message provided.'}</blockquote>
            <h3>Requested Products</h3>
            <ul>${itemsListHtml}</ul>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin-top: 20px;" />
            <p style="font-size: 11px; color: #64748b;">ORIVENCE Master Control Center Automated Alert</p>
          </div>
        `
      });
      ownerSent = true;
      console.log(`✔ [EMAIL SUCCESS] Owner notification sent to ${ownerEmail}`);
    } catch (ownerErr: any) {
      console.error("[EMAIL ERROR] Owner notification failed:", ownerErr?.message || ownerErr);
    }

    // B. CUSTOMER CONFIRMATION EMAIL
    try {
      const itemsListHtml = data.items.map(i => `<li>${i.productName || 'Surgical Instrument'} &mdash; Quantity: ${i.quantity}</li>`).join('');

      await transporter.sendMail({
        from: fromAddress,
        to: data.email,
        subject: `Inquiry Confirmation #${data.referenceNo} — ORIVENCE SURGICAL`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #253237; line-height: 1.6;">
            <h2 style="color: #0a5c67;">THANK YOU FOR YOUR INQUIRY</h2>
            <p>Dear ${data.name},</p>
            <p>We have received your quotation request for ORIVENCE medical-grade surgical instruments. Our export division in Tuttlingen, Germany is processing your inquiry.</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-weight: bold; color: #0a5c67;">Inquiry Reference: ${data.referenceNo}</p>
            </div>
            <h3>Summary of Requested Implements</h3>
            <ul>${itemsListHtml}</ul>
            <p>An export manager will contact you within 24 business hours with official specifications and pricing.</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1;" />
            <p style="font-size: 12px; color: #64748b;">ORIVENCE SURGICAL GMBH | Tuttlingen, Germany</p>
          </div>
        `
      });
      customerSent = true;
      console.log(`✔ [EMAIL SUCCESS] Customer confirmation sent to ${data.email}`);
    } catch (customerErr: any) {
      console.error("[EMAIL ERROR] Customer confirmation failed:", customerErr?.message || customerErr);
    }

    return { ownerSent, customerSent };
  } catch (error: any) {
    console.error("[EMAIL SYSTEM ERROR] Failure during email dispatch processing:", error?.message || error);
    return { ownerSent: false, customerSent: false, error: String(error) };
  }
}
