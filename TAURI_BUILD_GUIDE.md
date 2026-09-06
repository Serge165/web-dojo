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

**Linux (Fedora) - Builds all three targets:**
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

### Linux (AppImage, DEB, RPM) ✅ Buildable on Fedora

**Installed:**
- ✅ Rust 1.98.1
- ✅ gcc
- ✅ openssl
- ✅ pkg-config

**Required (not yet installed via sudo):**
```bash
sudo dnf install -y \
  webkit2gtk-4.0-devel \
  openssl-devel \
  libxcb-devel \
  cairo-devel \
  pango-devel \
  libfuse-devel \
  glib2-devel
```

**Status:** User installing libfuse-devel for AppImage support

---

### Windows (EXE, MSI) ⚠️ Requires Cross-Compilation

**Option A: Cross-compile from Fedora**
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

**Build specific target:**
```bash
cargo tauri build -- --target appimage
cargo tauri build -- --target deb
cargo tauri build -- --target rpm
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
cargo tauri build -- --target exe
cargo tauri build -- --target msi
```

**From Fedora (GNU, not recommended):**
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
cargo tauri build -- --target dmg
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
1. [ ] Complete Linux dependency installation via `sudo dnf install`
2. [ ] Test Linux build: `cargo tauri build`
3. [ ] Verify AppImage, DEB, RPM outputs in `src-tauri/target/release/bundle/`
4. [ ] Test AppImage on Fedora

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

### "webkit2gtk-4.0 not found"
```bash
sudo dnf install webkit2gtk-4.0-devel
```

### "libfuse.so.2 not found"
```bash
sudo dnf install libfuse-devel
```

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

**Ready for Linux build testing. Next: Complete `sudo dnf install` step and test `cargo tauri build`.**
