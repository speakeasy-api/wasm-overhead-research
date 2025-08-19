#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test data for transformations
const testData = {
  small: { name: 'John', value: 42 },
  medium: { 
    users: Array(100).fill(null).map((_, i) => ({ 
      id: i, 
      name: `User ${i}`, 
      email: `user${i}@example.com`,
      metadata: { created: Date.now(), active: true }
    }))
  },
  large: {
    records: Array(10000).fill(null).map((_, i) => ({
      id: i,
      data: `Sample data ${i}`.repeat(10),
      nested: { value: Math.random() * 1000 }
    }))
  }
};

const implementations = [
  {
    name: 'assemblyscript',
    wasmPath: 'implementations/assemblyscript/build/release.wasm',
    adapter: 'implementations/assemblyscript/adapter.js',
    buildCmd: 'mise run build:assemblyscript:optimized',
    runtime: 'native'
  },
  {
    name: 'tinygo-optimized',
    wasmPath: 'assets/wasm/lib.wasm',
    adapter: null,
    buildCmd: 'mise run build:basic:tinygo:optimized',
    runtime: 'go',
    execJs: 'assets/wasm/wasm_exec.js'
  },
  {
    name: 'quickjs',
    wasmPath: 'implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm',
    adapter: 'implementations/quickjs/quickjs-wasi-adapter.js',
    buildCmd: 'mise run build:quickjs',
    runtime: 'wasi'
  },
  {
    name: 'porffor',
    wasmPath: 'implementations/porffor/transform.wasm',
    adapter: 'implementations/porffor/porffor-adapter.js',
    buildCmd: 'mise run build:porffor:optimized',
    runtime: 'native'
  },
  {
    name: 'javy',
    wasmPath: 'implementations/javy/transform.wasm',
    adapter: 'implementations/javy/javy-adapter.js',
    buildCmd: 'mise run build:javy',
    runtime: 'wasi'
  },
  {
    name: 'go-basic',
    wasmPath: 'assets/wasm/lib.wasm',
    adapter: null,
    buildCmd: 'mise run build:basic:go:optimized',
    runtime: 'go',
    execJs: 'assets/wasm/wasm_exec.js'
  },
  {
    name: 'go-goja',
    wasmPath: 'assets/wasm/lib.wasm',
    adapter: null,
    buildCmd: 'mise run build:goja:go:optimized',
    runtime: 'go',
    execJs: 'assets/wasm/wasm_exec.js'
  }
];

class WasmBenchmark {
  constructor(impl) {
    this.impl = impl;
    this.results = {
      name: impl.name,
      wasmSize: 0,
      gzippedSize: 0,
      coldStartMs: [],
      executionMs: {
        small: [],
        medium: [],
        large: []
      },
      throughputMBps: {
        small: 0,
        medium: 0,
        large: 0
      },
      memoryUsageMB: {
        baseline: 0,
        afterLoad: 0,
        peak: 0
      },
      errors: []
    };
  }

  async measureSizes() {
    try {
      const stats = fs.statSync(this.impl.wasmPath);
      this.results.wasmSize = stats.size;
      
      // Measure gzipped size
      execSync(`gzip -c "${this.impl.wasmPath}" > /tmp/temp.wasm.gz`);
      const gzStats = fs.statSync('/tmp/temp.wasm.gz');
      this.results.gzippedSize = gzStats.size;
      fs.unlinkSync('/tmp/temp.wasm.gz');
    } catch (error) {
      this.results.errors.push(`Size measurement: ${error.message}`);
    }
  }

