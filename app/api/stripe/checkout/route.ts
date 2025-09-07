import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return new NextResponse('Invoice ID is required', { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    if (invoice.status === 'PAID') {
        return new NextResponse('Invoice has already been paid', { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd', // You might want to make this dynamic
            product_data: {
              name: `Invoice #${invoice.invoiceNumber}`,
              description: `Payment for services rendered`,
            },
            unit_amount: Math.round(invoice.totalAmount.toNumber() * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      customer_email: invoice.client.email,
      metadata: {
        invoiceId: invoice.id,
      },
      success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/client/billing`, // Assuming this is the client's billing page
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session');
    }

    // Update invoice status to PROCESSING
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PROCESSING' },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
