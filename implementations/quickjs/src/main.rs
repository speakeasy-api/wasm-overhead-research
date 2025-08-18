use rquickjs::{Runtime, Context, Value};
use std::env;
use std::io::{self, Read};

fn execute_js(js_code: &str, input_data: &str) -> Result<String, String> {
    let rt = Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;
    let ctx = Context::full(&rt).map_err(|e| format!("Failed to create context: {}", e))?;
    
    ctx.with(|ctx| {
        // Set up the input data as a global variable
        let setup_code = format!("const inputData = `{}`;", input_data.replace('`', r#"\`"#));
        if ctx.eval::<(), _>(setup_code.as_bytes()).is_err() {
            return Err("Failed to set up input data".to_string());
        }
        
        // Execute the user's JavaScript code
        let result: Result<Value, _> = ctx.eval(js_code.as_bytes());
        
        match result {
            Ok(value) => {
                if let Some(s) = value.as_string() {
                    Ok(s.to_string().unwrap_or_default())
                } else if let Some(n) = value.as_number() {
                    Ok(n.to_string())
                } else if let Some(b) = value.as_bool() {
                    Ok(b.to_string())
                } else if value.is_null() {
                    Ok("null".to_string())
                } else if value.is_undefined() {
                    Ok("undefined".to_string())
                } else {
                    Ok(format!("{:?}", value))
                }
            }
            Err(e) => Err(format!("JavaScript execution error: {:?}", e))
        }
    })
}

fn main() {
    let args: Vec<String> = env::args().collect();
    
    // Require JavaScript code as argument
    if args.len() < 2 {
        eprintln!("Usage: wasmer run quickjs.wasm 'JavaScript code' [input_data]");
        eprintln!("Example: echo '{{\"test\": 123}}' | wasmer run quickjs.wasm 'JSON.stringify({{result: JSON.parse(inputData)}})'");
        return;
    }
    
    let js_code = args[1].clone();
    
    // Read input data from stdin
    let mut input_data = String::new();
    if let Err(e) = io::stdin().read_to_string(&mut input_data) {
        eprintln!("Error reading input: {}", e);
        return;
    }
    
    // Trim whitespace from input
    input_data = input_data.trim().to_string();
    
    // Execute JavaScript with the input data
    match execute_js(&js_code, &input_data) {
        Ok(result) => println!("{}", result),
        Err(e) => eprintln!("Error: {}", e),
    }
}