  async measureColdStart(iterations = 5) {
    for (let i = 0; i < iterations; i++) {
      try {
        // Force garbage collection if available
        if (global.gc) global.gc();
        
        const startTime = performance.now();
        const wasmBuffer = fs.readFileSync(this.impl.wasmPath);
        
        if (this.impl.runtime === 'wasi') {
          const { WASI } = await import('wasi');
          const wasi = new WASI({
            args: [],
            env: {},
            preopens: {}
          });
          
          const module = await WebAssembly.compile(wasmBuffer);
          const instance = await WebAssembly.instantiate(module, {
            wasi_snapshot_preview1: wasi.wasiImport
          });
          
          wasi.initialize(instance);
        } else if (this.impl.runtime === 'go') {
          // Go runtime initialization
          const Go = (await import(path.join(__dirname, this.impl.execJs))).default;
          const go = new Go();
          
          const module = await WebAssembly.compile(wasmBuffer);
          const instance = await WebAssembly.instantiate(module, go.importObject);
          
          go.run(instance);
        } else {
          // Native WASM
          const module = await WebAssembly.compile(wasmBuffer);
          await WebAssembly.instantiate(module);
        }
        
        const endTime = performance.now();
        this.results.coldStartMs.push(endTime - startTime);
        
      } catch (error) {
        this.results.errors.push(`Cold start iteration ${i}: ${error.message}`);
      }
    }
  }

  async measureExecution(iterations = 10) {
    try {
      // Load the appropriate adapter
      let transform;
      
      if (this.impl.adapter) {
        const adapterModule = await import(path.join(__dirname, this.impl.adapter));
        transform = adapterModule.default || adapterModule.transform;
      } else if (this.impl.runtime === 'go') {
        // For Go implementations, we need special handling
        // This would require a custom adapter per Go implementation
        console.warn(`Skipping execution benchmark for ${this.impl.name} - Go runtime adapter needed`);
        return;
      }

      for (const [size, data] of Object.entries(testData)) {
        const jsonStr = JSON.stringify(data);
        const dataSize = new TextEncoder().encode(jsonStr).length;
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          try {
            await transform(jsonStr);
          } catch (error) {
            this.results.errors.push(`Execution ${size} iteration ${i}: ${error.message}`);
            continue;
          }
          
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          
          this.results.executionMs[size].push(executionTime);
          
          // Calculate throughput (MB/s)
          if (executionTime > 0) {
            const throughput = (dataSize / (1024 * 1024)) / (executionTime / 1000);
            if (i === iterations - 1) {
              this.results.throughputMBps[size] = throughput;
            }
          }
        }
      }
    } catch (error) {
      this.results.errors.push(`Execution setup: ${error.message}`);
    }
  }

  async measureMemory() {
    try {
      // Baseline memory
      if (global.gc) global.gc();
      const baseline = process.memoryUsage();
      this.results.memoryUsageMB.baseline = baseline.heapUsed / (1024 * 1024);
      
      // Load WASM module
      const wasmBuffer = fs.readFileSync(this.impl.wasmPath);
      const module = await WebAssembly.compile(wasmBuffer);
      const instance = await WebAssembly.instantiate(module);
      
      const afterLoad = process.memoryUsage();
      this.results.memoryUsageMB.afterLoad = afterLoad.heapUsed / (1024 * 1024);
      
      // Run a large transformation to measure peak
      if (this.impl.adapter) {
        const adapterModule = await import(path.join(__dirname, this.impl.adapter));
        const transform = adapterModule.default || adapterModule.transform;
        
        await transform(JSON.stringify(testData.large));
        
        const peak = process.memoryUsage();
        this.results.memoryUsageMB.peak = peak.heapUsed / (1024 * 1024);
      }
    } catch (error) {
      this.results.errors.push(`Memory measurement: ${error.message}`);
    }
  }

  async run() {
    console.log(`\nBenchmarking ${this.impl.name}...`);
    
    // Build if needed
    if (!fs.existsSync(this.impl.wasmPath)) {
      console.log(`  Building ${this.impl.name}...`);
      try {
        execSync(this.impl.buildCmd, { stdio: 'inherit' });
      } catch (error) {
        this.results.errors.push(`Build failed: ${error.message}`);
        return this.results;
      }
    }
    
    await this.measureSizes();
    console.log(`  Size: ${(this.results.wasmSize / 1024).toFixed(1)}KB (${(this.results.gzippedSize / 1024).toFixed(1)}KB gzipped)`);
    
    await this.measureColdStart();
    const avgColdStart = this.results.coldStartMs.reduce((a, b) => a + b, 0) / this.results.coldStartMs.length;
    console.log(`  Cold start: ${avgColdStart.toFixed(2)}ms`);
    
    await this.measureExecution();
    for (const size of ['small', 'medium', 'large']) {
      if (this.results.executionMs[size].length > 0) {
        const avg = this.results.executionMs[size].reduce((a, b) => a + b, 0) / this.results.executionMs[size].length;
        console.log(`  Execution (${size}): ${avg.toFixed(2)}ms, ${this.results.throughputMBps[size].toFixed(2)} MB/s`);
      }
    }
    
    await this.measureMemory();
    console.log(`  Memory: ${this.results.memoryUsageMB.baseline.toFixed(1)}MB → ${this.results.memoryUsageMB.afterLoad.toFixed(1)}MB → ${this.results.memoryUsageMB.peak.toFixed(1)}MB`);
    
    if (this.results.errors.length > 0) {
      console.log(`  Errors: ${this.results.errors.length}`);
    }
    
    return this.results;
  }

  toCSV() {
    const avgColdStart = this.results.coldStartMs.length > 0 
      ? this.results.coldStartMs.reduce((a, b) => a + b, 0) / this.results.coldStartMs.length 
      : 0;
    
    const avgExecSmall = this.results.executionMs.small.length > 0
      ? this.results.executionMs.small.reduce((a, b) => a + b, 0) / this.results.executionMs.small.length
      : 0;
    
    const avgExecMedium = this.results.executionMs.medium.length > 0
      ? this.results.executionMs.medium.reduce((a, b) => a + b, 0) / this.results.executionMs.medium.length
      : 0;
    
    const avgExecLarge = this.results.executionMs.large.length > 0
      ? this.results.executionMs.large.reduce((a, b) => a + b, 0) / this.results.executionMs.large.length
      : 0;
    
    return [
      this.results.name,
      this.results.wasmSize,
      this.results.gzippedSize,
      avgColdStart.toFixed(3),
      avgExecSmall.toFixed(3),
      avgExecMedium.toFixed(3),
      avgExecLarge.toFixed(3),
      this.results.throughputMBps.small.toFixed(2),
      this.results.throughputMBps.medium.toFixed(2),
      this.results.throughputMBps.large.toFixed(2),
      this.results.memoryUsageMB.baseline.toFixed(2),
      this.results.memoryUsageMB.afterLoad.toFixed(2),
      this.results.memoryUsageMB.peak.toFixed(2),
      this.results.errors.length
    ].join(',');
  }
}

