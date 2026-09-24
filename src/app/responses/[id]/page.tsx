import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { QuotationEditor } from './quotation-editor';
import { Product } from '@prisma/client';

export default async function ResponseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await prisma.formResponse.findUnique({
    where: { id },
    include: {
      form: {
        include: { organization: true }
      },
      answers: {
        include: { field: true }
      }
    }
  });

  if (!response) {
    notFound();
  }

  // Find the product table answer
  const productAnswer = response.answers.find(a => a.field.type === 'PRODUCT_TABLE');
  let cart: Record<string, number> = {};
  let products: Product[] = [];
  
  if (productAnswer) {
    try {
      cart = JSON.parse(productAnswer.value);
      products = await prisma.product.findMany({
        where: { id: { in: Object.keys(cart) } }
      });
    } catch {
      // ignore parse error
    }
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

  // Server Action to update status
  async function updateStatus(newStatus: string) {
    'use server';
    const { isAdminAuthenticated } = await import('@/lib/auth');
    if (!(await isAdminAuthenticated())) {
      throw new Error('Unauthorized');
    }

    const allowedStatuses = ['New', 'Order Placed', 'Quoted', 'PI Issued', 'Approved', 'Payment Confirmed', 'Dispatched', 'Cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }

    await prisma.formResponse.update({
      where: { id },
      data: { status: newStatus }
    });
    revalidatePath(`/responses/${id}`);
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
          onUpdateStatus={updateStatus}
        />
      </div>
    </div>
  );
}
