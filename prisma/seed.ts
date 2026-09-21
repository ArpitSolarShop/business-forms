import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { official23Products } from '../src/lib/products';

async function main() {
  let org = await prisma.organization.findFirst({
    where: { name: 'Arpit Solar & Electricals' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Arpit Solar & Electricals'
      }
    });
  }

  const skusToKeep = official23Products.map(p => p.sku);

  // Remove any obsolete products not in the official 23 list
  await prisma.product.deleteMany({
    where: {
      sku: { notIn: skusToKeep }
    }
  });

  // Upsert all official 23 products
  for (const product of official23Products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
        unit: product.unit,
        gstPercent: product.gstPercent,
        baseRate: product.baseRate,
        inStock: product.inStock,
      },
      create: product,
    });
  }

  console.log(`Cleaned catalog to exactly ${official23Products.length} official products!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
