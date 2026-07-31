const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Supabase PostgreSQL database...');

  const passwordHash = await bcrypt.hash('Ahmad1234', 10);

  const owner = await prisma.user.upsert({
    where: { username: 'ahmad123' },
    update: {
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    },
    create: {
      username: 'ahmad123',
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('Master Owner Seeded successfully:', owner.username, 'Role:', owner.role);

  // Check counts across key models
  const userCount = await prisma.user.count();
  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log(`Database counts -> Users: ${userCount}, Categories: ${categoryCount}, Products: ${productCount}`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
