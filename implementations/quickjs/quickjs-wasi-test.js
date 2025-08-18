import { transformData } from "./quickjs-wasi-adapter.js";

const testData = JSON.stringify({
  users: [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ],
});

console.log("Testing QuickJS-WASI implementation...");
console.log("Input:", testData);

try {
  const result = transformData(testData);
  console.log("Output:", result);
  console.log("✅ QuickJS-WASI implementation working!");
} catch (error) {
  console.error("❌ QuickJS-WASI implementation failed:", error.message);
}
