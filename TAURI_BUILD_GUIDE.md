# Web Dojo Tauri Multi-Platform Build Guide

**Date:** September 6, 2026  
**Status:** Setup in progress  
**Platforms:** AppImage, DEB, RPM, EXE, MSI, DMG

---

## Quick Start

### Current System State
- ✅ Rust 1.98.1 installed
- ✅ Cargo toolchain ready
- ✅ Tauri 2.11.3 configured
- ✅ Backend binary pre-built: `/backend/dist/webdojo-backend`
- ✅ Frontend build scripts configured
- ✅ tauri.conf.json updated with all targets

### Build Targets Configuration

**Linux (Ubuntu 26.04) - Builds all three targets:**
Updated `src-tauri/tauri.conf.json` with:
```json
"targets": [
  "appimage",     // Linux AppImage (self-contained executable)
  "deb",          // Debian/Ubuntu package
  "rpm"           // RedHat/Fedora/CentOS package
]
```

**Note:** Windows (exe, msi) and macOS (dmg) targets require native builds on those platforms or separate cross-compilation setup. Use the platform-specific build guides below.

---

## Platform-Specific Requirements

### Linux (AppImage, DEB, RPM) ✅ Buildable on Ubuntu 26.04

**Installed:**
- ✅ Rust 1.98.1
- ✅ gcc
- ✅ openssl
- ✅ pkg-config

**Required system packages:**
```bash
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libssl-dev \
  libxcb1-dev \
  libcairo2-dev \
  libpango1.0-dev \
  libfuse-dev \
  libglib2.0-dev \
  librsvg2-dev
```

**Notes:**
- Use **4.1**, not 4.0 — `webkit2gtk-4.0` is deprecated and unavailable on Ubuntu 26.04.
- `librsvg2-dev` is non-obvious but **required**: `linuxdeploy-plugin-gtk` calls
  `pkg-config --variable=libdir librsvg-2.0` to locate the SVG pixbuf loader.
  Ubuntu ships the runtime `librsvg-2.so.2` without the `.pc` file, so without
  this package the plugin exits 1 and Tauri reports only the generic
  `failed to bundle project: 'failed to run linuxdeploy'` with no further detail.

**Status:** ✅ AppImage, DEB and RPM all building.

---

### Windows (EXE, MSI) ⚠️ Requires Cross-Compilation

**Option A: Cross-compile from Ubuntu**
- Install MinGW-w64 toolchain
- Add Windows targets to Rust: `rustup target add x86_64-pc-windows-gnu`
- Known issue: Some Tauri plugins may not work with GNU toolchain

**Option B: Build on Windows (Recommended)**
- Windows machine or VM with Rust installed
- Visual Studio Build Tools (for MSVC toolchain)
- Quicker, fewer compatibility issues

---

### macOS (DMG) ⚠️ Requires Cross-Compilation

**Only viable on macOS or VM**
- Install Xcode Command Line Tools
- Add macOS targets if cross-compiling: `rustup target add aarch64-apple-darwin x86_64-apple-darwin`
- Code signing required for distribution (Apple Developer certificate)

---

## Build Commands

### Linux Builds (Ready to Run)

**Build all Linux targets:**
```bash
cd /home/januszeal/Downloads/web-dojo-main
source $HOME/.cargo/env
cd src-tauri
cargo tauri build
```

**Build a single bundle format** (use `--bundles`, *not* `--target` — `--target`
expects a Rust target triple and will fail with
`Target appimage does not exist. Please run 'rustup target list'`):
```bash
cargo tauri build --bundles appimage
cargo tauri build --bundles deb
cargo tauri build --bundles rpm
```

**Output location:** `src-tauri/target/release/bundle/`
- AppImage: `target/release/bundle/appimage/Web\ Dojo_*.AppImage`
- DEB: `target/release/bundle/deb/webdojo_*.deb`
- RPM: `target/release/bundle/rpm/webdojo-*.rpm`

---

### Windows Builds

**From Windows (MSVC - Recommended):**
```bash
cd src-tauri
cargo tauri build --bundles nsis,msi
```

`--target` takes a **Rust target triple**, not a bundle name. Bundle formats come
from `bundle.targets` in `tauri.conf.json`, or from `--bundles` on the CLI.
`cargo tauri build --target exe` fails with
`Target exe does not exist. Please run 'rustup target list'`.

**From Ubuntu (GNU, not recommended):**
```bash
rustup target add x86_64-pc-windows-gnu
cargo build --target x86_64-pc-windows-gnu --release
# Then manually bundle with tauri
```

---

### macOS Builds

**From macOS:**
```bash
cd src-tauri
cargo tauri build --bundles dmg
```

**Code signing (if distributing):**
Edit `src-tauri/tauri.conf.json`:
```json
"bundle": {
  "macOS": {
    "signingIdentity": "Developer ID Application: Your Name",
    "entitlements": null,
    "provisioningProfile": null
  }
}
```

---

## Development Workflow

### Start Dev Server
```bash
cd frontend && REACT_APP_BACKEND_URL=http://127.0.0.1:8787 npm start
```

### Start Tauri Dev (runs app in dev mode)
```bash
cd src-tauri
source $HOME/.cargo/env
cargo tauri dev
```

