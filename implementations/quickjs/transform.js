// Sample JavaScript transformation function for QuickJS WASI
// This file can be executed with: wasmer run quickjs.wasm transform.js

// Parse the input data (available as global variable 'inputData')
const data = JSON.parse(inputData);

// Transform the data
const result = {
  message: "Data has been processed by QuickJS WASI",
  original: data,
  timestamp: new Date().toISOString(),
  transformed: true,
  engine: "QuickJS-WASI-Dynamic",
};

// If there's a users array, increment ages
if (data.users && Array.isArray(data.users)) {
  result.users = data.users.map((user) => ({
    ...user,
    age: typeof user.age === "number" ? user.age + 1 : user.age,
  }));
}

// Return the result as JSON string
JSON.stringify(result);
