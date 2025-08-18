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

// Initialize WASI even though we don't have _start
// This is needed for memory operations to work properly
wasi.initialize(wasmInstance);

// Helper functions to work with C strings
function allocateString(wasmInstance, str) {
  const bytes = new TextEncoder().encode(str + "\0"); // null-terminated
  const ptr = wasmInstance.exports.malloc
    ? wasmInstance.exports.malloc(bytes.length)
    : null;
  if (!ptr) {
    // Fallback: use memory directly (this is a simplified approach)
    const memory = wasmInstance.exports.memory;
    const memoryView = new Uint8Array(memory.buffer);
    // Find some free space (this is very basic - in production you'd want proper allocation)
    const offset = 1024; // Start at 1KB offset
    memoryView.set(bytes, offset);
    return offset;
  }
  const memoryView = new Uint8Array(wasmInstance.exports.memory.buffer);
  memoryView.set(bytes, ptr);
  return ptr;
}

function readString(wasmInstance, ptr) {
  if (!ptr) return null;
  const memory = wasmInstance.exports.memory;
  const memoryView = new Uint8Array(memory.buffer);

  // Find the null terminator
  let length = 0;
  while (memoryView[ptr + length] !== 0) {
    length++;
  }

  const bytes = memoryView.slice(ptr, ptr + length);
  return new TextDecoder().decode(bytes);
}

// Export the transform function
export function transformData(jsonString) {
  try {
    console.log("QuickJS-WASI: Using direct C exports");
    console.log("Available exports:", Object.keys(wasmInstance.exports));

    const { transform_data, free_string } = wasmInstance.exports;

    if (!transform_data) {
      throw new Error("transform_data function not found in WASM exports");
    }

    // Allocate input string
    const inputPtr = allocateString(wasmInstance, jsonString);

    // Call the transform function
    const resultPtr = transform_data(inputPtr);

    if (!resultPtr) {
      throw new Error("transform_data returned null");
    }

    // Read the result
    const result = readString(wasmInstance, resultPtr);

    // Free the result string
    if (free_string) {
      free_string(resultPtr);
    }

    return result;
  } catch (error) {
    throw new Error(`QuickJS-WASI transform failed: ${error.message}`);
  }
}

// Export alternative function
export function executeJS(jsCode, inputData) {
  try {
    console.log("QuickJS-WASI: Using execute_js function");

    const { execute_js, free_string } = wasmInstance.exports;

    if (!execute_js) {
      throw new Error("execute_js function not found in WASM exports");
    }

    // Allocate input strings
    const jsCodePtr = allocateString(wasmInstance, jsCode);
    const inputDataPtr = allocateString(wasmInstance, inputData);

    // Call the execute function
    const resultPtr = execute_js(jsCodePtr, inputDataPtr);

    if (!resultPtr) {
      throw new Error("execute_js returned null");
    }

    // Read the result
    const result = readString(wasmInstance, resultPtr);

    // Free the result string
    if (free_string) {
      free_string(resultPtr);
    }

    return result;
  } catch (error) {
    throw new Error(`QuickJS-WASI execute_js failed: ${error.message}`);
  }
}
