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
    # NOTE: the file itself is named per-worker in pytest_configure below —
    # PYTEST_XDIST_WORKER is NOT reliably set while this module-level code
    # executes (it runs in the controller pre-fork), so resolving it here
    # would silently give every worker the same "main" file.
    _test_sqlite_path = os.path.join(tempfile.gettempdir(), "webdojo_pytest_unresolved.sqlite")
    os.environ["DB_BACKEND"] = "sqlite"
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest


def pytest_configure(config):
    """Runs once per process — including each xdist worker, where
    config.workerinput exists. Resolve the SQLite file HERE so every worker
    gets its own database file before any test module imports server."""
    if os.environ.get("DB_BACKEND") == "sqlite":
        worker = getattr(config, "workerinput", {}).get("workerid", "main") \
            if hasattr(config, "workerinput") else "main"
        path = os.path.join(tempfile.gettempdir(), f"webdojo_pytest_{worker}.sqlite")
        os.environ["SQLITE_PATH"] = path


@pytest.fixture(scope="session", autouse=True)
def _cleanup_test_sqlite():
    """Remove this worker's SQLite file at the end of the session so repeated
    test runs don't carry stale rows between runs."""
    yield
    if os.environ.get("WD_KEEP_DB"):
        return
    path = os.environ.get("SQLITE_PATH")
    if path and os.path.exists(path):
        try:
            os.unlink(path)
        except OSError:
            pass
