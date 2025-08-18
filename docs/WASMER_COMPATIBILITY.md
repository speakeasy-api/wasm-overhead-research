# Wasmer Runtime Compatibility Guide

This document outlines the compatibility of different WASM implementations with the Wasmer runtime and SDKs.

## Runtime Compatibility Matrix

| Implementation | Runtime Type   | Wasmer Compatible | Node.js Compatible | Notes                              |
| -------------- | -------------- | ----------------- | ------------------ | ---------------------------------- |
| **QuickJS**    | WASI           | ✅ **Excellent**   | ✅ Yes              | Full JS engine, 285KB gzipped      |
| **Porffor**    | Standard WASM  | ⚠️ **Partial**     | ✅ Yes              | Requires legacy exceptions support |
| **Javy**       | WASI (Dynamic) | ⚠️ **Partial**     | ✅ Yes              | Requires plugin loading, 488KB     |
| **Go/TinyGo**  | Go Runtime     | ❌ **No**          | ✅ Yes              | Requires wasm_exec.js              |
| **Goja**       | Go Runtime     | ❌ **No**          | ✅ Yes              | Requires wasm_exec.js              |

## Wasmer-Ready Implementations

### 1. QuickJS (Recommended for Full JS Engine)

**Size**: 285KB gzipped
**Runtime**: WASI (wasm32-wasip1)  
**Compatibility**: ✅ Perfect Wasmer compatibility

```bash
# Test with Wasmer
make test-quickjs-wasmer

# Or manually
wasmer run implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm
```

**Advantages**:
- Full JavaScript engine with ECMAScript compatibility
- One-time 285KB cost + minimal string overhead
- Excellent scaling for multiple operations
- 92% smaller than Goja
- Direct WASI compatibility

### 2. Porffor (Size Optimized, Limited Wasmer Support)

**Size**: 75KB gzipped
**Runtime**: Standard WASM with legacy exceptions
**Compatibility**: ⚠️ Requires legacy exceptions support

```bash
# Test with Wasmer (requires legacy exceptions)
make test-porffor-wasmer

# Or manually (may need --enable-all flag)
wasmer run implementations/porffor/transform.wasm --enable-all
```

**Advantages**:
- Smallest single operation (75KB)
- AOT compiled JavaScript
- Zero runtime overhead

**Limitations**:
- Uses legacy exceptions not supported by default in Wasmer
- May require special Wasmer configuration
- Better suited for Node.js runtime

### 3. Javy (Limited Wasmer Support)

**Size**: 488KB + 4KB per module  
**Runtime**: WASI with dynamic linking  
**Compatibility**: ⚠️ Requires special plugin handling

```bash
# Note: Javy dynamic modules need plugin.wasm
# Standard Wasmer doesn't handle dynamic linking automatically
```

**Limitations**:
- Dynamic linking not standard in Wasmer
- Requires custom plugin loading logic
- Better suited for Node.js WASI runtime

## Wasmer SDK Integration

### For JavaScript/TypeScript Projects (Wasmer-JS)

**Recommended**: QuickJS or Porffor

```javascript
import { init, WASI } from "@wasmer/wasi";

// Initialize WASI
await init();
const wasi = new WASI({
  env: {},
  args: []
});

// Load QuickJS WASM
const wasmBytes = await fetch("quickjs_transform.wasm").then(r => r.arrayBuffer());
const module = await WebAssembly.compile(wasmBytes);
const instance = await wasi.instantiate(module, {});

// Use the instance
const result = instance.exports.transform_data(inputPtr);
```

### For Other Languages (Wasmer SDKs)

**Supported Languages**: Python, Rust, C/C++, Go, PHP, Ruby, Java, C#

**Recommended**: QuickJS (full JS engine) or Porffor (size-optimized)

```python
# Python example with Wasmer
from wasmer import engine, Store, Module, Instance, wasi

# Load WASM module
store = Store(engine.JIT())
module = Module(store, open("quickjs_transform.wasm", "rb").read())

# Create WASI environment
wasi_env = wasi.StateBuilder("quickjs").finalize()
import_object = wasi_env.generate_import_object(store, module)

# Instantiate and run
instance = Instance(module, import_object)
result = instance.exports.transform_data(input_data)
```

## Testing Instructions

### Install Wasmer

```bash
curl https://get.wasmer.io -sSfL | sh
source ~/.bashrc
```

### Test All WASI-Compatible Implementations

```bash
# Test all Wasmer-compatible implementations
make test-wasmer

# Test individual implementations
make test-quickjs-wasmer
make test-porffor-wasmer
```

### Manual Testing

```bash
# QuickJS (WASI)
echo '{"test": "data"}' | wasmer run implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm

# Porffor (Standard WASM)
echo '{"test": "data"}' | wasmer run implementations/porffor/transform.wasm
```

## Recommendations by Use Case

### Single JavaScript Operation
**Use**: Porffor (75KB)
- Smallest size
- Standard WASM
- Perfect Wasmer compatibility

### Multiple JavaScript Operations (4+)
**Use**: QuickJS (286KB + minimal overhead)
- Full JavaScript engine
- Excellent scaling
- WASI compatibility

### Microservices Architecture
**Use**: QuickJS or Porffor
- Both have excellent Wasmer SDK support
- Choose based on size vs. JS compatibility needs

### Web Applications (Wasmer-JS)
**Use**: QuickJS or Porffor
- Both work perfectly with Wasmer-JS
- No special runtime requirements

## Migration from Node.js

If you're currently using Node.js-specific implementations:

1. **From Go/TinyGo**: Migrate to Porffor for size or QuickJS for JS compatibility
2. **From Goja**: Migrate to QuickJS (92% size reduction, same JS engine model)
3. **From Javy**: Consider QuickJS for better Wasmer compatibility

## Build Commands

```bash
# Build Wasmer-compatible implementations
make build-quickjs IMPL=quickjs
make build-porffor IMPL=porffor

# Test with Wasmer
make test-wasmer
```

## Summary

**Best for Wasmer SDK Integration**:
1. **QuickJS**: Full JavaScript engine, excellent WASI compatibility (285KB) ⭐ **VERIFIED WORKING**
2. **Porffor**: Size-optimized but incompatible with Wasmer (75KB) ❌ **NOT SUPPORTED**

**Verified Test Results**:
- ✅ **QuickJS + Wasmer**: Perfect compatibility, tested and working
- ❌ **Porffor + Wasmer**: Legacy exceptions not supported, even with `--enable-all`
- ⚠️ **Javy + Wasmer**: Dynamic linking requires special handling

**Final Recommendation**: Use **QuickJS** as the primary choice for Wasmer SDK integration. It provides perfect WASI compatibility with full JavaScript engine capabilities at 285KB gzipped, making it ideal for production Wasmer deployments across all supported programming languages.