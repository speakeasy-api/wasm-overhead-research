# Test WASM Modules

These are minimal WASM modules used for testing runtime overhead.

## add.wasm
- **Size**: 41 bytes
- **SHA256**: f61fd62f57c41269c3c23f360eeaf1090b1db9c38651106674d48bc65dba88ba
- **Exports**: add(i32, i32) -> i32
- **Description**: Simple addition function for basic runtime testing
- **Source**: Hand-crafted binary (equivalent to WAT: (module (func $add (param i32 i32) (result i32) (i32.add (local.get 0) (local.get 1))) (export "add" (func $add))))

## wasi_hello.wasm  
- **Size**: 38 bytes
- **SHA256**: 53bd3da2fb75bcafb0677938f211ce6c85da8b6c1b6607b239786373b767e155
- **Exports**: hello() -> i32
- **Description**: Minimal WASI module that returns 42
- **Source**: Hand-crafted binary (returns constant value, no actual WASI imports)

## extism_echo.wasm
- **Note**: Requires Extism PDK to build. Will be created when needed for Extism-specific tests.
