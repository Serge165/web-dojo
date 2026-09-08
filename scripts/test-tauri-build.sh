#!/bin/bash
# Quick Tauri multi-platform build test script

set -e

PROJECT_ROOT="/home/januszeal/Downloads/web-dojo-main"
BUILD_OUTPUT="$PROJECT_ROOT/src-tauri/target/release/bundle"

echo "🚀 Web Dojo Tauri Build Test"
echo "================================"
echo ""

# Source Rust environment
echo "📦 Loading Rust environment..."
source $HOME/.cargo/env

# Navigate to project
cd "$PROJECT_ROOT"
echo "📁 Working directory: $PWD"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."
if ! command -v pkg-config &> /dev/null; then
    echo "❌ pkg-config not found"
    exit 1
fi
# Probe via pkg-config rather than the package manager so this works on any distro.
missing=""
pkg-config --exists webkit2gtk-4.1 || missing="$missing libwebkit2gtk-4.1-dev"
# linuxdeploy-plugin-gtk reads librsvg-2.0's libdir; without the .pc file the
# AppImage bundling step dies as an opaque "failed to run linuxdeploy".
pkg-config --exists librsvg-2.0 || missing="$missing librsvg2-dev"
if [ -n "$missing" ]; then
    echo "❌ Missing dev packages:$missing"
    echo "   Run: sudo apt install -y$missing"
    exit 1
fi
echo "✅ Dependencies OK"
echo ""

# Build frontend first
echo "🎨 Building frontend..."
cd frontend
npm run build:tauri > /dev/null 2>&1 || npm run build > /dev/null 2>&1
echo "✅ Frontend built"
echo ""

# Build Tauri
echo "🔨 Building Tauri (this may take 5-10 minutes)..."
cd ../src-tauri
cargo tauri build --verbose

echo ""
echo "================================"
echo "✅ Build Complete!"
echo ""
echo "📦 Output bundles:"
ls -lh "$BUILD_OUTPUT"/appimage/ 2>/dev/null && echo "  ✓ AppImage" || echo "  ✗ AppImage"
ls -lh "$BUILD_OUTPUT"/deb/ 2>/dev/null && echo "  ✓ DEB" || echo "  ✗ DEB"
ls -lh "$BUILD_OUTPUT"/rpm/ 2>/dev/null && echo "  ✓ RPM" || echo "  ✗ RPM"

echo ""
echo "🧪 Quick verification:"
if [ -f "$BUILD_OUTPUT/appimage/Web"*.AppImage ]; then
    APPIMAGE=$(ls "$BUILD_OUTPUT/appimage/Web"*.AppImage | head -1)
    echo "  ✓ AppImage: $APPIMAGE"
    echo "  To test: chmod +x '$APPIMAGE' && '$APPIMAGE'"
else
    echo "  ✗ No AppImage found"
fi

echo ""
echo "📝 Next steps:"
echo "  1. Test AppImage: chmod +x <file> && ./<file>"
echo "  2. Test DEB: sudo dpkg -i <deb-file>"
echo "  3. Test RPM: sudo rpm -i <rpm-file>"
echo ""
echo "📚 Full guide: See TAURI_BUILD_GUIDE.md"
