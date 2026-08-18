"""PyInstaller entrypoint for the desktop sidecar build. Runs the same
FastAPI app as the normal `uvicorn server:app` dev command, but as a
frozen, dependency-free executable — no system Python required on the
end user's machine."""
import os

import uvicorn

# Import the app object directly (rather than passing uvicorn.run() the
# "server:app" string form) because PyInstaller's static import analysis
# can't follow uvicorn's runtime string-based import — the frozen binary
# would fail with "Could not import module server" at startup otherwise.
import server

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8787"))
    uvicorn.run(server.app, host="127.0.0.1", port=port, log_level="info")
