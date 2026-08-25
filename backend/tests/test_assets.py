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


class TestVideoUpload:
    """Phase: video upload feature validation. asset_type=video gets its own
    MIME allowlist (mp4/webm/ogg) and a larger 50 MB cap."""

    @pytest.mark.parametrize("ext,ctype,magic", [
        ("mp4", "video/mp4", b"\x00\x00\x00\x18ftypmp42"),
        ("webm", "video/webm", b"\x1a\x45\xdf\xa3EBML"),
        ("ogv", "video/ogg", b"OggS"),
    ])
    def test_accepts_each_video_format(self, client, ext, ctype, magic):
        tc, root = client
        r = tc.post(
            "/api/projects/pv/assets/upload",
            params={"asset_type": "video", "asset_id": "hero"},
            files={"file": ((f"clip.{ext}"), magic + b"payload", ctype)},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        expected = root / "projects" / "pv" / "imgs" / "video-hero" / f"clip.{ext}"
        assert expected.exists()
        assert expected.read_bytes().startswith(magic)

    def test_rejects_video_mime_on_image_path(self, client):
        tc, _ = client
        r = tc.post(
            "/api/projects/pv/assets/upload",
            params={"asset_type": "gallery", "asset_id": "1"},
            files={"file": ("clip.mp4", b"\x00\x00\x00\x18ftypmp42", "video/mp4")},
        )
        assert r.status_code == 400

    def test_rejects_disallowed_video_container(self, client):
        # mkv/avi/mov are not in _ALLOWED_VIDEO_TYPES — must 400, not store
        tc, root = client
        r = tc.post(
            "/api/projects/pv/assets/upload",
            params={"asset_type": "video", "asset_id": "hero"},
            files={"file": ("clip.mkv", b"\x1a\x45\xdf\xa3", "video/x-matroska")},
        )
        assert r.status_code == 400

    def test_50mb_cap_enforced(self, client, monkeypatch):
        # Patching the module constant keeps the test fast while exercising
        # the exact same `len(content) > max_bytes → 413` branch a real
        # oversize upload hits (the endpoint reads the constant at call time).
        monkeypatch.setattr(server, "_MAX_VIDEO_ASSET_BYTES", 100)
        tc, root = client
        r = tc.post(
            "/api/projects/pv/assets/upload",
            params={"asset_type": "video", "asset_id": "hero"},
            files={"file": ("big.mp4", b"x" * 101, "video/mp4")},
        )
        assert r.status_code == 413
        assert "too large" in r.json()["detail"].lower()

    def test_video_at_cap_boundary_accepted(self, client, monkeypatch):
        monkeypatch.setattr(server, "_MAX_VIDEO_ASSET_BYTES", 100)
        tc, root = client
        r = tc.post(
            "/api/projects/pv/assets/upload",
            params={"asset_type": "video", "asset_id": "hero"},
            files={"file": ("edge.mp4", b"x" * 100, "video/mp4")},  # exactly at cap
        )
        assert r.status_code == 200
