import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultProducts } from '../../../../../prisma/seed';

export async function POST() {
  try {
    for (const product of defaultProducts) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          name: product.name,
          description: product.description,
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
