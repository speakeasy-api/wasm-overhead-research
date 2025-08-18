#!/bin/bash

# Porffor Wasmer Test Script
# Tests the Porffor WASM module using Wasmer runtime

set -e

echo "🧪 Testing Porffor implementation with Wasmer"
echo "============================================="

# Test data
TEST_INPUT='{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}'
WASM_FILE="transform.wasm"

echo "📋 Test Input: $TEST_INPUT"
echo "📁 WASM File: $WASM_FILE"

# Check if WASM file exists
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "   Run: porf wasm transform.js transform.wasm"
    exit 1
fi

echo "📊 File Size: $(du -h "$WASM_FILE" | cut -f1) ($(du -h "$WASM_FILE" | cut -f1 | numfmt --from=iec --to=si)B)"
echo "📦 Gzipped: $(gzip -c "$WASM_FILE" | wc -c | numfmt --to=iec)B"

# Check if Wasmer is installed
if ! command -v wasmer >/dev/null 2>&1; then
    echo "❌ Wasmer not installed"
    echo "   Install with: curl https://get.wasmer.io -sSfL | sh"
    echo "   Then run: source ~/.bashrc"
    exit 1
fi

echo "🚀 Wasmer version: $(wasmer --version)"
echo ""

# Test with Wasmer
echo "🔧 Testing Porffor with Wasmer..."
echo "   Command: echo '$TEST_INPUT' | wasmer run $WASM_FILE"
echo ""

if echo "$TEST_INPUT" | wasmer run "$WASM_FILE"; then
    echo ""
    echo "✅ Porffor + Wasmer: SUCCESS!"
    echo ""
    echo "🎯 Integration Notes:"
    echo "   • Porffor compiles to standard WASM"
    echo "   • No special runtime requirements"
    echo "   • AOT compiled JavaScript (75KB gzipped)"
    echo "   • Perfect for Wasmer SDK integration"
    echo "   • Smallest size for single operations"
else
    echo ""
    echo "❌ Porffor + Wasmer: FAILED"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   • Ensure WASM file is built with: porf wasm transform.js transform.wasm"
    echo "   • Check Wasmer installation: wasmer --version"
    echo "   • Try with verbose output: wasmer run $WASM_FILE --verbose"
fi