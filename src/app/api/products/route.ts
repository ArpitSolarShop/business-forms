import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, sku, category, unit, gstPercent, baseRate, inStock } = body;

    if (!name || !sku || !category || !unit) {
      return NextResponse.json({ error: 'Name, SKU, category, and unit are required.' }, { status: 400 });
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() }
    });

    if (existing) {
      return NextResponse.json({ error: `Product with SKU "${sku}" already exists.` }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        unit: unit.trim(),
        gstPercent: parseFloat(gstPercent) || 18,
        baseRate: parseFloat(baseRate) || 1,
        inStock: inStock !== undefined ? Boolean(inStock) : true,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
