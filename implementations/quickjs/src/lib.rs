use rquickjs::{Context, Runtime, Value};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

fn execute_js_internal(js_code: &str, input_data: &str) -> Result<String, String> {
    let rt = Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;
    let ctx = Context::full(&rt).map_err(|e| format!("Failed to create context: {}", e))?;

    ctx.with(|ctx| {
        // Set up the input data as a global variable
        let setup_code = format!("const inputData = `{}`;", input_data.replace('`', r#"\`"#));
        if let Err(e) = ctx.eval::<(), _>(setup_code.as_bytes()) {
            return Err(format!("Failed to set up input data: {:?}", e));
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
            Err(e) => Err(format!("JavaScript execution error: {:?}", e)),
        }
    })
}

/// transform_data that accepts a null-terminated C string.
/// Returns a newly allocated C string (must be freed with free_string).
#[no_mangle]
pub extern "C" fn transform_data(input_ptr: *const c_char) -> *mut c_char {
    if input_ptr.is_null() {
        return std::ptr::null_mut();
    }
    // Safety: input_ptr must point to a valid C string.
    let input = unsafe { CStr::from_ptr(input_ptr) }.to_string_lossy().into_owned();
    // Default transform: JSON parse then stringify (no-op normalize)
    let js_code = "JSON.stringify(JSON.parse(inputData))";
    match execute_js_internal(js_code, &input) {
        Ok(s) => CString::new(s).map(|c| c.into_raw()).unwrap_or(std::ptr::null_mut()),
        Err(_) => std::ptr::null_mut(),
    }
}

/// transform_data that accepts (ptr, len) input.
#[no_mangle]
pub extern "C" fn transform_data_len(ptr: *const u8, len: usize) -> *mut c_char {
    if ptr.is_null() {
        return std::ptr::null_mut();
    }
    // Safety: ptr must point to a valid buffer of length len.
    let input = unsafe { std::slice::from_raw_parts(ptr, len) };
    let input = String::from_utf8_lossy(input).into_owned();
    let js_code = "JSON.stringify(JSON.parse(inputData))";
    match execute_js_internal(js_code, &input) {
        Ok(s) => CString::new(s).map(|c| c.into_raw()).unwrap_or(std::ptr::null_mut()),
        Err(_) => std::ptr::null_mut(),
    }
}

/// Execute arbitrary JS with inputData available as a global.
#[no_mangle]
pub extern "C" fn execute_js(js_ptr: *const c_char, input_ptr: *const c_char) -> *mut c_char {
    if js_ptr.is_null() || input_ptr.is_null() {
        return std::ptr::null_mut();
    }
    let js = unsafe { CStr::from_ptr(js_ptr) }.to_string_lossy().into_owned();
    let input = unsafe { CStr::from_ptr(input_ptr) }.to_string_lossy().into_owned();
    match execute_js_internal(&js, &input) {
        Ok(s) => CString::new(s).map(|c| c.into_raw()).unwrap_or(std::ptr::null_mut()),
        Err(_) => std::ptr::null_mut(),
    }
}

/// Free a C string previously returned by this module.
#[no_mangle]
pub extern "C" fn free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        // Safety: must only be called on pointers returned by our functions.
        unsafe { let _ = CString::from_raw(ptr); }
    }
}

// Note: malloc is already provided by the libc runtime, so we don't define our own