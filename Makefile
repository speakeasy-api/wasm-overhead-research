.PHONY: build build-go build-tinygo build-optimized build-go-optimized build-tinygo-optimized test test-go test-tinygo clean watch help size-comparison

# Default implementation
IMPL ?= basic

# Default target
help:
	@echo "Available targets:"
	@echo "  build                - Build the WASM binary with Go (default)"
	@echo "  build-go             - Build the WASM binary with Go"
	@echo "  build-tinygo         - Build the WASM binary with TinyGo (smaller size)"
	@echo "  build-optimized      - Build with maximum Go optimization + wasm-opt"
	@echo "  build-go-optimized   - Build with maximum Go optimization + wasm-opt"
	@echo "  build-tinygo-optimized - Build with maximum TinyGo optimization + wasm-opt"
	@echo "  build-javy           - Build with Javy (JavaScript-to-WASM)"
	@echo "  build-porffor        - Build with Porffor (AOT JavaScript)"
	@echo "  build-quickjs        - Build with QuickJS (Rust + JavaScript engine)"
	@echo "  test                 - Run tests with Go build (default)"
	@echo "  test-go              - Run tests with Go build"
	@echo "  test-tinygo          - Run tests with TinyGo build"
	@echo "  test-wasmer          - Test WASI-compatible implementations with Wasmer"
	@echo "  test-quickjs-wasmer  - Test QuickJS implementation with Wasmer"
	@echo "  test-porffor-wasmer  - Test Porffor implementation with Wasmer"
	@echo "  clean                - Clean build artifacts"
	@echo "  watch                - Build in watch mode with Go"
	@echo "  size-comparison      - Compare binary sizes for all implementations"
	@echo "  help                 - Show this help message"
	@echo ""
	@echo "Available implementations:"
	@ls -1 implementations/ 2>/dev/null || echo "  No implementations found"
	@echo ""
	@echo "Usage: make build IMPL=<implementation>"
	@echo "Example: make build IMPL=basic"
	@echo "Example: make build-optimized IMPL=goja"

# Default build uses Go
build: build-go

# Build the WASM binary with Go
build-go:
	@echo "Building WASM binary with Go ($(IMPL) implementation)..."
	@if [ ! -f "implementations/$(IMPL)/main.go" ]; then \
		echo "❌ Error: Implementation '$(IMPL)' not found in implementations/$(IMPL)/main.go"; \
		exit 1; \
	fi
	@mkdir -p assets/wasm
	@echo "Installing Go dependencies..."
	@go mod tidy > /dev/null 2>&1
	@echo "Compiling to WASM with Go..."
	@GOOS=js GOARCH=wasm go build -trimpath -o main.wasm implementations/$(IMPL)/main.go
	@echo "Compressing WASM binary..."
	@gzip -9 -c main.wasm > main.wasm.gz
	@rm main.wasm
	@mv main.wasm.gz assets/wasm/lib.wasm.gz
	@cp "$$(go env GOROOT)/lib/wasm/wasm_exec.js" assets/wasm/wasm_exec.js
	@echo "✅ Go build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Build the WASM binary with TinyGo
build-tinygo:
	@echo "Building WASM binary with TinyGo ($(IMPL) implementation)..."
	@if [ ! -f "implementations/$(IMPL)/main.go" ]; then \
		echo "❌ Error: Implementation '$(IMPL)' not found in implementations/$(IMPL)/main.go"; \
		exit 1; \
	fi
	@mkdir -p assets/wasm
	@echo "Installing Go dependencies..."
	@go mod tidy > /dev/null 2>&1
	@echo "Compiling to WASM with TinyGo..."
	@if ! command -v tinygo >/dev/null 2>&1; then \
		echo "❌ Error: TinyGo is not installed. Please install it from https://tinygo.org/getting-started/install/"; \
		exit 1; \
	fi
	@tinygo build -target wasm -o main.wasm implementations/$(IMPL)/main.go
	@echo "Compressing WASM binary..."
	@gzip -9 -c main.wasm > main.wasm.gz
	@rm main.wasm
	@mv main.wasm.gz assets/wasm/lib.wasm.gz
	@cp "$$(tinygo env TINYGOROOT)/targets/wasm_exec.js" assets/wasm/wasm_exec.js
	@echo "✅ TinyGo build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Default optimized build uses Go
