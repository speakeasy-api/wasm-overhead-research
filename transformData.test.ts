import { describe, it, expect, beforeAll } from "vitest";
import { getWasmFunction } from "./testHelpers";

describe("transformData", () => {
  let transformData: any;
  let healthCheck: any;

  beforeAll(async () => {
    // Get the WASM functions
    transformData = await getWasmFunction("transformData");
    healthCheck = await getWasmFunction("healthCheck");
  });

  it("should perform health check", async () => {
    const result = await healthCheck();
    const parsed = JSON.parse(result);

    expect(parsed.status).toBe("healthy");
    expect(parsed.message).toBe("Go WASM module is running");
  });

  it("should transform simple JSON object", async () => {
    const input = JSON.stringify({ name: "test", value: 42 });
    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original).toEqual({ name: "test", value: 42 });
    expect(parsed.transformed).toBe(true);
    expect(parsed.message).toBe("Data has been processed by Go WASM");
    expect(parsed.timestamp).toBeDefined();
  });

  it("should transform JSON array", async () => {
    const input = JSON.stringify([1, 2, 3, "test"]);
    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original).toEqual([1, 2, 3, "test"]);
    expect(parsed.transformed).toBe(true);
    expect(parsed.message).toBe("Data has been processed by Go WASM");
  });

  it("should transform nested JSON object", async () => {
    const input = JSON.stringify({
      user: {
        id: 1,
        name: "John Doe",
        preferences: {
          theme: "dark",
          notifications: true,
        },
      },
      metadata: {
        created: "2023-01-01",
        version: "1.0",
      },
    });

    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original.user.name).toBe("John Doe");
    expect(parsed.original.user.preferences.theme).toBe("dark");
    expect(parsed.transformed).toBe(true);
  });

  it("should handle empty JSON object", async () => {
    const input = JSON.stringify({});
    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original).toEqual({});
    expect(parsed.transformed).toBe(true);
  });

  it("should handle JSON with null values", async () => {
    const input = JSON.stringify({ value: null, active: false });
    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original.value).toBeNull();
    expect(parsed.original.active).toBe(false);
    expect(parsed.transformed).toBe(true);
  });

  it("should handle string values", async () => {
    const input = JSON.stringify("simple string");
    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original).toBe("simple string");
    expect(parsed.transformed).toBe(true);
  });

  it("should handle numeric values", async () => {
    const input = JSON.stringify(123.45);
    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original).toBe(123.45);
    expect(parsed.transformed).toBe(true);
  });

  it("should handle boolean values", async () => {
    const input = JSON.stringify(true);
    const result = await transformData(input);
    const parsed = JSON.parse(result);

    expect(parsed.original).toBe(true);
    expect(parsed.transformed).toBe(true);
  });

  it("should throw error for invalid JSON", async () => {
    const input = "invalid json {";

    await expect(transformData(input)).rejects.toThrow();
  });

  it("should throw error when no arguments provided", async () => {
    await expect((transformData as any)()).rejects.toThrow();
  });
});
