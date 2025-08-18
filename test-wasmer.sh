#!/bin/bash

# Wasmer Test Script for WASI-Compatible Implementations
# This script tests all WASI-compatible WASM modules with Wasmer

set -e

echo "🧪 Testing WASM implementations with Wasmer runtime"
echo "=================================================="

# Test data
TEST_INPUT='{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}'

echo ""
echo "📋 Test Input: $TEST_INPUT"
echo ""

# Function to test a WASM file with Wasmer
test_wasmer() {
    local name="$1"
    local wasm_file="$2"
    local extra_args="$3"
    
    echo "🔧 Testing $name..."
    
    if [ ! -f "$wasm_file" ]; then
        echo "❌ WASM file not found: $wasm_file"
        return 1
    fi
    
    echo "   File: $wasm_file"
    echo "   Size: $(du -h "$wasm_file" | cut -f1)"
    
    # Source Wasmer environment if available
    if [ -f "/home/trist/.wasmer/wasmer.sh" ]; then
        source /home/trist/.wasmer/wasmer.sh
    fi
    
    # Test with Wasmer
    if command -v wasmer >/dev/null 2>&1; then
        echo "   Running with Wasmer..."
        if echo "$TEST_INPUT" | wasmer run "$wasm_file" $extra_args 2>/dev/null; then
            echo "   ✅ $name: SUCCESS"
        else
            echo "   ❌ $name: FAILED"
        fi
    else
        echo "   ⚠️  Wasmer not installed - install with: curl https://get.wasmer.io -sSfL | sh"
        echo "   ⚠️  Then run: source ~/.bashrc or source /home/trist/.wasmer/wasmer.sh"
    fi
    echo ""
}

# Test Javy implementation (WASI)
echo "1️⃣  JAVY (JavaScript-to-WASM with WASI)"
if [ -f "implementations/javy/transform_dynamic.wasm" ] && [ -f "implementations/javy/plugin.wasm" ]; then
    echo "   Note: Javy uses dynamic linking - requires plugin.wasm"
    echo "   Plugin: $(du -h implementations/javy/plugin.wasm | cut -f1)"
    echo "   Module: $(du -h implementations/javy/transform_dynamic.wasm | cut -f1)"
    # Note: Javy dynamic modules need special handling with plugin
    echo "   ⚠️  Javy dynamic modules require special plugin loading (not standard WASI)"
else
    echo "   ❌ Javy WASM files not found - run: make build-javy IMPL=javy"
fi
echo ""

# Test Porffor implementation (Standard WASM)
echo "2️⃣  PORFFOR (AOT JavaScript-to-WASM)"
test_wasmer "Porffor" "implementations/porffor/transform.wasm"

# Test QuickJS implementation (WASI)
echo "3️⃣  QUICKJS (Rust + QuickJS JavaScript Engine)"
test_wasmer "QuickJS" "implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm"

echo "📊 Summary:"
echo "   ✅ Porffor: Standard WASM (Wasmer compatible)"
echo "   ✅ QuickJS: WASI target (Wasmer compatible)"
echo "   ⚠️  Javy: Dynamic linking (needs special handling)"
echo "   ❌ Go/TinyGo: Node.js specific (wasm_exec.js runtime)"
echo "   ❌ Goja: Node.js specific (wasm_exec.js runtime)"
echo ""
echo "🎯 For Wasmer SDK integration, focus on:"
echo "   • QuickJS (286KB) - Full JS engine with WASI"
echo "   • Porffor (75KB) - AOT compiled JS with standard WASM"