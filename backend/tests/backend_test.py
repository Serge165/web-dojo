import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    ids = []
    yield ids
    # cleanup
    for pid in ids:
        try:
            requests.delete(f"{API}/projects/{pid}", timeout=10)
        except Exception:
            pass


# ---------- CRUD (regression from iteration 1) ----------

class TestProjectsCRUD:
    def test_create(self, client, created_ids):
        payload = {
            "name": "TEST_it2_proj",
            "elements": [{"id": "el_1", "html": "<section id=\"el_1\"><h1>Hello</h1></section>"}],
            "head_html": "<meta name=\"desc\" content=\"t\"/>",
            "canvas_bg": "#123456",
            "fonts": ["Roboto"],
        }
        r = client.post(f"{API}/projects", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert data["name"] == payload["name"]
        assert data["canvas_bg"] == "#123456"
        assert data["fonts"] == ["Roboto"]
        assert len(data["elements"]) == 1
        created_ids.append(data["id"])

    def test_list(self, client, created_ids):
        r = client.get(f"{API}/projects")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert any(p["id"] == created_ids[0] for p in arr)

    def test_get(self, client, created_ids):
        pid = created_ids[0]
        r = client.get(f"{API}/projects/{pid}")
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == pid
        assert d["canvas_bg"] == "#123456"

    def test_put(self, client, created_ids):
        pid = created_ids[0]
        r = client.put(f"{API}/projects/{pid}", json={"name": "TEST_it2_updated", "canvas_bg": "#abcdef"})
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_it2_updated"
        assert d["canvas_bg"] == "#abcdef"
        # verify persistence
        g = client.get(f"{API}/projects/{pid}").json()
        assert g["name"] == "TEST_it2_updated"
        assert g["canvas_bg"] == "#abcdef"

    def test_get_unknown_404(self, client):
        r = client.get(f"{API}/projects/nope-does-not-exist")
        assert r.status_code == 404

    def test_delete_and_verify(self, client):
        # create separate to delete
        r = client.post(f"{API}/projects", json={"name": "TEST_it2_del", "elements": [], "canvas_bg": "#ffffff"})
        pid = r.json()["id"]
        d = client.delete(f"{API}/projects/{pid}")
        assert d.status_code == 200
        assert d.json().get("ok") is True
        g = client.get(f"{API}/projects/{pid}")
        assert g.status_code == 404


# ---------- Preview HTML endpoint (iteration 2) ----------

class TestPreview:
    def test_preview_returns_html(self, client, created_ids):
        # create a fresh project inside this class so it's on the same xdist worker
        payload = {
            "name": "TEST_it2_preview",
            "elements": [{"id": "el_h", "html": "<section id=\"el_h\"><h1>HelloPrev</h1></section>"}],
            "canvas_bg": "#abcdef",
            "fonts": [],
        }
        cr = client.post(f"{API}/projects", json=payload)
        assert cr.status_code == 200
        pid = cr.json()["id"]
        created_ids.append(pid)

        r = client.get(f"{API}/preview/{pid}")
        assert r.status_code == 200
        ctype = r.headers.get("content-type", "")
        assert "text/html" in ctype, ctype
        body = r.text
        assert "<!doctype html>" in body.lower() or "<!DOCTYPE html>" in body
        # body content from element html
        assert "HelloPrev" in body
        # canvas_bg from payload
        assert "#abcdef" in body

    def test_preview_unknown_404(self, client):
        r = client.get(f"{API}/preview/nope")
        assert r.status_code == 404


# ---------- Saved components CRUD (iteration 7 regression) ----------

class TestComponentsCRUD:
    created = []

    def test_list_initial(self, client):
        r = client.get(f"{API}/components")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_component(self, client):
        payload = {
            "name": "TEST_it7_cmp",
            "category": "custom",
            "html": "<div id='c1'><button>Hi</button></div>",
            "thumbnail": "data:image/png;base64,AAAA",
        }
        r = client.post(f"{API}/components", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == payload["name"]
        assert d["category"] == "custom"
        assert d["html"] == payload["html"]
        assert d["thumbnail"] == payload["thumbnail"]
        assert isinstance(d["id"], str) and len(d["id"]) > 0
        TestComponentsCRUD.created.append(d["id"])

        # verify via list
        lst = client.get(f"{API}/components").json()
        assert any(c["id"] == d["id"] for c in lst)

    def test_delete_component(self, client):
        # create then delete
        r = client.post(f"{API}/components", json={"name": "TEST_it7_cmp_del", "html": "<div/>"})
        cid = r.json()["id"]
        d = client.delete(f"{API}/components/{cid}")
        assert d.status_code == 200
        assert d.json().get("ok") is True
        # verify gone
        lst = client.get(f"{API}/components").json()
        assert not any(c["id"] == cid for c in lst)

    def test_delete_unknown_404(self, client):
        r = client.delete(f"{API}/components/nope-xyz")
        assert r.status_code == 404

    @classmethod
    def teardown_class(cls):
        for cid in cls.created:
            try:
                requests.delete(f"{API}/components/{cid}", timeout=10)
            except Exception:
                pass


# ---------- Publish endpoint (iteration 4) ----------

class TestPublish:
    def _make_project(self, client, created_ids):
        r = client.post(f"{API}/projects", json={
            "name": "TEST_it4_pub",
            "elements": [{"id": "e1", "html": "<section id='e1'><h1 style='color:red'>Pub</h1></section>"}],
            "canvas_bg": "#eeeeee",
        })
        assert r.status_code == 200
        pid = r.json()["id"]
        created_ids.append(pid)
        return pid

    def test_publish_missing_host(self, client, created_ids):
        pid = self._make_project(client, created_ids)
        r = client.post(f"{API}/projects/{pid}/publish", json={
            "host": "", "username": "u", "password": "p", "protocol": "ftp"
        })
        assert r.status_code == 400, r.text
        assert "host" in r.json().get("detail", "").lower()

    def test_publish_missing_username(self, client, created_ids):
        pid = created_ids[-1]
        r = client.post(f"{API}/projects/{pid}/publish", json={
            "host": "127.0.0.1", "username": "", "password": "p", "protocol": "ftp"
        })
        assert r.status_code == 400, r.text
        assert "username" in r.json().get("detail", "").lower()

    def test_publish_unknown_protocol(self, client, created_ids):
        pid = created_ids[-1]
        r = client.post(f"{API}/projects/{pid}/publish", json={
            "host": "127.0.0.1", "username": "u", "password": "p", "protocol": "webdav"
        })
        assert r.status_code == 400, r.text
        assert "protocol" in r.json().get("detail", "").lower()

    def test_publish_unknown_project_404(self, client):
        r = client.post(f"{API}/projects/nope-xyz/publish", json={
            "host": "127.0.0.1", "username": "u", "password": "p", "protocol": "ftp"
        })
        assert r.status_code == 404, r.text

# ---------- Iteration 6: Snippets CRUD ----------

class TestSnippetsCRUD:
    created = []

    def test_create_snippet(self, client):
        payload = {"name": "TEST_it6_snip", "language": "html", "content": "<h1>hi</h1>", "tags": ["t1"]}
        r = client.post(f"{API}/snippets", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_it6_snip"
        assert d["language"] == "html"
        assert d["content"] == "<h1>hi</h1>"
        assert d["tags"] == ["t1"]
        assert isinstance(d["id"], str) and d["id"]
        TestSnippetsCRUD.created.append(d["id"])

    def test_list_reverse_created(self, client):
        # create second, ensure it comes first in the list
        r = client.post(f"{API}/snippets", json={"name": "TEST_it6_snip2", "content": "x"})
        assert r.status_code == 200
        sid2 = r.json()["id"]
        TestSnippetsCRUD.created.append(sid2)
        lst = client.get(f"{API}/snippets").json()
        # find positions
        ids = [s["id"] for s in lst]
        assert sid2 in ids and TestSnippetsCRUD.created[0] in ids
        assert ids.index(sid2) < ids.index(TestSnippetsCRUD.created[0]), "list should be reverse-created order"

    def test_delete_snippet(self, client):
        sid = TestSnippetsCRUD.created.pop()
        r = client.delete(f"{API}/snippets/{sid}")
        assert r.status_code == 200
        assert r.json().get("ok") is True
        lst = client.get(f"{API}/snippets").json()
        assert not any(s["id"] == sid for s in lst)

    def test_delete_unknown_404(self, client):
        r = client.delete(f"{API}/snippets/nope-xyz")
        assert r.status_code == 404

    @classmethod
    def teardown_class(cls):
        for sid in cls.created:
            try:
                requests.delete(f"{API}/snippets/{sid}", timeout=10)
            except Exception:
                pass


# ---------- Iteration 6: Templates CRUD ----------

class TestTemplatesCRUD:
    created = []

    def test_create_template(self, client):
        payload = {"name": "TEST_it6_tpl", "description": "d", "data": {"pages": [{"id": "home", "name": "Home"}]}}
        r = client.post(f"{API}/templates", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_it6_tpl"
        assert d["description"] == "d"
        assert d["data"]["pages"][0]["id"] == "home"
        assert isinstance(d["id"], str) and d["id"]
        TestTemplatesCRUD.created.append(d["id"])

    def test_list_templates(self, client):
        lst = client.get(f"{API}/templates").json()
        assert isinstance(lst, list)
        assert any(t["id"] == TestTemplatesCRUD.created[0] for t in lst)

    def test_delete_template(self, client):
        tid = TestTemplatesCRUD.created.pop()
        r = client.delete(f"{API}/templates/{tid}")
        assert r.status_code == 200
        assert r.json().get("ok") is True
        lst = client.get(f"{API}/templates").json()
        assert not any(t["id"] == tid for t in lst)

    def test_delete_unknown_404(self, client):
        r = client.delete(f"{API}/templates/nope-xyz")
        assert r.status_code == 404

    @classmethod
    def teardown_class(cls):
        for tid in cls.created:
            try:
                requests.delete(f"{API}/templates/{tid}", timeout=10)
            except Exception:
                pass


# ---------- Iteration 6: Analytics & Preview counter ----------

class TestAnalytics:
    def test_unknown_project_404(self, client):
        r = client.get(f"{API}/projects/nope-xyz/analytics")
        assert r.status_code == 404

    def test_analytics_shape_and_preview_increments(self, client, created_ids):
        # fresh project
        r = client.post(f"{API}/projects", json={"name": "TEST_it6_analytics", "elements": [], "canvas_bg": "#111111"})
        assert r.status_code == 200
        pid = r.json()["id"]
        created_ids.append(pid)

        # baseline
        a0 = client.get(f"{API}/projects/{pid}/analytics")
        assert a0.status_code == 200
        base = a0.json()
        assert set(["total_views", "total_publishes", "recent", "by_day", "project_id"]).issubset(base.keys())
        base_views = base["total_views"]

        # hit preview twice
        assert client.get(f"{API}/preview/{pid}").status_code == 200
        assert client.get(f"{API}/preview/{pid}").status_code == 200

        a1 = client.get(f"{API}/projects/{pid}/analytics").json()
        assert a1["total_views"] >= base_views + 2
        assert isinstance(a1["recent"], list)
        assert isinstance(a1["by_day"], list)


# ---------- Iteration 6: Project pages + template round-trip ----------

class TestPagesAndTemplate:
    def test_pages_active_template_roundtrip(self, client, created_ids):
        payload = {
            "name": "TEST_it6_pages",
            "pages": [
                {"id": "home", "name": "Home", "slug": "index", "status": "draft",
                 "elements": [{"id": "e1", "html": "<h1>Home</h1>"}],
                 "head_html": "", "canvas_bg": "#ffffff", "fonts": [], "seo": {}},
                {"id": "p2", "name": "About", "slug": "about", "status": "review",
                 "elements": [], "head_html": "", "canvas_bg": "#eeeeee", "fonts": [], "seo": {}},
            ],
            "active_page_id": "p2",
            "template": {"header_html": "<header>H</header>", "footer_html": "<footer>F</footer>", "use_template": True},
        }
        r = client.post(f"{API}/projects", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        pid = d["id"]
        created_ids.append(pid)
        assert d["active_page_id"] == "p2"
        assert len(d["pages"]) == 2
        assert d["template"]["use_template"] is True

        g = client.get(f"{API}/projects/{pid}").json()
        assert g["active_page_id"] == "p2"
        assert len(g["pages"]) == 2
        assert g["pages"][0]["id"] == "home"
        assert g["pages"][1]["name"] == "About"
        assert g["template"]["header_html"] == "<header>H</header>"

    def test_preview_seo_meta_and_template_wrapper(self, client, created_ids):
        payload = {
            "name": "TEST_it6_seo",
            "pages": [
                {"id": "home", "name": "Home", "slug": "index", "status": "draft",
                 "elements": [{"id": "e1", "html": "<section id='e1'>MAIN</section>"}],
                 "head_html": "", "canvas_bg": "#ffffff", "fonts": [],
                 "seo": {"description": "hello world", "title": "SEO Title"}},
            ],
            "active_page_id": "home",
            "template": {"header_html": "<header id='wrap-h'>HEADER</header>",
                         "footer_html": "<footer id='wrap-f'>FOOTER</footer>",
                         "use_template": True},
        }
        r = client.post(f"{API}/projects", json=payload)
        assert r.status_code == 200
        pid = r.json()["id"]
        created_ids.append(pid)

        prev = client.get(f"{API}/preview/{pid}")
        assert prev.status_code == 200
        body = prev.text
        assert '<meta name="description" content="hello world"' in body
        assert "<title>SEO Title</title>" in body
        assert "HEADER" in body
        assert "FOOTER" in body
        assert "MAIN" in body
        # ensure header appears before body element and footer after
        assert body.index("HEADER") < body.index("MAIN") < body.index("FOOTER")

    def test_preview_wrapper_disabled_when_use_template_false(self, client, created_ids):
        payload = {
            "name": "TEST_it6_seo_off",
            "pages": [
                {"id": "home", "name": "Home", "slug": "index", "status": "draft",
                 "elements": [{"id": "e1", "html": "<section>MAIN2</section>"}],
                 "head_html": "", "canvas_bg": "#ffffff", "fonts": [], "seo": {}},
            ],
            "active_page_id": "home",
            "template": {"header_html": "<header>WRAP_H</header>",
                         "footer_html": "<footer>WRAP_F</footer>",
                         "use_template": False},
        }
        r = client.post(f"{API}/projects", json=payload)
        pid = r.json()["id"]
        created_ids.append(pid)
        body = client.get(f"{API}/preview/{pid}").text
        assert "MAIN2" in body
        assert "WRAP_H" not in body
        assert "WRAP_F" not in body


# ---------- Existing publish test kept ----------

class TestPublishUnreachable:
    def _make(self, client, created_ids):
        r = client.post(f"{API}/projects", json={"name": "TEST_it4_pub2", "elements": [], "canvas_bg": "#fff"})
        pid = r.json()["id"]
        created_ids.append(pid)
        return pid

    def test_publish_unreachable_host_502(self, client, created_ids):
        pid = created_ids[-1]
        # Hit the backend directly on localhost:8001 — the public ingress
        # (Cloudflare) intercepts backend-emitted 5xx responses and replaces
        # the JSON body with its own HTML error page, which would hide the
        # real backend detail. We still verify the status code + JSON detail.
        r = requests.post(
            f"http://localhost:8001/api/projects/{pid}/publish",
            json={"host": "127.0.0.1", "port": 1, "username": "u",
                  "password": "p", "protocol": "ftp"},
            timeout=60,
        )
        assert r.status_code == 502, f"expected 502, got {r.status_code}: {r.text}"
        detail = r.json().get("detail", "")
        assert "upload failed" in detail.lower(), f"unexpected detail: {detail}"



# ---------- Iteration 7: Publish Presets (encrypted password) ----------

class TestPublishPresets:
    created = []

    def test_list_returns_array(self, client):
        r = client.get(f"{API}/publish-presets")
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_create_with_password_and_fetch_secret(self, client):
        payload = {
            "name": "TEST_it7_preset_saved",
            "host": "ftp.example.com",
            "port": 21,
            "username": "deploy",
            "password": "s3cret-P@ss!",
            "save_password": True,
            "remote_path": "/public_html",
            "protocol": "ftps",
            "include_zip": True,
        }
        r = client.post(f"{API}/publish-presets", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == payload["name"]
        assert d["host"] == payload["host"]
        assert d["username"] == payload["username"]
        assert d["protocol"] == "ftps"
        assert d["include_zip"] is True
        assert d["has_password"] is True
        assert "password" not in d  # public model must not leak plaintext or ciphertext
        assert isinstance(d["id"], str) and d["id"]
        TestPublishPresets.created.append(d["id"])

        # secret endpoint returns the decrypted plaintext
        s = client.get(f"{API}/publish-presets/{d['id']}/secret")
        assert s.status_code == 200
        assert s.json() == {"password": "s3cret-P@ss!"}

        # list surfaces it and has_password stays True
        lst = client.get(f"{API}/publish-presets").json()
        me = next((p for p in lst if p["id"] == d["id"]), None)
        assert me is not None
        assert me["has_password"] is True

    def test_create_without_password_returns_empty_secret(self, client):
        payload = {
            "name": "TEST_it7_preset_nopwd",
            "host": "sftp.example.com",
            "port": 22,
            "username": "deploy",
            "password": "will-not-be-saved",
            "save_password": False,
            "protocol": "sftp",
        }
        r = client.post(f"{API}/publish-presets", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["has_password"] is False
        TestPublishPresets.created.append(d["id"])

        s = client.get(f"{API}/publish-presets/{d['id']}/secret")
        assert s.status_code == 200
        assert s.json() == {"password": ""}

    def test_create_missing_required_400(self, client):
        # missing name
        r1 = client.post(f"{API}/publish-presets", json={"name": "", "host": "h", "username": "u"})
        assert r1.status_code == 400, r1.text
        # missing host
        r2 = client.post(f"{API}/publish-presets", json={"name": "n", "host": "", "username": "u"})
        assert r2.status_code == 400
        # missing username
        r3 = client.post(f"{API}/publish-presets", json={"name": "n", "host": "h", "username": ""})
        assert r3.status_code == 400

    def test_delete_preset_and_verify_removal(self, client):
        # create dedicated preset for deletion
        r = client.post(f"{API}/publish-presets", json={
            "name": "TEST_it7_preset_del", "host": "h", "username": "u",
            "password": "p", "save_password": False,
        })
        pid = r.json()["id"]
        d = client.delete(f"{API}/publish-presets/{pid}")
        assert d.status_code == 200
        assert d.json().get("ok") is True
        lst = client.get(f"{API}/publish-presets").json()
        assert not any(p["id"] == pid for p in lst)
        # secret on deleted returns 404
        assert client.get(f"{API}/publish-presets/{pid}/secret").status_code == 404

    def test_delete_unknown_404(self, client):
        assert client.delete(f"{API}/publish-presets/nope-xyz").status_code == 404

    @classmethod
    def teardown_class(cls):
        for pid in cls.created:
            try:
                requests.delete(f"{API}/publish-presets/{pid}", timeout=10)
            except Exception:
                pass


# ---------- Iteration 7: Starter templates ----------

EXPECTED_STARTER_IDS = [
    "starter-frutiger-aero", "starter-dark-academia", "starter-solar-punk",
    "starter-cottagecore", "starter-y2k", "starter-vaporwave",
    "starter-cyberpunk", "starter-brutalism", "starter-bauhaus",
    "starter-scandi-minimal", "starter-memphis", "starter-retro-futurism",
    "starter-bloomcore", "starter-neubrutalism", "starter-corp-memphis",
    # Iteration 8: 13 new aesthetics
    "starter-kidcore", "starter-blueprint", "starter-editorial-warm",
    "starter-diffused-worlds", "starter-cassette-futurism", "starter-newspaper",
    "starter-barbiecore", "starter-win95", "starter-grunge-zine",
    "starter-art-nouveau", "starter-swiss", "starter-goblincore",
    "starter-dreamcore",
]

EXPECTED_AESTHETIC_SLUGS = {
    "art-nouveau", "barbiecore", "bauhaus", "bloomcore", "blueprint", "brutalism",
    "cassette-futurism", "corp-memphis", "cottagecore", "cyberpunk", "dark-academia",
    "diffused-worlds", "dreamcore", "editorial-warm", "frutiger-aero", "goblincore",
    "grunge-zine", "kidcore", "memphis", "neubrutalism", "newspaper",
    "retro-futurism", "scandi-minimal", "solar-punk", "swiss", "vaporwave",
    "win95", "y2k",
}


class TestStarterTemplates:
    def test_all_28_starters_present_and_first(self, client):
        r = client.get(f"{API}/templates")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        starters = [t for t in arr if t.get("is_starter")]
        # Should have >= 28 total (starters + any user templates)
        assert len(arr) >= 28, f"expected >=28 templates, got {len(arr)}"
        # Exactly 28 starters
        assert len(starters) == 28, f"expected 28 starters, got {len(starters)}"
        # All 28 expected starter ids present, each exactly once (idempotent upsert)
        starter_ids = [t["id"] for t in starters]
        for sid in EXPECTED_STARTER_IDS:
            assert starter_ids.count(sid) == 1, f"starter {sid} count={starter_ids.count(sid)}"
        # Each starter has aesthetic populated
        aesthetic_slugs = set()
        for t in starters:
            assert t.get("aesthetic"), f"missing aesthetic on {t['id']}"
            assert t.get("name")
            assert isinstance(t.get("data"), dict)
            aesthetic_slugs.add(t["aesthetic"])
        # Verify all 28 expected aesthetic slugs are present
        missing = EXPECTED_AESTHETIC_SLUGS - aesthetic_slugs
        assert not missing, f"missing aesthetics: {missing}"
        # Starters appear before user templates in returned order
        first_non_starter = next((i for i, t in enumerate(arr) if not t.get("is_starter")), len(arr))
        # every element before first_non_starter must be a starter
        assert all(arr[i].get("is_starter") for i in range(first_non_starter))

    def test_delete_starter_returns_403(self, client):
        r = client.delete(f"{API}/templates/starter-frutiger-aero")
        assert r.status_code == 403, r.text
        detail = r.json().get("detail", "")
        assert "starter" in detail.lower() and "cannot" in detail.lower()
        # Verify still present
        arr = client.get(f"{API}/templates").json()
        assert any(t["id"] == "starter-frutiger-aero" for t in arr)

    def test_user_template_still_deletable(self, client):
        r = client.post(f"{API}/templates", json={
            "name": "TEST_it7_user_tpl", "description": "x", "data": {"pages": []},
        })
        assert r.status_code == 200
        tid = r.json()["id"]
        assert r.json().get("is_starter") is False
        d = client.delete(f"{API}/templates/{tid}")
        assert d.status_code == 200
        assert d.json().get("ok") is True



# ---------- Iteration 10: Commerce (Stripe) ----------

class TestCommerce:
    def test_commerce_config(self, client):
        r = client.get(f"{API}/commerce/config")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("stripe_enabled") is True
        assert isinstance(d.get("publishable_key"), str)
        assert d.get("mode") == "test"
        assert isinstance(d.get("currencies"), list) and "usd" in d["currencies"]

    def test_payment_link_success(self, client):
        r = client.post(f"{API}/commerce/payment-link", json={
            "name": "TEST_it10_prod", "amount": 12.5, "currency": "usd", "quantity": 1
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d.get("url"), str) and d["url"].startswith("https://buy.stripe.com/")
        assert isinstance(d.get("id"), str) and d["id"]
        assert isinstance(d.get("price_id"), str) and d["price_id"]

    def test_payment_link_empty_name_400(self, client):
        r = client.post(f"{API}/commerce/payment-link", json={
            "name": "", "amount": 5, "currency": "usd", "quantity": 1
        })
        assert r.status_code == 400, r.text

    def test_payment_link_zero_amount_400(self, client):
        r = client.post(f"{API}/commerce/payment-link", json={
            "name": "TEST_it10_zero", "amount": 0, "currency": "usd", "quantity": 1
        })
        assert r.status_code == 400, r.text

    def test_payment_link_negative_amount_400(self, client):
        r = client.post(f"{API}/commerce/payment-link", json={
            "name": "TEST_it10_neg", "amount": -3, "currency": "usd", "quantity": 1
        })
        assert r.status_code == 400, r.text
