#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test data
const testData = {
  tiny: JSON.stringify({ name: 'test', value: 42 }), // ~30 bytes
  small: JSON.stringify({ users: Array(10).fill(null).map((_, i) => ({ id: i, name: `User${i}` })) }), // ~300 bytes  
  medium: JSON.stringify({ records: Array(100).fill(null).map((_, i) => ({ id: i, data: `Data${i}`.repeat(10) })) }), // ~5KB
  large: JSON.stringify({ items: Array(1000).fill(null).map((_, i) => ({ id: i, payload: `Payload${i}`.repeat(50) })) }) // ~500KB
};

// Calculate data sizes
const dataSizes = {};
for (const [key, value] of Object.entries(testData)) {
  dataSizes[key] = new TextEncoder().encode(value).length;
}

async function measureWasmSize(wasmPath) {
  if (!fs.existsSync(wasmPath)) {
    return { raw: 0, gzipped: 0 };
  }
  
  const rawSize = fs.statSync(wasmPath).size;
  const wasmBuffer = fs.readFileSync(wasmPath);
  const gzipped = zlib.gzipSync(wasmBuffer, { level: 9 });
  
  return {
    raw: rawSize,
    gzipped: gzipped.length
  };
}

async function benchmarkImplementation(name, wasmPath, iterations = 10) {
  console.log(`\nBenchmarking ${name}...`);
  
  const results = {
    name,
    sizes: await measureWasmSize(wasmPath),
    coldStart: [],
    warmExecution: {},
    throughput: {},
    memory: {}
  };
  
  // Measure cold start (WebAssembly compilation)
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      const wasmBuffer = fs.readFileSync(wasmPath);
      await WebAssembly.compile(wasmBuffer);
      const elapsed = performance.now() - start;
      results.coldStart.push(elapsed);
    } catch (error) {
      console.error(`  Cold start error: ${error.message}`);
    }
  }
  
  // Load module once for warm benchmarks
  let module, instance;
  try {
    const wasmBuffer = fs.readFileSync(wasmPath);
    module = await WebAssembly.compile(wasmBuffer);
    
    // Try to instantiate with minimal imports
    const imports = {
      env: { memory: new WebAssembly.Memory({ initial: 1 }) },
      wasi_snapshot_preview1: {}
    };
    instance = await WebAssembly.instantiate(module, imports);
  } catch (error) {
    console.log(`  Instantiation requires specific runtime: ${error.message}`);
  }
  
  // For each data size, measure execution time (if we can instantiate)
  if (instance) {
    for (const [size, data] of Object.entries(testData)) {
      results.warmExecution[size] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // Try to find and call the transform function
        try {
          if (instance.exports.transform) {
            instance.exports.transform(data);
          }
        } catch (error) {
          // Expected for most implementations without proper setup
        }
        const elapsed = performance.now() - start;
        results.warmExecution[size].push(elapsed);
      }
      
      // Calculate throughput
      const avgTime = results.warmExecution[size].reduce((a, b) => a + b, 0) / results.warmExecution[size].length;
      results.throughput[size] = dataSizes[size] / (avgTime / 1000) / (1024 * 1024); // MB/s
    }
  }
  
  // Memory usage (baseline)
  const memUsage = process.memoryUsage();
  results.memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 10) / 10,
    external: Math.round(memUsage.external / 1024 / 1024 * 10) / 10
  };
  
  return results;
}

