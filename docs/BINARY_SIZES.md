# Binary Size Tracking

This document tracks the binary sizes of different WASM implementations and optimization levels.

## Current Size Comparison

| Implementation | Go (KB) | Go Opt (KB) | TinyGo (KB) | TinyGo Opt (KB) | Javy (KB) | Porffor (KB) | QuickJS (KB) | Best Reduction |
| -------------- | ------- | ----------- | ----------- | --------------- | --------- | ------------ | ------------ | -------------- |
| basic          | 860     | 844         | 348         | 92              | N/A       | N/A          | N/A          | 89.3%          |
| goja           | 3,756   | 3,600       | N/A*        | N/A*            | N/A       | N/A          | N/A          | 4.2%           |
| javy           | N/A     | N/A         | N/A         | N/A             | 492**     | N/A          | N/A          | 42.8%          |
| porffor        | N/A     | N/A         | N/A         | N/A             | N/A       | 513***       | N/A          | 40.3%          |
| quickjs        | N/A     | N/A         | N/A         | N/A             | N/A       | N/A          | 286****      | 66.7%          |

## Gzipped Size Comparison (Web Deployment)

| Implementation | Original (KB) | Gzipped (KB) | Compression | Total Gzipped | Scaling Notes                                        |
| -------------- | ------------- | ------------ | ----------- | ------------- | ---------------------------------------------------- |
| **TinyGo Opt** | 198           | **93**       | 53.3%       | **93KB**      | Each operation adds ~93KB                            |
| **Porffor**    | 513           | **75**       | **85.4%**   | **75KB**      | Each operation adds ~75KB                            |
| **QuickJS**    | 703           | **286**      | 59.3%       | **286KB**     | One-time runtime cost + minimal JS strings           |
| **Javy Total** | 492           | **488**      | 0.8%        | **488KB**     | **Additional operations add 4KB each (2KB gzipped)** |
| Javy Plugin    | 488           | 486          | 0.4%        | -             | Shared runtime (one-time cost)                       |
| Javy Module    | 4             | 2            | 50%         | -             | Per-operation cost                                   |
| **Goja**       | 15,818        | **3,716**    | 76.5%       | **3,716KB**   | One-time runtime cost + minimal JS strings           |

### Scaling Analysis for Multiple Operations (e.g., OpenAPI transformations)

**For 1 operation:**
- TinyGo: 93KB
- Porffor: 75KB ⭐ **Smallest single operation**
- QuickJS: 286KB
- Javy: 488KB
- Goja: 3,716KB

**For 5 operations:**
- TinyGo: 465KB (5 × 93KB)
- Porffor: 375KB (5 × 75KB)
- QuickJS: ~287KB (286KB + ~1KB JS strings) ⭐ **Best for multiple operations**
- Javy: 504KB (488KB + 4 × 4KB raw modules)
- Goja: ~3,717KB (3,716KB + ~1KB JS strings)

**For 10 operations:**
- TinyGo: 930KB (10 × 93KB)
- Porffor: 750KB (10 × 75KB)
- QuickJS: ~288KB (286KB + ~1KB JS strings) ⭐ **Scales excellently**
- Javy: 524KB (488KB + 9 × 4KB raw modules)
- Goja: ~3,718KB (3,716KB + ~1KB JS strings)

*Goja implementation doesn't compile with TinyGo due to dependency complexity
**Javy total: 4KB module + 488KB plugin (compressed). Additional modules only add 4KB each.
***Porffor: AOT compiled JavaScript to WASM, single self-contained binary
****QuickJS: Rust + QuickJS JavaScript engine compiled to WASM with WASI target

## Optimization Analysis

### Basic Implementation
- **Go Standard**: 860KB baseline
- **Go Optimized**: 844KB (-16KB, -1.9% reduction)
  - Uses maximum optimization flags: `-ldflags="-s -w -buildid="`, `-gcflags="-l=4 -B -C"`, `-trimpath`
  - Post-processed with `wasm-opt -Oz` for additional size reduction
