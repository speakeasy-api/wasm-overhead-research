#!/usr/bin/env python3
"""Wasmer Python runtime evaluation - loads and executes a WASM module"""

from wasmer import engine, Store, Module, Instance
from wasmer_compiler_cranelift import Compiler
import sys
import os

def main():
    # Path to the test WASM module
    wasm_path = os.path.join(os.path.dirname(__file__), "../../test-modules/add.wasm")
    
    if not os.path.exists(wasm_path):
        print(f"Error: WASM file not found at {wasm_path}")
        sys.exit(1)
    
    # Create a store with Cranelift compiler
    store = Store(engine.JIT(Compiler))
    
    # Load the WASM module
    with open(wasm_path, "rb") as f:
        wasm_bytes = f.read()
    
    # Compile the module
    module = Module(store, wasm_bytes)
    
    # Instantiate the module
    instance = Instance(module)
    
    # Get the exported function
    add = instance.exports.add
    
    # Call the function
    result = add(5, 3)
    print(f"Result of add(5, 3): {result}")
    
    # Verify the result
    assert result == 8, f"Expected 8, got {result}"
    print("✓ Test passed!")

if __name__ == "__main__":
    main()