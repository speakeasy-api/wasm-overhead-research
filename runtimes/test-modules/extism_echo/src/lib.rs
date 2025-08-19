use extism_pdk::*;

#[plugin_fn]
pub fn echo(input: String) -> FnResult<String> {
    Ok(format!("Echo: {}", input))
}

#[plugin_fn]
pub fn add(input: String) -> FnResult<String> {
    let parts: Vec<&str> = input.split(',').collect();
    if parts.len() != 2 {
        return Err(WithReturnCode::new_with_message(1, "Expected two comma-separated numbers"));
    }
    
    let a = parts[0].parse::<i32>().map_err(|_| WithReturnCode::new_with_message(1, "Invalid first number"))?;
    let b = parts[1].parse::<i32>().map_err(|_| WithReturnCode::new_with_message(1, "Invalid second number"))?;
    
    Ok((a + b).to_string())
}