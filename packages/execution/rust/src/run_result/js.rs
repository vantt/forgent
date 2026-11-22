//! The few JavaScript rules the record readers and the writer depend on, spelled once: truthiness, `?.` over a
//! value of any shape, trimming and the text a value takes inside a template string.

use serde_json::{Map, Value};

/// JavaScript truthiness of a value that may be absent (`undefined`).
pub(crate) fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_none_or(|f| f != 0.0 && !f.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// `value?.key`: absent for anything that is not an object.
pub(crate) fn get<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.as_object()?.get(key)
}

/// `value?.a?.b?.c` over a chain of keys.
pub(crate) fn path<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a Value> {
    keys.iter().try_fold(value, |node, key| get(node, key))
}

/// `value ?? fallback`, cloned: absent and `null` both take the fallback.
pub(crate) fn or_else(value: Option<&Value>, fallback: Value) -> Value {
    match value {
        None | Some(Value::Null) => fallback,
        Some(v) => v.clone(),
    }
}

pub(crate) fn str_of(value: Option<&Value>) -> Option<&str> {
    value.and_then(Value::as_str)
}

/// `typeof value === 'object'` after a truthiness test: an object or an array.
pub(crate) fn object_like(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::Object(_) | Value::Array(_)))
}

/// `typeof value === 'object' && !Array.isArray(value)`, null excluded.
pub(crate) fn plain_object(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::Object(_)))
}

/// `String.prototype.trim`: Unicode white space plus the byte-order mark.
pub(crate) fn js_trim(text: &str) -> &str {
    text.trim_matches(|c: char| c.is_whitespace() || c == '\u{feff}')
}

/// A non-empty string once trimmed.
pub(crate) fn non_empty_string(value: Option<&Value>) -> bool {
    str_of(value).is_some_and(|s| !js_trim(s).is_empty())
}

/// `String(value)` for a value that may be absent.
pub(crate) fn js_display(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_string(),
        Some(Value::Null) => "null".to_string(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Bool(b)) => b.to_string(),
        Some(Value::Number(n)) => n.to_string(),
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| match item {
                Value::Null => String::new(),
                other => js_display(Some(other)),
            })
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".to_string(),
    }
}

/// `JSON.stringify(value)` for a value that may be absent (`undefined` reads as the word).
pub(crate) fn js_json(value: Option<&Value>) -> String {
    value.map_or_else(|| "undefined".to_string(), Value::to_string)
}

pub(crate) fn object(entries: Vec<(&str, Value)>) -> Value {
    let mut map = Map::new();
    for (key, value) in entries {
        map.insert(key.to_string(), value);
    }
    Value::Object(map)
}

pub(crate) fn strings(items: &[&str]) -> Value {
    Value::Array(
        items
            .iter()
            .map(|s| Value::String((*s).to_string()))
            .collect(),
    )
}
