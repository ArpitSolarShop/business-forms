import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.sku !== undefined) updateData.sku = body.sku.trim().toUpperCase();
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.unit !== undefined) updateData.unit = body.unit.trim();
    if (body.gstPercent !== undefined) updateData.gstPercent = parseFloat(body.gstPercent);
    if (body.baseRate !== undefined) updateData.baseRate = parseFloat(body.baseRate);
    if (body.inStock !== undefined) updateData.inStock = Boolean(body.inStock);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
