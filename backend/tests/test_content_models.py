"""Phase 2 regression tests: blog posts, social wall, portfolio projects."""
import os
import uuid

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture(scope="module")
def client():
    with TestClient(server.app) as c:
        yield c


async def _noop(*a, **kw):
    return None


@pytest.fixture()
def no_dash_gate(monkeypatch):
    """Patch the dashboard-token gate so social-post tests don't need a full
    password round-trip. The dedicated gate-enforcement tests below unpatch."""
    monkeypatch.setattr(server._content_mod, "_require_dashboard_token", _noop)


def _register(client, email=None):
    email = email or f"u{uuid.uuid4().hex[:8]}@test.dev"
    r = client.post("/api/auth/register", json={"email": email, "password": "password123"})
    assert r.status_code == 200
    body = r.json()
    return {"headers": {"Authorization": f"Bearer {body['token']}"}, **body}


def _project(client, user):
    r = client.post("/api/projects", json={"name": "content"}, headers=user["headers"])
    return r.json()["id"]


class TestBlogPosts:
    def _post(self, client, pid, user, title="Hello", **kw):
        r = client.post(f"/api/projects/{pid}/posts", json={"title": title, **kw}, headers=user["headers"])
        assert r.status_code == 200, r.text
        return r.json()

    def test_create_slug_and_public_fetch(self, client):
        u = _register(client)
        pid = _project(client, u)
        post = self._post(client, pid, u, "My First Post!", draft=False)
        assert post["slug"] == "my-first-post"
        assert post["published_at"]
        r = client.get(f"/api/preview/{pid}/posts/my-first-post")
        assert r.status_code == 200 and r.json()["title"] == "My First Post!"

    def test_draft_hidden_from_public_but_visible_in_dashboard(self, client):
        u = _register(client)
        pid = _project(client, u)
        draft = self._post(client, pid, u, "Secret Draft", draft=True)
        assert client.get(f"/api/preview/{pid}/posts/{draft['slug']}").status_code == 404
        # Anonymous list → published only.
        anon = client.get(f"/api/projects/{pid}/posts").json()["posts"]
        assert all(p["slug"] != draft["slug"] for p in anon)
        # Authenticated list → drafts included.
        authed = client.get(f"/api/projects/{pid}/posts", headers=u["headers"]).json()["posts"]
        assert any(p["id"] == draft["id"] for p in authed)

    def test_update_persists(self, client):
        u = _register(client)
        pid = _project(client, u)
        post = self._post(client, pid, u)
        r = client.put(f"/api/projects/{pid}/posts/{post['id']}",
                       json={"title": "Updated Title", "excerpt": "now with excerpt"},
                       headers=u["headers"])
        assert r.status_code == 200
        assert r.json()["title"] == "Updated Title"
        again = client.get(f"/api/projects/{pid}/posts", headers=u["headers"]).json()["posts"]
        assert any(p["title"] == "Updated Title" for p in again)

    def test_publish_transition_sets_published_at(self, client):
        u = _register(client)
        pid = _project(client, u)
        post = self._post(client, pid, u, draft=True)
        assert post["published_at"] is None
        r = client.put(f"/api/projects/{pid}/posts/{post['id']}", json={"draft": False}, headers=u["headers"])
        assert r.json()["published_at"]

    def test_delete_requires_admin_rank(self, client):
        owner = _register(client)
        editor_email = f"e{uuid.uuid4().hex[:6]}@test.dev"
        pid = _project(client, owner)
        client.post(f"/api/projects/{pid}/share", json={"email": editor_email, "role": "editor"}, headers=owner["headers"])
        editor = _register(client, editor_email)
        post = self._post(client, pid, owner)
        # Editor rank can update but not delete (delete needs admin).
        assert client.put(f"/api/projects/{pid}/posts/{post['id']}", json={"content": "x"}, headers=editor["headers"]).status_code == 200
        assert client.delete(f"/api/projects/{pid}/posts/{post['id']}", headers=editor["headers"]).status_code == 403
        assert client.delete(f"/api/projects/{pid}/posts/{post['id']}", headers=owner["headers"]).status_code == 200

    def test_tag_filter_sort_and_pagination(self, client):
        u = _register(client)
        pid = _project(client, u)
        for i, tags in enumerate([["react"], ["javascript"], ["react", "javascript"]]):
            self._post(client, pid, u, f"t{i}", tags=tags, draft=False)
        both = client.get(f"/api/projects/{pid}/posts", params={"tags": "react,javascript"}).json()
        assert both["total"] == 1
        react = client.get(f"/api/projects/{pid}/posts", params={"tags": "react"}).json()
        assert react["total"] == 2
        page = client.get(f"/api/projects/{pid}/posts", params={"limit": 2, "offset": 0}).json()
        assert len(page["posts"]) == 2
        asc = client.get(f"/api/projects/{pid}/posts", params={"sort": "created_at", "order": "asc"}).json()
        assert asc["posts"][0]["title"] == "t0"

    def test_write_requires_auth(self, client):
        u = _register(client)
        pid = _project(client, u)
        assert client.post(f"/api/projects/{pid}/posts", json={"title": "nope"}).status_code == 401
        intruder = _register(client)
        assert client.post(f"/api/projects/{pid}/posts", json={"title": "nope"}, headers=intruder["headers"]).status_code == 403


