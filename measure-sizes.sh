#!/bin/bash

echo "=== JavaScript to WebAssembly Size Analysis ==="
echo ""
echo "Implementation,Raw WASM (bytes),Gzipped (bytes),Raw KB,Gzipped KB,Compression %,vs Smallest"
echo "---"

# AssemblyScript
if [ -f "implementations/assemblyscript/build/release.wasm" ]; then
  RAW=$(stat -f%z "implementations/assemblyscript/build/release.wasm" 2>/dev/null || stat -c%s "implementations/assemblyscript/build/release.wasm" 2>/dev/null)
  GZ=$(gzip -c "implementations/assemblyscript/build/release.wasm" | wc -c | tr -d ' ')
  echo "AssemblyScript,$RAW,$GZ,$(echo "scale=1; $RAW/1024" | bc),$(echo "scale=1; $GZ/1024" | bc),$(echo "scale=1; (1-$GZ/$RAW)*100" | bc),baseline"
  SMALLEST=$GZ
fi

# Porffor
if [ -f "implementations/porffor/transform.wasm" ]; then
  RAW=$(stat -f%z "implementations/porffor/transform.wasm" 2>/dev/null || stat -c%s "implementations/porffor/transform.wasm" 2>/dev/null)
  GZ=$(gzip -c "implementations/porffor/transform.wasm" | wc -c | tr -d ' ')
  RATIO=$(echo "scale=1; $GZ/$SMALLEST" | bc)
  echo "Porffor,$RAW,$GZ,$(echo "scale=1; $RAW/1024" | bc),$(echo "scale=1; $GZ/1024" | bc),$(echo "scale=1; (1-$GZ/$RAW)*100" | bc),${RATIO}x"
fi

# QuickJS
if [ -f "implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm" ]; then
  RAW=$(stat -f%z "implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm" 2>/dev/null || stat -c%s "implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm" 2>/dev/null)
  GZ=$(gzip -c "implementations/quickjs/target/wasm32-wasip1/release/quickjs_transform.wasm" | wc -c | tr -d ' ')
  RATIO=$(echo "scale=1; $GZ/$SMALLEST" | bc)
  echo "QuickJS,$RAW,$GZ,$(echo "scale=1; $RAW/1024" | bc),$(echo "scale=1; $GZ/1024" | bc),$(echo "scale=1; (1-$GZ/$RAW)*100" | bc),${RATIO}x"
fi

# Current lib.wasm.gz (could be TinyGo or Go)
if [ -f "assets/wasm/lib.wasm.gz" ]; then
  GZ=$(stat -f%z "assets/wasm/lib.wasm.gz" 2>/dev/null || stat -c%s "assets/wasm/lib.wasm.gz" 2>/dev/null)
  RAW=$(gunzip -c "assets/wasm/lib.wasm.gz" | wc -c | tr -d ' ')
  RATIO=$(echo "scale=1; $GZ/$SMALLEST" | bc)
  
  # Determine which implementation based on size
  if [ $RAW -lt 500000 ]; then
    NAME="TinyGo"
  elif [ $RAW -lt 5000000 ]; then
    NAME="Go"
  else
    NAME="Go+Goja"
  fi
  
  echo "$NAME,$RAW,$GZ,$(echo "scale=1; $RAW/1024" | bc),$(echo "scale=1; $GZ/1024" | bc),$(echo "scale=1; (1-$GZ/$RAW)*100" | bc),${RATIO}x"
fi