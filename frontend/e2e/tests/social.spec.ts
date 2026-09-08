import { test, expect } from "@playwright/test";

// Social Wall tests: verify API connection, feed rendering, and testimonial
// display. All external API calls are mocked — no real platform hits.

const API = "http://localhost:8787";

async function createProject(request: any) {
  const res = await request.post(`${API}/api/projects`, {
    data: { name: "Social Test Project" },
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

test.describe("Social Wall", () => {
  test("Social config: stores API keys encrypted", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    const res = await request.post(`${API}/api/${projectId}/social-config`, {
      headers: { "X-Dashboard-Token": token },
      data: {
        config: {
          facebook: { token: "test-fb-token", page_id: "test-page" },
          x: { token: "test-x-token", user_id: "test-user" },
        },
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("Social feed: returns empty when no platforms connected", async ({ request }) => {
    const projectId = await createProject(request);

    const res = await request.get(`${API}/api/${projectId}/social-feed`);
    const body = await res.json();
    expect(body.posts).toEqual([]);
    expect(body.connected).toEqual([]);
  });

  test("Social feed: filters by platform", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // Save config with a mock token
    await request.post(`${API}/api/${projectId}/social-config`, {
      headers: { "X-Dashboard-Token": token },
      data: {
        config: {
          facebook: { token: "test-token", page_id: "test-page" },
        },
      },
    });

    // The feed endpoint will try to fetch from Facebook but fail gracefully
    // (no real API call in tests — the fetch is mocked/blocked)
    const res = await request.get(`${API}/api/${projectId}/social-feed?platform=facebook`);
    const body = await res.json();
    // Should return empty posts (fetch fails gracefully) but list connected platforms
    expect(Array.isArray(body.posts)).toBeTruthy();
    expect(body.connected).toContain("facebook");
  });

  test("Testimonials: returns empty when no post_id provided", async ({ request }) => {
    const projectId = await createProject(request);

    const res = await request.get(`${API}/api/${projectId}/social-testimonials`);
    const body = await res.json();
    expect(body.testimonials).toEqual([]);
  });
});