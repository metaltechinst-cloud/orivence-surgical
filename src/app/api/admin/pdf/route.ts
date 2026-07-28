// src/app/api/admin/pdf/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsPDF } from "jspdf";
import { getAuthToken, verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Standard styling variables for luxury industrial theme
const COLOR_BLACK = "#000000";
const COLOR_DARK_GRAY = "#222222";
const COLOR_SILVER = "#C0C0C0";
const COLOR_LIGHT_GRAY = "#F0F0F0";

// Helper to draw a luxury minimal header
function drawHeader(doc: jsPDF, title: string) {
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ORIVENCE", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("S U R G I C A L  I M P L E M E N T S", 15, 24);

  // Document Title
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), 195 - doc.getTextWidth(title), 20);
}

// Helper to draw a luxury footer
function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 280, 195, 280);

  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("ORIVENCE - MedTech Park Tuttlingen, Germany", 15, 286);
  doc.text(`Page ${pageNum} of ${totalPages}`, 195 - doc.getTextWidth(`Page ${pageNum} of ${totalPages}`), 286);
}

// Helper to draw specs table
function drawSpecsTable(doc: jsPDF, specs: Record<string, string>, startY: number) {
  doc.setFillColor(245, 245, 245);
  doc.rect(15, startY, 180, 8, "F");
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SPECIFICATION", 20, startY + 5.5);
  doc.text("VALUE", 110, startY + 5.5);

  let currentY = startY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  Object.entries(specs).forEach(([key, val], idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(15, currentY, 180, 7, "F");
    }
    doc.text(key, 20, currentY + 5);
    doc.text(String(val), 110, currentY + 5);
    
    doc.setDrawColor(230, 230, 230);
    doc.line(15, currentY + 7, 195, currentY + 7);
    currentY += 7;
  });

  return currentY;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "catalog";
    const productId = searchParams.get("productId") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const inquiryId = searchParams.get("inquiryId") || "";

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let pdfFilename = "orivence_document.pdf";

    // Track download in analytics
    try {
      const country = req.headers.get("x-vercel-ip-country") || "Local";
      await db.analyticsEvent.create({
        data: {
          eventType: "pdf_download",
          path: `/api/admin/pdf?type=${type}`,
          metaJson: JSON.stringify({ query: `id=${productId || categoryId || inquiryId}`, device: "Desktop" }),
          country,
        },
      });
    } catch (e) {
      // ignore
    }

    // ----------------------------------------------------
    // 1. SPEC SHEET
    // ----------------------------------------------------
    if (type === "spec" && productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: { category: true },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      pdfFilename = `orivence_spec_${product.slug}.pdf`;

      drawHeader(doc, "TECHNICAL SPECIFICATION");

      // Product Identity
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(product.name, 15, 45);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`SKU: ${product.sku || "N/A"}  |  Model: ${product.modelNumber || "N/A"}`, 15, 52);

      // Section Line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(15, 56, 195, 56);

      // Description
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.text("OVERVIEW", 15, 64);
      doc.setFont("helvetica", "normal");
      
      const splitDesc = doc.splitTextToSize(product.description, 180);
      doc.text(splitDesc, 15, 70);
      let yOffset = 70 + (splitDesc.length * 5) + 5;

      // Specs Table
      const technicalSpecs: Record<string, string> = {
        "Brand": product.brand || "ORIVENCE",
        "Category": product.category?.name || "Uncategorized",
        "Material Composition": product.material || "Surgical-grade Stainless Steel",
        "Surface Finish": product.finish || "Satin Electro-polished",
      };

      if (product.length) technicalSpecs["Total Length"] = product.length;
      if (product.width) technicalSpecs["Total Width"] = product.width;
      if (product.tipSize) technicalSpecs["Tip Diameter"] = product.tipSize;
      if (product.jawSize) technicalSpecs["Jaw Opening"] = product.jawSize;
      if (product.weight) technicalSpecs["Weight"] = product.weight;
      if (product.packaging) technicalSpecs["Packaging Spec"] = product.packaging;

      // Parse specJson dynamically
      try {
        const customSpecs = JSON.parse(product.specJson || "{}");
        Object.entries(customSpecs).forEach(([k, v]) => {
          technicalSpecs[k] = String(v);
        });
      } catch (e) {
        // ignore
      }

      yOffset = drawSpecsTable(doc, technicalSpecs, yOffset);

      // Draw simulated QR code bottom-right
      const qrY = 240;
      doc.setFillColor(240, 240, 240);
      doc.rect(165, qrY, 30, 30, "F");
      doc.setTextColor(0, 0, 0);
      doc.rect(165, qrY, 30, 30, "D");
      // Inner blocks
      doc.setFillColor(0, 0, 0);
      doc.rect(167, qrY + 2, 8, 8, "F");
      doc.rect(185, qrY + 2, 8, 8, "F");
      doc.rect(167, qrY + 20, 8, 8, "F");
      doc.rect(177, qrY + 10, 6, 6, "F");

      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text("SCAN FOR LIVE DETAILS", 165, qrY + 34);

      drawFooter(doc, 1, 1);
    }
    
    // ----------------------------------------------------
    // 2. CATEGORY CATALOG
    // ----------------------------------------------------
    else if (type === "category" && categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId },
        include: { products: true },
      });

      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      pdfFilename = `orivence_catalog_${category.slug}.pdf`;

      // Cover Page
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 297, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("ORIVENCE", 30, 100);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 180);
      doc.text(category.name.toUpperCase(), 30, 110);
      doc.line(30, 115, 100, 115);

      doc.setFontSize(10);
      const splitCatDesc = doc.splitTextToSize(category.description || "", 150);
      doc.text(splitCatDesc, 30, 125);

      doc.setTextColor(120, 120, 120);
      doc.text("MEDTECH INDUSTRIAL SELECTION CATALOG  |  GERMANY", 30, 260);

      // Product list pages
      category.products.forEach((prod, index) => {
        doc.addPage();
        drawHeader(doc, category.name);
        
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`${index + 1}. ${prod.name}`, 15, 45);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`SKU: ${prod.sku}  |  Material: ${prod.material}`, 15, 52);

        doc.setDrawColor(200, 200, 200);
        doc.line(15, 55, 195, 55);

        doc.setTextColor(60, 60, 60);
        const descText = doc.splitTextToSize(prod.description, 180);
        doc.text(descText, 15, 63);

        const specs: Record<string, string> = {
          "Model Number": prod.modelNumber || "N/A",
          "Surface Finish": prod.finish || "Satin Electro-polished",
          "Dimensions": prod.dimensions || "N/A",
        };
        if (prod.tipSize) specs["Tip Alignment"] = prod.tipSize;
        if (prod.jawSize) specs["Jaw Spec"] = prod.jawSize;

        drawSpecsTable(doc, specs, 63 + (descText.length * 5) + 8);

        drawFooter(doc, index + 2, category.products.length + 1);
      });
    }

    // ----------------------------------------------------
    // 3. COMPLETE CATALOG
    // ----------------------------------------------------
    else if (type === "catalog") {
      pdfFilename = "orivence_corporate_catalog.pdf";

      // Cover Page
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 297, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.text("ORIVENCE", 30, 100);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("MASTER CATALOG & TECHNICAL COMPENDIUM", 30, 112);
      doc.setDrawColor(255, 255, 255);
      doc.line(30, 117, 120, 117);

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.text("ESTHETICIAN  •  LASH & BROW  •  NAIL TECH  •  SURGICAL", 30, 125);
      doc.text("FOR CLINIQUES, SALONS, AND RETAIL CHANNELS  |  GERMANY", 30, 260);

      // Page 2: Company Profile
      doc.addPage();
      drawHeader(doc, "COMPANY PROFILE");

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("THE ORIVENCE STANDARD", 15, 45);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      const profileText = 
        "Forged at the epicenter of MedTech innovation in Tuttlingen, Germany, Orivence designs and manufactures professional-grade clinical beauty implements with surgical precision. " +
        "Every tool represents a perfect convergence of engineering precision, premium metallurgical composition, and minimalist industrial aesthetics. We supply international distribution agencies, high-end dermatology practices, and leading cosmetic institutes worldwide. Our product portfolio is constructed from premium AISI surgical steel, electro-polished to satin finish and individually hand-calibrated at micron levels to ensure perfect, drag-free alignments.";

      const splitProfile = doc.splitTextToSize(profileText, 180);
      doc.text(splitProfile, 15, 55);

      // Core Values grid
      doc.setFillColor(245, 245, 245);
      doc.rect(15, 110, 180, 35, "F");

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("METALLURGICAL EXCELLENCE", 25, 118);
      doc.text("MICRON ALIGNMENT", 25, 128);
      doc.text("ZERO RUST WARRANTY", 25, 138);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("AISI 316 / 420 Medical Grade steel alloys.", 95, 118);
      doc.text("Individually checked under 20x magnification.", 95, 128);
      doc.text("Autoclavable configurations resistant to rust.", 95, 138);

      drawFooter(doc, 2, 3);

      // Page 3: Summary of Categories
      doc.addPage();
      drawHeader(doc, "CATALOG SUMMARY");

      const categories = await db.category.findMany({
        include: { _count: { select: { products: true } } },
      });

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("AVAILABLE COLLECTIONS", 15, 45);

      let catY = 55;
      categories.forEach((cat, idx) => {
        doc.setFillColor(248, 248, 248);
        doc.rect(15, catY, 180, 15, "F");

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`${idx + 1}. ${cat.name}`, 20, catY + 6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8.5);
        doc.text(`${cat._count.products} Registered Implements`, 20, catY + 11);

        doc.setTextColor(0, 0, 0);
        doc.text("EXPLORE Range >", 155, catY + 9);

        catY += 19;
      });

      drawFooter(doc, 3, 3);
    }

    // ----------------------------------------------------
    // 4. COMPANY PROFILE ONLY
    // ----------------------------------------------------
    else if (type === "profile") {
      pdfFilename = "orivence_company_profile.pdf";
      drawHeader(doc, "COMPANY PROFILE");

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("ORIVENCE", 15, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text("THE PINNACLE OF MEDICAL-GRADE BEAUTY INSTRUMENTS", 15, 56);

      doc.setDrawColor(0, 0, 0);
      doc.line(15, 60, 195, 60);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("TUTTLINGEN CRAFTSMANSHIP", 15, 70);
      doc.setFont("helvetica", "normal");
      
      const compText = 
        "Orivence operates under the strict guidelines of medical manufacturing norms. Founded as an exclusive line of dermatology and cosmetic surgery implements, Orivence has evolved into a global brand serving premium aesthetic clinics, salons, and technicians. All products are hand-calibrated, ensuring micro-alignments that prevent skin bruising, lash crimping, or splitting. We are committed to absolute engineering precision and minimalistic design logic.";
      
      const splitComp = doc.splitTextToSize(compText, 180);
      doc.text(splitComp, 15, 76);

      drawFooter(doc, 1, 1);
    }

    // ----------------------------------------------------
    // 5. CUSTOMER QUOTATION PDF
    // ----------------------------------------------------
    else if (type === "quotation" && inquiryId) {
      const inquiry = await db.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          items: true
        }
      });

      if (!inquiry) {
        return NextResponse.json({ error: "Inquiry RFQ not found" }, { status: 404 });
      }

      pdfFilename = `orivence_quotation_${inquiry.id.slice(0, 8)}.pdf`;

      drawHeader(doc, "OFFICIAL BID QUOTATION");

      // Quote Details
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("CLIENT INQUIRY INFORMATION", 15, 45);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`RFQ ID: ${inquiry.id}`, 15, 51);
      doc.text(`Date: ${inquiry.createdAt.toLocaleDateString()}`, 15, 56);
      doc.text(`Valid Until: ${new Date(inquiry.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} (30 Days)`, 15, 61);

      // Client Box
      doc.setFillColor(248, 248, 248);
      doc.rect(110, 42, 85, 25, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("INQUIRED BY:", 115, 47);
      doc.setFont("helvetica", "normal");
      doc.text(inquiry.name, 115, 52);
      doc.text(inquiry.companyName || "Individual Clinique", 115, 57);
      doc.text(inquiry.country, 115, 62);

      // Line item header
      let yOffset = 75;
      doc.setFillColor(0, 0, 0);
      doc.rect(15, yOffset, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ITEM DETAIL & SPECIFICATIONS", 20, yOffset + 5.5);
      doc.text("QTY", 145, yOffset + 5.5);
      doc.text("UNIT PRICE", 165, yOffset + 5.5);

      yOffset += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      // Fetch actual items
      for (let i = 0; i < inquiry.items.length; i++) {
        const it = inquiry.items[i];
        
        let prodName = "Spec Implements Reference";
        let prodSku = "ORV-SPEC";
        try {
          const pr = await db.product.findUnique({ where: { id: it.productId } });
          if (pr) {
            prodName = pr.name;
            prodSku = pr.sku;
          }
        } catch (e) {
          // ignore
        }

        if (i % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, yOffset, 180, 8, "F");
        }

        doc.text(`${prodName} (${prodSku})`, 20, yOffset + 5.5);
        doc.text(String(it.quantity), 147, yOffset + 5.5);
        doc.text("Quote Bid", 165, yOffset + 5.5);

        doc.setDrawColor(220, 220, 220);
        doc.line(15, yOffset + 8, 195, yOffset + 8);
        yOffset += 8;
      }

      // Terms & Conditions block
      yOffset += 15;
      doc.setFillColor(245, 245, 245);
      doc.rect(15, yOffset, 180, 30, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("RFQ TERMS & DISTRIBUTION POLICY", 20, yOffset + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("1. All items listed above represent direct exports from MedTech Tuttlingen facility.", 20, yOffset + 11);
      doc.text("2. Payments are via corporate bank wire transfer upon final invoice validation.", 20, yOffset + 16);
      doc.text("3. Shipping terms are EXW Tuttlingen, Germany, unless freight options are negotiated.", 20, yOffset + 21);
      doc.text("4. Custom catalog alterations or private labeling require a minimum order volume (MOQ).", 20, yOffset + 26);

      drawFooter(doc, 1, 1);
    }

    // Output raw array buffer
    const buffer = doc.output("arraybuffer");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdfFilename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    console.error("PDF Generate Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
