//! The few JavaScript behaviours the shape rules lean on, written once: `JSON.stringify` of a maybe-missing value,
//! truthiness, and the plain-object test. Policies are dynamic JSON, judged as Node judged them.

use serde_json::Value;

/// `JSON.stringify(value)` as a template string prints it; a missing value prints `undefined`.
pub(crate) fn show(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_string(),
        Some(v) => serde_json::to_string(v).unwrap_or_else(|_| "undefined".to_string()),
    }
}

/// JavaScript truthiness of a present value.
pub(crate) fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// `typeof v === 'string' && v.trim()` is non-empty.
pub(crate) fn non_blank(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::String(s)) if !s.trim().is_empty())
}

/// `Number.isInteger(value)` as an integer, when it is one.
pub(crate) fn integer(value: &Value) -> Option<i64> {
    match value {
        Value::Number(n) => n.as_i64().or_else(|| {
            n.as_f64()
                .filter(|f| f.fract() == 0.0 && f.abs() < 9e15)
                .map(|f| f as i64)
        }),
        _ => None,
    }
}

/// A string field of an object, `None` when missing or not a string.
pub(crate) fn str_field<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

/// `a ?? b`: `a` unless it is missing or null.
pub(crate) fn coalesce<'a>(a: Option<&'a Value>, b: Option<&'a Value>) -> Option<&'a Value> {
    match a {
        None | Some(Value::Null) => b,
        some => some,
    }
}
