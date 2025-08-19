package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"

	"github.com/wasmerio/wasmer-go/wasmer"
)

func main() {
	// Path to the test WASM module
	wasmPath := filepath.Join("..", "..", "test-modules", "add.wasm")

	// Read the WASM file
	wasmBytes, err := ioutil.ReadFile(wasmPath)
	if err != nil {
		log.Fatalf("Failed to read WASM file: %v", err)
	}

	// Create a new WebAssembly Engine
	engine := wasmer.NewEngine()

	// Create a Store
	store := wasmer.NewStore(engine)

	// Compile the module
	module, err := wasmer.NewModule(store, wasmBytes)
	if err != nil {
		log.Fatalf("Failed to compile module: %v", err)
	}

	// Instantiate the module
	instance, err := wasmer.NewInstance(module, wasmer.NewImportObject())
	if err != nil {
		log.Fatalf("Failed to instantiate module: %v", err)
	}

	// Get the exported function
	add, err := instance.Exports.GetFunction("add")
	if err != nil {
		log.Fatalf("Failed to get add function: %v", err)
	}

	// Call the function
	result, err := add(5, 3)
	if err != nil {
		log.Fatalf("Failed to call add function: %v", err)
	}

	fmt.Printf("Result of add(5, 3): %d\n", result)

	// Verify the result
	if result != 8 {
		log.Fatalf("Expected 8, got %d", result)
	}
	fmt.Println("✓ Test passed!")
}