import path from "path";
import { promisify } from "util";
import { gunzip } from "zlib";
import { readFile, access } from "fs/promises";

export const gunzipAsync = promisify(gunzip);

// Helper to call Go functions directly (they return promises already)
export function callGoFunction(fn: any, ...args: any[]): Promise<string> {
  return fn(...args);
}

// Check if current build is using Javy
async function isJavyBuild(): Promise<boolean> {
  try {
    // Check if javy-adapter.js exists in the current implementation
    const javyAdapterPath = path.join(
      __dirname,
      "implementations/javy/javy-adapter.js"
    );
    await access(javyAdapterPath);

    // Also check if the current symlink points to javy implementation
    const mainGoPath = path.join(__dirname, "main.go");
    try {
      const mainGoContent = await readFile(mainGoPath, "utf8");
      // This is a simple heuristic - in a real implementation you might check the symlink target
      return false; // Go implementations will have main.go
    } catch {
      // If main.go doesn't exist, might be a Javy build
      return true;
    }
  } catch {
    return false;
  }
}

/**
 * Get a WASM function from the global object. Handles both Go/TinyGo and Javy implementations.
 */
export async function getWasmFunction(name: string, promisify: boolean = true) {
  // Check if this is a Javy build
  if (await isJavyBuild()) {
    // For Javy, import the adapter directly
    const javyAdapterPath = path.join(
      __dirname,
      "implementations/javy/javy-adapter.js"
    );
    const javyAdapter = await import(javyAdapterPath);
    return javyAdapter[name];
  }

  // Original Go/TinyGo WASM loading logic
  // Load the wasm_exec.js file to set up the Go runtime
  const wasmExecPath = path.join(__dirname, "assets/wasm/wasm_exec.js");
  const wasmExecCode = await readFile(wasmExecPath, "utf8");

  // Create a safe execution context for wasm_exec.js
  // This handles both Go and TinyGo wasm_exec.js files
  const safeEval = new Function(
    "globalThis",
    `
    // Set up global reference for TinyGo compatibility
    if (typeof global === 'undefined') {
      var global = globalThis;
    }
    ${wasmExecCode}
  `
  );

  // Execute the wasm_exec.js code to set up the Go class
  safeEval(globalThis);

  const gzippedBuffer = await readFile(
    path.join(__dirname, "assets/wasm/lib.wasm.gz")
  );

  // Decompress the gzipped buffer
  const wasmBuffer = await gunzipAsync(gzippedBuffer);

  // Instantiate the WASM module
  const go = new (globalThis as any).Go();
  const result = await WebAssembly.instantiate(wasmBuffer, go.importObject);

  go.run(result.instance);

  // Get the global functions
  const global = globalThis as unknown as { [key: string]: any };
  return global[name];
}