build-optimized: build-go-optimized

# Build the WASM binary with maximum Go optimization + wasm-opt
build-go-optimized:
	@echo "Building WASM binary with maximum Go optimization ($(IMPL) implementation)..."
	@if [ ! -f "implementations/$(IMPL)/main.go" ]; then \
		echo "❌ Error: Implementation '$(IMPL)' not found in implementations/$(IMPL)/main.go"; \
		exit 1; \
	fi
	@mkdir -p assets/wasm
	@echo "Installing Go dependencies..."
	@go mod tidy > /dev/null 2>&1
	@echo "Compiling to WASM with maximum Go optimization..."
	@CGO_ENABLED=0 GOOS=js GOARCH=wasm go build \
		-ldflags="-s -w -buildid=" \
		-gcflags="-l=4 -B -C" \
		-trimpath \
		-o main_raw.wasm implementations/$(IMPL)/main.go
	@echo "Raw size: $$(du -h main_raw.wasm | cut -f1)"
	@echo "Optimizing with wasm-opt..."
	@if command -v wasm-opt >/dev/null 2>&1; then \
		wasm-opt -Oz --enable-bulk-memory --enable-sign-ext --converge main_raw.wasm -o main.wasm; \
		echo "Optimized size: $$(du -h main.wasm | cut -f1)"; \
	else \
		echo "⚠️  wasm-opt not found, skipping post-build optimization"; \
		mv main_raw.wasm main.wasm; \
	fi
	@echo "Compressing WASM binary..."
	@gzip -9 -c main.wasm > main.wasm.gz
	@rm main.wasm main_raw.wasm 2>/dev/null || true
	@mv main.wasm.gz assets/wasm/lib.wasm.gz
	@cp "$$(go env GOROOT)/lib/wasm/wasm_exec.js" assets/wasm/wasm_exec.js
	@echo "✅ Optimized Go build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Build the WASM binary with maximum TinyGo optimization + wasm-opt
build-tinygo-optimized:
	@echo "Building WASM binary with maximum TinyGo optimization ($(IMPL) implementation)..."
	@if [ ! -f "implementations/$(IMPL)/main.go" ]; then \
		echo "❌ Error: Implementation '$(IMPL)' not found in implementations/$(IMPL)/main.go"; \
		exit 1; \
	fi
	@mkdir -p assets/wasm
	@echo "Installing Go dependencies..."
	@go mod tidy > /dev/null 2>&1
	@echo "Compiling to WASM with maximum TinyGo optimization..."
	@if ! command -v tinygo >/dev/null 2>&1; then \
		echo "❌ Error: TinyGo is not installed. Please install it from https://tinygo.org/getting-started/install/"; \
		exit 1; \
	fi
	@tinygo build \
		-o main_raw.wasm \
		-target wasm \
		-no-debug \
		-gc=leaking \
		-opt=z \
		-size=full \
		-panic=trap \
		implementations/$(IMPL)/main.go
	@echo "Raw size: $$(du -h main_raw.wasm | cut -f1)"
	@echo "Optimizing with wasm-opt..."
	@if command -v wasm-opt >/dev/null 2>&1; then \
		wasm-opt -Oz --enable-bulk-memory --enable-sign-ext --enable-mutable-globals --converge --all-features main_raw.wasm -o main.wasm; \
		echo "Optimized size: $$(du -h main.wasm | cut -f1)"; \
	else \
		echo "⚠️  wasm-opt not found, skipping post-build optimization"; \
		mv main_raw.wasm main.wasm; \
	fi
	@echo "Compressing WASM binary..."
	@gzip -9 -c main.wasm > main.wasm.gz
	@rm main.wasm main_raw.wasm 2>/dev/null || true
	@mv main.wasm.gz assets/wasm/lib.wasm.gz
	@cp "$$(tinygo env TINYGOROOT)/targets/wasm_exec.js" assets/wasm/wasm_exec.js
	@echo "✅ Optimized TinyGo build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Build WASM binary with Javy (JavaScript to WASM) using dynamic linking
