import os
import sys
import tempfile
from pathlib import Path

# Add the backend directory to sys.path so tests can import server
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# ---------------------------------------------------------------------------
# Default to the SQLite test backend.
#
# server.py creates a process-global DB client at *import* time (line 54:
# `client, db = _build_client()`).  When DB_BACKEND is unset it builds an
# AsyncIOMotorClient pointing at MONGO_URL — lazy by design, but the first
# query (or any TestClient lifespan that calls _ensure_live_client →
# _build_client) will block forever if no MongoDB is listening.  In CI /
# local dev MongoDB is rarely running, so the suite hangs.
#
# Setting DB_BACKEND=sqlite here (before any test module does `import server`)
# makes every worker use the SQLite shim (sqlite_compat.py) instead — the same
# backend the production desktop/Tauri build uses.  Tests that really need
# MongoDB can still set DB_BACKEND=mongodb before importing server.
# ---------------------------------------------------------------------------
if os.environ.get("DB_BACKEND", "").lower() not in ("sqlite", "mongo", "mongodb", "mongodb+srv"):
    _test_sqlite_path = os.path.join(tempfile.gettempdir(), "webdojo_pytest.sqlite")
    os.environ["DB_BACKEND"] = "sqlite"
    os.environ["SQLITE_PATH"] = _test_sqlite_path
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest


@pytest.fixture(scope="session", autouse=True)
def _cleanup_test_sqlite():
    """Remove the shared SQLite file at the end of the session so repeated
    test runs don't carry stale data between xdist workers."""
    yield
    for path in (
        os.environ.get("SQLITE_PATH"),
        os.path.join(tempfile.gettempdir(), "webdojo_pytest.sqlite"),
    ):
        if path and os.path.exists(path):
            try:
                os.unlink(path)
            except OSError:
                pass
