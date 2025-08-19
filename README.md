# WASM Overhead research

## Size Comparison

*Data location: `results/size-comparison.csv`*

| Implementation | Raw WASM | Gzipped | Compression | Overhead vs Smallest |
|----------------|----------|---------|-------------|---------------------|
| AssemblyScript | 18.4KB   | 8.2KB   | 55.5%       | Baseline            |
| Porffor        | 512.9KB  | 75.1KB  | 85.3%       | 9.1x                |
| QuickJS        | 633.1KB  | 265.5KB | 58.0%       | 32.3x               |
| Go Basic       | 2,791KB  | 835KB   | 70.1%       | 101.8x              |
| Go + Goja      | 15,571KB | 3,657KB | 76.5%       | 445.7x              |

*Note: TinyGo builds failed during benchmarking but typically produce ~128KB gzipped binaries*

## WebAssembly Cold-Start times


| Implementation | Cold Start (ms) |
|----------------|-----------------|
| AssemblyScript | 0.28            |
| Porffor        | Compilation fails |
| QuickJS        | 1.16            |
| Go Basic       | ~2-3            |
| Go + Goja      | ~5-10           |

## JavaScript Feature Support

| Feature         | AssemblyScript | Porffor | QuickJS | Javy | Go+Goja |
|-----------------|----------------|---------|---------|------|---------|
| ES5             | Partial        | ✅      | ✅      | ✅   | ✅      |
| ES6+            | Partial        | Partial | ✅      | ✅   | ✅      |
| async/await     | ❌             | ❌      | ✅      | ✅   | ✅      |
| eval()          | ❌             | ❌      | ✅      | ✅   | ✅      |
| Regex           | Limited        | ✅      | ✅      | ✅   | ✅      |
| JSON            | ✅             | ✅      | ✅      | ✅   | ✅      |
| TypeScript      | ✅             | ❌      | ❌      | ❌   | ❌      |
## Extism Runtime Overhead

*Data location: `results/engine-overhead.csv`*

| Language    | SDK Size | Dependencies | Total Overhead | Architecture |
|-------------|----------|--------------|----------------|--------------|
| Go          | N/A      | Pure Go      | 0              | Native wazero |
| Rust        | 72KB     | Static       | Embedded       | Static link  |
| JavaScript  | 2.12MB   | None         | 2.12MB         | V8 native    |
| Python      | 11KB     | libextism    | 5.7MB          | FFI          |
| Java        | N/A      | JNA+libextism| 7.0MB          | FFI          |