build-javy:
	@if [ "$(IMPL)" != "javy" ]; then \
		echo "❌ Error: Javy build only supports IMPL=javy"; \
		exit 1; \
	fi
	@echo "Building WASM binary with Javy ($(IMPL) implementation)..."
	@mkdir -p assets/wasm
	@echo "Creating Javy plugin..."
	@if ! command -v javy >/dev/null 2>&1; then \
		echo "❌ Error: Javy is not installed. Please install it from https://github.com/bytecodealliance/javy"; \
		exit 1; \
	fi
	@cd implementations/$(IMPL) && javy emit-plugin -o plugin.wasm
	@echo "Compiling JavaScript to WASM with dynamic linking..."
	@cd implementations/$(IMPL) && javy build -C dynamic -C plugin=plugin.wasm -o transform_dynamic.wasm transform.js
	@echo "Plugin size: $$(du -h implementations/$(IMPL)/plugin.wasm | cut -f1)"
	@echo "Dynamic module size: $$(du -h implementations/$(IMPL)/transform_dynamic.wasm | cut -f1)"
	@echo "Total size: $$(du -ch implementations/$(IMPL)/plugin.wasm implementations/$(IMPL)/transform_dynamic.wasm | tail -1 | cut -f1)"
	@echo "Compressing dynamic module..."
	@gzip -c implementations/$(IMPL)/transform_dynamic.wasm > assets/wasm/lib.wasm.gz
	@echo "✅ Javy build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Build WASM binary with Javy optimization (dynamic linking is already optimized)
build-javy-optimized:
	@if [ "$(IMPL)" != "javy" ]; then \
		echo "❌ Error: Javy build only supports IMPL=javy"; \
		exit 1; \
	fi
	@echo "Building WASM binary with optimized Javy ($(IMPL) implementation)..."
	@echo "Note: Javy dynamic linking is already highly optimized (4KB modules)"
	@echo "Note: wasm-opt corrupts Javy plugins, so using standard dynamic build"
	@$(MAKE) build-javy IMPL=$(IMPL)
	@echo "✅ Optimized Javy build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Build WASM binary with Porffor (AOT JavaScript to WASM)
build-porffor:
	@if [ "$(IMPL)" != "porffor" ]; then \
		echo "❌ Error: Porffor build only supports IMPL=porffor"; \
		exit 1; \
	fi
	@echo "Building WASM binary with Porffor ($(IMPL) implementation)..."
	@mkdir -p assets/wasm
	@echo "Compiling JavaScript to WASM with Porffor AOT compiler..."
	@if ! command -v porf >/dev/null 2>&1; then \
		echo "❌ Error: Porffor is not installed. Please install it with: npm install -g porffor@latest"; \
		exit 1; \
	fi
	@cd implementations/$(IMPL) && porf wasm transform.js transform.wasm
	@echo "Raw size: $$(du -h implementations/$(IMPL)/transform.wasm | cut -f1)"
	@echo "Compressing WASM binary..."
	@gzip -c implementations/$(IMPL)/transform.wasm > assets/wasm/lib.wasm.gz
	@echo "✅ Porffor build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Build WASM binary with Porffor optimization
build-porffor-optimized:
	@if [ "$(IMPL)" != "porffor" ]; then \
		echo "❌ Error: Porffor build only supports IMPL=porffor"; \
		exit 1; \
	fi
	@echo "Building WASM binary with optimized Porffor ($(IMPL) implementation)..."
	@mkdir -p assets/wasm
	@echo "Compiling JavaScript to WASM with Porffor AOT compiler (max optimization)..."
	@if ! command -v porf >/dev/null 2>&1; then \
		echo "❌ Error: Porffor is not installed. Please install it with: npm install -g porffor@latest"; \
		exit 1; \
	fi
	@cd implementations/$(IMPL) && porf wasm -O3 transform.js transform_opt.wasm
	@echo "Optimized size: $$(du -h implementations/$(IMPL)/transform_opt.wasm | cut -f1)"
	@echo "Compressing WASM binary..."
	@gzip -c implementations/$(IMPL)/transform_opt.wasm > assets/wasm/lib.wasm.gz
	@echo "✅ Optimized Porffor build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Default test uses Go
test: test-go

