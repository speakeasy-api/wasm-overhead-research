import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Set the test timeout to 30 seconds (default is 5000ms)
    // The WASM tests should take a little over 5 seconds to run
    testTimeout: 30_000,
    environment: "jsdom",
    // Disable watch mode and parallelism due to WASM's single threaded nature
    watch: false,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
