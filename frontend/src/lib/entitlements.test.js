import { renderHook, waitFor } from "@testing-library/react";
import { LOCKED_TABS, useEntitlements } from "./entitlements";

jest.mock("./projectFileHandler", () => ({ isTauri: jest.fn(() => false) }));
jest.mock("./stripeBilling", () => ({
  billingConfigured: true,
  onAuthChange: (cb) => { cb({ uid: "u1" }); return () => {}; },
  getSubscriptionStatus: jest.fn(),
}));

const { isTauri } = require("./projectFileHandler");
const { getSubscriptionStatus } = require("./stripeBilling");

const forStatus = async (status) => {
  getSubscriptionStatus.mockResolvedValue({ status });
  const { result } = renderHook(() => useEntitlements());
  await waitFor(() => expect(result.current.status).toBe(status));
  return result.current;
};

beforeEach(() => {
  jest.clearAllMocks();
  isTauri.mockReturnValue(false);
});

test("only a paid subscription can publish", async () => {
  expect((await forStatus("active")).canPublish).toBe(true);
  for (const status of ["trialing", "past_due", "canceled", "none"]) {
    expect((await forStatus(status)).canPublish).toBe(false);
  }
});

test("export is the free tier's paywall, but stays open during the trial", async () => {
  expect((await forStatus("none")).canExport).toBe(false);
  expect((await forStatus("canceled")).canExport).toBe(false);
  expect((await forStatus("trialing")).canExport).toBe(true);
  expect((await forStatus("active")).canExport).toBe(true);
});

test("advanced tabs unlock only on an active subscription", async () => {
  expect((await forStatus("active")).lockedTabs).toEqual([]);
  expect((await forStatus("trialing")).lockedTabs).toEqual(LOCKED_TABS);
  expect((await forStatus("none")).lockedTabs).toEqual(LOCKED_TABS);
});

test("an unknown status falls back to the free tier rather than granting access", async () => {
  getSubscriptionStatus.mockResolvedValue({ status: "incomplete_expired" });
  const { result } = renderHook(() => useEntitlements());
  await waitFor(() => expect(result.current.status).toBe("incomplete_expired"));
  expect(result.current.canPublish).toBe(false);
  expect(result.current.canExport).toBe(false);
});

test("a failed status lookup does not hand out access it could not confirm", async () => {
  getSubscriptionStatus.mockRejectedValue(new Error("offline"));
  const { result } = renderHook(() => useEntitlements());
  await waitFor(() => expect(result.current.canPublish).toBe(false));
  expect(result.current.canExport).toBe(false);
});

test("the desktop build is never gated and never calls the billing API", async () => {
  isTauri.mockReturnValue(true);
  const { result } = renderHook(() => useEntitlements());
  expect(result.current.canPublish).toBe(true);
  expect(result.current.canExport).toBe(true);
  expect(result.current.lockedTabs).toEqual([]);
  expect(getSubscriptionStatus).not.toHaveBeenCalled();
});

test("refresh keeps a stable identity so a scheduled re-check still fires", async () => {
  getSubscriptionStatus.mockResolvedValue({ status: "none" });
  const { result } = renderHook(() => useEntitlements());
  await waitFor(() => expect(getSubscriptionStatus).toHaveBeenCalledTimes(1));

  // What the post-checkout timer does: hold the first render's refresh, then
  // call it later. A stale closure over `user` would make this a no-op.
  const captured = result.current.refresh;
  getSubscriptionStatus.mockResolvedValue({ status: "active" });
  captured();

  await waitFor(() => expect(result.current.canPublish).toBe(true));
});
