#!/usr/bin/env tsx
/**
 * Baseline TypeScript app without Wasmer - for size comparison
 */

function add(a: number, b: number): number {
  return a + b;
}

function main() {
  const result = add(5, 3);
  console.log(`Result of add(5, 3): ${result}`);
  
  if (result !== 8) {
    throw new Error(`Expected 8, got ${result}`);
  }
  console.log("✓ Test passed!");
}

main();