//! JSON reading helpers that keep JavaScript's meaning of absent, null and truthy, so a record read here is
//! judged the way the Node reader judged it.

use serde_json::Value;

/// JavaScript truthiness of a parsed JSON value.
pub(crate) fn truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|f| f != 0.0),
        Value::String(s) => !s.is_empty(),
        Value::Array(_) | Value::Object(_) => true,
    }
}

/// `value?.[key]` as `Some` only when present and not null (the case `??` does not skip).
pub(crate) fn nn(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null())
}

/// `value?.[key]`, present and not null.
pub(crate) fn get<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    nn(value.get(key))
}

/// The string at `key`, when it is one.
pub(crate) fn str_at<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

/// `JSON.stringify(value)` where an absent value stringifies as `undefined` in a template literal.
pub(crate) fn js_json(value: Option<&Value>) -> String {
    value.map_or_else(|| "undefined".to_string(), Value::to_string)
}

/// The elements of an array value (empty for anything else).
pub(crate) fn items(value: Option<&Value>) -> &[Value] {
    value.and_then(Value::as_array).map_or(&[], Vec::as_slice)
}
