#include <stdio.h>

int main() {
    printf("Hello from WASI!\n");
    return 0;
}

__attribute__((export_name("hello")))
int hello() {
    printf("Hello from WASI function!\n");
    return 42;
}