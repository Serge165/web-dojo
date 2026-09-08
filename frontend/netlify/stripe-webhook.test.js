/**
 * Self-check for the webhook's entitlement decisions.
 * Run: node netlify/stripe-webhook.test.js
 *
 * Not under src/, so CRA's jest never picks it up — it stubs firebase-admin
 * and stripe at the module loader, which jest's own mocking would fight.
 *
 * Deliberately one level above functions/: Netlify deploys every .js in that
 * directory as a function, and a name containing a dot fails the build.
 */

const assert = require('assert');
const Module = require('module');

// --- stubs -----------------------------------------------------------------

const writes = [];

const Timestamp = {
  fromMillis: (ms) => ({ _ms: ms, toDate: () => new Date(ms) }),
  now: () => ({ _ms: 0, toDate: () => new Date(0) }),
};

const docs = new Map();

function collection(name) {
  return {
    doc: (id) => ({
      set: async (data, opts) => {
        writes.push({ path: `${name}/${id}`, data, merge: opts?.merge });
        docs.set(`${name}/${id}`, { ...(docs.get(`${name}/${id}`) || {}), ...data });
      },
      get: async () => ({ data: () => docs.get(`${name}/${id}`) }),
    }),
  };
}

// Stubs the modular firebase-admin subpaths. An earlier version stubbed the
// namespaced `firebase-admin` root instead, which v14 no longer ships: that
// handed shared.js an API the real package does not have, so this file passed
// while every deployed function 502'd on `admin.apps.length`.
//
// getApps() returns empty so initializeApp actually runs and the credential
// path is exercised.
let initOptions = null;
let certArgs = null;

const appStub = {
  getApps: () => [],
  initializeApp: (options) => { initOptions = options; },
  cert: (serviceAccount) => { certArgs = serviceAccount; return { CERT: true }; },
};

const firestoreStub = { getFirestore: () => ({ collection }), Timestamp };

const authStub = { getAuth: () => ({ verifyIdToken: async () => ({ uid: 'u1' }) }) };

let nextEvent = null;
const stripeStub = () => ({
  webhooks: { constructEvent: () => nextEvent },
  subscriptions: { retrieve: async () => nextEvent.data.object },
});

const realLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'firebase-admin/app') return appStub;
  if (request === 'firebase-admin/firestore') return firestoreStub;
  if (request === 'firebase-admin/auth') return authStub;
  // Loud failure rather than a stub: the namespaced root resolves at require
  // time but every property off it is undefined on v14.
  if (request === 'firebase-admin') {
    throw new Error('firebase-admin v14 has no namespaced API; import the /app, /firestore and /auth subpaths');
  }
  if (request === 'stripe') return stripeStub;
  return realLoad.call(this, request, parent, isMain);
};

const { handler } = require('./functions/stripe-webhook');

// --- helpers ---------------------------------------------------------------

function subscription(status) {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    status,
    metadata: { userId: 'u1', plan: 'monthly' },
    items: { data: [{ price: { unit_amount: 5000, currency: 'usd' } }] },
    current_period_start: 1700000000,
    current_period_end: 1702592000,
    trial_end: 1700604800,
  };
}

async function fire(type, object) {
  writes.length = 0;
  nextEvent = { type, data: { object } };
  const result = await handler({
    httpMethod: 'POST',
    headers: { 'stripe-signature': 'stub' },
    body: '{}',
  });
  assert.strictEqual(result.statusCode, 200, `${type} returned ${result.statusCode}`);
  return writes;
}

function userWrite() {
  return writes.find((w) => w.path === 'users/u1').data;
}

// --- checks ----------------------------------------------------------------

async function main() {
  // Credentials must be built with credential.cert(). Passing the service
  // account fields as top-level initializeApp options leaves the app with no
  // credential at all, and every function 502s the moment it is deployed.
  assert.ok(certArgs, 'admin.credential.cert() must be used to build credentials');
  assert.deepStrictEqual(
    Object.keys(certArgs).sort(), ['clientEmail', 'privateKey', 'projectId'],
    'cert() needs exactly projectId, clientEmail and privateKey',
  );
  assert.deepStrictEqual(
    initOptions, { credential: { CERT: true } },
    'initializeApp must receive the cert() result as `credential`',
  );

  // The recorded entitlements must match the shared policy table, or a future
  // server-side check would grant what the UI withholds.
  await fire('customer.subscription.updated', subscription('trialing'));
  assert.deepStrictEqual(
    userWrite().features, { canPublish: false, canExport: true },
    'no-card trial: export yes, publish no',
  );

  await fire('customer.subscription.updated', subscription('active'));
  assert.deepStrictEqual(
    userWrite().features, { canPublish: true, canExport: true },
    'active must be entitled',
  );

  await fire('customer.subscription.updated', subscription('past_due'));
  assert.strictEqual(userWrite().features.canPublish, false, 'past_due must lose publish');

  // The billing portal reads stripeCustomerId off the user doc; nothing else
  // writes it, so losing this write silently breaks cancellation.
  assert.strictEqual(userWrite().stripeCustomerId, 'cus_1', 'customer id must persist');

  // Every subscription write must merge: customer.subscription.created often
  // arrives before checkout.session.completed, so the doc may not exist yet.
  const subWrite = writes.find((w) => w.path === 'stripe_subscriptions/sub_1');
  assert.strictEqual(subWrite.merge, true, 'subscription writes must merge');
  assert.strictEqual(subWrite.data.amount, 50, 'amount is dollars, not cents');
  assert.strictEqual(
    subWrite.data.currentPeriodEnd._ms, 1702592000 * 1000,
    'Stripe seconds must become Firestore millis',
  );

  // Stripe moved the subscription pointer on invoices; both shapes must work
  // or payment tracking silently no-ops on one API version.
  const legacy = await fire('invoice.payment_succeeded', { subscription: 'sub_1', total: 5000 });
  assert.ok(legacy.some((w) => w.path === 'stripe_subscriptions/sub_1'), 'legacy invoice shape');

  const modern = await fire('invoice.payment_succeeded', {
    parent: { subscription_details: { subscription: 'sub_1' } },
    total: 5000,
  });
  assert.ok(modern.some((w) => w.path === 'stripe_subscriptions/sub_1'), 'modern invoice shape');

  // An invoice with no subscription at all must not throw.
  await fire('invoice.payment_failed', { total: 0 });

  // A bad signature must never reach a handler.
  nextEvent = null;
  const bad = await handler({ httpMethod: 'POST', headers: {}, body: '{}' });
  assert.strictEqual(bad.statusCode, 400, 'missing signature must be rejected');

  console.log('stripe-webhook: all checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
