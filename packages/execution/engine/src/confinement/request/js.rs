//! The few JavaScript behaviours the request rules lean on, written once: truthiness, how a value prints inside a
//! message, strict equality and the plain-object test. Requests are dynamic JSON, judged as Node judged them.

use serde_json::Value;

/// JavaScript truthiness of an optional value (`undefined` and `null` are falsy).
pub(crate) fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|n| n != 0.0 && !n.is_nan()),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// A plain object: an object that is not an array.
pub(crate) fn is_object(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::Object(_)))
}

/// `value[key]` of an object; `None` for anything else or a missing key.
pub(crate) fn get<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.as_object()?.get(key)
}

/// `value?.a?.b` along `keys`.
pub(crate) fn at<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a Value> {
    keys.iter()
        .try_fold(value, |current, key| get(current, key))
}

/// A string that is not blank once trimmed.
pub(crate) fn non_blank(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::String(s)) if !s.trim().is_empty())
}

/// `a ?? b`: `a` unless it is missing or null.
pub(crate) fn coalesce<'a>(a: Option<&'a Value>, b: Option<&'a Value>) -> Option<&'a Value> {
    match a {
        None | Some(Value::Null) => b,
        some => some,
    }
}

/// `Number.isInteger(value) && value >= 1`.
pub(crate) fn positive_integer(value: Option<&Value>) -> bool {
    match value {
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f.fract() == 0.0 && f >= 1.0),
        _ => false,
    }
}

/// `a === b` for JSON values: numbers compare by value, everything else structurally.
pub(crate) fn strict_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => x.as_f64() == y.as_f64(),
        _ => a == b,
    }
}

/// `${value}`: what a template literal prints.
pub(crate) fn display(value: Option<&Value>) -> String {
    match value {
        None => "undefined".into(),
        Some(Value::Null) => "null".into(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Number(n)) => match n.as_f64() {
            Some(f) if f.fract() == 0.0 && f.abs() < 1e21 => format!("{}", f as i64),
            _ => n.to_string(),
        },
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| match item {
                Value::Null => String::new(),
                other => display(Some(other)),
            })
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".into(),
        Some(other) => other.to_string(),
    }
}

/// `JSON.stringify(value)`, where `undefined` prints as the word.
pub(crate) fn json_text(value: Option<&Value>) -> String {
    value.map_or_else(|| "undefined".into(), Value::to_string)
}
