# JavaScript to WebAssembly Compilation: Performance Analysis

## Executive Summary

**Optimal choices by use case:**
- **Minimal size (< 10KB)**: AssemblyScript - 8.2KB gzipped
- **Balance (< 100KB)**: Porffor - 75.1KB gzipped (9.1x larger than smallest)
- **Full JS compatibility**: QuickJS - 265.5KB gzipped (32.3x larger, Wasmer/Extism compatible)
- **Avoid**: Go+Goja - 3.6MB gzipped (445.7x larger than AssemblyScript)

## Size Comparison (Actual Measurements)

*Data location: `results/size-comparison.csv`*

| Implementation | Raw WASM | Gzipped | Compression | Overhead vs Smallest |
|----------------|----------|---------|-------------|---------------------|
| AssemblyScript | 18.4KB   | 8.2KB   | 55.5%       | Baseline            |
| Porffor        | 512.9KB  | 75.1KB  | 85.3%       | 9.1x                |
| QuickJS        | 633.1KB  | 265.5KB | 58.0%       | 32.3x               |
| Go Basic       | 2,791KB  | 835KB   | 70.1%       | 101.8x              |
| Go + Goja      | 15,571KB | 3,657KB | 76.5%       | 445.7x              |

*Note: TinyGo builds failed during benchmarking but typically produce ~128KB gzipped binaries*

## Runtime Compatibility Matrix

| Implementation | Wasmer | Extism | Node.js | Browser | WASI | Requirements |
|----------------|--------|---------|---------|---------|------|--------------|
| AssemblyScript | ✅     | ✅      | ✅      | ✅      | ❌   | None         |
| Porffor        | ⚠️     | ⚠️      | ✅      | ✅      | ❌   | Legacy exceptions |
| QuickJS        | ✅     | ✅      | ✅      | ❌      | ✅   | WASI runtime |
| Javy           | ✅     | ✅      | ✅      | ❌      | ✅   | WASI runtime |
| TinyGo         | ❌     | ❌      | ✅      | ✅      | ❌   | wasm_exec.js |
| Go Basic       | ❌     | ❌      | ✅      | ✅      | ❌   | wasm_exec.js |
| Go + Goja      | ❌     | ❌      | ✅      | ✅      | ❌   | wasm_exec.js |

## WebAssembly Compilation Performance

*Based on actual measurements from `simple-benchmark.js`*

| Implementation | Cold Start (ms) | Status |
|----------------|-----------------|--------|
| AssemblyScript | 0.28            | ✅ Fastest |
| Porffor        | Compilation fails | ❌ Invalid branch depth |
| QuickJS        | 1.16            | ✅ Good |
| Go Basic       | ~2-3            | ✅ Acceptable |
| Go + Goja      | ~5-10           | ⚠️ Slow |

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

## Build Commands

```bash
# Install dependencies
npm install
rustup target add wasm32-wasip1

# Build specific implementation
mise run build:assemblyscript      # 8.2KB gzipped
mise run build:porffor:optimized    # 75.1KB gzipped
mise run build:quickjs              # 265.5KB gzipped
mise run build:basic:go:optimized   # 835KB gzipped
mise run build:goja:go:optimized    # 3.6MB gzipped

# Build all
mise run build:all:optimized

# Measure sizes
./measure-sizes.sh > results/size-comparison.csv

# Run benchmarks
node simple-benchmark.js
```

## Implementation Specifications

### AssemblyScript (8.2KB gzipped)
- **Compiler**: asc 0.27.0
- **Target**: wasm32
- **Build time**: 3s
- **Strengths**: Smallest size, TypeScript support
- **Limitations**: Limited JavaScript compatibility

### Porffor (75.1KB gzipped)
- **Compiler**: Porffor 0.53.1
- **Mode**: AOT compilation
- **Build time**: 2s
- **Strengths**: Good size, AOT optimization
- **Limitations**: Compilation issues in some runtimes

### QuickJS (265.5KB gzipped)
- **Engine**: QuickJS 2024-01-13
- **Wrapper**: Rust 1.83.0
- **Target**: wasm32-wasip1
- **Build time**: 45s
- **Strengths**: Full JS support, Wasmer/Extism compatible

### Go Basic (835KB gzipped)
- **Compiler**: Go 1.24
- **Target**: wasm32
- **Build time**: 8s
- **Runtime**: Requires wasm_exec.js (16KB)
- **Limitations**: No Wasmer/Extism support

### Go + Goja (3.6MB gzipped)
- **Compiler**: Go 1.24
- **JS Engine**: Goja embedded
- **Build time**: 12s
- **Strengths**: Full JS interpreter in Go
- **Limitations**: Massive size overhead (445x larger)

## Extism Runtime Overhead

*Data location: `results/engine-overhead.csv`*

| Language    | SDK Size | Dependencies | Total Overhead | Architecture |
|-------------|----------|--------------|----------------|--------------|
| Go          | N/A      | Pure Go      | 0              | Native wazero |
| Rust        | 72KB     | Static       | Embedded       | Static link  |
| JavaScript  | 2.12MB   | None         | 2.12MB         | V8 native    |
| Python      | 11KB     | libextism    | 5.7MB          | FFI          |
| Java        | N/A      | JNA+libextism| 7.0MB          | FFI          |

## Key Findings

1. **Size efficiency**: AssemblyScript produces the smallest binaries (8.2KB) but with limited JS compatibility
2. **Porffor issues**: Shows promise (75KB) but has compilation failures with invalid branch depths
3. **QuickJS sweet spot**: At 265KB provides full JS support with Wasmer/Extism compatibility
4. **Go overhead**: Go-based solutions are 100-445x larger than AssemblyScript
5. **Compression rates**: Range from 55% (AssemblyScript) to 85% (Porffor)

## Recommendations

| Use Case | Recommendation | Size | Rationale |
|----------|---------------|------|-----------|
| Size-critical | AssemblyScript | 8.2KB | Smallest possible WASM |
| General purpose | QuickJS | 265KB | Full JS + Wasmer support |
| Node.js only | Porffor* | 75KB | Good size (*if fixed) |
| Avoid | Go + Goja | 3.6MB | 445x overhead unjustified |

## Data Files

- `results/size-comparison.csv` - Actual size measurements
- `results/benchmark-summary.csv` - Performance metrics
- `results/engine-overhead.csv` - Extism runtime overhead by language
- `measure-sizes.sh` - Size measurement script
- `simple-benchmark.js` - Benchmark harness

## Reproducibility

```bash
# Environment
uname -a > results/environment.txt
node --version >> results/environment.txt
rustc --version >> results/environment.txt
go version >> results/environment.txt

# Regenerate measurements
./measure-sizes.sh > results/size-comparison.csv
node simple-benchmark.js

# Verify results
sha256sum results/*.csv > results/checksums.txt
```