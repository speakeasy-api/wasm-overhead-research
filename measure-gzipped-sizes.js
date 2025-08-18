import { readFile, writeFile } from "fs/promises";
import { gzip } from "zlib";
import { promisify } from "util";
import { glob } from "glob";

const gzipAsync = promisify(gzip);

async function measureGzippedSize(filePath) {
  try {
    const data = await readFile(filePath);
    const compressed = await gzipAsync(data);
    return {
      original: data.length,
      gzipped: compressed.length,
      ratio: ((1 - compressed.length / data.length) * 100).toFixed(1),
    };
  } catch (error) {
    return null;
  }
}

async function measureAllWasmFiles() {
  console.log("📊 Measuring gzipped sizes of all WASM binaries...\n");

  // Find all WASM files
  const wasmFiles = await glob("**/*.wasm", { ignore: "node_modules/**" });

  const results = [];

  for (const file of wasmFiles.sort()) {
    const sizes = await measureGzippedSize(file);
    if (sizes) {
      results.push({
        file,
        ...sizes,
      });

      console.log(`${file}:`);
      console.log(`  Original: ${(sizes.original / 1024).toFixed(0)}KB`);
      console.log(
        `  Gzipped:  ${(sizes.gzipped / 1024).toFixed(0)}KB (${
          sizes.ratio
        }% compression)`
      );
      console.log("");
    }
  }

  // Generate summary table
  console.log("=== GZIPPED SIZE SUMMARY ===\n");
  console.log("| File | Original (KB) | Gzipped (KB) | Compression |");
  console.log("|------|---------------|--------------|-------------|");

  for (const result of results) {
    const originalKB = (result.original / 1024).toFixed(0);
    const gzippedKB = (result.gzipped / 1024).toFixed(0);
    console.log(
      `| ${result.file} | ${originalKB} | ${gzippedKB} | ${result.ratio}% |`
    );
  }

  return results;
}

measureAllWasmFiles().catch(console.error);
