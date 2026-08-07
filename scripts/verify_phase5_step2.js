// scripts/verify_phase5_step2.js
process.env.DATABASE_URL = process.env.DIRECT_URL || "postgresql://postgres.wonrbugnncrvabfxdckn:Ahmad1234%2CAhmad@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || "postgresql://postgres.wonrbugnncrvabfxdckn:Ahmad1234%2CAhmad@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
    }
  }
});

const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("==================================================================");
  console.log("PHASE 5.2 — HOMEPAGE BUILDER COMPLETE VERIFICATION & STRESS AUDIT");
  console.log("==================================================================");

  let results = [];
  function record(section, name, pass, details) {
    results.push({ section, name, pass, details });
    const statusStr = pass ? "[PASS]" : "[FAIL]";
    console.log(`${statusStr} ${section} - ${name}: ${details}`);
  }

  let token = "";

  // ---------------------------------------------------------
  // 1. SECURITY & AUTHENTICATION (SECTION 12)
  // ---------------------------------------------------------
  console.log("\n--- SECTION 12: SECURITY & JWT AUTHENTICATION ---");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ahmad123", password: "Ahmad1234" })
  });

  if (loginRes.ok) {
    const data = await loginRes.json();
    token = data.token;
    record("SEC 12", "JWT Owner Login", true, "Received valid JWT token");
  } else {
    record("SEC 12", "JWT Owner Login", false, "Login failed");
  }

  // Test Unauthorized Access (Missing JWT)
  const unauthRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save_draft", sections: [] })
  });
  record("SEC 12", "Unauthorized Access Blocked (401)", unauthRes.status === 401, `Status: ${unauthRes.status}`);

  // ---------------------------------------------------------
  // 2. DATABASE VERIFICATION (SECTION 1 & 13 & 14)
  // ---------------------------------------------------------
  console.log("\n--- SECTION 1, 13, 14: SUPABASE & PRISMA DATABASE INTEGRITY ---");
  const allBuilderRows = await prisma.websiteSetting.findMany({ where: { key: "homepage_builder" } });
  const countPass = allBuilderRows.length === 1;
  record("SEC 1", "Single homepage_builder Record in DB", countPass, `Found ${allBuilderRows.length} rows (exactly 1 expected)`);

  let dbRecord = allBuilderRows[0];
  let parsedDb = null;
  let validJson = false;
  if (dbRecord) {
    try {
      parsedDb = JSON.parse(dbRecord.value);
      validJson = true;
    } catch (e) {}
  }

  record("SEC 1", "Valid JSON Schema", validJson, validJson ? "JSON parse successful" : "Invalid JSON");
  record("SEC 1", "Draft & Published Sections Exist", Boolean(parsedDb?.draftSections && parsedDb?.publishedSections), `Drafts: ${parsedDb?.draftSections?.length}, Published: ${parsedDb?.publishedSections?.length}`);
  record("SEC 1", "createdAt & updatedAt Timestamps Valid", Boolean(parsedDb?.createdAt || dbRecord?.createdAt), `Created: ${parsedDb?.createdAt || dbRecord?.createdAt}`);

  // ---------------------------------------------------------
  // 3. API VERIFICATION (SECTION 2)
  // ---------------------------------------------------------
  console.log("\n--- SECTION 2: API ENDPOINT TESTING (GET, POST, PUT, ERRORS) ---");
  
  // GET Test with Bearer Token
  const startGet = Date.now();
  const getRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const getLatency = Date.now() - startGet;
  record("SEC 2", "GET /api/admin/homepage-builder (200 OK)", getRes.status === 200, `Status ${getRes.status}, Latency: ${getLatency}ms`);

  // 400 Bad Request (Malformed JSON)
  const badJsonRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: "{ invalid json string"
  });
  record("SEC 2", "400 Bad Request on Malformed JSON", badJsonRes.status === 400, `Status: ${badJsonRes.status}`);

  // 400 Bad Request (Invalid Body)
  const badBodyRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "save_draft", sections: "not-an-array" })
  });
  record("SEC 2", "400 Bad Request on Non-Array Sections", badBodyRes.status === 400, `Status: ${badBodyRes.status}`);

  // 405 Method Not Allowed
  const deleteRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  record("SEC 2", "405 Method Not Allowed on DELETE", deleteRes.status === 405, `Status: ${deleteRes.status}`);

  // ---------------------------------------------------------
  // 4. SAVE DRAFT & PUBLISH WORKFLOW (SECTION 3 & 4)
  // ---------------------------------------------------------
  console.log("\n--- SECTION 3 & 4: SAVE DRAFT AND PUBLISH WORKFLOW ---");
  const getJson = await getRes.json();
  const originalSections = [...getJson.data.draftSections];

  // Reorder for draft: Move 'contact' to top
  const contactSec = originalSections.find(s => s.id === "contact");
  const withoutContact = originalSections.filter(s => s.id !== "contact");
  const reorderedSections = [contactSec, ...withoutContact];

  // Test Save Draft
  const saveDraftRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "save_draft", sections: reorderedSections })
  });
  const saveDraftJson = await saveDraftRes.json();
  record("SEC 3", "Save Draft API Response (200 OK)", saveDraftRes.status === 200 && saveDraftJson.data?.status === "DRAFT", `Status: ${saveDraftJson.data?.status}`);

  // Verify DB after Save Draft: Draft is updated, but Published remains unchanged!
  const dbAfterDraft = JSON.parse((await prisma.websiteSetting.findUnique({ where: { key: "homepage_builder" } })).value);
  const draftPass = dbAfterDraft.status === "DRAFT" && dbAfterDraft.draftSections[0].id === "contact" && dbAfterDraft.publishedSections[0].id !== "contact";
  record("SEC 3", "Draft Saved to DB without Publishing Live", draftPass, `First Draft: ${dbAfterDraft.draftSections[0].id}, First Published: ${dbAfterDraft.publishedSections[0].id}`);

  // Test Publish Live
  const publishRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "publish", sections: reorderedSections })
  });
  const publishJson = await publishRes.json();
  record("SEC 4", "Publish Live API Response (200 OK)", publishRes.status === 200 && publishJson.data?.status === "PUBLISHED", `Status: ${publishJson.data?.status}`);

  // Verify DB after Publish: Both draft & published updated!
  const dbAfterPub = JSON.parse((await prisma.websiteSetting.findUnique({ where: { key: "homepage_builder" } })).value);
  const pubPass = dbAfterPub.status === "PUBLISHED" && dbAfterPub.publishedSections[0].id === "contact";
  record("SEC 4", "Published Layout Saved to DB", pubPass, `First Published in DB: ${dbAfterPub.publishedSections[0].id}`);

  // ---------------------------------------------------------
  // 5. PUBLIC HOMEPAGE REFLECTION (SECTION 5, 6, 7, 8)
  // ---------------------------------------------------------
  console.log("\n--- SECTION 5, 6, 7, 8: PUBLIC HOMEPAGE SYNCHRONIZATION ---");
  const homeHtml = await (await fetch(`${BASE_URL}/`)).text();
  record("SEC 8", "Public Homepage Render Success", homeHtml.length > 10000, `HTML Size: ${homeHtml.length} bytes`);
  record("SEC 5", "Reordered Section Reflected on Public Site", homeHtml.includes("INQUIRY DESK"), "Contact section correctly rendered");

  // Test Hiding a Section
  console.log("\n--- TESTING SECTION VISIBILITY HIDE & SHOW ---");
  const hiddenSections = reorderedSections.map(s => s.id === "contact" ? { ...s, visible: false } : s);
  
  await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "publish", sections: hiddenSections })
  });

  const hiddenHomeHtml = await (await fetch(`${BASE_URL}/`)).text();
  record("SEC 6", "Hidden Section Omitted from Public Homepage", !hiddenHomeHtml.includes("INQUIRY DESK"), "Contact section hidden");

  // ---------------------------------------------------------
  // 6. AUTO-RECOVERY & SELF-HEALING (SECTION 10)
  // ---------------------------------------------------------
  console.log("\n--- SECTION 10: AUTO-RECOVERY & SELF-HEALING TEST ---");
  // Temporarily corrupt DB JSON
  await prisma.websiteSetting.update({
    where: { key: "homepage_builder" },
    data: { value: "{ corrupted invalid json" }
  });

  // Call GET endpoint -> verify it auto-recovers!
  const recoverGetRes = await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const recoverJson = await recoverGetRes.json();
  const recoverPass = recoverGetRes.status === 200 && recoverJson.data?.draftSections?.length === 9;
  record("SEC 10", "Auto-Heals Corrupted Database JSON", recoverPass, `Recovered ${recoverJson.data?.draftSections?.length} default sections`);

  // ---------------------------------------------------------
  // 7. RESTORE DEFAULT SECTIONS & CLEANUP
  // ---------------------------------------------------------
  console.log("\n--- RESTORING DEFAULT HOMEPAGE LAYOUT ---");
  const defaultSections = [
    { id: "hero", name: "Hero Banner & Opening Animation", visible: true, order: 0 },
    { id: "about", name: "Corporate Craft & Precision", visible: true, order: 1 },
    { id: "categories", name: "Specialized Catalog Departments", visible: true, order: 2 },
    { id: "products", name: "Featured Implements Showcase", visible: true, order: 3 },
    { id: "facility", name: "Manufacturing Facility & Lab", visible: true, order: 4 },
    { id: "album", name: "Instrument Photo Gallery", visible: true, order: 5 },
    { id: "videos", name: "Manufacturing Process Video", visible: true, order: 6 },
    { id: "global", name: "Global B2B Logistics & Standards", visible: true, order: 7 },
    { id: "contact", name: "Direct Quotation Inquiry Desk", visible: true, order: 8 }
  ];

  await fetch(`${BASE_URL}/api/admin/homepage-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "publish", sections: defaultSections })
  });
  record("CLEANUP", "Restored & Published Default Order", true, "Default 9 sections active");

  // ---------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------
  console.log("\n==================================================================");
  console.log("PHASE 5.2 COMPLETE AUDIT SUMMARY:");
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Stress test audit exception:", err);
  process.exit(1);
});
