#!/bin/bash
set -e

echo "Building test WASM modules..."

# Build tiny.wasm from WAT
if command -v wat2wasm &> /dev/null; then
    wat2wasm tiny.wat -o tiny.wasm
    echo "✓ Built tiny.wasm"
else
    echo "⚠ wat2wasm not found. Install wabt to build tiny.wasm"
fi

# Build WASI hello world
if command -v clang &> /dev/null; then
    clang --target=wasm32-wasi -O3 -o wasi_hello.wasm wasi_hello.c
    echo "✓ Built wasi_hello.wasm"
else
    echo "⚠ clang not found. Install clang with wasi-sdk to build wasi_hello.wasm"
fi

# Build Extism plugin
if command -v cargo &> /dev/null; then
    cd extism_echo
    cargo build --target wasm32-unknown-unknown --release
    cp target/wasm32-unknown-unknown/release/extism_echo.wasm ../extism_echo.wasm
    cd ..
    echo "✓ Built extism_echo.wasm"
else
    echo "⚠ cargo not found. Install Rust to build extism_echo.wasm"
fi

echo "Build complete!"
ls -lh *.wasm 2>/dev/null || echo "No WASM files built yet"