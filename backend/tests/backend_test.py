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