async function main() {
  console.log('JavaScript to WebAssembly Benchmark Suite');
  console.log('==========================================');
  
  const results = [];
  const csvHeader = 'Implementation,WASM Size (bytes),Gzipped Size (bytes),Cold Start (ms),Exec Small (ms),Exec Medium (ms),Exec Large (ms),Throughput Small (MB/s),Throughput Medium (MB/s),Throughput Large (MB/s),Memory Baseline (MB),Memory Loaded (MB),Memory Peak (MB),Errors';
  
  for (const impl of implementations) {
    const benchmark = new WasmBenchmark(impl);
    const result = await benchmark.run();
    results.push(result);
    
    // Write individual CSV
    const csvContent = csvHeader + '\n' + benchmark.toCSV();
    fs.writeFileSync(path.join(__dirname, 'results', `${impl.name}.csv`), csvContent);
  }
  
  // Write combined CSV
  const combinedCSV = csvHeader + '\n' + 
    results.map(r => {
      const benchmark = new WasmBenchmark({ name: r.name });
      benchmark.results = r;
      return benchmark.toCSV();
    }).join('\n');
  
  fs.writeFileSync(path.join(__dirname, 'results', 'all-implementations.csv'), combinedCSV);
  
  console.log('\n✅ Benchmark complete! Results saved to results/');
}

// Run with --expose-gc flag for better memory measurements
main().catch(console.error);