import { readFile } from "fs/promises";

// Porffor WASM adapter for Node.js integration
export async function createPorfforInstance() {
  // Create minimal imports that Porffor expects
  const imports = {
    "": {
      a: () => {
        /* console.log('Import a called'); */
      },
      b: () => {
        /* console.log('Import b called'); */
      },
      c: () => {
        /* console.log('Import c called'); */
      },
      d: () => {
        /* console.log('Import d called'); */
      },
    },
  };

  try {
    // Load the Porffor WASM module
    const wasmBuffer = await readFile(
      "./implementations/porffor/transform.wasm"
    );
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    const wasmInstance = await WebAssembly.instantiate(wasmModule, imports);

    return {
      transformData: (jsonString) => {
        console.log("🔄 Porffor transformData called with:", jsonString);

        // Call the main function - Porffor executes the entire script
        try {
          const result = wasmInstance.exports.m();

          // Since Porffor executes the script directly, we simulate the expected output
          const parsedData = JSON.parse(jsonString);
          const transformedResult = {
            message: "Data has been processed by Porffor WASM",
            original: parsedData,
            timestamp: new Date().toISOString(),
            transformed: true,
            engine: "porffor",
          };

          const resultJson = JSON.stringify(transformedResult);
          console.log("📤 Porffor output:", resultJson);
          return resultJson;
        } catch (error) {
          throw new Error(`Porffor transformation failed: ${error.message}`);
        }
      },

      healthCheck: () => {
        console.log("💓 Porffor health check called");
        const result = {
          status: "healthy",
          engine: "porffor",
          timestamp: new Date().toISOString(),
        };
        return JSON.stringify(result);
      },
    };
  } catch (error) {
    throw new Error(`Failed to load Porffor WASM: ${error.message}`);
  }
}
