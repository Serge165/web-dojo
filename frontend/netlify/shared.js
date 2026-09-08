/**
 * Shared setup for the Stripe subscription functions.
 *
 * Lives above functions/ on purpose: Netlify publishes every file in that
 * directory as its own endpoint, and this one has no handler to serve.
 *
 * Each Netlify function is its own bundle, but a warm container reuses the
 * module between invocations, so initializeApp() must be guarded or the
 * second call throws "The default Firebase app already exists".
 */

// firebase-admin 13 removed the namespaced API: on v14 the bare require gives
// only the modular app surface, so `admin.apps`, `admin.credential`,
// `admin.firestore` and `admin.auth` are all undefined and reading any of them
// throws at module load — which Netlify reports as an opaque 502. Every guide
// written before that release still shows the old form. Import the subpaths.
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (!getApps().length) {
  initializeApp({
    // The service account fields belong inside cert(). Passed as top-level
    // options they are ignored, the SDK falls back to application default
    // credentials that do not exist in a Netlify container, and every call throws.
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Netlify stores the key with literal \n escapes; restore real newlines.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Netlify sets URL to the site's primary address on deploy; the fallback keeps
// local `netlify dev` and preview builds pointing somewhere real.
const SITE_URL = process.env.URL || 'https://dojo-web.netlify.app';

// Price ids live server-side and are chosen by plan name. If the client passed
// a price id directly it could subscribe itself to any price in the account,
// including a $0 one from a test product.
const PRICE_IDS = {
  monthly: process.env.PRICE_ID_MONTHLY,
  yearly: process.env.PRICE_ID_YEARLY,
};

const TRIAL_DAYS = 7;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/**
 * Resolve the caller from their Firebase ID token.
 *
 * The caller's uid must never be read from the request body: these endpoints
 * return subscription state and mint billing-portal sessions, so trusting a
 * body field would let anyone read any account and manage its billing.
 *
 * Returns the decoded token, or null when the caller is unauthenticated.
 */
async function verifyCaller(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await getAuth().verifyIdToken(match[1]);
  } catch (error) {
    console.warn('ID token verification failed:', error.message);
    return null;
  }
}

/** Firestore Timestamp from a Stripe epoch-seconds field. */
function tsFromStripe(seconds) {
  return seconds ? Timestamp.fromMillis(seconds * 1000) : null;
}

module.exports = { Timestamp, db, stripe, json, verifyCaller, tsFromStripe, SITE_URL, PRICE_IDS, TRIAL_DAYS };
