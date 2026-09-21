import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { official23Products } from '../../../../../prisma/seed';

export async function POST() {
  try {
    const skusToKeep = official23Products.map(p => p.sku);

    // Remove any items not in the 23 items list
    await prisma.product.deleteMany({
      where: {
        sku: { notIn: skusToKeep }
      }
    });

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

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Error resetting products:', error);
    return NextResponse.json({ error: 'Failed to reset products' }, { status: 500 });
  }
}
