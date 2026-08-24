import { test, expect } from "@playwright/test";

// Funnel tracking tests: verify entry → checkpoint → conversion event firing
// and variant tracking.

const API = "http://localhost:8787";

async function createProject(request: any) {
  const res = await request.post(`${API}/api/projects`, {
    data: { name: "Funnel Test Project" },
  });
  return (await res.json()).id;
}

async function setPassword(request: any, projectId: string) {
  await request.post(`${API}/api/dashboard/${projectId}/set-password`, {
    data: { password: "testpass123" },
  });
  const res = await request.post(`${API}/api/dashboard/${projectId}/unlock`, {
    data: { password: "testpass123" },
  });
  return (await res.json()).token;
}

test.describe("Funnel Tracking", () => {
  test("Fires entry → checkpoint_a → checkpoint_b → conversion events", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // Fire the full funnel sequence
    const checkpoints = ["entry", "checkpoint_a", "checkpoint_b", "conversion"];
    for (const cp of checkpoints) {
      const res = await request.post(`${API}/api/funnels/${projectId}/event`, {
        data: { checkpoint: cp, visitor_id: "test-visitor-1", variant: "control" },
      });
      expect(res.ok()).toBeTruthy();
    }

    // Verify analytics
    const res = await request.get(`${API}/api/analytics/funnels/${projectId}?variant=control`, {
      headers: { "X-Dashboard-Token": token },
    });
    const body = await res.json();
    expect(body.entry_count).toBe(1);
    expect(body.checkpoint_a_count).toBe(1);
    expect(body.checkpoint_b_count).toBe(1);
    expect(body.conversion_count).toBe(1);
    expect(body.conversion_rate).toBe(100);
  });

  test("Tracks drop-off correctly", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // 3 entries, 2 reach checkpoint_a, 1 reaches conversion
    for (let i = 0; i < 3; i++) {
      await request.post(`${API}/api/funnels/${projectId}/event`, {
        data: { checkpoint: "entry", visitor_id: `visitor-${i}`, variant: "control" },
      });
    }
    for (let i = 0; i < 2; i++) {
      await request.post(`${API}/api/funnels/${projectId}/event`, {
        data: { checkpoint: "checkpoint_a", visitor_id: `visitor-${i}`, variant: "control" },
      });
    }
    await request.post(`${API}/api/funnels/${projectId}/event`, {
      data: { checkpoint: "conversion", visitor_id: "visitor-0", variant: "control" },
    });

    const res = await request.get(`${API}/api/analytics/funnels/${projectId}?variant=control`, {
      headers: { "X-Dashboard-Token": token },
    });
    const body = await res.json();
    expect(body.entry_count).toBe(3);
    expect(body.checkpoint_a_count).toBe(2);
    expect(body.conversion_count).toBe(1);
    expect(body.drop_off_a).toBe(1);
    expect(body.conversion_rate).toBeCloseTo(33.33, 1);
  });

  test("A/B variant tracking splits analytics", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // Control variant: 2 entries, 1 conversion
    await request.post(`${API}/api/funnels/${projectId}/event`, {
      data: { checkpoint: "entry", visitor_id: "c1", variant: "control" },
    });
    await request.post(`${API}/api/funnels/${projectId}/event`, {
      data: { checkpoint: "entry", visitor_id: "c2", variant: "control" },
    });
    await request.post(`${API}/api/funnels/${projectId}/event`, {
      data: { checkpoint: "conversion", visitor_id: "c1", variant: "control" },
    });

    // Variant A: 1 entry, 1 conversion
    await request.post(`${API}/api/funnels/${projectId}/event`, {
      data: { checkpoint: "entry", visitor_id: "a1", variant: "variant_a" },
    });
    await request.post(`${API}/api/funnels/${projectId}/event`, {
      data: { checkpoint: "conversion", visitor_id: "a1", variant: "variant_a" },
    });

    // Control analytics
    const controlRes = await request.get(`${API}/api/analytics/funnels/${projectId}?variant=control`, {
      headers: { "X-Dashboard-Token": token },
    });
    const control = await controlRes.json();
    expect(control.entry_count).toBe(2);
    expect(control.conversion_count).toBe(1);
    expect(control.conversion_rate).toBe(50);

    // Variant A analytics
    const variantRes = await request.get(`${API}/api/analytics/funnels/${projectId}?variant=variant_a`, {
      headers: { "X-Dashboard-Token": token },
    });
    const variant = await variantRes.json();
    expect(variant.entry_count).toBe(1);
    expect(variant.conversion_count).toBe(1);
    expect(variant.conversion_rate).toBe(100);
  });
});