import { transformData } from "./rust-adapter.js";

const testData = JSON.stringify({
  users: [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ],
});

console.log("Testing Rust implementation...");
console.log("Input:", testData);

try {
  const result = transformData(testData);
  console.log("Output:", result);
  console.log("✅ Rust implementation working!");
} catch (error) {
  console.error("❌ Rust implementation failed:", error.message);
}