async function main() {
  console.log('JavaScript to WebAssembly Benchmark');
  console.log('====================================');
  console.log('\nData sizes:');
  for (const [key, size] of Object.entries(dataSizes)) {
    console.log(`  ${key}: ${size} bytes (${(size/1024).toFixed(2)} KB)`);
  }
  
  const implementations = [
    { name: 'AssemblyScript', path: 'implementations/assemblyscript/build/release.wasm' },
    { name: 'QuickJS', path: 'implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm' },
    { name: 'Porffor', path: 'implementations/porffor/transform.wasm' },
  ];
  
  // Check for Go/TinyGo builds
  if (fs.existsSync('assets/wasm/lib.wasm.gz')) {
    // Decompress first
    try {
      const gzipped = fs.readFileSync('assets/wasm/lib.wasm.gz');
      const decompressed = zlib.gunzipSync(gzipped);
      fs.writeFileSync('assets/wasm/lib.wasm', decompressed);
      
      // Try to determine which implementation it is
      const stats = fs.statSync('assets/wasm/lib.wasm');
      if (stats.size < 500000) {
        implementations.push({ name: 'TinyGo', path: 'assets/wasm/lib.wasm' });
      } else if (stats.size < 5000000) {
        implementations.push({ name: 'Go', path: 'assets/wasm/lib.wasm' });
      } else {
        implementations.push({ name: 'Go+Goja', path: 'assets/wasm/lib.wasm' });
      }
    } catch (error) {
      console.error('Error decompressing Go WASM:', error.message);
    }
  }
  
  const allResults = [];
  
  for (const impl of implementations) {
    if (fs.existsSync(impl.path)) {
      const result = await benchmarkImplementation(impl.name, impl.path);
      allResults.push(result);
      
      // Print summary
      console.log(`  Size: ${(result.sizes.raw/1024).toFixed(1)}KB raw, ${(result.sizes.gzipped/1024).toFixed(1)}KB gzipped`);
      if (result.coldStart.length > 0) {
        const avgCold = result.coldStart.reduce((a, b) => a + b, 0) / result.coldStart.length;
        console.log(`  Cold start: ${avgCold.toFixed(2)}ms`);
      }
      console.log(`  Memory: ${result.memory.heapUsed}MB heap`);
    } else {
      console.log(`\n${impl.name}: Not built (${impl.path} not found)`);
    }
  }
  
  // Write CSV results
  console.log('\nWriting results to CSV...');
  
  const csvHeader = 'Implementation,Raw Size (KB),Gzipped (KB),Compression %,Cold Start (ms),Memory (MB)';
  const csvRows = [csvHeader];
  
  for (const result of allResults) {
    const avgCold = result.coldStart.length > 0 
      ? (result.coldStart.reduce((a, b) => a + b, 0) / result.coldStart.length).toFixed(2)
      : 'N/A';
    
    const compression = result.sizes.raw > 0 
      ? ((1 - result.sizes.gzipped / result.sizes.raw) * 100).toFixed(1)
      : '0';
    
    csvRows.push([
      result.name,
      (result.sizes.raw / 1024).toFixed(1),
      (result.sizes.gzipped / 1024).toFixed(1),
      compression,
      avgCold,
      result.memory.heapUsed
    ].join(','));
  }
  
  const csvContent = csvRows.join('\n');
  fs.writeFileSync(path.join(__dirname, 'results', 'benchmark-summary.csv'), csvContent);
  
  // Create detailed size comparison
  console.log('\n=== SIZE COMPARISON ===');
  console.log('Implementation | Raw WASM | Gzipped | Compression | vs Smallest');
  console.log('---------------|----------|---------|-------------|------------');
  
  const sorted = allResults.sort((a, b) => a.sizes.gzipped - b.sizes.gzipped);
  const smallest = sorted[0]?.sizes.gzipped || 1;
  
  for (const result of sorted) {
    const ratio = (result.sizes.gzipped / smallest).toFixed(1);
    const compression = ((1 - result.sizes.gzipped / result.sizes.raw) * 100).toFixed(1);
    console.log(
      `${result.name.padEnd(14)} | ${(result.sizes.raw/1024).toFixed(1).padStart(8)}KB | ${(result.sizes.gzipped/1024).toFixed(1).padStart(7)}KB | ${compression.padStart(11)}% | ${ratio}x`
    );
  }
  
  console.log('\n✅ Benchmark complete! Results saved to results/benchmark-summary.csv');
}

main().catch(console.error);