# Run tests with Go build (builds first)
test-go: build-go
	@echo "Installing Node.js dependencies..."
	@npm install > /dev/null 2>&1
	@echo "Running tests with Go build..."
	@npx vitest run

# Run tests with TinyGo build (builds first)
test-tinygo: build-tinygo
	@echo "Installing Node.js dependencies..."
	@npm install > /dev/null 2>&1
	@echo "Running tests with TinyGo build..."
	@npx vitest run

# Test Javy implementation directly
test-javy:
	@$(MAKE) build-javy IMPL=javy > /dev/null 2>&1
	@echo "Testing Javy implementation..."
	@node -e "import('./implementations/javy/javy-adapter.js').then(async (javy) => { \
		console.log('🚀 Javy adapter loaded'); \
		try { \
			const health = await javy.healthCheck(); \
			console.log('💓 Health check:', JSON.parse(health).status); \
			const result = await javy.transformData('{\"name\":\"test\",\"value\":42}'); \
			const parsed = JSON.parse(result); \
			console.log('🔄 Transform test:', parsed.engine === 'javy' ? 'PASS' : 'FAIL'); \
			console.log('✅ All Javy tests passed!'); \
		} catch (error) { \
			console.error('❌ Javy test failed:', error.message); \
			process.exit(1); \
		} \
	}).catch(console.error);" 2>/dev/null

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf assets/
	@rm -f main.wasm main.wasm.gz
	@rm -rf node_modules/
	@echo "✅ Clean complete"

# Build in watch mode with Go (requires fswatch)
watch:
	@if ! command -v fswatch >/dev/null 2>&1; then \
		echo "❌ Error: fswatch is not installed. Install with: brew install fswatch (macOS) or apt-get install fswatch (Linux)"; \
		exit 1; \
	fi
	@echo "🚀 Starting watch mode with Go ($(IMPL)). Press Ctrl+C to stop."
	@$(MAKE) build-go IMPL=$(IMPL)
	@echo "👀 Watching for changes to *.go files..."
	@fswatch -r -e ".*" -i "\\.go$$" implementations/$(IMPL)/ | while read file; do \
		echo "🔄 Change detected in $$file"; \
		$(MAKE) build-go IMPL=$(IMPL); \
	done

# Compare binary sizes for all implementations
size-comparison:
	@echo "=== Binary Size Comparison ==="
	@echo "| Implementation | Go (KB) | Go Opt (KB) | TinyGo (KB) | TinyGo Opt (KB) | Javy (KB) | Javy Opt (KB) | Best Reduction |"
	@echo "|---------------|---------|-------------|-------------|-----------------|-----------|---------------|----------------|"
	@for impl in $$(ls implementations/); do \
		if [ -f "implementations/$$impl/main.go" ]; then \
			echo -n "| $$impl | "; \
			$(MAKE) build-go IMPL=$$impl > /dev/null 2>&1; \
			go_size=$$(du -k assets/wasm/lib.wasm.gz | cut -f1); \
			echo -n "$$go_size | "; \
			$(MAKE) build-go-optimized IMPL=$$impl > /dev/null 2>&1; \
			go_opt_size=$$(du -k assets/wasm/lib.wasm.gz | cut -f1); \
			echo -n "$$go_opt_size | "; \
			if [ "$$impl" = "goja" ]; then \
				echo -n "N/A* | N/A* | N/A | N/A | "; \
				reduction=$$(echo "scale=1; ($$go_size - $$go_opt_size) * 100 / $$go_size" | bc -l 2>/dev/null || echo "N/A"); \
				echo "$$reduction% |"; \
			else \
				$(MAKE) build-tinygo IMPL=$$impl > /dev/null 2>&1; \
				tinygo_size=$$(du -k assets/wasm/lib.wasm.gz | cut -f1); \
				echo -n "$$tinygo_size | "; \
				$(MAKE) build-tinygo-optimized IMPL=$$impl > /dev/null 2>&1; \
				tinygo_opt_size=$$(du -k assets/wasm/lib.wasm.gz | cut -f1); \
				echo -n "$$tinygo_opt_size | N/A | N/A | "; \
				reduction=$$(echo "scale=1; ($$go_size - $$tinygo_opt_size) * 100 / $$go_size" | bc -l 2>/dev/null || echo "N/A"); \
				echo "$$reduction% |"; \
			fi \
		elif [ -f "implementations/$$impl/transform.js" ]; then \
			echo -n "| $$impl | N/A | N/A | N/A | N/A | "; \
			$(MAKE) build-javy IMPL=$$impl > /dev/null 2>&1; \
			javy_size=$$(du -k assets/wasm/lib.wasm.gz | cut -f1); \
			echo -n "$$javy_size | "; \
			$(MAKE) build-javy-optimized IMPL=$$impl > /dev/null 2>&1; \
			javy_opt_size=$$(du -k assets/wasm/lib.wasm.gz | cut -f1); \
			echo -n "$$javy_opt_size | "; \
			reduction=$$(echo "scale=1; ($$javy_size - $$javy_opt_size) * 100 / $$javy_size" | bc -l 2>/dev/null || echo "N/A"); \
			echo "$$reduction% |"; \
		fi \
	done
	@echo ""
	@echo "*Goja implementation doesn't compile with TinyGo due to dependency complexity"
