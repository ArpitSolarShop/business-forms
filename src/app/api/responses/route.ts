import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formId, respondent, answers } = body;

    if (!formId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    // 1. Verify the form exists to prevent foreign key constraint failures
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // 2. Generate a highly unique PI Number using crypto
    const uniqueHash = crypto.randomUUID().split('-')[0].toUpperCase() + crypto.randomUUID().split('-')[1].toUpperCase();
    const piNumber = `PI-${new Date().getFullYear()}-${uniqueHash}`;
    // Use transaction to ensure response and all fields are saved
    const response = await prisma.$transaction(async (tx) => {
      const newResponse = await tx.formResponse.create({
        data: {
          rfqNumber: piNumber,
          formId,
          respondent,
          status: 'Order Placed',
          answers: {
            create: answers.map((ans: { fieldId: string; value: string | number }) => ({
              fieldId: ans.fieldId,
              value: String(ans.value),
            }))
          }
        },
        include: {
          answers: true
        }
      });

      return newResponse;
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
