//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
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

// transformData takes a JSON string, processes it, and returns a JSON string
func transformData(args []js.Value) (string, error) {
	js.Global().Get("console").Call("log", "🔄 transformData called with", len(args), "arguments")

	if len(args) < 1 {
		return "", fmt.Errorf("expected at least one argument (JSON string)")
	}

	// Get the input JSON string
	inputJSON := args[0].String()
	js.Global().Get("console").Call("log", "📥 Input JSON:", inputJSON)

	// Parse the input JSON
	var inputData interface{}
	if err := json.Unmarshal([]byte(inputJSON), &inputData); err != nil {
		return "", fmt.Errorf("failed to parse input JSON: %v", err)
	}

	// Transform the data (example transformation - you can modify this)
	transformedData := map[string]interface{}{
		"original":    inputData,
		"transformed": true,
		"timestamp":   js.Global().Get("Date").New().Call("toISOString").String(),
		"message":     "Data has been processed by Go WASM",
	}

	// Convert back to JSON
	outputJSON, err := json.Marshal(transformedData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal output JSON: %v", err)
	}

	result := string(outputJSON)
	js.Global().Get("console").Call("log", "📤 Output JSON:", result)

	return result, nil
}

func main() {
	js.Global().Get("console").Call("log", "🚀 Go WASM module loaded")

	// Expose the transformData function to JavaScript
	js.Global().Set("transformData", promisify(transformData))

	// Add a simple health check function
	js.Global().Set("healthCheck", promisify(func(args []js.Value) (string, error) {
		js.Global().Get("console").Call("log", "💓 Health check called")
		return `{"status": "healthy", "message": "Go WASM module is running"}`, nil
	}))

	js.Global().Get("console").Call("log", "✅ Functions exposed to JavaScript:")
	js.Global().Get("console").Call("log", "  - transformData(jsonString)")
	js.Global().Get("console").Call("log", "  - healthCheck()")

	// Keep the program running
	<-make(chan bool)
}
