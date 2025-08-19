# WebAssembly Runtime SDK Evaluation

This directory contains implementations for evaluating the dependency size overhead of WebAssembly runtimes (Wasmer and Extism) across multiple programming languages.

## Structure

```
runtimes/
├── test-modules/        # Minimal WASM modules for testing
├── wasmer/             # Wasmer runtime evaluations
│   ├── python/
│   ├── typescript/
│   ├── go/
│   ├── ruby/           # (planned)
│   └── java/           # (planned)
├── extism/             # Extism runtime evaluations
│   ├── python/
│   ├── typescript/
│   ├── go/
│   ├── ruby/           # (planned)
│   └── java/           # (planned)
└── measure_all.sh      # Aggregation script

```

## Methodology

### What We Measure

For each runtime/language combination, we measure:

1. **Dependency Download Size**: Total bytes fetched from package registries
2. **Installed Footprint**: Uncompressed size on disk after installation
3. **Deployed Artifact Size**: Size increase of deployable artifacts (binaries, JARs, bundles)
4. **Native Libraries**: Count and size of native libraries included
5. **Lazy Downloads**: Any runtime downloads on first execution

### Measurement Approach

#### Python
- **Baseline**: Empty venv with minimal script
- **With Runtime**: venv with Wasmer/Extism SDK installed
- **Metrics**: venv size delta, pip download size, native .so/.dylib files

#### TypeScript/Node.js
- **Baseline**: Empty npm project
- **With Runtime**: Project with runtime SDK dependencies
- **Metrics**: node_modules size delta, npm pack size, native bindings

#### Go
- **Baseline**: Minimal Go binary
- **With Runtime**: Binary with runtime SDK statically linked
- **Metrics**: Binary size delta, module cache size

### Test Modules

- **add.wasm**: Minimal 41-byte module exporting `add(i32, i32) -> i32`
- **wasi_hello.wasm**: Simple WASI module returning constant value
- **extism_echo.wasm**: Extism plugin with echo functionality (when built)

## Running Measurements

### Quick Start

```bash
# Measure all implementations
mise run measure:runtimes:all

# Measure specific runtime/language
mise run measure:wasmer:python
mise run measure:wasmer:typescript
mise run measure:wasmer:go
mise run measure:extism:python
```

### Manual Execution

```bash
# Build test modules
cd runtimes/test-modules
python3 create_test_modules.py

# Run individual measurement
cd runtimes/wasmer/python
python3 measure.py

# Run all measurements
cd runtimes
./measure_all.sh
```

## Results Format

Each measurement outputs JSON with:

```json
{
  "runtime": "wasmer|extism",
  "language": "python|typescript|go|ruby|java",
  "os": "darwin|linux|windows",
  "arch": "arm64|x86_64",
  "versions": {
    "language": "3.11.0",
    "sdk": "1.0.0"
  },
  "baseline": {
    "size_bytes": 1000000
  },
  "with_runtime": {
    "size_bytes": 2000000,
    "download_size_bytes": 500000,
    "native_libs_count": 1
  },
  "delta": {
    "size_bytes": 1000000,
    "download_size_bytes": 500000
  },
  "native_libs": [...],
  "offline_viable": true,
  "notes": "Additional context"
}
```

## Key Findings

### Size Overhead Comparison

