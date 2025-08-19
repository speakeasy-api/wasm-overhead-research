package main

import "fmt"

func add(a, b int) int {
	return a + b
}

func main() {
	result := add(5, 3)
	fmt.Printf("Result of add(5, 3): %d\n", result)
	
	if result != 8 {
		panic(fmt.Sprintf("Expected 8, got %d", result))
	}
	fmt.Println("✓ Test passed!")
}