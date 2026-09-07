/**
 * Mint a Stripe Billing Portal session so the user can update payment details
 * or cancel. The customer id comes from the caller's own user doc, never from
 * the request — otherwise anyone could open anyone else's billing.
 */

const { db, stripe, json, verifyCaller, SITE_URL } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const caller = await verifyCaller(event);
  if (!caller) return json(401, { error: 'Sign in required' });

  try {
    const user = await db.collection('users').doc(caller.uid).get();
    const customerId = user.data()?.stripeCustomerId;
    if (!customerId) return json(404, { error: 'No billing account found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/`,
    });

    return json(200, { url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return json(500, { error: 'Could not open billing portal' });
  }
};
