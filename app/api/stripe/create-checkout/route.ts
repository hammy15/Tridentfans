import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, priceId, successUrl, cancelUrl } = await request.json();

    if (!userId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user profile from Supabase
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a Stripe customer ID
    let customerId = userProfile.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userProfile.email,
        name: userProfile.display_name || userProfile.username,
        metadata: {
          userId: userId,
          username: userProfile.username,
        },
      });

      customerId = customer.id;

      // Update user profile with Stripe customer ID
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      metadata: {
        userId: userId,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Handle Stripe webhooks for subscription events
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulPayment(session);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleSuccessfulPayment(invoice);
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleSuccessfulPayment(
  sessionOrInvoice: Stripe.Checkout.Session | Stripe.Invoice
) {
  try {
    const userId = sessionOrInvoice.metadata?.userId;
    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    // Get subscription details
    let subscription: Stripe.Subscription;
    
    if ('subscription' in sessionOrInvoice) {
      // From checkout session
      subscription = await stripe.subscriptions.retrieve(
        sessionOrInvoice.subscription as string
      );
    } else {
      // From invoice
      subscription = await stripe.subscriptions.retrieve(
        sessionOrInvoice.subscription as string
      );
    }

    // Create or update premium subscription record
    await supabase
      .from('premium_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan_type: 'premium',
        price_cents: subscription.items.data[0]?.price?.unit_amount || 499,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    console.log(`Premium subscription activated for user ${userId}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Update subscription record
    await supabase
      .from('premium_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);

  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}