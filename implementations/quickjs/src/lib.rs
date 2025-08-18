use rquickjs::{Runtime, Context, Value};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// Direct WASM exports for WASI (no wasm-bindgen)
#[no_mangle]
pub extern "C" fn transform_data(input_ptr: *const c_char) -> *mut c_char {
    // Convert C string to Rust string
    let input_cstr = unsafe { CStr::from_ptr(input_ptr) };
    let json_string = match input_cstr.to_str() {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };
    
    // Create a QuickJS runtime and context
    let rt = match Runtime::new() {
        Ok(rt) => rt,
        Err(_) => return std::ptr::null_mut(),
    };
    
    let ctx = match Context::full(&rt) {
        Ok(ctx) => ctx,
        Err(_) => return std::ptr::null_mut(),
    };
    
    let result = ctx.with(|ctx| {
        // JavaScript code to transform the data
        let js_code = format!(r#"
            (function() {{
                const inputData = `{}`;
                const parsedData = JSON.parse(inputData);
                
                // Add processed flag and timestamp
                parsedData.processed = true;
                parsedData.timestamp = new Date().toISOString();
                parsedData.engine = "QuickJS-WASI";
                
                // If there's a users array, increment ages
                if (parsedData.users && Array.isArray(parsedData.users)) {{
                    parsedData.users.forEach(user => {{
                        if (typeof user.age === 'number') {{
                            user.age += 1;
                        }}
                    }});
                }}
                
                return JSON.stringify(parsedData);
            }})()
        "#, json_string.replace('`', r#"\`"#));
        
        // Execute the JavaScript code
        let result: Result<Value, _> = ctx.eval(js_code.as_bytes());
        
        match result {
            Ok(value) => {
                if let Some(s) = value.as_string() {
                    s.to_string().unwrap_or_default()
                } else {
                    "null".to_string()
                }
            }
            Err(_) => "error".to_string()
        }
    });
    
    // Convert result to C string
    match CString::new(result) {
        Ok(c_string) => c_string.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn execute_js(js_code_ptr: *const c_char, input_data_ptr: *const c_char) -> *mut c_char {
    // Convert C strings to Rust strings
    let js_code_cstr = unsafe { CStr::from_ptr(js_code_ptr) };
    let input_data_cstr = unsafe { CStr::from_ptr(input_data_ptr) };
    
    let js_code = match js_code_cstr.to_str() {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };
    
    let input_data = match input_data_cstr.to_str() {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };
    
    // Create a QuickJS runtime and context
    let rt = match Runtime::new() {
        Ok(rt) => rt,
        Err(_) => return std::ptr::null_mut(),
    };
    
    let ctx = match Context::full(&rt) {
        Ok(ctx) => ctx,
        Err(_) => return std::ptr::null_mut(),
    };
    
    let result = ctx.with(|ctx| {
        // Set up the input data as a global variable
        let setup_code = format!("const inputData = {};", input_data);
        if ctx.eval::<(), _>(setup_code.as_bytes()).is_err() {
            return "setup_error".to_string();
        }
        
        // Execute the user's JavaScript code
        let result: Result<Value, _> = ctx.eval(js_code.as_bytes());
        
        match result {
            Ok(value) => {
                if let Some(s) = value.as_string() {
                    s.to_string().unwrap_or_default()
                } else if let Some(n) = value.as_number() {
                    n.to_string()
                } else if let Some(b) = value.as_bool() {
                    b.to_string()
                } else if value.is_null() {
                    "null".to_string()
                } else if value.is_undefined() {
                    "undefined".to_string()
                } else {
                    format!("{:?}", value)
                }
            }
            Err(_) => "execution_error".to_string()
        }
    });
    
    // Convert result to C string
    match CString::new(result) {
        Ok(c_string) => c_string.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

// Memory management function for freeing strings
#[no_mangle]
pub extern "C" fn free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe {
            let _ = CString::from_raw(ptr);
        }
    }
}

// WASI entry point (required for WASI modules)
#[no_mangle]
pub extern "C" fn _start() {
    // Read from stdin for Wasmer CLI compatibility
    use std::io::{self, Read};
    
    let mut input = String::new();
    if io::stdin().read_to_string(&mut input).is_ok() {
        let input_cstring = match CString::new(input.trim()) {
            Ok(s) => s,
            Err(_) => return,
        };
        
        let result_ptr = transform_data(input_cstring.as_ptr());
        if !result_ptr.is_null() {
            let result_cstr = unsafe { CStr::from_ptr(result_ptr) };
            if let Ok(result_str) = result_cstr.to_str() {
                println!("{}", result_str);
            }
            free_string(result_ptr);
        }
    }
}
