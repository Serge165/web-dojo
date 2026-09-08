/**
 * Stripe webhook handler: the only thing that grants or revokes paid access.
 *
 * Authenticated by Stripe's signature rather than a user token, so it must
 * never trust the request body before constructEvent() has verified it.
 */

const { Timestamp, db, stripe, json, tsFromStripe } = require('../shared');

// Shared with the browser so the recorded entitlements and the gating the UI
// applies cannot disagree.
const { policyFor } = require('../../src/lib/entitlementPolicy');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const signature = event.headers['stripe-signature'];
  if (!signature) return json(400, { error: 'Missing signature' });

  // The signature covers the exact bytes Stripe sent. Netlify base64-encodes
  // the body for some content types, and re-serializing the decoded string
  // would change those bytes and fail verification.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body || '', 'utf8');

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return json(400, { error: 'Invalid signature' });
  }

  console.log(`Received Stripe event: ${stripeEvent.type}`);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(stripeEvent.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(stripeEvent.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(stripeEvent.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }
    return json(200, { received: true });
  } catch (error) {
    // A 500 makes Stripe retry with backoff, which is what we want for a
    // transient Firestore failure.
    console.error(`Handler for ${stripeEvent.type} failed:`, error);
    return json(500, { error: 'Handler failed' });
  }
};

/** Stripe moved the subscription pointer on invoices; accept either shape. */
function invoiceSubscriptionId(invoice) {
  return invoice.subscription || invoice.parent?.subscription_details?.subscription || null;
}

async function writeSubscription(subscription, extra = {}) {
  const item = subscription.items?.data?.[0];
  await db.collection('stripe_subscriptions').doc(subscription.id).set({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    status: subscription.status,
    amount: item ? item.price.unit_amount / 100 : null,
    currency: item ? item.price.currency.toUpperCase() : null,
    currentPeriodStart: tsFromStripe(subscription.current_period_start),
    currentPeriodEnd: tsFromStripe(subscription.current_period_end),
    trialEnd: tsFromStripe(subscription.trial_end),
    ...extra,
    // Written on every sync so an out-of-order delivery cannot erase fields
    // an earlier event already set.
  }, { merge: true });
}

async function applyEntitlement(userId, subscription) {
  const { canPublish, canExport } = policyFor(subscription.status);
  await db.collection('users').doc(userId).set({
    subscriptionStatus: subscription.status,
    subscriptionProvider: 'stripe',
    subscriptionId: subscription.id,
    // The billing portal needs this and nothing else writes it.
    stripeCustomerId: subscription.customer,
    features: { canPublish, canExport },
  }, { merge: true });
}

async function handleCheckoutComplete(session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;
  if (!userId || !session.subscription) {
    console.warn('checkout.session.completed without userId or subscription');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await writeSubscription(subscription, {
    userId,
    plan,
    createdAt: Timestamp.now(),
  });
  await applyEntitlement(userId, subscription);

  console.log(`Checkout complete: user ${userId}, subscription ${subscription.id}`);
  await sendConfirmationEmail(userId, plan);
}

/**
 * customer.subscription.created can arrive before checkout.session.completed,
 * so this writes with merge rather than update — the document may not exist.
 */
async function syncSubscription(subscription) {
  const userId = subscription.metadata?.userId;
  await writeSubscription(subscription, userId ? { userId } : {});
  if (userId) await applyEntitlement(userId, subscription);
  console.log(`Subscription synced: ${subscription.id} → ${subscription.status}`);
}

async function handleSubscriptionCancelled(subscription) {
  const userId = subscription.metadata?.userId;
  await db.collection('stripe_subscriptions').doc(subscription.id).set({
    status: 'canceled',
    cancelledAt: Timestamp.now(),
  }, { merge: true });

  if (userId) {
    await db.collection('users').doc(userId).set({
      subscriptionStatus: 'canceled',
      features: { canPublish: false, canExport: false },
    }, { merge: true });
    console.log(`User ${userId} subscription cancelled`);
  }
}

async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  await db.collection('stripe_subscriptions').doc(subscriptionId).set({
    lastPaymentDate: Timestamp.now(),
    lastPaymentAmount: invoice.total / 100,
  }, { merge: true });
  console.log(`Payment succeeded for subscription: ${subscriptionId}`);
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  await db.collection('stripe_subscriptions').doc(subscriptionId).set({
    lastFailedPaymentDate: Timestamp.now(),
    lastFailedPaymentReason: invoice.last_finalization_error?.message || 'Payment declined',
  }, { merge: true });

  // Stripe keeps the subscription past_due and retries on its own dunning
  // schedule; access is revoked by the resulting subscription.updated event,
  // not here.
  const doc = await db.collection('stripe_subscriptions').doc(subscriptionId).get();
  const userId = doc.data()?.userId;
  console.error(`Payment failed for subscription: ${subscriptionId}`);
  if (userId) await sendPaymentFailedEmail(userId);
}

/**
 * Email is best-effort: a send failure must not fail the webhook, or Stripe
 * retries an event whose Firestore writes already succeeded. No-ops when
 * SendGrid is not configured.
 */
async function sendEmail(userId, subject, html) {
  if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) return;
  try {
    const user = await db.collection('users').doc(userId).get();
    const email = user.data()?.email;
    if (!email) return;

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({ to: email, from: process.env.FROM_EMAIL, subject, html });
    console.log(`Sent "${subject}" to ${email}`);
  } catch (error) {
    console.error('Email error:', error.message);
  }
}

function sendConfirmationEmail(userId, plan) {
  const planName = plan === 'yearly' ? 'Annual ($500/year)' : 'Monthly ($50/month)';
  return sendEmail(userId, 'Welcome to Web Dojo Pro!', `
    <h2>Welcome to Web Dojo Pro</h2>
    <p>Your 7-day free trial has started. No card is on file — add a payment
    method before the trial ends to keep your account.</p>
    <p><strong>Plan:</strong> ${planName}</p>
    <p><a href="https://dojo-web.netlify.app/">Return to Web Dojo</a></p>
  `);
}

function sendPaymentFailedEmail(userId) {
  return sendEmail(userId, 'Payment failed - Web Dojo subscription', `
    <h2>Payment failed</h2>
    <p>We couldn't process your subscription payment. Please update your
    payment method to avoid losing access.</p>
    <p><a href="https://dojo-web.netlify.app/">Update payment method</a></p>
  `);
}
