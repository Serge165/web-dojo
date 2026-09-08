/**
 * What a given subscription state is allowed to do.
 *
 * Resolves the current user's subscription state into the entitlements in
 * ./entitlementPolicy — change a cell in that table rather than adding checks
 * at call sites, so there is one place to look when a customer asks why
 * something is locked.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { isTauri } from './projectFileHandler';
import { billingConfigured, onAuthChange, getSubscriptionStatus } from './stripeBilling';
import { LOCKED_TABS, policyFor } from './entitlementPolicy';

export { LOCKED_TABS };

/** The desktop build and any deployment without billing configured. */
const UNRESTRICTED = { canPublish: true, canExport: true, lockedTabs: [] };

/**
 * Current entitlements, plus the raw status for messaging.
 *
 * The desktop build is never gated: it has no way to reach the Netlify
 * functions that verify a subscription, and it is the build used for demos.
 * Gating is a property of the hosted site alone.
 */
export function useEntitlements() {
  const ungated = isTauri() || !billingConfigured;

  const [status, setStatus] = useState(ungated ? 'active' : 'none');
  const [user, setUser] = useState(null);

  // Read through a ref so refresh() keeps a stable identity. A caller that
  // schedules it — the post-checkout re-check waits out the webhook — captures
  // it once, and a version closed over a stale `user` would silently no-op.
  const userRef = useRef(null);
  userRef.current = user;

  useEffect(() => {
    if (ungated) return;
    return onAuthChange(setUser);
  }, [ungated]);

  const refresh = useCallback(() => {
    if (ungated || !userRef.current) return;
    getSubscriptionStatus()
      .then((s) => setStatus(s.status || 'none'))
      // A failed lookup must not hand out access it could not confirm.
      .catch(() => setStatus('none'));
  }, [ungated]);

  useEffect(() => {
    if (ungated) return;
    if (!user) return setStatus('none');
    refresh();
  }, [ungated, user, refresh]);

  return { ...(ungated ? UNRESTRICTED : policyFor(status)), status, refresh };
}
