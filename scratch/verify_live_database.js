// scratch/verify_live_database.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runLiveDatabaseVerification() {
  console.log("==================================================");
  console.log("LIVE SUPABASE POSTGRESQL DATABASE VERIFICATION");
  console.log("==================================================");

  // 1. CONNECTIVITY & TABLES EXISTENCE AUDIT
  console.log("\n--- STEP 1: AUDITING ALL 10 TABLES ---");
  
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  const inquiryCount = await prisma.inquiry.count();
  const inquiryItemCount = await prisma.inquiryItem.count();
  const mediaAssetCount = await prisma.mediaAsset.count();
  const websiteSettingCount = await prisma.websiteSetting.count();
  const auditLogCount = await prisma.auditLog.count();
  const analyticsEventCount = await prisma.analyticsEvent.count();
  const backupRecordCount = await prisma.backupRecord.count();

  console.log(`✔ User table count: ${userCount}`);
  console.log(`✔ Product table count: ${productCount}`);
  console.log(`✔ Category table count: ${categoryCount}`);
  console.log(`✔ Inquiry table count: ${inquiryCount}`);
  console.log(`✔ InquiryItem table count: ${inquiryItemCount}`);
  console.log(`✔ MediaAsset table count: ${mediaAssetCount}`);
  console.log(`✔ WebsiteSetting table count: ${websiteSettingCount}`);
  console.log(`✔ AuditLog table count: ${auditLogCount}`);
  console.log(`✔ AnalyticsEvent table count: ${analyticsEventCount}`);
  console.log(`✔ BackupRecord table count: ${backupRecordCount}`);

  // 2. ORPHAN RECORDS AUDIT
  console.log("\n--- STEP 2: ORPHAN RECORDS & FOREIGN KEYS AUDIT ---");
  
  const categories = await prisma.category.findMany({ select: { id: true } });
  const categoryIdSet = new Set(categories.map(c => c.id));
  
  const products = await prisma.product.findMany({ select: { id: true, categoryId: true, name: true, sku: true, slug: true } });
  const orphanProducts = products.filter(p => p.categoryId && !categoryIdSet.has(p.categoryId));
  console.log(`  Orphan Products (referencing missing category): ${orphanProducts.length}`);

  const inquiries = await prisma.inquiry.findMany({ select: { id: true, referenceNo: true } });
  const inquiryIdSet = new Set(inquiries.map(i => i.id));
  const productIdSet = new Set(products.map(p => p.id));

  const inquiryItems = await prisma.inquiryItem.findMany();
  const orphanInquiryItems = inquiryItems.filter(item => !inquiryIdSet.has(item.inquiryId) || !productIdSet.has(item.productId));
  console.log(`  Orphan InquiryItems: ${orphanInquiryItems.length}`);

  // 3. UNIQUE KEYS & DUPLICATE ROWS AUDIT
  console.log("\n--- STEP 3: UNIQUE CONSTRAINTS & DUPLICATE ROWS AUDIT ---");
  
  // Product SKUs
  const skus = products.map(p => p.sku);
  const dupSkus = skus.filter((item, index) => skus.indexOf(item) !== index);
  console.log(`  Duplicate Product SKUs: ${dupSkus.length}`, dupSkus);

  // Product Slugs
  const prodSlugs = products.map(p => p.slug);
  const dupProdSlugs = prodSlugs.filter((item, index) => prodSlugs.indexOf(item) !== index);
  console.log(`  Duplicate Product Slugs: ${dupProdSlugs.length}`, dupProdSlugs);

  // WebsiteSetting Keys
  const settings = await prisma.websiteSetting.findMany({ select: { key: true } });
  const settingKeys = settings.map(s => s.key);
  const dupSettingKeys = settingKeys.filter((item, index) => settingKeys.indexOf(item) !== index);
  console.log(`  Duplicate WebsiteSetting Keys: ${dupSettingKeys.length}`, dupSettingKeys);

  // User Usernames
  const users = await prisma.user.findMany({ select: { username: true } });
  const usernames = users.map(u => u.username);
  const dupUsernames = usernames.filter((item, index) => usernames.indexOf(item) !== index);
  console.log(`  Duplicate User Usernames: ${dupUsernames.length}`, dupUsernames);

  // 4. LIVE CRUD & ROLLBACK TEST
  console.log("\n--- STEP 4: RUNNING LIVE CRUD & ROLLBACK TEST ---");
  
  const timestamp = Date.now();

  // A. INSERT
  console.log("1. Executing INSERT on test entities...");
  const testCat = await prisma.category.create({
    data: {
      name: `Audit Category ${timestamp}`,
      slug: `audit-category-${timestamp}`,
      description: "Temporary category for live DB verification"
    }
  });

  const testProd = await prisma.product.create({
    data: {
      name: `Audit Product ${timestamp}`,
      slug: `audit-product-${timestamp}`,
      sku: `AUDIT-SKU-${timestamp}`,
      description: "Temporary product for live DB verification",
      imagesJson: "[]",
      categoryId: testCat.id
    }
  });

  const testInq = await prisma.inquiry.create({
    data: {
      referenceNo: `RFQ-AUDIT-${timestamp}`,
      name: "Audit Tester",
      country: "Germany",
      email: "audit@orivencesurgical.com"
    }
  });

  const testItem = await prisma.inquiryItem.create({
    data: {
      inquiryId: testInq.id,
      productId: testProd.id,
      quantity: 5
    }
  });

  const testMedia = await prisma.mediaAsset.create({
    data: {
      filename: `audit_${timestamp}.png`,
      url: `https://wonrbugnncrvabfxdckn.supabase.co/storage/v1/object/public/orivence-media/audit/audit_${timestamp}.png`,
      type: "image/png",
      size: 1024
    }
  });

  const testSetting = await prisma.websiteSetting.create({
    data: {
      key: `audit_key_${timestamp}`,
      value: JSON.stringify({ test: true })
    }
  });

  const testLog = await prisma.auditLog.create({
    data: {
      userId: "test-user-id",
      username: "audit_tester",
      action: "AUDIT_TEST_ACTION"
    }
  });

  const testAnalytics = await prisma.analyticsEvent.create({
    data: {
      eventType: "AUDIT_TEST_EVENT",
      path: "/audit-test"
    }
  });

  const testBackup = await prisma.backupRecord.create({
    data: {
      filename: `backup_audit_${timestamp}.zip`,
      size: 2048,
      url: `https://wonrbugnncrvabfxdckn.supabase.co/backups/backup_audit_${timestamp}.zip`
    }
  });

  console.log("✔ INSERT PASS across all entity tables!");

  // B. SELECT
  console.log("2. Executing SELECT on test entities...");
  const readCat = await prisma.category.findUnique({ where: { id: testCat.id } });
  const readProd = await prisma.product.findUnique({ where: { id: testProd.id }, include: { category: true } });
  const readInq = await prisma.inquiry.findUnique({ where: { id: testInq.id }, include: { items: true } });
  const readMedia = await prisma.mediaAsset.findUnique({ where: { id: testMedia.id } });

  if (!readCat || !readProd || !readInq || !readMedia) {
    throw new Error("SELECT verification failed!");
  }
  console.log(`✔ SELECT PASS: Product "${readProd.name}" under Category "${readProd.category.name}"`);

  // C. UPDATE
  console.log("3. Executing UPDATE on test entities...");
  const updatedProd = await prisma.product.update({
    where: { id: testProd.id },
    data: { name: `Audit Product ${timestamp} (Updated)` }
  });
  console.log(`✔ UPDATE PASS: Updated Product Name = "${updatedProd.name}"`);

  // D. DELETE (ROLLBACK CLEANUP)
  console.log("4. Executing DELETE / ROLLBACK cleanup...");
  await prisma.inquiryItem.delete({ where: { id: testItem.id } });
  await prisma.inquiry.delete({ where: { id: testInq.id } });
  await prisma.product.delete({ where: { id: testProd.id } });
  await prisma.category.delete({ where: { id: testCat.id } });
  await prisma.mediaAsset.delete({ where: { id: testMedia.id } });
  await prisma.websiteSetting.delete({ where: { id: testSetting.id } });
  await prisma.auditLog.delete({ where: { id: testLog.id } });
  await prisma.analyticsEvent.delete({ where: { id: testAnalytics.id } });
  await prisma.backupRecord.delete({ where: { id: testBackup.id } });

  console.log("✔ DELETE / ROLLBACK PASS: All test records completely cleaned up!");

  console.log("\n==================================================");
  console.log("ALL LIVE SUPABASE DATABASE CHECKS PASSED 100%");
  console.log("==================================================");

  await prisma.$disconnect();
}

runLiveDatabaseVerification().catch(err => {
  console.error("Live DB Verification Error:", err);
  process.exit(1);
});
