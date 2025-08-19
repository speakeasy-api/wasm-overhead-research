#!/bin/bash
set -e

echo "Creating pre-built test WASM modules..."

# Create tiny.wasm - minimal add function (hand-crafted binary)
# This is a minimal WASM module with just an add function
# Module format: magic(4) + version(4) + sections...
printf '\x00\x61\x73\x6d' > tiny.wasm  # Magic number
printf '\x01\x00\x00\x00' >> tiny.wasm # Version 1

# Type section (function type: (i32, i32) -> i32)
printf '\x01\x07\x01\x60\x02\x7f\x7f\x01\x7f' >> tiny.wasm

# Function section (1 function of type 0)
printf '\x03\x02\x01\x00' >> tiny.wasm

# Export section (export "add")
printf '\x07\x07\x01\x03\x61\x64\x64\x00\x00' >> tiny.wasm

# Code section (function body: get_local 0, get_local 1, i32.add)
printf '\x0a\x09\x01\x07\x00\x20\x00\x20\x01\x6a\x0b' >> tiny.wasm

echo "✓ Created tiny.wasm (minimal add function)"

# For now, we'll skip wasi_hello.wasm and extism_echo.wasm
# These require proper toolchains to build
echo "Note: wasi_hello.wasm and extism_echo.wasm require proper toolchains"
echo "They will be built when testing specific language bindings"

ls -lh tiny.wasm