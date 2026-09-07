/**
 * Report the caller's own subscription state to the frontend.
 * Read-only; the webhook is the sole writer.
 */

const { db, json, verifyCaller } = require('./_shared');

const NO_SUBSCRIPTION = {
  hasSubscription: false,
  status: 'none',
  features: { canPublish: false, canExport: false, canCollaborate: false },
};

exports.handler = async (event) => {
  const caller = await verifyCaller(event);
  if (!caller) return json(401, { error: 'Sign in required' });

  try {
    const user = await db.collection('users').doc(caller.uid).get();
    const data = user.data();
    if (!data?.subscriptionId) return json(200, NO_SUBSCRIPTION);

    const sub = await db.collection('stripe_subscriptions').doc(data.subscriptionId).get();
    const subData = sub.data() || {};

    return json(200, {
      hasSubscription: true,
      status: data.subscriptionStatus || subData.status || 'unknown',
      plan: subData.plan || null,
      amount: subData.amount ?? null,
      currentPeriodEnd: subData.currentPeriodEnd?.toDate?.().toISOString() || null,
      trialEnd: subData.trialEnd?.toDate?.().toISOString() || null,
      features: data.features || NO_SUBSCRIPTION.features,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return json(500, { error: 'Could not read subscription status' });
  }
};
