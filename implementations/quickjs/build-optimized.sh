#!/bin/bash
set -e

echo "🚀 Building ultra-optimized QuickJS WASM binary..."

# Step 1: Build with aggressive Rust optimizations
echo "📦 Building with Rust optimizations..."
cargo build --release --target wasm32-wasip1

# Step 2: Apply wasm-opt ultra-optimization
echo "⚡ Applying wasm-opt ultra-optimization..."
wasm-opt -Oz \
  --enable-bulk-memory \
  --enable-sign-ext \
  --enable-mutable-globals \
  --enable-nontrapping-float-to-int \
  --enable-simd \
  --enable-reference-types \
  target/wasm32-wasip1/release/quickjs_transform.wasm \
  -o target/wasm32-wasip1/release/quickjs_transform_optimized.wasm

# Step 3: Replace original with optimized version
echo "🔄 Replacing original with optimized version..."
mv target/wasm32-wasip1/release/quickjs_transform_optimized.wasm target/wasm32-wasip1/release/quickjs_transform.wasm

# Step 4: Show size comparison
echo "📊 Final size analysis:"
RAW_SIZE=$(stat -c%s target/wasm32-wasip1/release/quickjs_transform.wasm)
GZIPPED_SIZE=$(gzip -c target/wasm32-wasip1/release/quickjs_transform.wasm | wc -c)

echo "  Raw size: $RAW_SIZE bytes ($(($RAW_SIZE / 1024))KB)"
echo "  Gzipped:  $GZIPPED_SIZE bytes ($(($GZIPPED_SIZE / 1024))KB)"

# Step 5: Test functionality
echo "🧪 Testing optimized binary..."
if echo '{"test": "success"}' | wasmer run target/wasm32-wasip1/release/quickjs_transform.wasm 'JSON.stringify({result: "Ultra-optimized QuickJS works!", input: JSON.parse(inputData)})' > /dev/null 2>&1; then
    echo "✅ Optimization successful! Binary is fully functional."
else
    echo "❌ Warning: Optimized binary may have issues."
    exit 1
fi

echo "🎉 Ultra-optimization complete!"
echo "   Final size: $(($GZIPPED_SIZE / 1024))KB gzipped"