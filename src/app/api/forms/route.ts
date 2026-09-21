import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const forms = await prisma.form.findMany({
      include: {
        organization: true,
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, organizationName, fields } = body;

    if (!title || !organizationName) {
      return NextResponse.json({ error: 'Title and Organization are required' }, { status: 400 });
    }

    // Using a Prisma transaction to ensure the organization (if new), form, and fields are created together
    const form = await prisma.$transaction(async (tx) => {
      // Find or create organization
      let org = await tx.organization.findFirst({
        where: { name: organizationName }
      });

      if (!org) {
        org = await tx.organization.create({
          data: { name: organizationName }
        });
      }

      // Create form with nested fields
      const newForm = await tx.form.create({
        data: {
          title,
          description,
          organizationId: org.id,
          isPublished: true,
          fields: {
            create: fields.map((field: { type: string, label: string, placeholder?: string, required?: boolean, options?: string[] }, index: number) => ({
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              required: field.required || false,
              options: field.options ? JSON.stringify(field.options) : null,
              order: index,
            }))
          }
        },
        include: {
          fields: true
        }
      });

      return newForm;
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
