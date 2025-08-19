#!/usr/bin/env tsx
/**
 * Wasmer TypeScript runtime evaluation - loads and executes a WASM module
 */

// Note: @wasmer/sdk is primarily for running Wasmer packages
// For basic WASM, we'll use Node's native WebAssembly support
import fs from "fs";
import path from "path";

async function main() {
  // Path to the test WASM module
  const wasmPath = path.join(__dirname, "../../test-modules/add.wasm");
  
  if (!fs.existsSync(wasmPath)) {
    console.error(`Error: WASM file not found at ${wasmPath}`);
    process.exit(1);
  }
  
  // Note: Using Node's native WebAssembly support
  // @wasmer/sdk is for running Wasmer packages from registry
  
  // Load the WASM module
  const wasmBytes = fs.readFileSync(wasmPath);
  const module = await WebAssembly.compile(wasmBytes);
  const instance = await WebAssembly.instantiate(module);
  
  // Get the exported function
  const add = instance.exports.add as (a: number, b: number) => number;
  
  // Call the function
  const result = add(5, 3);
  console.log(`Result of add(5, 3): ${result}`);
  
  // Verify the result
  if (result !== 8) {
    throw new Error(`Expected 8, got ${result}`);
  }
  console.log("✓ Test passed!");
}

main().catch(console.error);