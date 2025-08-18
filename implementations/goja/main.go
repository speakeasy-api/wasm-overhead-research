//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/dop251/goja"
)

// promisify wraps a Go function to return a JavaScript Promise
func promisify(fn func([]js.Value) (string, error)) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Create a new Promise
		handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			resolve := promiseArgs[0]
			reject := promiseArgs[1]

			// Run the function in a goroutine
			go func() {
				defer func() {
					if r := recover(); r != nil {
						errorConstructor := js.Global().Get("Error")
						errorObj := errorConstructor.New(fmt.Sprintf("panic occurred: %v", r))
						reject.Invoke(errorObj)
					}
				}()

				// Pass the original args to the function, not the promise args
				result, err := fn(args)
				if err != nil {
					errorConstructor := js.Global().Get("Error")
					errorObj := errorConstructor.New(err.Error())
					reject.Invoke(errorObj)
				} else {
					resolve.Invoke(result)
				}
			}()

			return nil
		})

		promiseConstructor := js.Global().Get("Promise")
		return promiseConstructor.New(handler)
	})
}

// transformData takes a JSON string and JavaScript code, processes it using Goja JavaScript engine, and returns a JSON string
func transformData(args []js.Value) (string, error) {
	js.Global().Get("console").Call("log", "🔄 transformData called with", len(args), "arguments")

	if len(args) < 2 {
		return "", fmt.Errorf("expected two arguments: JSON string and JavaScript code")
	}

	// Get the input JSON string
	inputJSON := args[0].String()
	js.Global().Get("console").Call("log", "📥 Input JSON:", inputJSON)

	// Get the JavaScript transformation code
	transformJS := args[1].String()
	js.Global().Get("console").Call("log", "📜 JavaScript code length:", len(transformJS), "characters")

	// Parse the input JSON
	var inputData interface{}
	if err := json.Unmarshal([]byte(inputJSON), &inputData); err != nil {
		return "", fmt.Errorf("failed to parse input JSON: %v", err)
	}

	// Create a new Goja runtime
	vm := goja.New()

	// Execute the JavaScript code to define the transform function
	_, err := vm.RunString(transformJS)
	if err != nil {
		return "", fmt.Errorf("failed to execute JavaScript transformation code: %v", err)
	}

	// Get the transform function
	transformFunc, ok := goja.AssertFunction(vm.Get("transform"))
	if !ok {
		return "", fmt.Errorf("transform function not found in JavaScript code")
	}

	// Convert Go data to Goja value
	gojaInput := vm.ToValue(inputData)

	// Call the JavaScript transform function
	result, err := transformFunc(goja.Undefined(), gojaInput)
	if err != nil {
		return "", fmt.Errorf("JavaScript transformation failed: %v", err)
	}

	// Export the result back to Go
	transformedData := result.Export()

	// Convert back to JSON
	outputJSON, err := json.Marshal(transformedData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal output JSON: %v", err)
	}

	resultStr := string(outputJSON)
	js.Global().Get("console").Call("log", "📤 Output JSON:", resultStr)

	return resultStr, nil
}

func main() {
	js.Global().Get("console").Call("log", "🚀 Go WASM module loaded (Goja implementation)")

	// Expose the transformData function to JavaScript
	js.Global().Set("transformData", promisify(transformData))

	// Add a simple health check function
	js.Global().Set("healthCheck", promisify(func(args []js.Value) (string, error) {
		js.Global().Get("console").Call("log", "💓 Health check called")
		return `{"status": "healthy", "message": "Go WASM module with Goja is running"}`, nil
	}))

	js.Global().Get("console").Call("log", "✅ Functions exposed to JavaScript:")
	js.Global().Get("console").Call("log", "  - transformData(jsonString, jsCode)")
	js.Global().Get("console").Call("log", "  - healthCheck()")

	// Keep the program running
	<-make(chan bool)
}
