// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await db.adminUser.deleteMany();
  await db.inquiryComment.deleteMany();
  await db.inquiryItem.deleteMany();
  await db.inquiry.deleteMany();
  await db.mediaAsset.deleteMany();
  await db.websiteSetting.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  console.log("Seeding role-based administrator accounts...");
  const roles = [
    { username: "owner", password: "ownerorivance", role: "OWNER" },
    { username: "admin", password: "adminorivance", role: "ADMIN" },
    { username: "editor", password: "editororivance", role: "EDITOR" },
    { username: "agent", password: "agentorivance", role: "AGENT" },
  ];

  for (const user of roles) {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    await db.adminUser.create({
      data: {
        username: user.username,
        passwordHash,
        role: user.role,
      },
    });
    console.log(`- Created ${user.role} (username: ${user.username}, password: ${user.password})`);
  }

  console.log("Seeding corporate settings...");
  const defaultSettings = [
    {
      key: "homepage_hero",
      value: JSON.stringify({
        headline: "MICRON-LEVEL SURGICAL ALIGNMENT",
        subheadline: "Aesthetic implements forged for elite dermatologists, lash masters, and clinical beauty technicians.",
        ctaText: "ACQUIRE CATALOG",
        ctaLink: "#contact-section",
        secondaryCtaText: "EXPLORE RANGE",
        secondaryCtaLink: "#products-section",
        heroImage: "/images/products/hero_tweezers.webp",
      }),
    },
    {
      key: "homepage_visibility",
      value: JSON.stringify({
        hero: true,
        about: true,
        categories: true,
        products: true,
        global: true,
        contact: true,
        footer: true,
        order: ["hero", "about", "categories", "products", "global", "contact"],
      }),
    },
    {
      key: "contact_info",
      value: JSON.stringify({
        phone: "+49 (7461) 9876-0",
        whatsapp: "+49 170 1234567",
        email: "inquiry@orivence.com",
        address: "Orivance HQ, MedTech Park 4B, 78532 Tuttlingen, Germany",
        hours: "Mon - Fri: 08:00 - 18:00 (CET)",
      }),
    },
    {
      key: "legal_policies",
      value: JSON.stringify({
        privacyPolicy: "This Privacy Policy describes how Orivance Surgical processes corporate customer inquiry details. All inquiry data is processed locally in Tuttlingen and is subject to strict DSGVO/GDPR guidelines. Data is never shared with third-party logistics without clear authorization.",
        termsConditions: "These terms govern the catalog review and quotation request portal. All quotes supplied by Orivance Surgical are official corporate bids valid for 30 calendar days. No direct sales or checkout transactions are authorized via this platform.",
        cookiePolicy: "This website uses essential system cookies only. We use secure session identifiers for administrator consoles and basic preferences toggles (language, theme selector). No tracking or marketing pixels are deployed.",
      }),
    },
    {
      key: "branding",
      value: JSON.stringify({
        logoText: "ORIVENCE",
        logoSubtext: "SURGICAL",
        faviconUrl: "/favicon.ico",
      }),
    },
    {
      key: "seo_settings",
      value: JSON.stringify({
        metaTitle: "ORIVENCE SURGICAL | Premium Catalog & Inquiries",
        metaDescription: "World-class luxury industrial catalog of surgical-grade implements. Forged in Tuttlingen for dermatologists, estheticians, and clinics.",
        googleAnalyticsId: "UA-1827550-1",
        socialLinks: {
          linkedin: "https://linkedin.com/company/orivance-surgical",
          instagram: "https://instagram.com/orivance.surgical",
          youtube: "https://youtube.com/c/orivancesurgical",
        },
      }),
    },
    {
      key: "smtp_settings",
      value: JSON.stringify({
        host: "smtp.orivance-mail.de",
        port: 465,
        username: "smtp@orivance.de",
        password: "securepassword",
        notifyEmail: "sales-alert@orivance.de",
      }),
    },
  ];

  for (const setting of defaultSettings) {
    await db.websiteSetting.create({
      data: setting,
    });
  }
  console.log("- Seeding settings finished.");

  console.log("Seeding 8 master categories...");
  const catEsthetician = await db.category.create({
    data: {
      name: "Esthetician Pro Series",
      slug: "esthetician-pro-series",
      description: "Surgical-grade skin extraction instruments engineered for elite dermatologists and estheticians.",
      image: "/images/products/lancet_extractor.webp",
    },
  });

  const catLashBrow = await db.category.create({
    data: {
      name: "Lash & Brow Precision",
      slug: "lash-brow-precision",
      description: "Ultra-fine point isolation and volume tweezers designed for flawless lash application and brow grooming.",
      image: "/images/products/curved_tweezers.webp",
    },
  });

  const catNailTech = await db.category.create({
    data: {
      name: "Advanced Nail Tech Implements",
      slug: "advanced-nail-tech-implements",
      description: "Ergonomic cuticle nippers, pushers, and splitters crafted for premium manicures and advanced podiatry care.",
      image: "/images/products/cuticle_nippers.webp",
    },
  });

  const catSalonHardware = await db.category.create({
    data: {
      name: "Salon Extension Hardware",
      slug: "salon-extension-hardware",
      description: "Durable pulling loops, extension clamps, and removal pliers forged for professional hair extensions.",
      image: "/images/products/extension_pliers.webp",
    },
  });

  const catCosmeticMixing = await db.category.create({
    data: {
      name: "Cosmetic Mixing Tools",
      slug: "cosmetic-mixing-tools",
      description: "Hygienic compounding spatulas, offset palettes, and wax applicators for cosmetic lab mixing.",
      image: "/images/products/mixing_spatula.webp",
    },
  });

  const catGrooming = await db.category.create({
    data: {
      name: "Professional Grooming Instruments",
      slug: "professional-grooming-instruments",
      description: "Premium personal care instruments, toenail clippers, ear-loops, and multi-use pushers.",
      image: "/images/products/lancet_extractor.webp",
    },
  });

  const catScissors = await db.category.create({
    data: {
      name: "Precision Beauty Scissors",
      slug: "precision-beauty-scissors",
      description: "Exquisite hand-finished micro-bladed scissors for eyelash trimming and cuticle extraction.",
      image: "/images/products/curved_tweezers.webp",
    },
  });

  const catKits = await db.category.create({
    data: {
      name: "Professional Beauty Kits",
      slug: "professional-beauty-kits",
      description: "Hand-picked clinical sets organized inside protective brushed stainless cases for field technicians.",
      image: "/images/products/hero_tweezers.webp",
    },
  });

  console.log("Seeding complete catalog products...");

  const products = [
    // 1. Esthetician Pro Series
    {
      name: "Lancet Extractor Dual-End",
      slug: "lancet-extractor-dual-end",
      sku: "ORV-EST-LE135",
      modelNumber: "LE-135",
      material: "Surgical Stainless Steel AISI 316",
      finish: "Satin Electro-polished",
      length: "135 mm",
      width: "6 mm",
      tipSize: "0.1 mm Lancet / 1.2 mm Loop",
      weight: "14g",
      description: "Double-ended lancet extractor designed for micro-precision skin extractions. Features a laser-sharpened 0.1 mm surgical lancet and a micro-thin flat loop.",
      features: JSON.stringify(["Dual-ended tool", "knurled non-slip center shaft", "laser-sharp lancet edge", "100% autoclavable"]),
      applications: JSON.stringify(["Acne extractions", "comedone removal", "clinical dermatology", "facial skin clearing"]),
      imagesJson: JSON.stringify(["/images/products/lancet_extractor.webp"]),
      specJson: JSON.stringify({ 
        "Autoclavable": "Yes", 
        "Tension": "Rigid", 
        "Grip": "Knurled Hex",
        "Care Instructions": "Autoclave up to 134°C. Clean with distilled water immediately after chemical use."
      }),
      categoryId: catEsthetician.id,
      featured: true,
    },
    {
      name: "Dome Cup Extractor",
      slug: "dome-cup-extractor",
      sku: "ORV-EST-CE125",
      modelNumber: "CE-125",
      material: "Surgical Stainless Steel AISI 410",
      finish: "Matte Anti-reflective",
      length: "125 mm",
      width: "5 mm",
      tipSize: "1.5 mm Cup / 2.0 mm Loop",
      weight: "12g",
      description: "Designed for localized acne treatment. Features dual dome-shaped extraction cups and precision center holes to minimize surrounding skin damage.",
      features: JSON.stringify(["Dome profile for uniform pressure", "glare-free matte finish", "double-ended", "smooth edges"]),
      applications: JSON.stringify(["Targeted blackhead extraction", "deep comedone treatment", "salon skincare"]),
      imagesJson: JSON.stringify(["/images/products/lancet_extractor.webp"]),
      specJson: JSON.stringify({ 
        "Cup Diameter": "1.5 mm", 
        "Autoclavable": "Yes",
        "Care Instructions": "Ultrasonic cleaning safe. Do not use chlorine-based disinfectants."
      }),
      categoryId: catEsthetician.id,
      featured: false,
    },
    {
      name: "Flat Loop Skin Extractor",
      slug: "flat-loop-skin-extractor",
      sku: "ORV-EST-FL125",
      modelNumber: "FL-125",
      material: "Surgical Stainless Steel AISI 316",
      finish: "Matte Anti-glare",
      length: "125 mm",
      width: "5.5 mm",
      tipSize: "0.6 mm flat wire",
      weight: "11g",
      description: "Features a wider flat loop profile to compress wider skin pores evenly, minimizing surface tissue red marks and pressure scarring.",
      features: JSON.stringify(["Flat pressing band", "ultra-light build", "anti-glare aesthetic finish", "hand-finished borders"]),
      applications: JSON.stringify(["General extraction", "sensitive skin pore compression", "facial skin care"]),
      imagesJson: JSON.stringify(["/images/products/lancet_extractor.webp"]),
      specJson: JSON.stringify({ 
        "Wire Profile": "Flat", 
        "Autoclavable": "Yes",
        "Care Instructions": "Dry thoroughly after sterilization. Store in protective sleeve."
      }),
      categoryId: catEsthetician.id,
      featured: false,
    },
    {
      name: "Wire Loop Extractor Classic",
      slug: "wire-loop-extractor-classic",
      sku: "ORV-EST-WL120",
      modelNumber: "WL-120",
      material: "Surgical Stainless Steel AISI 316",
      finish: "Satin Electro-polished",
      length: "120 mm",
      width: "4.5 mm",
      tipSize: "0.4 mm wire loop",
      weight: "10g",
      description: "Classical wire loop extractor with dual micro-wire loops with thin gauge steel for minimum footprint skin pressure.",
      features: JSON.stringify(["Double-ended loops", "fine-gauge wire", "knurled ergonomic shaft", "lightweight structure"]),
      applications: JSON.stringify(["Localized skin extraction", "blackhead clearing", "beauty salon skin prepping"]),
      imagesJson: JSON.stringify(["/images/products/lancet_extractor.webp"]),
      specJson: JSON.stringify({ 
        "Wire Gauge": "0.4 mm", 
        "Autoclavable": "Yes",
        "Care Instructions": "Clean immediately after use. Autoclavable up to 134°C."
      }),
      categoryId: catEsthetician.id,
      featured: false,
    },
    {
      name: "Comedone Curved Tweezer",
      slug: "comedone-curved-tweezer",
      sku: "ORV-EST-CT115",
      modelNumber: "CT-115",
      material: "AISI 316L Surgical Steel",
      finish: "Satin Electro-polished",
      length: "115 mm",
      width: "9 mm",
      tipSize: "0.2 mm Curved claw",
      weight: "16g",
      description: "Features a specialized curved claw tip to safely wrap around and extract stubborn comedones under microscope grids.",
      features: JSON.stringify(["90° curved claw tip", "micro-fitted alignment", "calibrated light squeeze tension"]),
      applications: JSON.stringify(["Microsurgery extractions", "detailed skincare treatments", "comedone removal"]),
      imagesJson: JSON.stringify(["/images/products/hero_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Claw Angle": "90 Degrees", 
        "Autoclavable": "Yes",
        "Care Instructions": "Store with rubber tip guard on. Autoclave compatible."
      }),
      categoryId: catEsthetician.id,
      featured: true,
    },

    // 2. Lash & Brow Precision
    {
      name: "Straight Lash Isolation Tweezer",
      slug: "straight-lash-isolation-tweezer",
      sku: "ORV-LSH-IT125",
      modelNumber: "IT-125",
      material: "Japanese Surgical Stainless Steel",
      finish: "Anti-static Matte Silver",
      length: "125 mm",
      width: "10 mm",
      tipSize: "0.1 mm straight tip",
      weight: "15g",
      description: "Straight micro-tip isolation tweezers engineered to isolate individual natural eyelashes cleanly with zero hand fatigue.",
      features: JSON.stringify(["Needle straight tips", "calibrated light tension", "anti-static coating", "lightweight"]),
      applications: JSON.stringify(["Lash isolation", "classic lash extension application", "detail hair handling"]),
      imagesJson: JSON.stringify(["/images/products/curved_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Tip Shape": "Straight", 
        "Tension": "Calibrated Light",
        "Care Instructions": "Avoid dropping. Do not let tips touch other instruments during sterilization."
      }),
      categoryId: catLashBrow.id,
      featured: true,
    },
    {
      name: "Volume Boot Lash Tweezer",
      slug: "volume-boot-lash-tweezer",
      sku: "ORV-LSH-VB118",
      modelNumber: "VB-118",
      material: "Premium Surgical AISI 316 Steel",
      finish: "Satin Electro-polished",
      length: "118 mm",
      width: "10 mm",
      tipSize: "0.12 mm Boot",
      weight: "16g",
      description: "L-shape 'boot' offers maximum surface contact to easily grasp multiple micro-lashes simultaneously for volume fans.",
      features: JSON.stringify(["L-shape boot tip", "10mm contact area", "hand-filed alignment", "high tension grip"]),
      applications: JSON.stringify(["Volume lash fan creation", "Russian volume application", "multi-lash pick-up"]),
      imagesJson: JSON.stringify(["/images/products/curved_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Tip Shape": "L-Boot", 
        "Contact Length": "10 mm",
        "Care Instructions": "Wipe tips with acetone to remove lash glue residue. Autoclave clean."
      }),
      categoryId: catLashBrow.id,
      featured: true,
    },
    {
      name: "45 Degree Volume Lash Tweezer",
      slug: "45-degree-volume-lash-tweezer",
      sku: "ORV-LSH-V45",
      modelNumber: "V-45",
      material: "Japanese Surgical Stainless Steel",
      finish: "Anti-static Matte Silver",
      length: "120 mm",
      width: "10 mm",
      tipSize: "0.1 mm 45° angle",
      weight: "15g",
      description: "Continuous 45-degree angle tip, calibrated under micro-grids to prevent lash slippage during placement.",
      features: JSON.stringify(["45-degree offset tip", "hand-honed edges", "light action spring", "matte finish"]),
      applications: JSON.stringify(["Volume lash picking", "placement, styling", "eyebrow hair tweezing"]),
      imagesJson: JSON.stringify(["/images/products/curved_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Angle": "45 Degrees", 
        "Autoclavable": "Yes",
        "Care Instructions": "Autoclave safe. Clean adhesive with organic solvent."
      }),
      categoryId: catLashBrow.id,
      featured: false,
    },
    {
      name: "90 Degree Volume Lash Tweezer",
      slug: "90-degree-volume-lash-tweezer",
      sku: "ORV-LSH-V90",
      modelNumber: "V-90",
      material: "Premium Surgical AISI 316 Steel",
      finish: "Mirror Polish Silver",
      length: "115 mm",
      width: "10 mm",
      tipSize: "0.15 mm 90° angle",
      weight: "14g",
      description: "90-degree boot tweezer optimized for picking up fan lashes from the strip with minimal finger strain.",
      features: JSON.stringify(["90-degree tip", "mirror polish finish", "micro-milled inner teeth", "firm alignment"]),
      applications: JSON.stringify(["Russian volume lash extensions", "mega volume fan pickup"]),
      imagesJson: JSON.stringify(["/images/products/curved_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Angle": "90 Degrees", 
        "Autoclavable": "Yes",
        "Care Instructions": "Clean with specialized tweezer cleaner. Handle with care."
      }),
      categoryId: catLashBrow.id,
      featured: false,
    },

    // 3. Advanced Nail Tech Implements
    {
      name: "Professional Cuticle Nipper 4mm",
      slug: "professional-cuticle-nipper-4mm",
      sku: "ORV-NAL-CN105",
      modelNumber: "CN-105",
      material: "Surgical AISI 420 Tempered Steel",
      finish: "Satin Electro-polished",
      length: "105 mm",
      width: "48 mm",
      tipSize: "4 mm Jaw",
      weight: "42g",
      description: "Featuring a high-performance double-spring mechanism and a hand-filed jaw. Specifically engineered for clean cuticle trimming.",
      features: JSON.stringify(["Double-spring action", "4mm jaw length", "hand-honed blade edges", "box-joint connection"]),
      applications: JSON.stringify(["Cuticle trimming", "manicure detailing", "pedicure skin cleaning"]),
      imagesJson: JSON.stringify(["/images/products/cuticle_nippers.webp"]),
      specJson: JSON.stringify({ 
        "Jaw Size": "4 mm", 
        "Joint": "Box Joint", 
        "Spring": "Double",
        "Care Instructions": "Oil joints weekly. Protect jaw with leather guard when not in use."
      }),
      categoryId: catNailTech.id,
      featured: true,
    },
    {
      name: "Ingrown Toenail Splitter",
      slug: "ingrown-toenail-splitter",
      sku: "ORV-NAL-NS130",
      modelNumber: "NS-130",
      material: "Surgical AISI 440C Tempered Carbon-Steel",
      finish: "Matte Sandblasted",
      length: "130 mm",
      width: "50 mm",
      tipSize: "15 mm straight jaw",
      weight: "68g",
      description: "Engineered with reinforced long jaws and a sharp straight tip to split thick or ingrown nails smoothly with clean margins.",
      features: JSON.stringify(["Extended straight cutting jaw", "heavy-duty handle", "safety locking latch", "carbon-steel alloy"]),
      applications: JSON.stringify(["Ingrown nail splitting", "podiatry care", "pedicure thick nail cutting"]),
      imagesJson: JSON.stringify(["/images/products/cuticle_nippers.webp"]),
      specJson: JSON.stringify({ 
        "Jaw Length": "15 mm", 
        "Lock": "Safety latch",
        "Care Instructions": "Dry immediately after washing to prevent carbon spot oxidation. Sterilize via autoclave."
      }),
      categoryId: catNailTech.id,
      featured: true,
    },
    {
      name: "Double-Ended Cuticle Pusher",
      slug: "double-ended-cuticle-pusher",
      sku: "ORV-NAL-CP135",
      modelNumber: "CP-135",
      material: "Surgical Stainless Steel AISI 304",
      finish: "Satin Finish",
      length: "135 mm",
      width: "6 mm",
      tipSize: "8.5 mm / 6.0 mm Spoon",
      weight: "18g",
      description: "Double-ended spoon-like pusher contoured to match the natural curve of the nail plate, with smooth rounded edges.",
      features: JSON.stringify(["Double-ended spoon and flat edge", "textured grip handle", "rounded safety borders"]),
      applications: JSON.stringify(["Cuticle pushing", "nail plate prepping", "gel extension scraping"]),
      imagesJson: JSON.stringify(["/images/products/cuticle_nippers.webp"]),
      specJson: JSON.stringify({ 
        "Spoon Widths": "8.5mm / 6.0mm", 
        "Autoclavable": "Yes",
        "Care Instructions": "Autoclave safe. Wash with nylon brush to remove skin residues."
      }),
      categoryId: catNailTech.id,
      featured: false,
    },

    // 4. Salon Extension Hardware
    {
      name: "Micro Ring Pulling Loop",
      slug: "micro-ring-pulling-loop",
      sku: "ORV-SAL-RL210",
      modelNumber: "RL-210",
      material: "Surgical Steel Wire & Hardened Alloy Handle",
      finish: "High-shine Electro-polished",
      length: "210 mm",
      width: "8 mm",
      tipSize: "0.3 mm Wire loop",
      weight: "22g",
      description: "Wire loop needle designed to slide micro-rings and beads onto natural hair sections smoothly without snagging.",
      features: JSON.stringify(["Fine flexible wire loop", "ergonomic hexagonal alloy handle", "anti-rust plating"]),
      applications: JSON.stringify(["Micro-ring hair extensions", "I-tip extensions", "bead thread insertion"]),
      imagesJson: JSON.stringify(["/images/products/extension_pliers.webp"]),
      specJson: JSON.stringify({ 
        "Wire Material": "Flexible Surgical Steel", 
        "Grip": "Hexagonal",
        "Care Instructions": "Wipe with disinfectant cloth. Do not bend the wire loop past 45°."
      }),
      categoryId: catSalonHardware.id,
      featured: false,
    },
    {
      name: "Extension Clamping Plier",
      slug: "extension-clamping-plier",
      sku: "ORV-SAL-EC140",
      modelNumber: "EC-140",
      material: "Surgical Stainless Steel AISI 410",
      finish: "Electrode-plated Mirror Silver",
      length: "140 mm",
      width: "52 mm",
      tipSize: "Triple grooved jaw",
      weight: "85g",
      description: "Professional pliers with ribbed inner jaws to securely close micro rings, copper tubes, and nano beads without damaging natural hair.",
      features: JSON.stringify(["Triple-groove inner jaw design", "spring-loaded return", "comfortable double-dipped grip"]),
      applications: JSON.stringify(["Clamping beads", "micro ring extensions", "nano ring applications"]),
      imagesJson: JSON.stringify(["/images/products/extension_pliers.webp"]),
      specJson: JSON.stringify({ 
        "Slots": "Triple Groove", 
        "Spring Loaded": "Yes",
        "Care Instructions": "Wipe joints with mineral oil monthly. Autoclavable safe."
      }),
      categoryId: catSalonHardware.id,
      featured: true,
    },
    {
      name: "Extension Removal Plier",
      slug: "extension-removal-plier",
      sku: "ORV-SAL-ER135",
      modelNumber: "ER-135",
      material: "Surgical Stainless Steel AISI 410",
      finish: "Satin Finish",
      length: "135 mm",
      width: "48 mm",
      tipSize: "Prong opener",
      weight: "78g",
      description: "Specifically shaped to reopen micro-rings, copper loops, or crack keratin bonds without cutting or tearing hair fiber.",
      features: JSON.stringify(["Reopening prong tip", "flat compression pad", "comfortable spring-back handle"]),
      applications: JSON.stringify(["Hair extension removal", "micro ring opening", "keratin bond cracking"]),
      imagesJson: JSON.stringify(["/images/products/extension_pliers.webp"]),
      specJson: JSON.stringify({ 
        "Function": "Removal/Reopening", 
        "Autoclavable": "Yes",
        "Care Instructions": "Autoclave safe. Clean thoroughly to remove tape or glue adhesive residues."
      }),
      categoryId: catSalonHardware.id,
      featured: false,
    },

    // 5. Cosmetic Mixing Tools
    {
      name: "Foundation Makeup Spatula",
      slug: "foundation-makeup-spatula",
      sku: "ORV-SPT-MS155",
      modelNumber: "MS-155",
      material: "Surgical Stainless Steel AISI 304",
      finish: "Mirror Polish Chrome",
      length: "155 mm",
      width: "12 mm",
      tipSize: "10 mm blade width",
      weight: "15g",
      description: "Designed for blending foundations, primers, and colors cleanly. Flat blade design prevents product absorption and ensures sterile application.",
      features: JSON.stringify(["Flat flexible blade", "rounded safety margins", "high mirror finish", "easy clean"]),
      applications: JSON.stringify(["Makeup mixing", "cream blending", "hygienic palette transfer"]),
      imagesJson: JSON.stringify(["/images/products/mixing_spatula.webp"]),
      specJson: JSON.stringify({ 
        "Blade Profile": "Flat Flexible", 
        "Finish": "Mirror",
        "Care Instructions": "Clean with soap and alcohol wipe after every use. Autoclavable."
      }),
      categoryId: catCosmeticMixing.id,
      featured: true,
    },
    {
      name: "Dual-Ended Compounding Spatula",
      slug: "dual-ended-compounding-spatula",
      sku: "ORV-SPT-MT160",
      modelNumber: "MT-160",
      material: "Surgical Stainless Steel AISI 304",
      finish: "High-shine Electro-polished",
      length: "160 mm",
      width: "8 mm",
      tipSize: "8 mm Spoon / 5 mm Blade",
      weight: "17g",
      description: "Double-ended mixing spatula. Flat paddle on one side and a pointed blade on the other, perfect for compounding cosmetic pigments.",
      features: JSON.stringify(["Double-ended scoop/paddle", "matte grip middle", "electro-polished tips"]),
      applications: JSON.stringify(["Pigment compounding", "cream mixing", "lab cosmetic creation"]),
      imagesJson: JSON.stringify(["/images/products/mixing_spatula.webp"]),
      specJson: JSON.stringify({ 
        "Ends": "Spoon & Blade", 
        "Autoclavable": "Yes",
        "Care Instructions": "Autoclave safe. Ultrasonic cleaning recommended."
      }),
      categoryId: catCosmeticMixing.id,
      featured: true,
    },
    {
      name: "Offset Micro-Pigment Spatula",
      slug: "offset-micro-pigment-spatula",
      sku: "ORV-SPT-PS175",
      modelNumber: "PS-175",
      material: "Surgical Steel Flexible Blade",
      finish: "Satin Finish",
      length: "175 mm",
      width: "14 mm",
      tipSize: "12 mm offset blade",
      weight: "20g",
      description: "Flexible offset blade designed to mix microblading or permanent makeup pigment pastes cleanly on ceramic or metal palettes.",
      features: JSON.stringify(["Offset cranked handle", "highly flexible steel blade", "secure grip"]),
      applications: JSON.stringify(["Pigment blending", "microblading paste preparation", "cosmetic mixing"]),
      imagesJson: JSON.stringify(["/images/products/mixing_spatula.webp"]),
      specJson: JSON.stringify({ 
        "Blade Type": "Offset Crank", 
        "Flexibility": "High",
        "Care Instructions": "Clean pigment paste immediately to avoid staining. Autoclave compatible."
      }),
      categoryId: catCosmeticMixing.id,
      featured: false,
    },

    // 6. Professional Grooming Instruments
    {
      name: "Precision Ear Loop Cleaner",
      slug: "precision-ear-loop-cleaner",
      sku: "ORV-GRM-EL120",
      modelNumber: "EL-120",
      material: "Surgical Stainless Steel AISI 316",
      finish: "Satin Electro-polished",
      length: "120 mm",
      width: "4 mm",
      tipSize: "3 mm loop",
      weight: "8g",
      description: "Precision ear loop cleaner engineered with rounded, non-abrasive loop edges to ensure maximum safety during clinical hygiene operations.",
      features: JSON.stringify(["Flexible round loop", "textured hex grip handle", "surgical steel composition"]),
      applications: JSON.stringify(["Ear hygiene", "clinical cleanup", "dermatology preparation"]),
      imagesJson: JSON.stringify(["/images/products/lancet_extractor.webp"]),
      specJson: JSON.stringify({ 
        "Loop Profile": "Rounded Wire", 
        "Autoclavable": "Yes",
        "Care Instructions": "Autoclave clean. Keep loop protected from heavy compression."
      }),
      categoryId: catGrooming.id,
      featured: false,
    },
    {
      name: "Heavy-Duty Toenail Clipper",
      slug: "heavy-duty-toenail-clipper",
      sku: "ORV-GRM-TC130",
      modelNumber: "TC-130",
      material: "Surgical AISI 420 Tempered Steel",
      finish: "Matte Sandblasted",
      length: "130 mm",
      width: "15 mm",
      tipSize: "12 mm curved jaw",
      weight: "72g",
      description: "Heavy-duty toenail clipper with compound lever action to cleanly cut through thick nails with minimal force.",
      features: JSON.stringify(["Compound lever force transmission", "curved blade alignment", "safety storage latch"]),
      applications: JSON.stringify(["Toenail clipping", "podiatry care", "grooming salons"]),
      imagesJson: JSON.stringify(["/images/products/cuticle_nippers.webp"]),
      specJson: JSON.stringify({ 
        "Lever Type": "Compound Action", 
        "Jaw": "Curved",
        "Care Instructions": "Keep center rivet clean and oiled. Dry after autoclave cycle."
      }),
      categoryId: catGrooming.id,
      featured: true,
    },

    // 7. Precision Beauty Scissors
    {
      name: "Curved Eyelash Scissors",
      slug: "curved-eyelash-scissors",
      sku: "ORV-SCI-CES90",
      modelNumber: "CES-90",
      material: "High-grade Surgical Carbon Steel",
      finish: "Satin Finish",
      length: "90 mm",
      width: "40 mm",
      tipSize: "Curved micro blades",
      weight: "18g",
      description: "Exquisite hand-finished curved micro-bladed scissors for eyelash tape, strip lashes, and patch trimming.",
      features: JSON.stringify(["Curved blade contour", "micro-sharp cutting edges", "large finger loops"]),
      applications: JSON.stringify(["Lash strip trimming", "medical tape cutting", "eyebrow grooming"]),
      imagesJson: JSON.stringify(["/images/products/curved_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Blade Type": "Curved Micro", 
        "Autoclavable": "Yes",
        "Care Instructions": "Wipe blades with alcohol cloth. Do not cut metal wires or hard plastics."
      }),
      categoryId: catScissors.id,
      featured: true,
    },
    {
      name: "Extra-Fine Cuticle Scissors",
      slug: "extra-fine-cuticle-scissors",
      sku: "ORV-SCI-ECS90",
      modelNumber: "ECS-90",
      material: "Surgical AISI 420 Tempered Steel",
      finish: "Mirror Polish",
      length: "90 mm",
      width: "42 mm",
      tipSize: "Needle curved tips",
      weight: "17g",
      description: "Features ultra-thin curved blades that taper to a needle point, allowing nail technicians to excise dead cuticles cleanly.",
      features: JSON.stringify(["Needle-point curved blades", "smooth friction joint", "hand-honed blade alignment"]),
      applications: JSON.stringify(["Cuticle trimming", "advanced manicure procedures", "dead skin removal"]),
      imagesJson: JSON.stringify(["/images/products/curved_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Tip Profile": "Needle Point", 
        "Blade": "Curved",
        "Care Instructions": "Autoclave safe. Protect blade tips with plastic case."
      }),
      categoryId: catScissors.id,
      featured: false,
    },

    // 8. Professional Beauty Kits
    {
      name: "Lash Artist Tweezer Kit 5-Pc",
      slug: "lash-artist-tweezer-kit-5-pc",
      sku: "ORV-KIT-LA05",
      modelNumber: "LA-05",
      material: "Japanese Surgical Steel (Instruments) / Stainless Case",
      finish: "Brushed Steel Case / Matte Tweezers",
      length: "160 mm case",
      width: "80 mm case",
      tipSize: "Various calibrated tips",
      weight: "180g (full kit)",
      description: "Professional selection of 5 lash extension tweezers: Straight Isolation, Volume Boot, 45-degree, 90-degree, and Classic Curved. Packaged in a custom brushed stainless steel display case.",
      features: JSON.stringify(["Complete tweezers kit", "protective custom case", "padded internal loops", "high-grade tools"]),
      applications: JSON.stringify(["Professional lash extension services", "salon training", "beauty gifts"]),
      imagesJson: JSON.stringify(["/images/products/hero_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Tools Count": "5 Tweezers", 
        "Case Material": "Brushed Stainless Steel",
        "Care Instructions": "Clean tweezers after every service. Case can be wiped with disinfectant."
      }),
      categoryId: catKits.id,
      featured: true,
    },
    {
      name: "Comedone Skin Extraction Kit 4-Pc",
      slug: "comedone-skin-extraction-kit-4-pc",
      sku: "ORV-KIT-SE04",
      modelNumber: "SE-04",
      material: "Surgical Stainless Steel AISI 316 / Stainless Case",
      finish: "Satin Instruments / Mirror Trim Case",
      length: "150 mm case",
      width: "60 mm case",
      tipSize: "Various loops & lancets",
      weight: "140g (full kit)",
      description: "Set of 4 essential dermatological skin extraction tools: Wire Loop, Dome Cup, Flat Loop, and Lancet Extractor. Organized inside a compact brushed stainless case.",
      features: JSON.stringify(["Complete extraction toolkit", "sterile metal case", "secure snap closure", "high-grade tools"]),
      applications: JSON.stringify(["Acne extractions", "comedone removal", "dermatology clinic use", "skincare"]),
      imagesJson: JSON.stringify(["/images/products/hero_tweezers.webp"]),
      specJson: JSON.stringify({ 
        "Tools Count": "4 Extractors", 
        "Case Type": "Brushed Snap Case",
        "Care Instructions": "Autoclave case and tools together. Dry fully to prevent moisture spotting."
      }),
      categoryId: catKits.id,
      featured: true,
    },
  ];

  for (const prod of products) {
    await db.product.create({
      data: prod,
    });
  }

  console.log(`Seeded ${products.length} products successfully into 8 categories!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
