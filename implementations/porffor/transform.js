// Porffor JavaScript implementation for transformData
// This will be compiled directly to WASM using Porffor AOT compiler

function transformData(jsonString) {
  console.log("🔄 transformData called with input:", jsonString);

  if (!jsonString) {
    throw new Error("transformData requires a JSON string argument");
  }

  // Parse the input JSON
  let parsedData;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    throw new Error("Invalid JSON: " + error.message);
  }

  // Create the transformed response
  const result = {
    message: "Data has been processed by Porffor WASM",
    original: parsedData,
    timestamp: new Date().toISOString(),
    transformed: true,
    engine: "porffor",
  };

  const resultJson = JSON.stringify(result);
  console.log("📤 Output JSON:", resultJson);

  return resultJson;
}

function healthCheck() {
  console.log("💓 Health check called");
  const result = {
    status: "healthy",
    engine: "porffor",
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(result);
}

// Export functions for potential module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { transformData, healthCheck };
}

// For testing purposes, we can also expose them globally
globalThis.transformData = transformData;
globalThis.healthCheck = healthCheck;

// Simple test when run directly
if (typeof process !== "undefined" && process.argv && process.argv[2]) {
  const testInput = process.argv[2];
  try {
    const result = transformData(testInput);
    console.log("Test result:", result);
  } catch (error) {
    console.error("Test error:", error.message);
  }
}
