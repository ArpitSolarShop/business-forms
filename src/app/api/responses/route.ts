import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formId, respondent, answers } = body;

    if (!formId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    // Use transaction to ensure response and all fields are saved
    const response = await prisma.$transaction(async (tx) => {
      const newResponse = await tx.formResponse.create({
        data: {
          formId,
          respondent,
          answers: {
            create: answers.map((ans: any) => ({
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
