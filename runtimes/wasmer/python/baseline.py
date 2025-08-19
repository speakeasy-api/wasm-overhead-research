#!/usr/bin/env python3
"""Baseline Python app without Wasmer - for size comparison"""

def add(a, b):
    return a + b

def main():
    result = add(5, 3)
    print(f"Result of add(5, 3): {result}")
    assert result == 8, f"Expected 8, got {result}"
    print("✓ Test passed!")

if __name__ == "__main__":
    main()