"""Tests for the Phase 2D asset upload endpoint. Uses WEBDOJO_ASSETS_DIR
(via monkeypatch of server.ASSETS_ROOT) so nothing is written to the real
assets/ tree."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(server, "ASSETS_ROOT", tmp_path)
    return TestClient(server.app), tmp_path


class TestAssetUpload:
    def test_upload_gallery_image(self, client):
        tc, root = client
        r = tc.post(
            "/api/projects/p1/assets/upload",
            params={"asset_type": "gallery", "asset_id": "1"},
            files={"file": ("My Holiday Photo.JPG", b"\xff\xd8\xff\xe0fakejpeg", "image/jpeg")},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["filename"] == "my-holiday-photo.jpg"
        expected = root / "projects" / "p1" / "imgs" / "gallery-1" / "my-holiday-photo.jpg"
        assert expected.exists()
        assert expected.read_bytes() == b"\xff\xd8\xff\xe0fakejpeg"

    def test_rejects_non_image(self, client):
        tc, _ = client
        r = tc.post(
            "/api/projects/p1/assets/upload",
            params={"asset_type": "gallery", "asset_id": "1"},
            files={"file": ("evil.exe", b"MZ...", "application/x-msdownload")},
        )
        assert r.status_code == 400

    def test_rejects_bad_asset_type(self, client):
        tc, _ = client
        r = tc.post(
            "/api/projects/p1/assets/upload",
            params={"asset_type": "hacks", "asset_id": "1"},
            files={"file": ("x.png", b"\x89PNG", "image/png")},
        )
        assert r.status_code == 422

    def test_asset_id_is_slugified(self, client):
        tc, root = client
        r = tc.post(
            "/api/projects/p2/assets/upload",
            params={"asset_type": "bento", "asset_id": "../../etc"},
            files={"file": ("a.png", b"\x89PNG", "image/png")},
        )
        assert r.status_code == 200
        # traversal characters never reach the path — only [a-z0-9-]
        assert ".." not in str(r.json()["url"])