gzipped-sizes:
	@echo "�� Measuring gzipped sizes of all WASM binaries..."
	@node measure-gzipped-sizes.js

# Build WASM binary with QuickJS (Rust + QuickJS JavaScript engine)
build-quickjs:
	@if [ "$(IMPL)" != "quickjs" ]; then \
		echo "❌ Error: QuickJS build only supports IMPL=quickjs"; \
		exit 1; \
	fi
	@echo "Building WASM binary with QuickJS ($(IMPL) implementation)..."
	@mkdir -p assets/wasm
	@echo "Compiling Rust + QuickJS to WASM with WASI target..."
	@if ! command -v cargo >/dev/null 2>&1; then \
		echo "❌ Error: Rust/Cargo is not installed. Please install it from https://rustup.rs/"; \
		exit 1; \
	fi
	@cd implementations/$(IMPL) && cargo build --target wasm32-wasip1 --release
	@echo "Raw size: $$(du -h implementations/$(IMPL)/target/wasm32-wasip1/release/quickjs_transform.wasm | cut -f1)"
	@echo "Compressing WASM binary..."
	@gzip -c implementations/$(IMPL)/target/wasm32-wasip1/release/quickjs_transform.wasm > assets/wasm/lib.wasm.gz
	@echo "✅ QuickJS build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Build WASM binary with QuickJS optimization (already optimized with --release)
build-quickjs-optimized:
	@if [ "$(IMPL)" != "quickjs" ]; then \
		echo "❌ Error: QuickJS build only supports IMPL=quickjs"; \
		exit 1; \
	fi
	@echo "Building WASM binary with optimized QuickJS ($(IMPL) implementation)..."
	@echo "Note: QuickJS Rust build is already optimized with --release profile"
	@$(MAKE) build-quickjs IMPL=$(IMPL)
	@echo "✅ Optimized QuickJS build complete ($(IMPL)): assets/wasm/lib.wasm.gz ($$(du -h assets/wasm/lib.wasm.gz | cut -f1))"

# Test QuickJS implementation directly
test-quickjs:
	@$(MAKE) build-quickjs IMPL=quickjs > /dev/null 2>&1
	@echo "Testing QuickJS implementation..."
	@node implementations/quickjs/quickjs-wasi-test.js 2>/dev/null

# Test WASI-compatible implementations with Wasmer
test-wasmer:
	@echo "🧪 Testing WASI-compatible implementations with Wasmer..."
	@./test-wasmer.sh

# Test individual implementations with Wasmer
test-quickjs-wasmer:
	@$(MAKE) build-quickjs IMPL=quickjs > /dev/null 2>&1
	@echo "Testing QuickJS with Wasmer..."
	@cd implementations/quickjs && ./quickjs-wasmer-test.sh

test-porffor-wasmer:
	@$(MAKE) build-porffor IMPL=porffor > /dev/null 2>&1
	@echo "Testing Porffor with Wasmer..."
	@cd implementations/porffor && ./porffor-wasmer-test.sh

measure-all: size-comparison gzipped-sizes
	@echo ""
	@echo "✅ Complete size analysis finished!"
