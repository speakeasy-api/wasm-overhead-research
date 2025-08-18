# JavaScript to WebAssembly Compilation Comparison

A comprehensive analysis and comparison of different approaches to compile JavaScript to WebAssembly, with a focus on size optimization and runtime compatibility.

## 🎯 Overview

This repository explores 7 different JavaScript-to-WASM compilation approaches:

1. **AssemblyScript** - 12KB gzipped ✨ **Smallest size**
2. **TinyGo (optimized)** - 128KB gzipped ✅ **Good balance**
3. **Porffor** - 128KB gzipped (Node.js only)
4. **QuickJS (Rust)** - 320KB gzipped ✅ **Recommended for Wasmer**
5. **TinyGo Basic** - 384KB gzipped (Browser/Node.js)
6. **Go Basic** - 896KB gzipped (Browser/Node.js)
7. **Go + Goja** - 4.1MB gzipped (Full JS engine in Go)

## 🏆 Key Results

### Wasmer Runtime Compatibility
- **✅ QuickJS**: Perfect compatibility, 320KB gzipped
- **✅ Javy**: Perfect compatibility (when CLI installed)
- **✅ Porffor**: Works with Wasmer
- **❌ Go/TinyGo**: Require browser/Node.js runtime

### Size Comparison (Gzipped)
| Implementation    | Size      | Runtime    | Wasmer | Best For                     |
| ----------------- | --------- | ---------- | ------ | ---------------------------- |
| **AssemblyScript**| **12KB**  | WASM       | ✅      | **Smallest size**            |
| **TinyGo (opt)**  | **128KB** | Go Runtime | ❌      | **Balanced size/features**   |
| **Porffor**       | **128KB** | Standard   | ✅      | **AOT compilation**          |
| **QuickJS**       | **320KB** | WASI       | ✅      | **Full JS engine in WASM**  |
| TinyGo Basic      | 384KB     | Go Runtime | ❌      | Simple transformations       |
| Go Basic          | 896KB     | Go Runtime | ❌      | Browser applications         |
| Go + Goja         | 4.1MB     | Go Runtime | ❌      | Full JS engine in Go         |

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Rust with `wasm32-wasip1` target
- Node.js 18+
- [Javy](https://github.com/bytecodealliance/javy)
- [Porffor](https://github.com/CanadaHonk/porffor)
- [Wasmer](https://wasmer.io/) (optional, for testing)

### Build All Implementations
```bash
# Install dependencies
make install-deps

# Build all implementations
make build-all

# Test all implementations
make test-all

# Test Wasmer compatibility
make test-wasmer
```

### Build Individual Implementations

#### QuickJS (Recommended)
```bash
cd implementations/quickjs
cargo build --release --target wasm32-wasip1
```

#### Javy Static
```bash
cd implementations/javy
javy build -o transform.wasm transform.js
```

#### Porffor
```bash
cd implementations/porffor
porffor transform.js -o transform.wasm
```

## 📊 Detailed Analysis

### Performance Characteristics

#### AssemblyScript
- **Cold start**: <1ms
- **Execution**: <1ms per operation
- **Memory**: ~256KB baseline
- **Scaling**: Excellent, minimal overhead

#### TinyGo (Optimized)
- **Cold start**: ~2ms
- **Execution**: ~1ms per operation
- **Memory**: ~512KB baseline
- **Scaling**: Very good for multiple operations

#### QuickJS
- **Cold start**: ~5ms
- **Execution**: ~1ms per operation
- **Memory**: ~2MB baseline
- **Scaling**: Excellent with full JS support

#### Go + Goja
- **Cold start**: ~15ms
- **Execution**: ~2ms per operation  
- **Memory**: ~8MB baseline
- **Scaling**: Good for complex JS transformations

### Runtime Compatibility

#### WASI Compatible (Wasmer Ready)
- **QuickJS**: Perfect compatibility, uses standard WASI interfaces
- **Javy Static**: Perfect compatibility, self-contained

#### Node.js/Browser Only
- **Porffor**: Uses legacy WASM exceptions
- **Go/TinyGo**: Requires `wasm_exec.js` runtime
- **Javy Dynamic**: Needs dynamic linking support

## 🔧 Implementation Details

### QuickJS Implementation
- **Language**: Rust
- **Engine**: QuickJS JavaScript engine
- **Target**: `wasm32-wasip1`
- **Features**: Full ECMAScript support, WASI I/O

### Javy Implementation
- **Language**: JavaScript
- **Engine**: QuickJS (via Javy)
- **Target**: WASI
- **Features**: Bytecode Alliance quality, multiple build modes

### Porffor Implementation
- **Language**: JavaScript
- **Engine**: AOT compiled
- **Target**: Standard WASM
- **Features**: Smallest size, compile-time optimization

## 📁 Repository Structure

```
├── implementations/
│   ├── quickjs/          # Rust + QuickJS (RECOMMENDED)
│   ├── javy/             # Javy static/dynamic builds
│   ├── porffor/          # Porffor AOT compilation
│   ├── goja/             # Go + Goja JavaScript engine
│   └── tinygo/           # TinyGo basic implementation
├── docs/
│   ├── BINARY_SIZES.md           # Detailed size analysis
│   ├── WASMER_COMPATIBILITY.md   # Runtime compatibility guide
│   ├── JAVY_WASMER_ANALYSIS.md   # Javy-specific analysis
│   └── FINAL_WASMER_SUMMARY.md   # Executive summary
├── tests/                # Test suites and benchmarks
├── Makefile             # Build automation
└── README.md           # This file
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Wasmer Compatibility Tests
```bash
make test-wasmer
```

### Size Analysis
```bash
make measure-sizes
```

### Performance Benchmarks
```bash
make benchmark
```

## 📖 Documentation

- **[Binary Size Analysis](docs/BINARY_SIZES.md)** - Comprehensive size comparison
- **[Wasmer Compatibility Guide](docs/WASMER_COMPATIBILITY.md)** - Runtime compatibility details
- **[Javy Analysis](docs/JAVY_WASMER_ANALYSIS.md)** - Javy-specific findings
- **[Final Summary](docs/FINAL_WASMER_SUMMARY.md)** - Executive summary and recommendations

## 🔬 Research Findings

### Wasmer v6.1.0-rc.2 Dynamic Linking
- Introduces dynamic linking for WASIX/C++ libraries
- Does NOT support WASM module import resolution
- Javy dynamic builds still require Node.js runtime

### Size Optimization Techniques
- **wasm-opt**: 15-20% size reduction
- **Compression**: 60-70% reduction with gzip
- **Dead code elimination**: Significant impact on Go builds

### Runtime Performance
- **WASI overhead**: Minimal (~1ms)
- **JavaScript engine startup**: 5-10ms
- **Execution performance**: Comparable to native JavaScript

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your implementation in `implementations/`
4. Update documentation and tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Bytecode Alliance](https://bytecodealliance.org/) for Javy
- [Wasmer](https://wasmer.io/) for the excellent WASM runtime
- [QuickJS](https://bellard.org/quickjs/) for the JavaScript engine
- [Porffor](https://github.com/CanadaHonk/porffor) for AOT JavaScript compilation
- [TinyGo](https://tinygo.org/) for efficient Go compilation

---

## 📌 Recommendations

- **For smallest size**: Use **AssemblyScript** (12KB) - ideal for simple transformations
- **For balance of size and features**: Use **TinyGo optimized** (128KB) or **Porffor** (128KB)
- **For full JavaScript support in Wasmer**: Use **QuickJS** (320KB) - complete JS engine in WASM
- **For existing Go codebases**: Use **TinyGo** (128-384KB) depending on optimization needs
- **For complex JavaScript transformations**: Use **Go + Goja** (4.1MB) if size isn't critical