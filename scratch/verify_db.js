const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB AUDIT & INTEGRITY CHECK ===");

  // 1. Users
  const users = await prisma.user.findMany();
  console.log(`Users count: ${users.length}`);
  users.forEach(u => console.log(`  - User: ${u.username}, Role: ${u.role}, 2FA: ${u.twoFactorEnabled}`));

  // 2. Categories & Products orphan check
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  console.log(`Categories count: ${categories.length}, Products count: ${products.length}`);
  const catIds = new Set(categories.map(c => c.id));
  const orphanProducts = products.filter(p => p.categoryId && !catIds.has(p.categoryId));
  console.log(`Orphan products: ${orphanProducts.length}`);
  if (orphanProducts.length > 0) {
    console.log("Orphan product names:", orphanProducts.map(p => p.name));
  }

  // Duplicate SKUs check
  const skus = products.map(p => p.sku);
  const dupSkus = skus.filter((item, index) => skus.indexOf(item) !== index);
  console.log(`Duplicate SKUs: ${dupSkus.length}`, dupSkus);

  // 3. WebsiteSettings
  const settings = await prisma.websiteSetting.findMany();
  console.log(`WebsiteSetting rows: ${settings.length}`);
  const keys = settings.map(s => s.key);
  const dupKeys = keys.filter((item, index) => keys.indexOf(item) !== index);
  console.log(`Duplicate keys in WebsiteSetting: ${dupKeys.length}`, dupKeys);

  const homepageBuilder = settings.find(s => s.key === "homepage_builder");
  console.log("homepage_builder key exists:", !!homepageBuilder);

  // 4. MediaAssets
  const media = await prisma.mediaAsset.findMany();
  console.log(`MediaAssets count: ${media.length}`);

  // 5. AuditLogs
  const auditLogs = await prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log(`AuditLogs recent count: ${auditLogs.length}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("DB Verification error:", err);
  process.exit(1);
});
