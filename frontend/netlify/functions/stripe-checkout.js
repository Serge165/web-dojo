/**
 * Create a Stripe Checkout session for a Web Dojo subscription.
 * Called by the frontend when the user picks a plan.
 */

const { db, stripe, json, verifyCaller, SITE_URL, PRICE_IDS, TRIAL_DAYS } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const caller = await verifyCaller(event);
  if (!caller) return json(401, { error: 'Sign in required' });

  let plan;
  try {
    ({ plan } = JSON.parse(event.body || '{}'));
  } catch {
    return json(400, { error: 'Malformed request body' });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) return json(400, { error: "plan must be 'monthly' or 'yearly'" });

  try {
    // Nothing else records the user's identity, and the webhook's receipt
    // emails look up the address here. Taken from the verified token, not the
    // request body.
    await db.collection('users').doc(caller.uid).set({
      email: caller.email || null,
      displayName: caller.name || null,
    }, { merge: true });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: caller.email,
      line_items: [{ price: priceId, quantity: 1 }],
      // The SPA serves a single route at `/`; deep paths would render blank.
      success_url: `${SITE_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/?checkout=cancelled`,
      // No card before the trial. Stripe skips payment collection entirely
      // when the first charge is deferred, so the user reaches the editor
      // without entering card details.
      payment_method_collection: 'if_required',
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        trial_settings: {
          // With no card on file there is nothing to charge on day 8. Cancel
          // rather than 'create_invoice', which would issue a real unpaid
          // invoice and start dunning someone who never agreed to pay.
          end_behavior: { missing_payment_method: 'cancel' },
        },
        // Copied onto the subscription itself so the customer.subscription.*
        // webhooks can identify the user; session metadata does not propagate.
        metadata: { userId: caller.uid, plan },
      },
      metadata: { userId: caller.uid, plan },
    });

    console.log(`Checkout session created for ${caller.uid}: ${session.id}`);
    return json(200, { sessionId: session.id, redirectUrl: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return json(500, { error: 'Could not start checkout' });
  }
};
