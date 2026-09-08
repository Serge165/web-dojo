import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import {
  billingConfigured, onAuthChange, signInWithGoogle, signOutUser,
  startCheckout, getSubscriptionStatus, openBillingPortal,
} from "@/lib/stripeBilling";
import { isTauri } from "@/lib/projectFileHandler";

const PLANS = [
  { id: "monthly", name: "Monthly", price: "$50", period: "per month" },
  { id: "yearly", name: "Yearly", price: "$500", period: "per year", note: "2 months free" },
];

const ACTIVE_STATUSES = ["active", "trialing"];
const btn = "w-full rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
}

export const AccountModal = ({ open, onClose }) => {
  const [user, setUser] = useState(undefined); // undefined = still resolving
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  // Subscribed once for the life of the modal rather than per-open: Firebase
  // restores the session asynchronously, and re-subscribing on each open
  // flashes the signed-out state every time.
  useEffect(() => {
    if (!billingConfigured) return setUser(null);
    return onAuthChange(setUser);
  }, []);

  const refresh = useCallback(() => {
    if (!user) return setStatus(null);
    setError(null);
    getSubscriptionStatus().then(setStatus).catch((e) => setError(e.message));
  }, [user]);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  const act = (name, fn) => async () => {
    setBusy(name);
    setError(null);
    try {
      await fn();
    } catch (e) {
      // Closing the Google popup rejects; that is a cancellation, not a fault.
      if (!/popup-closed|cancelled-popup/.test(e.message)) setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const subscribed = status && ACTIVE_STATUSES.includes(status.status);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-md" data-testid="account-modal">
        <DialogHeader>
          <DialogTitle>Account &amp; Billing</DialogTitle>
          <DialogDescription className="sr-only">Sign in and manage your Web Dojo subscription</DialogDescription>
        </DialogHeader>

        {/* Sign-in needs a popup against an authorized web origin; the desktop
            webview serves from tauri://localhost, which Firebase rejects. */}
        {isTauri() ? (
          <p className="text-xs text-[#A79C87] leading-relaxed">
            Manage your subscription in a browser at{" "}
            <span className="text-[#C9A227] font-mono">dojo-web.netlify.app</span>. Your desktop
            app picks up the change the next time it signs in.
          </p>
        ) : !billingConfigured ? (
          <p className="text-xs text-[#A79C87]">
            Billing isn’t configured for this deployment. The Firebase web keys are missing.
          </p>
        ) : user === undefined ? (
          <div className="flex items-center gap-2 text-xs text-[#A79C87] py-4">
            <Loader2 size={13} className="animate-spin" /> Checking your account…
          </div>
        ) : !user ? (
          <>
            <p className="text-xs text-[#A79C87] leading-relaxed">
              Sign in to start your 7-day free trial. No card required.
            </p>
            <button
              onClick={act("signin", signInWithGoogle)}
              disabled={busy === "signin"}
              className={`${btn} bg-[#C9A227] text-[#15130E] hover:bg-[#D9B237]`}
              data-testid="account-signin"
            >
              {busy === "signin" ? "Opening Google…" : "Sign in with Google"}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A79C87] truncate">{user.email}</span>
              <button onClick={act("signout", signOutUser)} className="text-[#948C79] hover:text-[#F1EDE2] flex-none ml-3" data-testid="account-signout">
                Sign out
              </button>
            </div>

            {subscribed ? (
              <div className="space-y-3">
                <div className="rounded-md border border-[#332D22] bg-[#15130E] p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#C9A227] font-medium">
                    <Check size={13} />
                    {status.status === "trialing" ? "Free trial" : "Subscribed"}
                    {status.plan && <span className="text-[#948C79] font-normal">· {status.plan}</span>}
                  </div>
                  {status.status === "trialing" && formatDate(status.trialEnd) && (
                    <p className="text-[#A79C87]">
                      Trial ends {formatDate(status.trialEnd)}. Add a payment method before then to keep your account.
                    </p>
                  )}
                  {status.status === "active" && formatDate(status.currentPeriodEnd) && (
                    <p className="text-[#A79C87]">Renews {formatDate(status.currentPeriodEnd)}.</p>
                  )}
                </div>
                <button
                  onClick={act("portal", openBillingPortal)}
                  disabled={busy === "portal"}
                  className={`${btn} bg-[#242019] border border-[#332D22] text-[#F1EDE2] hover:bg-[#332D22] flex items-center justify-center gap-1.5`}
                  data-testid="account-portal"
                >
                  {busy === "portal" ? "Opening…" : <>{status.status === "trialing" ? "Add payment method" : "Manage billing"} <ExternalLink size={12} /></>}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {status?.status === "past_due" && (
                  <p className="text-xs text-[#E0894A]">
                    Your last payment failed. Update your card to restore access.
                  </p>
                )}
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={act(plan.id, () => startCheckout(plan.id))}
                    disabled={!!busy}
                    className="w-full flex items-center justify-between rounded-md border border-[#332D22] bg-[#15130E] px-3 py-2.5 text-left hover:border-[#C9A227] disabled:opacity-40 transition-colors"
                    data-testid={`account-plan-${plan.id}`}
                  >
                    <span className="text-xs">
                      <span className="text-[#F1EDE2] font-medium">{plan.name}</span>
                      {plan.note && <span className="text-[#C9A227] ml-2">{plan.note}</span>}
                      <span className="block text-[#948C79] mt-0.5">7-day free trial, no card</span>
                    </span>
                    <span className="text-xs text-right flex-none ml-3">
                      <span className="text-[#F1EDE2] font-medium">{busy === plan.id ? "…" : plan.price}</span>
                      <span className="block text-[#948C79]">{plan.period}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {error && <p className="text-xs text-[#E0894A]" data-testid="account-error">{error}</p>}
      </DialogContent>
    </Dialog>
  );
};