| Runtime | Language   | Install Overhead | Download Size | Notes |
|---------|------------|------------------|---------------|-------|
| Wasmer  | Python     | 3.9 KB          | 3.4 KB        | ⚠️ Core package only[¹](#footnotes) |
| Wasmer  | TypeScript | 12.8 MB         | 7.0 MB        | @wasmer/sdk v0.9.0 |
| Wasmer  | Go         | 159.0 KB        | N/A[²](#footnotes) | Dynamic linking to libwasmer.dylib |
| Extism  | Python     | 21.9 MB         | 7.1 MB        | Includes native libraries |
| Extism  | TypeScript | Not tested      | -             | Partial implementation |
| Extism  | Go         | Not tested      | -             | Partial implementation |

### Detailed Results

#### Test Environment
- **OS**: macOS Darwin (arm64)
- **Python**: 3.12.6 / 3.13.3
- **Node.js**: v23.10.0
- **Go**: 1.24.5
- **Date**: August 2024

#### Wasmer Results

**Python (wasmer 1.1.0)**
- Download: 3.4 KB (wasmer-1.1.0-py3-none-any.whl)
- Install size delta: 3.9 KB
- Native libraries: None detected
- Issue: The wasmer package is pure Python without bundled native runtime

**TypeScript (@wasmer/sdk 0.9.0)**
- Download: 7.0 MB (npm packages)
- node_modules size: 12.8 MB
- Native libraries: None detected (WASM-based)
- Notes: Consolidated package, no longer requires @wasmer/wasi or @wasmer/wasmfs

**Go (wasmer-go v1.0.4)**
- Binary size increase: 159 KB
- Module cache: Included in binary
- Linking: Static
- Notes: Very efficient size overhead

#### Extism Results

**Python (extism 1.0.0)**
- Download: 7.1 MB
- Install size delta: 21.9 MB  
- Native libraries: Included
- Notes: Significantly larger than Wasmer, includes full plugin runtime

### Footnotes

¹ **Wasmer Python Package Structure**: The wasmer 1.1.0 package on PyPI is the core API package only. To actually compile and run WebAssembly, you need to install a compiler engine separately:
- `pip install wasmer-compiler-cranelift==1.1.0` (recommended for development)
- `pip install wasmer-compiler-llvm==1.1.0` (recommended for production)
- `pip install wasmer-compiler-singlepass==1.1.0` (fastest compilation)

Our measurement only included the core package. With cranelift compiler, the total download would be significantly larger.

² **Wasmer Go Dynamic Linking**: The Go binary dynamically links to `libwasmer.dylib` which must be installed separately or bundled with the application. The binary size increase (159KB) doesn't include the ~40MB libwasmer library. For distribution, you need either:
- System-wide Wasmer installation
- Bundle libwasmer.dylib with your application
- Use CGO_ENABLED=0 for static linking (if supported)

### Analysis & Recommendations

#### Key Takeaways

1. **Go requires external dependencies**: Despite small binary size increase (159KB), it needs libwasmer.dylib (~40MB) at runtime due to dynamic linking.

2. **TypeScript/Node.js is self-contained**: 12.8MB for @wasmer/sdk includes everything needed, making deployment simpler.

3. **Python Wasmer is modular**: Requires separate compiler package installation. Total size with compiler would be much larger than our 3.9KB measurement.

4. **Extism is all-inclusive**: At 21.9MB for Python, it bundles everything needed including native libraries.

#### Recommendations by Use Case

- **Self-contained deployment**: Use TypeScript with @wasmer/sdk (12.8MB all-inclusive)
- **Minimal binary size**: Use Go, but plan for libwasmer distribution
- **Python applications**: Install both wasmer and a compiler package, or use wasmtime
- **Plugin systems**: Extism provides the most complete out-of-box experience

### Platform Considerations

- **macOS ARM64**: Some SDKs may not have pre-built wheels/binaries
- **Python 3.13**: Newer Python versions may lack wheel support
- **Native Libraries**: Dynamic vs static linking varies by language
- **Lazy Downloads**: Some SDKs download native components on first use

## Adding New Languages

To add Ruby or Java support:

1. Create directory: `runtimes/{runtime}/{language}/`
2. Add implementation files:
   - `main.{ext}`: Runtime loader/executor
   - `baseline.{ext}`: Minimal app without runtime
   - `measure.{sh|py|js}`: Measurement script
3. Update `measure_all.sh` to include new language
4. Add mise task in `.mise.toml`

## Known Issues

1. **Wasmer Python on ARM64**: Limited wheel availability
2. **Extism Plugin Format**: Requires Extism-specific WASM format
3. **Version Compatibility**: Some SDK versions may not support latest language versions

## Future Improvements

- [ ] Add Ruby implementations
- [ ] Add Java implementations  
- [ ] Create Docker containers for reproducible Linux measurements
- [ ] Add performance benchmarks (instantiation time, call overhead)
- [ ] Measure memory footprint at runtime
- [ ] Test with real-world WASM modules
- [ ] Add CI/CD automation for measurements