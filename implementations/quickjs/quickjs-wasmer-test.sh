#!/bin/bash

# QuickJS Wasmer Test Script
# Tests the QuickJS WASM module using Wasmer runtime

set -e

echo "🧪 Testing QuickJS implementation with Wasmer"
echo "============================================="

# Test data
TEST_INPUT='{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}'
WASM_FILE="target/wasm32-wasip1/release/quickjs_transform.wasm"

echo "📋 Test Input: $TEST_INPUT"
echo "📁 WASM File: $WASM_FILE"

# Check if WASM file exists
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "   Run: cargo build --target wasm32-wasip1 --release"
    exit 1
fi

echo "📊 File Size: $(du -h "$WASM_FILE" | cut -f1) ($(du -h "$WASM_FILE" | cut -f1 | numfmt --from=iec --to=si)B)"
echo "📦 Gzipped: $(gzip -c "$WASM_FILE" | wc -c | numfmt --to=iec)B"

# Source Wasmer environment if available
if [ -f "/home/trist/.wasmer/wasmer.sh" ]; then
    source /home/trist/.wasmer/wasmer.sh
fi

# Check if Wasmer is installed
if ! command -v wasmer >/dev/null 2>&1; then
    echo "❌ Wasmer not installed"
    echo "   Install with: curl https://get.wasmer.io -sSfL | sh"
    echo "   Then run: source ~/.bashrc or source /home/trist/.wasmer/wasmer.sh"
    exit 1
fi

echo "🚀 Wasmer version: $(wasmer --version)"
echo ""

# Test with Wasmer
echo "🔧 Testing QuickJS with Wasmer..."
echo "   Command: echo '$TEST_INPUT' | wasmer run $WASM_FILE"
echo ""

if echo "$TEST_INPUT" | wasmer run "$WASM_FILE"; then
    echo ""
    echo "✅ QuickJS + Wasmer: SUCCESS!"
    echo ""
    echo "🎯 Integration Notes:"
    echo "   • QuickJS uses WASI target (wasm32-wasip1)"
    echo "   • Compatible with Wasmer runtime out of the box"
    echo "   • Full JavaScript engine (286KB gzipped)"
    echo "   • Excellent for Wasmer SDK integration"
else
    echo ""
    echo "❌ QuickJS + Wasmer: FAILED"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   • Ensure WASM file is built with: cargo build --target wasm32-wasip1 --release"
    echo "   • Check Wasmer installation: wasmer --version"
    echo "   • Try with verbose output: wasmer run $WASM_FILE --verbose"
fi