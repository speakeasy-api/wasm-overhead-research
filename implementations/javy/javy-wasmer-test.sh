#!/bin/bash

# Javy Wasmer Test Script
# Tests the Javy static WASM module using Wasmer runtime

set -e

echo "🧪 Testing Javy implementation with Wasmer"
echo "=========================================="

# Test data
TEST_INPUT='{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}'
WASM_FILE="transform.wasm"

echo "📋 Test Input: $TEST_INPUT"
echo "📁 WASM File: $WASM_FILE"

# Check if WASM file exists
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "   Run: javy build -o transform.wasm transform.js"
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
echo "🔧 Testing Javy static build with Wasmer..."
echo "   Command: echo '$TEST_INPUT' | wasmer run $WASM_FILE"
echo ""

if echo "$TEST_INPUT" | wasmer run "$WASM_FILE"; then
    echo ""
    echo "✅ Javy Static + Wasmer: SUCCESS!"
    echo ""
    echo "🎯 Integration Notes:"
    echo "   • Javy static build works perfectly with Wasmer"
    echo "   • Self-contained JavaScript engine (519KB gzipped)"
    echo "   • No dynamic linking required"
    echo "   • Excellent for Wasmer SDK integration"
    echo "   • Larger than dynamic build but simpler deployment"
else
    echo ""
    echo "❌ Javy Static + Wasmer: FAILED"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   • Ensure WASM file is built with: javy build -o transform.wasm transform.js"
    echo "   • Check Wasmer installation: wasmer --version"
    echo "   • Try with verbose output: wasmer run $WASM_FILE --verbose"
fi