#!/usr/bin/env python3
"""Create proper test WASM modules for runtime evaluation"""

import os
import hashlib

# Minimal add function WASM module
# This is a properly formatted WASM module with an add function
# Format: (module (func $add (param i32 i32) (result i32) (i32.add (local.get 0) (local.get 1))) (export "add" (func $add)))
ADD_WASM = bytes([
    # Magic number and version
    0x00, 0x61, 0x73, 0x6d,  # \0asm
    0x01, 0x00, 0x00, 0x00,  # version 1
    
    # Type section - id: 1
    0x01,  # section id
    0x07,  # section size
    0x01,  # number of types
    0x60,  # function type
    0x02,  # number of parameters
    0x7f,  # i32
    0x7f,  # i32
    0x01,  # number of results
    0x7f,  # i32
    
    # Function section - id: 3
    0x03,  # section id
    0x02,  # section size
    0x01,  # number of functions
    0x00,  # function 0 has type 0
    
    # Export section - id: 7
    0x07,  # section id
    0x07,  # section size
    0x01,  # number of exports
    0x03,  # string length
    0x61, 0x64, 0x64,  # "add"
    0x00,  # export kind: function
    0x00,  # function index
    
    # Code section - id: 10
    0x0a,  # section id
    0x09,  # section size
    0x01,  # number of functions
    0x07,  # function body size
    0x00,  # number of local declarations
    0x20,  # local.get
    0x00,  # local index 0
    0x20,  # local.get
    0x01,  # local index 1
    0x6a,  # i32.add
    0x0b,  # end
])

# Simple WASI hello world that just returns 42
# This is a minimal WASI module
WASI_HELLO = bytes([
    # Magic number and version
    0x00, 0x61, 0x73, 0x6d,  # \0asm
    0x01, 0x00, 0x00, 0x00,  # version 1
    
    # Type section
    0x01,  # section id
    0x05,  # section size
    0x01,  # number of types
    0x60,  # function type
    0x00,  # no parameters
    0x01,  # one result
    0x7f,  # i32
    
    # Function section
    0x03,  # section id
    0x02,  # section size
    0x01,  # number of functions
    0x00,  # function 0 has type 0
    
    # Export section
    0x07,  # section id
    0x09,  # section size
    0x01,  # number of exports
    0x05,  # string length
    0x68, 0x65, 0x6c, 0x6c, 0x6f,  # "hello"
    0x00,  # export kind: function
    0x00,  # function index
    
    # Code section
    0x0a,  # section id
    0x06,  # section size
    0x01,  # number of functions
    0x04,  # function body size
    0x00,  # no locals
    0x41, 0x2a,  # i32.const 42
    0x0b,  # end
])

def main():
    """Create test WASM modules"""
    
    # Write add.wasm
    with open("add.wasm", "wb") as f:
        f.write(ADD_WASM)
    print(f"✓ Created add.wasm ({len(ADD_WASM)} bytes)")
    print(f"  SHA256: {hashlib.sha256(ADD_WASM).hexdigest()}")
    
    # Write wasi_hello.wasm
    with open("wasi_hello.wasm", "wb") as f:
        f.write(WASI_HELLO)
    print(f"✓ Created wasi_hello.wasm ({len(WASI_HELLO)} bytes)")
    print(f"  SHA256: {hashlib.sha256(WASI_HELLO).hexdigest()}")
    
    # Create README with module info
    readme = """# Test WASM Modules

These are minimal WASM modules used for testing runtime overhead.

## add.wasm
- **Size**: {} bytes
- **SHA256**: {}
- **Exports**: add(i32, i32) -> i32
- **Description**: Simple addition function for basic runtime testing
- **Source**: Hand-crafted binary (equivalent to WAT: (module (func $add (param i32 i32) (result i32) (i32.add (local.get 0) (local.get 1))) (export "add" (func $add))))

## wasi_hello.wasm  
- **Size**: {} bytes
- **SHA256**: {}
- **Exports**: hello() -> i32
- **Description**: Minimal WASI module that returns 42
- **Source**: Hand-crafted binary (returns constant value, no actual WASI imports)

## extism_echo.wasm
- **Note**: Requires Extism PDK to build. Will be created when needed for Extism-specific tests.
""".format(
        len(ADD_WASM),
        hashlib.sha256(ADD_WASM).hexdigest(),
        len(WASI_HELLO),
        hashlib.sha256(WASI_HELLO).hexdigest()
    )
    
    with open("README.md", "w") as f:
        f.write(readme)
    print("✓ Created README.md with module documentation")

if __name__ == "__main__":
    main()