#!/bin/bash
set -e

# Measure Wasmer Go SDK size overhead

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "Measuring Wasmer Go SDK overhead..." >&2

# Measure baseline
BASELINE_DIR="$TMPDIR/baseline"
mkdir -p "$BASELINE_DIR"
cp baseline.go "$BASELINE_DIR/main.go"
cd "$BASELINE_DIR"
go mod init baseline >/dev/null 2>&1
go build -ldflags="-s -w" -o baseline main.go
BASELINE_SIZE=$(stat -f%z baseline 2>/dev/null || stat -c%s baseline)
cd - >/dev/null

# Measure with Wasmer
WASMER_DIR="$TMPDIR/wasmer"
mkdir -p "$WASMER_DIR"
cp go.mod main.go "$WASMER_DIR/"
cd "$WASMER_DIR"
go mod download github.com/wasmerio/wasmer-go >/dev/null 2>&1
go mod tidy >/dev/null 2>&1
go build -ldflags="-s -w" -o wasmer main.go
WASMER_SIZE=$(stat -f%z wasmer 2>/dev/null || stat -c%s wasmer)

# Get module cache size
GOPATH=${GOPATH:-$(go env GOPATH)}
if [ -d "$GOPATH/pkg/mod/github.com/wasmerio" ]; then
    WASMER_MOD_SIZE=$(du -sk "$GOPATH/pkg/mod/github.com/wasmerio" 2>/dev/null | cut -f1 || echo 0)
    WASMER_MOD_SIZE=$((WASMER_MOD_SIZE * 1024))
else
    WASMER_MOD_SIZE=0
fi

# Get Go version
GO_VERSION=$(go version | cut -d' ' -f3)

# Get Wasmer version
WASMER_VERSION=$(go list -m github.com/wasmerio/wasmer-go | cut -d' ' -f2)

cd - >/dev/null

# Output JSON result
cat <<EOF
{
  "runtime": "wasmer",
  "language": "go",
  "os": "$(uname -s | tr '[:upper:]' '[:lower:]')",
  "arch": "$(uname -m)",
  "versions": {
    "go": "$GO_VERSION",
    "sdk": "$WASMER_VERSION"
  },
  "baseline": {
    "binary_size_bytes": $BASELINE_SIZE
  },
  "with_runtime": {
    "binary_size_bytes": $WASMER_SIZE,
    "module_cache_size_bytes": $WASMER_MOD_SIZE
  },
  "delta": {
    "binary_size_bytes": $((WASMER_SIZE - BASELINE_SIZE)),
    "module_cache_size_bytes": $WASMER_MOD_SIZE
  },
  "offline_viable": true,
  "notes": "Wasmer Go SDK with static linking"
}
EOF