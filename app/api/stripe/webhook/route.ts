import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error constructing event";
    console.error(`❌ Error verifying webhook signature: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case 'checkout.session.completed':
      if (!session?.metadata?.invoiceId) {
        console.error('Webhook received without invoiceId in metadata');
        return new NextResponse('Error: Missing invoiceId in metadata', { status: 400 });
      }

      try {
        const invoiceId = session.metadata.invoiceId;
        
        // Find the invoice and update it
        const updatedInvoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAID',
            paidDate: new Date(),
            externalPaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          },
        });

        console.log(`✅ Invoice ${updatedInvoice.invoiceNumber} marked as PAID.`);

        // TODO: Optionally, create an activity feed item or notification here

      } catch (error) {
        console.error('Error updating invoice status:', error);
        // The webhook will be retried by Stripe if it doesn't receive a 200 response
        return new NextResponse('Error updating database', { status: 500 });
      }
      break;

    case 'checkout.session.async_payment_failed':
        // Handle failed payments if necessary
        console.log('Async payment failed for session:', session.id);
        // You might want to update the invoice status back to SENT or DRAFT
        break;

    default:
      console.warn(`Unhandled event type ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
