/**
 * The gating policy, and the only copy of it.
 *
 * Read by the browser (src/lib/entitlements.js) and by the Stripe webhook
 * (netlify/functions/stripe-webhook.js), so the access the UI hides and the
 * access recorded in Firestore cannot drift apart. Written in CommonJS
 * because the Netlify functions are CJS; webpack imports it either way.
 *
 * Client gating is an affordance, not a defence — it lives in a React bundle
 * anyone can edit. Server-side checks belong on the `features` map this
 * produces.
 */

/**
 * Inspector tabs withheld below a paid subscription — 4 of the 17, chosen as
 * the advanced ones so core styling (color, type, spacing, layout) stays
 * whole. A half-working control reads as a bug; a clearly locked tab reads as
 * an upsell.
 */
const LOCKED_TABS = ['variants', 'anim', 'theme', 'cdn'];

const POLICY = {
  // Signed out, or signed in with no subscription. This is the free tier.
  none:     { canPublish: false, canExport: false, lockedTabs: LOCKED_TABS },
  // The 7-day trial. No card is collected to start it, so a trial user is a
  // non-paying user and is gated accordingly; export stays open so they can
  // still get their work out and see what the product does.
  trialing: { canPublish: false, canExport: true,  lockedTabs: LOCKED_TABS },
  active:   { canPublish: true,  canExport: true,  lockedTabs: [] },
  // Stripe is still retrying the card; keep their work reachable, withhold
  // publishing until it clears.
  past_due: { canPublish: false, canExport: true,  lockedTabs: LOCKED_TABS },
  canceled: { canPublish: false, canExport: false, lockedTabs: LOCKED_TABS },
};

/** Unknown statuses fall back to the free tier rather than granting access. */
function policyFor(status) {
  return POLICY[status] || POLICY.none;
}

module.exports = { LOCKED_TABS, POLICY, policyFor };
