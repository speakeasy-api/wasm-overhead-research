import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import init, { transform_data, execute_js } from "./pkg/quickjs_transform.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the WASM file directly
const wasmPath = join(__dirname, "pkg/quickjs_transform_bg.wasm");
const wasmBytes = readFileSync(wasmPath);

// Initialize the WASM module with the bytes
await init(wasmBytes);

// Export the transform function
export function transformData(jsonString) {
  try {
    console.log("Rust: Using transform_data function");
    return transform_data(jsonString);
  } catch (error) {
    throw new Error(`Rust transform failed: ${error.message}`);
  }
}

// Export alternative function
export function executeJS(jsCode, inputData) {
  try {
    console.log("Rust: Using execute_js function");
    return execute_js(jsCode, inputData);
  } catch (error) {
    throw new Error(`Rust execute_js failed: ${error.message}`);
  }
}
