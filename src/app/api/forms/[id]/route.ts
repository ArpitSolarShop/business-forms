import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const form = await prisma.form.findUnique({
      where: { id: resolvedParams.id },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        organization: true
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const hasProductTable = form.fields.some(f => f.type === 'PRODUCT_TABLE');
    let products: any[] = [];
    if (hasProductTable) {
      // Fetch available products from the database
      products = await prisma.product.findMany({
        where: { inStock: true }
      });
    }

    return NextResponse.json({ ...form, products });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}
