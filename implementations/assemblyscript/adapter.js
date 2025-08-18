import { instantiate } from "@assemblyscript/loader";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load and instantiate the WASM module
export async function loadWasm() {
  const wasmPath = path.join(__dirname, "build", "release.wasm");
  const wasmBuffer = await fs.readFile(wasmPath);
  
  const { exports } = await instantiate(wasmBuffer, {
    env: {
      "console.log": (msgPtr) => {
        console.log(exports.__getString(msgPtr));
      }
    }
  });
  
  const {
    memory,
    __newString,
    __getString,
    transformDataWithTimestamp,
    healthCheck
  } = exports;
  
  return {
    // Promise-based API for compatibility with tests
    async transformData(jsonString) {
      try {
        // Generate ISO timestamp in JavaScript
        const isoTimestamp = new Date().toISOString();
        
        // Marshal strings to/from WASM
        const jsonPtr = __newString(jsonString);
        const timestampPtr = __newString(isoTimestamp);
        const resultPtr = transformDataWithTimestamp(jsonPtr, timestampPtr);
        const result = __getString(resultPtr);
        
        return result;
      } catch (error) {
        // Match Go behavior on parse errors
        throw new Error(`failed to parse input JSON: ${error.message}`);
      }
    },
    
    async healthCheck() {
      try {
        const resultPtr = healthCheck();
        const result = __getString(resultPtr);
        return result;
      } catch (error) {
        throw new Error(`health check failed: ${error.message}`);
      }
    }
  };
}

// Export individual functions for testing
let wasmInstance = null;

export async function transformData(jsonString) {
  if (!wasmInstance) {
    wasmInstance = await loadWasm();
  }
  return wasmInstance.transformData(jsonString);
}

export async function healthCheck() {
  if (!wasmInstance) {
    wasmInstance = await loadWasm();
  }
  return wasmInstance.healthCheck();
}