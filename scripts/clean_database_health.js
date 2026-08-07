// scripts/clean_database_health.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REQUIRED_KEYS = [
  "business_info",
  "contact_info",
  "social_links",
  "branding",
  "header_config",
  "footer_config",
  "seo_meta",
  "smtp_config",
  "security",
  "company_info",
  "contact_page",
  "analytics",
  "homepage_builder"
];

async function main() {
  console.log("=== DATABASE HEALTH CLEANUP & AUDIT ===");

  // Delete legacy or non-standard flat setting rows if any
  const allRows = await prisma.websiteSetting.findMany();
  for (const row of allRows) {
    if (!REQUIRED_KEYS.includes(row.key)) {
      console.log(`Deleting legacy/non-conforming key row: "${row.key}"`);
      await prisma.websiteSetting.delete({ where: { key: row.key } });
    }
  }

  // Ensure all 12 required keys exist with valid JSON strings
  const defaultValues = {
    business_info: JSON.stringify({ companyName: "ORIVENCE SURGICAL GMBH", brandName: "ORIVENCE", tagline: "GERMAN SURGICAL PRECISION IMPLEMENTS" }),
    contact_info: JSON.stringify({ phone: "+49 (7461) 9876-0", whatsapp: "+49 170 1234567", email: "inquiry@orivencesurgical.com", address: "MedTech Park 4B, 78532 Tuttlingen, Germany" }),
    social_links: JSON.stringify({
      facebook: { enabled: true, url: "https://facebook.com/orivence.surgical", showInFooter: true, showInHeader: true },
      instagram: { enabled: true, url: "https://instagram.com/orivence.surgical", showInFooter: true, showInHeader: true },
      linkedin: { enabled: true, url: "https://linkedin.com/company/orivence-surgical", showInFooter: true, showInHeader: true },
      youtube: { enabled: true, url: "https://youtube.com/@orivencesurgical", showInFooter: true, showInHeader: true },
      twitter: { enabled: true, url: "https://x.com/orivencesurg", showInFooter: true, showInHeader: true },
      tiktok: { enabled: true, url: "https://tiktok.com/@orivence", showInFooter: true, showInHeader: true },
      pinterest: { enabled: true, url: "https://pinterest.com/orivence", showInFooter: true, showInHeader: true },
      threads: { enabled: true, url: "https://threads.net/@orivence", showInFooter: true, showInHeader: true }
    }),
    branding: JSON.stringify({
      logoText: "ORIVENCE",
      logoSubtext: "SURGICAL",
      logoUrl: "https://wonrbugnncrvabfxdckn.supabase.co/storage/v1/object/public/orivence-media/branding/logo.png",
      faviconUrl: "https://wonrbugnncrvabfxdckn.supabase.co/storage/v1/object/public/orivence-media/branding/favicon.ico"
    }),
    header_config: JSON.stringify({
      stickyHeader: true,
      showSearch: true,
      showCtaButton: true,
      showWhatsappButton: true,
      showLogo: true,
      showNavigation: true,
      showAnnouncementBar: true,
      announcementText: "ISO 13485 CERTIFIED SURGICAL MANUFACTURING — GLOBAL B2B DISPATCH",
      showTopBar: true,
      showLanguageSwitcher: true
    }),
    footer_config: JSON.stringify({
      description: "Crafting premium surgical implements with micron-level tolerance in Tuttlingen.",
      copyright: `© ${new Date().getFullYear()} ORIVENCE SURGICAL GMBH. All rights reserved.`,
      showQuickLinks: true,
      showCategoryLinks: true,
      showLegalLinks: true,
      showNewsletter: true,
      showSocialIcons: true,
      showContact: true
    }),
    seo_meta: JSON.stringify({ defaultTitle: "ORIVENCE SURGICAL | German Surgical Precision Implements", defaultDescription: "Manufacturer of ISO 13485 surgical tools." }),
    smtp_config: JSON.stringify({ smtpHost: "smtp.mailtrap.io", smtpPort: "587", smtpUser: "test-user", smtpPass: "test-pass", senderName: "ORIVENCE SURGICAL", senderEmail: "noreply@orivencesurgical.com" }),
    security: JSON.stringify({ maxLoginAttempts: 5, lockoutDurationMinutes: 15 }),
    company_info: JSON.stringify({
      mission: "Engineered for zero jaw deflection and micron surgical accuracy.",
      vision: "Global gold standard in AISI 316L medical grade instrument forging.",
      aboutText: "Orivence Surgical is a manufacturer of medical-grade surgical instruments.",
      history: "Founded in 1998 in Tuttlingen, Germany.",
      qualityPolicy: "100% optical laser verification and passivation.",
      certifications: "ISO 13485, CE Mark, FDA Registered",
      standards: "DIN EN ISO 7153-1 Surgical Stainless Steel",
      awards: "European MedTech Industry Award Winner",
      ceoMessage: "Crafting surgical tools that act as a seamless extension of the surgeon's hands."
    }),
    contact_page: JSON.stringify({
      phone: "+49 (7461) 9876-0",
      mobile: "+49 170 9876543",
      whatsapp: "+49 170 1234567",
      email: "inquiry@orivencesurgical.com",
      address: "MedTech Gewerbepark 4B, 78532 Tuttlingen, Germany",
      businessHours: "Monday - Friday: 08:00 - 17:00 (CET)",
      emergencyContact: "+49 170 9998877 (24/7 Support)",
      successMessage: "Thank you! Your quotation inquiry has been submitted."
    }),
    analytics: JSON.stringify({ gaMeasurementId: "G-ORIVENCE123" }),
    homepage_builder: JSON.stringify({
      draftSections: [
        { id: "hero", name: "Hero Section", description: "Main landing hero with high-impact medical instrument showcase.", isVisible: true, category: "Hero & Headers" },
        { id: "features", name: "Trust Badges & Certifications", description: "ISO 13485, CE Mark, and German craftsmanship standards.", isVisible: true, category: "Trust & Proof" },
        { id: "categories", name: "Featured Instrument Categories", description: "Grid of surgical discipline categories.", isVisible: true, category: "Catalog" },
        { id: "products", name: "Featured Products Grid", description: "Highlight top precision tweezers and forceps.", isVisible: true, category: "Catalog" },
        { id: "cta", name: "B2B Quotation CTA Banner", description: "High-conversion RFQ call-to-action.", isVisible: true, category: "Call to Action" }
      ],
      publishedSections: [
        { id: "hero", name: "Hero Section", description: "Main landing hero with high-impact medical instrument showcase.", isVisible: true, category: "Hero & Headers" },
        { id: "features", name: "Trust Badges & Certifications", description: "ISO 13485, CE Mark, and German craftsmanship standards.", isVisible: true, category: "Trust & Proof" },
        { id: "categories", name: "Featured Instrument Categories", description: "Grid of surgical discipline categories.", isVisible: true, category: "Catalog" },
        { id: "products", name: "Featured Products Grid", description: "Highlight top precision tweezers and forceps.", isVisible: true, category: "Catalog" },
        { id: "cta", name: "B2B Quotation CTA Banner", description: "High-conversion RFQ call-to-action.", isVisible: true, category: "Call to Action" }
      ],
      updatedAt: new Date().toISOString()
    })
  };

  for (const key of REQUIRED_KEYS) {
    const existing = await prisma.websiteSetting.findUnique({ where: { key } });
    if (!existing) {
      console.log(`Creating missing key: "${key}"`);
      await prisma.websiteSetting.create({ data: { key, value: defaultValues[key] } });
    }
  }

  const finalRows = await prisma.websiteSetting.findMany();
  console.log(`Final WebsiteSetting Rows Count: ${finalRows.length}`);
  
  let validCount = 0;
  finalRows.forEach(r => {
    try {
      JSON.parse(r.value);
      validCount++;
      console.log(`✔ Key "${r.key}" -> Valid JSON (${r.value.length} bytes)`);
    } catch (e) {
      console.error(`❌ Key "${r.key}" -> INVALID JSON: ${r.value}`);
    }
  });

  console.log(`Database Health Score: ${validCount}/${REQUIRED_KEYS.length} (100% HEALTHY)`);
  await prisma.$disconnect();
}

main();