- **TinyGo Standard**: 348KB (-512KB, -59.5% reduction vs Go)
- **TinyGo Optimized**: 92KB (-768KB, -89.3% reduction vs Go)
  - Uses maximum TinyGo optimization: `-opt=z`, `-no-debug`, `-gc=leaking`, `-panic=trap`
  - Post-processed with `wasm-opt -Oz --enable-bulk-memory --enable-sign-ext --enable-mutable-globals`

### Goja Implementation (Updated!)
- **Go Standard**: 3,756KB baseline (JavaScript engine overhead)
- **Go Optimized**: 3,600KB (-156KB, -4.2% reduction)
  - Removed embedded JavaScript code (pure runtime approach)
  - Now accepts JavaScript code as parameter for maximum flexibility
  - Limited further optimization due to large Goja runtime dependencies
- **TinyGo**: Not compatible due to `golang.org/x/text` dependency complexity

### Javy Implementation
- **Dynamic Module**: 4KB (compressed)
- **Shared Plugin**: 1.3MB raw (488KB compressed, shared across all Javy modules)
- **Total for single app**: 492KB (42.8% reduction vs Go basic, 46.5% smaller than TinyGo optimized)
- **Advantage**: Plugin is shared - additional Javy modules only add 4KB each
- **Scaling benefit**: Multiple modules share the 488KB plugin cost

### Porffor Implementation
- **AOT Compiled**: 513KB (single self-contained binary)
- **Moderate reduction**: 40.3% smaller than Go basic (347KB savings)
- **Ahead-of-time compilation**: JavaScript compiled to WASM at build time
- **Zero runtime overhead**: No JavaScript engine or interpreter needed
- **Advantage**: Self-contained binary for JavaScript-based transformations
- **Limitation**: Limited JavaScript feature support, larger than expected due to runtime overhead

### QuickJS Implementation (NEW!)
- **Rust + QuickJS**: 703KB raw (286KB compressed, single self-contained binary)
- **Good reduction**: 66.7% smaller than Go basic (574KB savings)
- **Full JavaScript engine**: Complete ECMAScript compatibility via QuickJS
- **WASI target**: Uses WebAssembly System Interface for C standard library support
- **Advantage**: Full JavaScript engine smaller than Goja, excellent JS compatibility
- **Breakthrough**: Successfully compiled C-based JavaScript engine to WASM using WASI
- **Runtime**: Requires WASI runtime (Node.js WASI or wasmtime)

## Key Insights

1. **TinyGo achieves the smallest overall binary** at 92KB for Go-native code
2. **TinyGo provides best Go-native optimization** for Go code (92KB, 89.3% reduction)
3. **Javy provides the smallest individual modules** at 4KB per implementation
4. **Javy's dynamic linking shines for multiple modules** - shared 1.3MB plugin
5. **Go optimization flags have modest impact** on standard Go builds (~2% reduction)
6. **Complex dependencies limit optimization effectiveness** (Goja only 4.2% reduction)
7. **wasm-opt is crucial for Go/TinyGo** but corrupts Javy plugins and Porffor exception handling
8. **AOT compilation beats runtime approaches** for size optimization

## Architecture Comparison

### Go/TinyGo Approach
- **Pros**: Single self-contained binary, excellent tooling, mature ecosystem
- **Cons**: Larger binaries, limited by Go runtime overhead
- **Best for**: Single applications, Go-native logic

### Javy Approach
- **Pros**: Tiny individual modules (4KB), shared runtime, JavaScript flexibility
- **Cons**: Requires WASI runtime, plugin dependency, newer ecosystem
- **Best for**: Multiple small modules, JavaScript-based transformations, microservices

### Porffor Approach
- **Pros**: Smallest overall binary (75KB), AOT compilation, zero runtime overhead
- **Cons**: Limited JavaScript feature support, newer/experimental toolchain
- **Best for**: Single JavaScript applications, maximum size optimization, performance-critical scenarios

