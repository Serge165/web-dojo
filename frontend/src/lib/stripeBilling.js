/**
 * Client side of the Stripe subscription flow.
 *
 * Every call carries a Firebase ID token; the Netlify functions derive the
 * user from that token and ignore anything else the client sends, so a caller
 * cannot read or manage another account's billing.
 */

// Firebase is imported lazily so the ~200KB SDK stays out of the main bundle —
// the Builder loads for users who never open billing.
let authPromise = null;

function getAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth: firebaseGetAuth } = await import('firebase/auth');
      const app = getApps()[0] || initializeApp({
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
      });
      return firebaseGetAuth(app);
    })();
  }
  return authPromise;
}

/**
 * False until the Firebase web config is present. Checked before rendering any
 * billing UI so a missing env var shows a message instead of throwing inside
 * the SDK on a live site.
 */
export const billingConfigured = Boolean(process.env.REACT_APP_FIREBASE_API_KEY);

/** Subscribe to sign-in state. Returns an unsubscribe function. */
export function onAuthChange(callback) {
  let unsubscribe = () => {};
  let cancelled = false;
  getAuth().then(async (auth) => {
    if (cancelled) return;
    const { onAuthStateChanged } = await import('firebase/auth');
    unsubscribe = onAuthStateChanged(auth, callback);
  });
  return () => { cancelled = true; unsubscribe(); };
}

export async function signInWithGoogle() {
  const auth = await getAuth();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutUser() {
  const auth = await getAuth();
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

// The desktop build is served from tauri://localhost, where a relative path
// would resolve against the app bundle rather than the deployed site.
const FUNCTIONS_BASE =
  process.env.REACT_APP_BILLING_URL ||
  (typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? ''
    : 'https://dojo-web.netlify.app');

async function call(fn, { method = 'POST', body } = {}) {
  const auth = await getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in required');

  const response = await fetch(`${FUNCTIONS_BASE}/.netlify/functions/${fn}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

/**
 * Send the user to Stripe Checkout for the given plan.
 * `plan` is 'monthly' or 'yearly'; the server maps it to a price id.
 */
export async function startCheckout(plan) {
  const { redirectUrl } = await call('stripe-checkout', { body: { plan } });
  window.location.href = redirectUrl;
}

/** Current subscription state, including the trial end and feature flags. */
export function getSubscriptionStatus() {
  return call('stripe-subscription-status', { method: 'GET' });
}

/** Send the user to Stripe's hosted page to update payment details or cancel. */
export async function openBillingPortal() {
  const { url } = await call('stripe-billing-portal');
  window.location.href = url;
}
