/**
 * Shared setup for the Stripe subscription functions.
 *
 * Each Netlify function is its own bundle, but a warm container reuses the
 * module between invocations, so initializeApp() must be guarded or the
 * second call throws "The default Firebase app already exists".
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // Netlify stores the key with literal \n escapes; restore real newlines.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });
}

const db = admin.firestore();
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
    return await admin.auth().verifyIdToken(match[1]);
  } catch (error) {
    console.warn('ID token verification failed:', error.message);
    return null;
  }
}

/** Firestore Timestamp from a Stripe epoch-seconds field. */
function tsFromStripe(seconds) {
  return seconds ? admin.firestore.Timestamp.fromMillis(seconds * 1000) : null;
}

module.exports = { admin, db, stripe, json, verifyCaller, tsFromStripe, SITE_URL, PRICE_IDS, TRIAL_DAYS };
