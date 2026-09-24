import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { official23Products } from '@/lib/products';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skusToKeep = official23Products.map(p => p.sku);

    // Wrap catalog modifications in a transaction to prevent partial data corruption if an error occurs
    await prisma.$transaction(async (tx) => {
      // Remove any items not in the 23 items list
      await tx.product.deleteMany({
        where: {
          sku: { notIn: skusToKeep }
        }
      });

      for (const product of official23Products) {
        await tx.product.upsert({
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
    });

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Error resetting products:', error);
    return NextResponse.json({ error: 'Failed to reset products' }, { status: 500 });
  }
}
