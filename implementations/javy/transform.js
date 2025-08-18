// Javy JavaScript implementation for transformData
// This reads JSON from stdin and writes transformed JSON to stdout

function transformData(jsonString) {
  let parsedData;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }

  // Create the transformed response
  const result = {
    message: "Data has been processed by Javy WASM",
    original: parsedData,
    timestamp: new Date().toISOString(),
    transformed: true,
    engine: "javy",
  };

  return JSON.stringify(result);
}

function healthCheck() {
  return JSON.stringify({
    status: "healthy",
    engine: "javy",
    timestamp: new Date().toISOString(),
  });
}

// Main execution - read from stdin, transform, write to stdout
function main() {
  try {
    // Read all input from stdin
    let input = "";
    const stdin = 0;
    const buffer = new Uint8Array(1024);

    while (true) {
      const bytesRead = Javy.IO.readSync(stdin, buffer);
      if (bytesRead === 0) break;

      const chunk = new TextDecoder().decode(buffer.subarray(0, bytesRead));
      input += chunk;
    }

    // Trim whitespace
    input = input.trim();

    if (!input) {
      throw new Error("No input provided");
    }

    // Transform the data
    const result = transformData(input);

    // Write result to stdout
    const stdout = 1;
    const outputBytes = new TextEncoder().encode(result);
    Javy.IO.writeSync(stdout, outputBytes);
  } catch (error) {
    // Write error to stderr
    const stderr = 2;
    const errorBytes = new TextEncoder().encode(`Error: ${error.message}\n`);
    Javy.IO.writeSync(stderr, errorBytes);

    // Exit with error code
    process.exit(1);
  }
}

// Run main function
main();
