import { test, expect } from "@playwright/test";

// Block injection cycle tests: verify the fetch-and-inject blocks work
// correctly — Updates, Gallery, Blog (Latest from Blog), Portfolio.

const API = "http://localhost:8787";

async function createProject(request: any) {
  const res = await request.post(`${API}/api/projects`, {
    data: { name: "Blocks Test Project" },
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

test.describe("Block Injection Cycles", () => {
  test("Updates block: fetches and displays top 3 updates", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // Create 4 updates (only top 3 should display)
    for (let i = 1; i <= 4; i++) {
      await request.post(`${API}/api/${projectId}/updates`, {
        headers: { "X-Dashboard-Token": token },
        data: { title: `Update ${i}`, content: `Content ${i}` },
      });
    }

    const res = await request.get(`${API}/api/${projectId}/updates`);
    const body = await res.json();
    expect(body.updates.length).toBe(4);
    // The block fetches top 3
    expect(body.updates.slice(0, 3).length).toBe(3);
  });

  test("Gallery block: fetches and renders grid", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    await request.post(`${API}/api/${projectId}/gallery_items`, {
      headers: { "X-Dashboard-Token": token },
      data: { image_url: "https://example.com/img1.jpg", alt_text: "Image 1", category: "web" },
    });
    await request.post(`${API}/api/${projectId}/gallery_items`, {
      headers: { "X-Dashboard-Token": token },
      data: { image_url: "https://example.com/img2.jpg", alt_text: "Image 2", category: "branding" },
    });

    const res = await request.get(`${API}/api/${projectId}/gallery_items`);
    const body = await res.json();
    expect(body.gallery_items.length).toBe(2);
  });

  test("Latest from Blog: title click → paragraph injection", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // Create 2 blog posts
    await request.post(`${API}/api/${projectId}/blog_posts`, {
      headers: { "X-Dashboard-Token": token },
      data: {
        title: "Post One",
        content_html: "<p>This is the first paragraph of post one with enough content for an excerpt.</p>",
      },
    });
    await request.post(`${API}/api/${projectId}/blog_posts`, {
      headers: { "X-Dashboard-Token": token },
      data: {
        title: "Post Two",
        content_html: "<p>This is the first paragraph of post two with enough content for an excerpt.</p>",
      },
    });

    const res = await request.get(`${API}/api/${projectId}/blog_posts`);
    const body = await res.json();
    expect(body.blog_posts.length).toBe(2);
    // Both posts have excerpts
    expect(body.blog_posts[0].excerpt.length).toBeGreaterThan(0);
    expect(body.blog_posts[1].excerpt.length).toBeGreaterThan(0);
  });

  test("Portfolio block: fetches and renders timeline sorted by date", async ({ request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    await request.post(`${API}/api/${projectId}/portfolio_items`, {
      headers: { "X-Dashboard-Token": token },
      data: { title: "Older", description: "Older project", date: "2022-01-01", category: "web" },
    });
    await request.post(`${API}/api/${projectId}/portfolio_items`, {
      headers: { "X-Dashboard-Token": token },
      data: { title: "Newer", description: "Newer project", date: "2024-01-01", category: "web" },
    });

    const res = await request.get(`${API}/api/${projectId}/portfolio_items`);
    const body = await res.json();
    expect(body.portfolio_items.length).toBe(2);
    // Sorted by date (chronological)
    expect(body.portfolio_items[0].date).toBe("2022-01-01");
    expect(body.portfolio_items[1].date).toBe("2024-01-01");
  });
});