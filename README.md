# JavaScript to WebAssembly Compilation Comparison

A comprehensive analysis and comparison of different approaches to compile JavaScript to WebAssembly, with a focus on size optimization and runtime compatibility.

## 🎯 Overview

This repository explores 5 different JavaScript-to-WASM compilation approaches:

1. **QuickJS (Rust)** - 285KB gzipped ✅ **Recommended for Wasmer**
2. **Javy Static** - 519KB gzipped ✅ **Wasmer Compatible**
3. **Javy Dynamic** - 488KB + 2KB per module (Node.js only)
4. **Porffor** - 75KB gzipped (Node.js only)
5. **Go/TinyGo + Goja** - 92KB-3.7MB gzipped (Browser/Node.js only)

## 🏆 Key Results

### Wasmer Runtime Compatibility
- **✅ QuickJS**: Perfect compatibility, 285KB gzipped
- **✅ Javy Static**: Perfect compatibility, 519KB gzipped
- **❌ All others**: Require Node.js runtime or have compatibility issues

### Size Comparison (Gzipped)
| Implementation  | Size      | Runtime    | Wasmer | Best For                  |
| --------------- | --------- | ---------- | ------ | ------------------------- |
| **QuickJS**     | **285KB** | WASI       | ✅      | **Production Wasmer**     |
| **Javy Static** | **519KB** | WASI       | ✅      | **Full JS Compatibility** |
| Porffor         | 75KB      | Standard   | ❌      | Size-critical Node.js     |
| TinyGo Basic    | 92KB      | Go Runtime | ❌      | Browser applications      |
| Javy Dynamic    | 490KB     | WASI       | ❌      | Node.js multi-module      |
| Goja            | 3.7MB     | Go Runtime | ❌      | Full JS engine in Go      |

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

#### QuickJS
- **Cold start**: ~5ms
- **Execution**: ~1ms per operation
- **Memory**: ~2MB baseline
- **Scaling**: Excellent for multiple operations

#### Javy Static
- **Cold start**: ~8ms
- **Execution**: ~1ms per operation  
- **Memory**: ~3MB baseline
- **Scaling**: Good for multiple operations

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

**For production Wasmer deployment, use QuickJS (285KB) for optimal size or Javy Static (519KB) for maximum JavaScript compatibility.**