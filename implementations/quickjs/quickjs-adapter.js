import { readFileSync } from "fs";
import { WASI } from "wasi";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize WASI
const wasi = new WASI({
  version: "preview1",
  args: process.argv,
  env: process.env,
});

// Load the WASM file
const wasmPath = join(
  __dirname,
  "target/wasm32-wasip1/release/quickjs_transform.wasm"
);
const wasmBytes = readFileSync(wasmPath);

// Create imports object with WASI imports
const importObject = {
  wasi_snapshot_preview1: wasi.wasiImport,
};

// Instantiate the WASM module
const wasmModule = await WebAssembly.instantiate(wasmBytes, importObject);
const wasmInstance = wasmModule.instance;

// Don't call wasi.start() since this is a library, not a command

// Export the transform function
export function transformData(jsonString) {
  try {
    // Log available exports for debugging
    console.log("Available exports:", Object.keys(wasmInstance.exports));

    // Get the exported functions from the WASM instance
    const exports = wasmInstance.exports;

    // Check what functions are available - they might be mangled
    const exportNames = Object.keys(exports);
    console.log("Looking for transform functions...");

    // Look for any function that might be our transform function
    const transformFn = exportNames.find(
      (name) => name.includes("transform") || name.includes("execute")
    );

    if (transformFn) {
      console.log(`Found function: ${transformFn}`);
      try {
        return exports[transformFn](jsonString);
      } catch (e) {
        console.log(
          `Failed with single arg, trying with two args: ${e.message}`
        );
        return exports[transformFn](jsonString, jsonString);
      }
    } else {
      // Try to find any function that looks like it could be ours
      const possibleFns = exportNames.filter(
        (name) => !name.startsWith("__") && typeof exports[name] === "function"
      );
      console.log("Possible functions:", possibleFns);
      throw new Error("No suitable transform functions found in WASM exports");
    }
  } catch (error) {
    throw new Error(`QuickJS transform failed: ${error.message}`);
  }
}
