import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { QuotationEditor } from './quotation-editor';

export default async function ResponseDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const response = await prisma.formResponse.findUnique({
    where: { id: resolvedParams.id },
    include: {
      form: { include: { organization: true } },
      answers: { include: { field: true } }
    }
  });

  if (!response) {
    notFound();
  }

  // Find the product table answer
  const productAnswer = response.answers.find(a => a.field.type === 'PRODUCT_TABLE');
  let cart: Record<string, number> = {};
  let products: any[] = [];
  
  if (productAnswer) {
    try {
      cart = JSON.parse(productAnswer.value);
      products = await prisma.product.findMany({
        where: { id: { in: Object.keys(cart) } }
      });
    } catch(e) {}
  }

  const initialItems = products.map(product => {
    const qty = cart[product.id] || 0;
    const isQuoteOnRequest = product.baseRate <= 1;
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      gstPercent: product.gstPercent,
      baseRate: product.baseRate,
      qty,
      isQuoteOnRequest
    };
  });

  const customAnswers = response.answers
    .filter(a => a.field.type !== 'PRODUCT_TABLE')
    .map(a => ({
      label: a.field.label,
      value: a.value
    }));

  // Server Actions to update status
  async function markAsQuoted() {
    'use server';
    await prisma.formResponse.update({
      where: { id: resolvedParams.id },
      data: { status: 'Quoted' }
    });
    revalidatePath(`/responses/${resolvedParams.id}`);
    revalidatePath('/');
  }

  async function markAsApproved() {
    'use server';
    await prisma.formResponse.update({
      where: { id: resolvedParams.id },
      data: { status: 'Approved' }
    });
    revalidatePath(`/responses/${resolvedParams.id}`);
    revalidatePath('/');
  }

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto">
        <QuotationEditor 
          responseId={response.id}
          rfqNumber={response.rfqNumber}
          status={response.status}
          createdAt={response.createdAt.toISOString()}
          orgName={response.form.organization.name}
          respondent={response.respondent || 'Direct Commercial Buyer'}
          formTitle={response.form.title}
          customAnswers={customAnswers}
          initialItems={initialItems}
          onMarkQuoted={markAsQuoted}
          onMarkApproved={markAsApproved}
        />
      </div>
    </div>
  );
}
