import { transformData } from "./quickjs-adapter.js";

const testData = JSON.stringify({
  users: [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ],
});

console.log("Testing QuickJS implementation...");
console.log("Input:", testData);

try {
  const result = transformData(testData);
  console.log("Output:", result);
  console.log("✅ QuickJS implementation working!");
} catch (error) {
  console.error("❌ QuickJS implementation failed:", error.message);
}
