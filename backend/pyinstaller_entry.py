"""PyInstaller entrypoint for the desktop sidecar build. Runs the same
FastAPI app as the normal `uvicorn server:app` dev command, but as a
frozen, dependency-free executable — no system Python required on the
end user's machine."""
import os
import sys

import uvicorn

# Import the app object directly (rather than passing uvicorn.run() the
# "server:app" string form) because PyInstaller's static import analysis
# can't follow uvicorn's runtime string-based import — the frozen binary
# would fail with "Could not import module server" at startup otherwise.
import server


def _die_with_parent():
    """On Linux, ask the kernel to SIGTERM this process automatically
    whenever its parent (the Tauri app) dies for ANY reason — including a
    force-kill/crash, which Tauri's own ExitRequested handler can't catch.
    Confirmed necessary: a plain `kill -9` on the parent process left this
    sidecar running indefinitely (holding the port, blocking a relaunch)
    during manual testing. No-op on non-Linux platforms."""
    if sys.platform != "linux":
        return
    try:
        import ctypes

        PR_SET_PDEATHSIG = 1
        libc = ctypes.CDLL("libc.so.6", use_errno=True)
        libc.prctl(PR_SET_PDEATHSIG, 15)  # 15 = SIGTERM
    except Exception:
        pass  # best-effort — missing libc/prctl shouldn't block startup


if __name__ == "__main__":
    _die_with_parent()
    port = int(os.environ.get("PORT", "8787"))
    uvicorn.run(server.app, host="127.0.0.1", port=port, log_level="info")
