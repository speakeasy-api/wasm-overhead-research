.PHONY: build build-go build-tinygo build-optimized build-go-optimized build-tinygo-optimized test test-go test-tinygo clean watch help size-comparison

# Default implementation (deprecated): use mise task arguments instead

# Pass-through args to mise: use "make <target> <args...>"
ARGS := $(filter-out $@,$(MAKECMDGOALS))

# Default target
help:
	@echo "This project uses mise for toolchain and tasks."
	@echo ""
	@echo "Common commands:"
	@echo "  mise install                        # Install tools (Go 1.23)"
	@echo "  mise tasks                          # List available tasks"
	@echo "  mise run build <impl>               # Build with Go (alias for build-go)"
	@echo "  mise run build-go-optimized <impl>  # Build with Go (optimized)"
	@echo "  mise run build-tinygo <impl>        # Build with TinyGo"
	@echo "  mise run test <impl>                # Test (builds first)"
	@echo "  mise run clean                      # Clean artifacts"
	@echo "  mise run watch <impl>               # Watch build (requires fswatch)"
	@echo "  make build <impl>                   # Convenience wrapper to mise"
	@echo "  make test <impl>                    # Convenience wrapper to mise"
	@echo ""
	@echo "Note: Makefile targets are retained for compatibility but logic has moved to mise."

# Default build uses mise task (accepts positional args: make build <impl>)
build:
	@mise run build $(ARGS)

# Build the WASM binary with Go
build-go:
	@mise run build-go $(ARGS)

# Build the WASM binary with TinyGo
build-tinygo:
	@mise run build-tinygo $(ARGS)

# Default optimized build uses Go (mise wrapper)
build-optimized:
	@mise run build-optimized $(ARGS)

# Build the WASM binary with maximum Go optimization + wasm-opt
build-go-optimized:
	@mise run build-go-optimized $(ARGS)

# Build the WASM binary with maximum TinyGo optimization + wasm-opt
build-tinygo-optimized:
	@mise run build-tinygo-optimized $(ARGS)

# Build WASM binary with Javy (JavaScript to WASM) using dynamic linking
build-javy:
	@mise run build-javy $(ARGS)

# Build WASM binary with Javy optimization (dynamic linking is already optimized)
build-javy-optimized:
	@mise run build-javy-optimized $(ARGS)

# Build WASM binary with Porffor (AOT JavaScript to WASM)
build-porffor:
	@mise run build-porffor $(ARGS)

# Build WASM binary with Porffor optimization
build-porffor-optimized:
	@mise run build-porffor-optimized $(ARGS)

# Default test uses mise task (accepts positional args: make test <impl>)
test:
	@mise run test $(ARGS)

# Run tests with Go build (mise wrapper)
test-go:
	@mise run test-go $(ARGS)

# Run tests with TinyGo build (mise wrapper)
test-tinygo:
	@mise run test-tinygo $(ARGS)

# Test Javy implementation directly
test-javy:
	@mise run test-javy $(ARGS)

# Clean build artifacts
clean:
	@mise run clean

# Build in watch mode with Go (requires fswatch)
watch:
	@mise run watch $(ARGS)

# Compare binary sizes for all implementations
size-comparison:
	@mise run size-comparison
gzipped-sizes:
	@mise run gzipped-sizes

# Build WASM binary with QuickJS (Rust + QuickJS JavaScript engine)
build-quickjs:
	@mise run build-quickjs $(ARGS)

# Build WASM binary with QuickJS optimization (already optimized with --release)
build-quickjs-optimized:
	@mise run build-quickjs-optimized $(ARGS)

# Test QuickJS implementation directly
test-quickjs:
	@mise run test-quickjs $(ARGS)

# Test WASI-compatible implementations with Wasmer
test-wasmer:
	@mise run test-wasmer

# Test individual implementations with Wasmer
test-quickjs-wasmer:
	@mise run test-quickjs-wasmer

test-porffor-wasmer:
	@mise run test-porffor-wasmer

measure-all:
	@mise run measure-all
