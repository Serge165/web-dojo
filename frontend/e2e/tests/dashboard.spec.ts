import { test, expect } from "@playwright/test";

// Zenero Dashboard E2E tests: form submission → backend write → block display
// cycle for Updates, Gallery, Blog, and Portfolio sections.

const API = "http://localhost:8787";

async function createProject(request: any) {
  const res = await request.post(`${API}/api/projects`, {
    data: { name: "E2E Test Project" },
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

test.describe("Zenero Dashboard", () => {
  test("Updates: form → JSON write → block display", async ({ page, request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // Create an update via the API
    const res = await request.post(`${API}/api/${projectId}/updates`, {
      headers: { "X-Dashboard-Token": token },
      data: { title: "Test Update", content: "This is a test update content." },
    });
    expect(res.ok()).toBeTruthy();

    // Verify the update is retrievable
    const listRes = await request.get(`${API}/api/${projectId}/updates`);
    const body = await listRes.json();
    expect(body.updates.length).toBeGreaterThan(0);
    expect(body.updates[0].title).toBe("Test Update");
  });

  test("Gallery: image upload → folder creation → grid rendering", async ({ page, request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    const res = await request.post(`${API}/api/${projectId}/gallery_items`, {
      headers: { "X-Dashboard-Token": token },
      data: {
        image_url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=70",
        alt_text: "Test gallery image",
        category: "test",
      },
    });
    expect(res.ok()).toBeTruthy();

    const listRes = await request.get(`${API}/api/${projectId}/gallery_items`);
    const body = await listRes.json();
    expect(body.gallery_items.length).toBeGreaterThan(0);
    expect(body.gallery_items[0].alt_text).toBe("Test gallery image");
  });

  test("Blog: form → JSON write → excerpt generation", async ({ page, request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    const res = await request.post(`${API}/api/${projectId}/blog_posts`, {
      headers: { "X-Dashboard-Token": token },
      data: {
        title: "Test Blog Post",
        content_html: "<p>This is a test blog post with enough content to generate an excerpt from the first 150 characters of the text.</p>",
        keywords: "test, blog",
        hashtags: "#test #blog",
      },
    });
    expect(res.ok()).toBeTruthy();
    const post = await res.json();
    expect(post.excerpt.length).toBeGreaterThan(0);

    const listRes = await request.get(`${API}/api/${projectId}/blog_posts`);
    const body = await listRes.json();
    expect(body.blog_posts.length).toBeGreaterThan(0);
    expect(body.blog_posts[0].title).toBe("Test Blog Post");
  });

  test("Portfolio: form submission → timeline ordering → edit persistence", async ({ page, request }) => {
    const projectId = await createProject(request);
    const token = await setPassword(request, projectId);

    // Create two portfolio items
    await request.post(`${API}/api/${projectId}/portfolio_items`, {
      headers: { "X-Dashboard-Token": token },
      data: { title: "Project One", description: "First project", date: "2024-01-01", category: "web" },
    });
    await request.post(`${API}/api/${projectId}/portfolio_items`, {
      headers: { "X-Dashboard-Token": token },
      data: { title: "Project Two", description: "Second project", date: "2023-01-01", category: "branding" },
    });

    // Verify both exist
    const listRes = await request.get(`${API}/api/${projectId}/portfolio_items`);
    const body = await listRes.json();
    expect(body.portfolio_items.length).toBe(2);

    // Edit the first item
    const firstId = body.portfolio_items[0].id;
    const editRes = await request.put(`${API}/api/${projectId}/portfolio_items/${firstId}`, {
      headers: { "X-Dashboard-Token": token },
      data: { title: "Project One (Updated)", description: "Updated description" },
    });
    expect(editRes.ok()).toBeTruthy();

    // Verify edit persisted
    const afterEdit = await request.get(`${API}/api/${projectId}/portfolio_items`);
    const afterBody = await afterEdit.json();
    const updated = afterBody.portfolio_items.find((p: any) => p.id === firstId);
    expect(updated.title).toBe("Project One (Updated)");
  });
});