### QuickJS Approach
- **Pros**: Full JavaScript engine (286KB), excellent JS compatibility, smaller than Goja, mature JS engine
- **Cons**: Requires WASI runtime, larger than AOT approaches, Rust compilation complexity
- **Best for**: Full JavaScript compatibility with size constraints, alternative to Goja

## Build Commands

### Standard Builds
```bash
make build-go IMPL=basic        # Go standard build
make build-tinygo IMPL=basic    # TinyGo standard build
make build-go IMPL=goja         # Go with Goja engine
make build-javy IMPL=javy       # Javy with dynamic linking
make build-porffor IMPL=porffor # Porffor AOT compilation
make build-quickjs IMPL=quickjs # QuickJS Rust + JavaScript engine
```

### Optimized Builds
```bash
make build-optimized IMPL=basic         # Go optimized build
make build-tinygo-optimized IMPL=basic  # TinyGo optimized build
make build-optimized IMPL=goja          # Go optimized with Goja
make build-javy-optimized IMPL=javy     # Javy optimized (same as standard)
make build-porffor-optimized IMPL=porffor # Porffor optimized (wasm-opt disabled)
```

### Size Comparison
```bash
make size-comparison  # Compare all implementations and optimization levels
```

## Runtime Integration

### Go/TinyGo WASM
- Uses `wasm_exec.js` runtime
- Functions exposed globally
- Direct function calls

### Javy WASM
- Uses WASI (WebAssembly System Interface)
- Communicates via stdin/stdout
- Requires Node.js WASI or wasmtime runtime

## Historical Data

### 2025-08-18 - Porffor Integration
- Added Porffor AOT JavaScript-to-WASM compiler support
- Achieved 40.3% size reduction with AOT compilation (513KB vs 860KB)
- Implemented ahead-of-time JavaScript compilation with zero runtime overhead
- Confirmed wasm-opt compatibility issues with Porffor exception handling
- Porffor provides moderate size reduction with JavaScript AOT compilation

### 2025-08-18 - Javy Integration
- Added Javy JavaScript-to-WASM compiler support
- Implemented dynamic linking with shared plugin architecture
- Achieved 99.5% size reduction for individual modules (4KB vs 860KB)
- Created Node.js WASI adapter for test integration
- Confirmed wasm-opt compatibility issues with Javy plugins

### 2025-08-18 - Optimization Implementation
- Added maximum optimization flags for both Go and TinyGo builds
- Integrated wasm-opt post-processing for all optimized builds
- Achieved 89.3% size reduction for basic implementation with TinyGo optimized build
- Confirmed all optimized builds pass full test suite (11/11 tests)

## Recommendations

### Based on Gzipped Sizes (Web Deployment)

- **For single JavaScript operation**: Use Porffor AOT (75KB gzipped)
- **For 2-3 JavaScript operations**: Use Porffor AOT (~150-225KB total)
- **For 4+ JavaScript operations**: Use QuickJS (286KB + minimal strings) ⭐ **Best scaling**
- **For single Go operation**: Use TinyGo optimized (93KB gzipped)
- **For Go-heavy logic**: Use Go optimized (844KB raw, ~350KB gzipped estimated)
- **For full JavaScript engine (size-conscious)**: Use QuickJS (286KB gzipped)
- **For maximum JavaScript compatibility**: Use Goja (3.7MB gzipped)
- **For maximum compatibility**: Use Go standard (860KB raw, ~400KB gzipped estimated)

### Use Case Scenarios

**OpenAPI Document Processing (10+ operations):**
- ⭐ **Javy**: 506KB total (excellent scaling)
- Porffor: 750KB total (good for smaller sets)
- TinyGo: 930KB total (Go-native approach)

**Single Transformation Service:**
- ⭐ **Porffor**: 75KB (smallest single operation)
- TinyGo: 93KB (Go-native)
- Javy: 488KB (overkill for single operation)

**Microservices Architecture:**
- ⭐ **Javy**: Shared 488KB runtime + 2KB per service
- Porffor: 75KB per service (good for independent deployment)
- TinyGo: 93KB per service (Go-native microservices)