This:
1. Watches frontend for changes
2. Runs app with live reload
3. Opens DevTools console

---

## Next Steps

### Immediate (Today)
1. [x] Complete Linux dependency installation via `sudo apt install`
2. [x] Test Linux build: `cargo tauri build`
3. [x] Verify AppImage, DEB, RPM outputs in `src-tauri/target/release/bundle/`
4. [x] Test AppImage on Ubuntu 26.04 — launches, window opens, backend sidecar
       binds `127.0.0.1:8787`

### Short Term
1. [ ] Set up Windows build environment (VM or native machine)
2. [ ] Build EXE and MSI installers
3. [ ] Test installations on Windows

### Future
1. [ ] Set up macOS build environment
2. [ ] Configure code signing for distribution
3. [ ] Set up CI/CD pipeline (GitHub Actions) for automated builds
4. [ ] Create release process documentation

---

## CI/CD Pipeline (Optional - GitHub Actions)

When ready, automate multi-platform builds:

```yaml
# .github/workflows/build.yml
name: Tauri Build

on:
  push:
    tags: ['v*']

jobs:
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: rust-lang/rust-toolchain@v1
      - run: cargo tauri build
      
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: rust-lang/rust-toolchain@v1
      - run: cargo tauri build
      
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: rust-lang/rust-toolchain@v1
      - run: cargo tauri build
```

---

## Troubleshooting

### "webkit2gtk-4.0 not found" / `javascriptcore-rs-sys` build script fails
```bash
sudo apt install libwebkit2gtk-4.1-dev
```
4.0 is deprecated on Ubuntu 26.04; 4.1 is the correct package.

### "libfuse.so.2 not found"
```bash
sudo apt install libfuse-dev
```

### "failed to bundle project: `failed to run linuxdeploy`"
Tauri discards the linuxdeploy plugin's stderr, so this message appears with no
cause attached — `RUST_LOG=debug` does not reveal it either. Reproduce the step
by hand against the already-populated AppDir to see the real error:

```bash
cd src-tauri/target/release/bundle/appimage
APPIMAGE_EXTRACT_AND_RUN=1 NO_STRIP=true \
  ~/.cache/tauri/linuxdeploy-x86_64.AppImage \
  --appimage-extract-and-run --appdir "Web Dojo.AppDir" --plugin gtk --output appimage
```

The usual cause on Ubuntu 26.04 is a missing `librsvg-2.0.pc`:
```
there is no 'libdir' variable for 'librsvg-2.0' library.
ERROR: Failed to run plugin: gtk (exit code: 1)
```
Fix with `sudo apt install librsvg2-dev`.

### Frontend not loading in dev mode
Verify backend is running:
```bash
./backend/dist/webdojo-backend
# Should output: "Server running on http://127.0.0.1:8787"
```

### Tauri build fails with "icon not found"
Icons must exist at:
- `src-tauri/icons/32x32.png`
- `src-tauri/icons/128x128.png`
- `src-tauri/icons/128x128@2x.png`
- `src-tauri/icons/icon.icns` (macOS)
- `src-tauri/icons/icon.ico` (Windows)

---

## File Structure

```
web-dojo-main/
├── src-tauri/
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Build configuration (UPDATED ✅)
│   ├── icons/               # Platform icons
│   ├── src/                 # Rust source code
│   ├── capabilities/        # Tauri capability definitions
│   └── target/
│       └── release/bundle/  # Output bundles (after build)
├── frontend/
│   ├── package.json         # build:tauri script configured ✅
│   ├── src/
│   └── build/               # Built frontend (input to Tauri)
├── backend/
│   └── dist/webdojo-backend # Pre-built backend binary ✅
└── TAURI_BUILD_GUIDE.md     # This file
```

---

## Configuration Reference

**tauri.conf.json - Key Sections:**

```json
{
  "build": {
    "frontendDist": "../frontend/build",     // Built React app
    "devUrl": "http://localhost:3000",       // Dev server
    "beforeDevCommand": "cd frontend && ...", // Start dev server
    "beforeBuildCommand": "cd frontend && npm run build:tauri"  // Build frontend
  },
  "bundle": {
    "targets": ["appimage", "deb", "rpm", "exe", "msi", "dmg"],
    "externalBin": ["../backend/dist/webdojo-backend"],  // Bundle backend
    "icon": [...]  // Platform-specific icons
  }
}
```

---

## Performance Notes

- **Build time:** ~5-10 minutes first build, ~2-3 minutes incremental
- **Output sizes:**
  - AppImage: ~120-150 MB (self-contained)
  - DEB: ~80-100 MB
  - RPM: ~80-100 MB
  - EXE/MSI: ~100-130 MB
- **Dependencies:** Includes Chromium-based WebView (Tauri requirement)

---

## Rollback Plan

If any issues occur during dependency installation:
```bash
# Revert tauri.conf.json to original targets
git checkout src-tauri/tauri.conf.json

# Clean build artifacts
cargo clean -p app
```

---

**Linux builds verified on Ubuntu 26.04: AppImage, DEB and RPM all produced by `cargo tauri build`.**
