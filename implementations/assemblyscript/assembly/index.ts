import { JSON } from "json-as/assembly";

// Define data structures with @json decorator
@json
class HealthResponse {
  status!: string;
  message!: string;
}

// Health check function
export function healthCheck(): string {
  const response = new HealthResponse();
  response.status = "healthy";
  response.message = "AssemblyScript WASM module is running";
  return JSON.stringify<HealthResponse>(response);
}

// Transform data function with timestamp passed from JS
export function transformDataWithTimestamp(jsonStr: string, isoTimestamp: string): string {
  // Parse arbitrary JSON into a JSON.Value
  let original: JSON.Value;
  original = JSON.parse<JSON.Value>(jsonStr);

  // Create wrapper object
  const wrapper = new JSON.Obj();
  
  // Populate fields
  wrapper.set("original", original);
  wrapper.set("transformed", true);
  wrapper.set("timestamp", isoTimestamp);
  wrapper.set("message", "Data has been processed by AssemblyScript WASM");
  
  // Stringify the complete object
  return wrapper.toString();
}

// Export with the standard name for compatibility
export function transformData(jsonStr: string): string {
  // For backward compatibility, but this shouldn't be used directly
  // The JS adapter will use transformDataWithTimestamp
  return transformDataWithTimestamp(jsonStr, "");
}