class TestSocialWall:
    def test_dashboard_gated_write(self, client, no_dash_gate):
        u = _register(client)
        pid = _project(client, u)
        r = client.post(f"/api/projects/{pid}/social-posts",
                        json={"content": "First!", "author_name": "Webmaster"})
        assert r.status_code == 200
        assert r.json()["likes_count"] == 0

    def test_gate_enforced_without_patch(self, client):
        # No no_dash_gate fixture: the real gate must 401 anonymous callers.
        u = _register(client)
        pid = _project(client, u)
        r = client.post(f"/api/projects/{pid}/social-posts", json={"content": "x"})
        assert r.status_code == 401

    def test_public_list_sorted_desc_with_pagination(self, client, no_dash_gate):
        u = _register(client)
        pid = _project(client, u)
        for i in range(5):
            client.post(f"/api/projects/{pid}/social-posts", json={"content": f"post {i}"})
        page = client.get(f"/api/preview/{pid}/social-posts", params={"limit": 3}).json()
        assert len(page["posts"]) == 3 and page["total"] == 5
        rest = client.get(f"/api/preview/{pid}/social-posts", params={"limit": 3, "offset": 3}).json()
        assert len(rest["posts"]) == 2
        times = [p["created_at"] for p in page["posts"]]
        assert times == sorted(times, reverse=True)

    def test_edit_and_delete(self, client, no_dash_gate):
        u = _register(client)
        pid = _project(client, u)
        post = client.post(f"/api/projects/{pid}/social-posts", json={"content": "v1"}).json()
        r = client.put(f"/api/projects/{pid}/social-posts/{post['id']}", json={"content": "v2"})
        assert r.status_code == 200 and r.json()["content"] == "v2"
        assert client.delete(f"/api/projects/{pid}/social-posts/{post['id']}").status_code == 200
        assert client.get(f"/api/preview/{pid}/social-posts").json()["total"] == 0


class TestSocialLikes:
    def test_like_increments_persists_and_toggles_off(self, client, no_dash_gate):
        u = _register(client)
        pid = _project(client, u)
        post = client.post(f"/api/projects/{pid}/social-posts", json={"content": "like me"}).json()
        url = f"/api/projects/{pid}/social-posts/{post['id']}/like"
        r1 = client.post(url).json()
        assert r1["liked"] is True and r1["likes_count"] == 1
        # Persists across reads.
        wall = client.get(f"/api/preview/{pid}/social-posts").json()["posts"]
        assert wall[0]["likes_count"] == 1
        # Same visitor again → toggles off (spam guard).
        r2 = client.post(url).json()
        assert r2["liked"] is False and r2["likes_count"] == 0

    def test_like_missing_post_404(self, client):
        u = _register(client)
        pid = _project(client, u)
        assert client.post(f"/api/projects/{pid}/social-posts/nope/like").status_code == 404


class TestPortfolio:
    def _item(self, client, pid, user, title, category):
        r = client.post(f"/api/projects/{pid}/portfolio-projects",
                        json={"title": title, "category": category},
                        headers=user["headers"])
        assert r.status_code == 200, r.text
        return r.json()

    def test_crud_and_server_side_category_filter(self, client):
        u = _register(client)
        pid = _project(client, u)
        for i in range(3):
            self._item(client, pid, u, f"web {i}", "web")
        for i in range(2):
            self._item(client, pid, u, f"design {i}", "design")
        all_items = client.get(f"/api/preview/{pid}/portfolio-projects").json()
        assert all_items["total"] == 5
        web_only = client.get(f"/api/preview/{pid}/portfolio-projects", params={"category": "web"}).json()
        assert web_only["total"] == 3
        assert all(p["category"] == "web" for p in web_only["projects"])

    def test_update_appears_on_public_read(self, client):
        u = _register(client)
        pid = _project(client, u)
        item = self._item(client, pid, u, "old title", "web")
        r = client.put(f"/api/projects/{pid}/portfolio-projects/{item['id']}",
                       json={"title": "new title", "description": "revamped"},
                       headers=u["headers"])
        assert r.status_code == 200 and r.json()["title"] == "new title"
        pub = client.get(f"/api/preview/{pid}/portfolio-projects").json()["projects"]
        assert any(p["title"] == "new title" for p in pub)

    def test_delete_and_auth_gates(self, client):
        owner = _register(client)
        pid = _project(client, owner)
        item = self._item(client, pid, owner, "doomed", "web")
        intruder = _register(client)
        assert client.delete(f"/api/projects/{pid}/portfolio-projects/{item['id']}",
                             headers=intruder["headers"]).status_code == 403
        assert client.post(f"/api/projects/{pid}/portfolio-projects",
                           json={"title": "x"}, headers=intruder["headers"]).status_code == 403
        assert client.delete(f"/api/projects/{pid}/portfolio-projects/{item['id']}",
                             headers=owner["headers"]).status_code == 200