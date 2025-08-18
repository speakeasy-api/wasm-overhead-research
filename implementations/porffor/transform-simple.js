// Simplified Porffor implementation - AOT compilation entry point
// Porffor compiles this as the main function

// Test data for AOT compilation
const testInput = '{"name":"test","value":42}';

console.log("🔄 Porffor WASM starting with input:", testInput);

try {
  // Parse the input JSON
  const parsedData = JSON.parse(testInput);

  // Create the transformed response
  const result = {
    message: "Data has been processed by Porffor WASM",
    original: parsedData,
    timestamp: "2025-08-18T01:52:00.000Z", // Fixed timestamp for AOT
    transformed: true,
    engine: "porffor",
  };

  const resultJson = JSON.stringify(result);
  console.log("📤 Porffor output:", resultJson);

  // Success indicator
  console.log("✅ Porffor transformation completed successfully");
} catch (error) {
  console.log("❌ Porffor error:", error.message);
}
