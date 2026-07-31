const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runCrudTest() {
  console.log('--- STARTING REAL SUPABASE CRUD TEST ---');

  // 1. CREATE
  const testCategory = await prisma.category.create({
    data: {
      name: 'Test Category ' + Date.now(),
      slug: 'test-category-' + Date.now(),
      description: 'Temporary category for CRUD verification',
    },
  });
  console.log('✅ CREATE Category PASS:', testCategory.id);

  const testProduct = await prisma.product.create({
    data: {
      name: 'Test Instrument ' + Date.now(),
      slug: 'test-instrument-' + Date.now(),
      sku: 'TEST-SKU-' + Date.now(),
      description: 'Test instrument for Supabase DB verification',
      imagesJson: JSON.stringify(['/test.png']),
      categoryId: testCategory.id,
    },
  });
  console.log('✅ CREATE Product PASS:', testProduct.id);

  // 2. READ
  const readProduct = await prisma.product.findUnique({
    where: { id: testProduct.id },
    include: { category: true },
  });
  console.log('✅ READ Product PASS:', readProduct.name, 'Category:', readProduct.category.name);

  // 3. UPDATE
  const updatedProduct = await prisma.product.update({
    where: { id: testProduct.id },
    data: { name: readProduct.name + ' (Updated)' },
  });
  console.log('✅ UPDATE Product PASS:', updatedProduct.name);

  // 4. DELETE
  await prisma.product.delete({ where: { id: testProduct.id } });
  await prisma.category.delete({ where: { id: testCategory.id } });
  console.log('✅ DELETE Product & Category PASS');

  console.log('--- ALL SUPABASE CRUD TESTS PASSED 100% ---');
}

runCrudTest()
  .catch((e) => {
    console.error('CRUD Test Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
