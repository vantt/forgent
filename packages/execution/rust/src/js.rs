//! How JavaScript reads a JSON value, for the ports whose text and choices must match the Node code they replace:
//! its truthiness and the text a template literal prints for it.

use serde_json::Value;

/// JavaScript truthiness of a value that may be absent (a JSON number is never `NaN`).
pub(crate) fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(flag)) => *flag,
        Some(Value::Number(number)) => number.as_f64().is_some_and(|n| n != 0.0),
        Some(Value::String(text)) => !text.is_empty(),
        Some(_) => true,
    }
}

/// ECMAScript's whitespace, which is not Rust's: it holds the byte order mark and not the next-line character.
pub(crate) fn is_space(c: char) -> bool {
    matches!(c, '\u{0009}'..='\u{000d}' | '\u{0020}' | '\u{00a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}')
}

/// `text.trim()` as JavaScript reads it.
pub(crate) fn trim(text: &str) -> &str {
    text.trim_matches(is_space)
}

/// A number as ECMAScript writes it (`3.0` as `3`, `-0` as `0`, `1e21` as `1e+21`): the canonical-JSON door's
/// number text.
fn number(value: &Value) -> String {
    fgos_canonical_json::canonical_json(value).unwrap_or_else(|_| value.to_string())
}

/// `JSON.stringify(value)`. Node parses every number into one IEEE-754 double and writes it back as ECMAScript
/// does, and writes the array-index keys of an object first, in ascending order, before the other keys in insertion
/// order.
pub(crate) fn json(value: &Value) -> String {
    match value {
        Value::Number(_) => number(value),
        Value::Array(items) => {
            format!("[{}]", items.iter().map(json).collect::<Vec<_>>().join(","))
        }
        Value::Object(map) => {
            let index = |key: &str| -> Option<u32> {
                let n: u32 = key.parse().ok()?;
                (n != u32::MAX && n.to_string() == key).then_some(n)
            };
            let mut keys: Vec<&String> = map.keys().collect();
            // A stable sort keeps the other keys in insertion order behind the indices.
            keys.sort_by_key(|key| index(key).map_or((1, 0), |n| (0, n)));
            let fields: Vec<String> = keys
                .into_iter()
                .map(|key| format!("{}:{}", Value::String(key.clone()), json(&map[key])))
                .collect();
            format!("{{{}}}", fields.join(","))
        }
        other => other.to_string(),
    }
}

/// `JSON.stringify(value)` of a value that may be absent, as a template literal prints it: absent is `undefined`.
pub(crate) fn json_or_undefined(value: Option<&Value>) -> String {
    value.map_or_else(|| "undefined".to_string(), json)
}

/// `Number.isInteger`: a JSON number with no fraction, however it was written.
pub(crate) fn integer(value: &Value) -> Option<f64> {
    value.as_f64().filter(|x| x.is_finite() && x.fract() == 0.0)
}

/// A value as a JavaScript template literal renders it: absent is `undefined`.
pub(crate) fn text(value: Option<&Value>) -> String {
    match value {
        None => "undefined".into(),
        Some(Value::Null) => "null".into(),
        Some(Value::String(s)) => s.clone(),
        Some(number_value @ Value::Number(_)) => number(number_value),
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| match item {
                Value::Null => String::new(),
                other => text(Some(other)),
            })
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".into(),
        Some(other) => other.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A refusal quotes the value it refuses as Node's `JSON.stringify` writes it; serde_json keeps a float's
    /// fraction, prints `-0` and never uses an exponent, so the vectors (written by `JSON.stringify`) cannot show it.
    #[test]
    fn json_writes_numbers_and_key_order_as_json_stringify_does() {
        let raw = r#"[3.0, -0, 1e21, 1.5e-7, 123456789012345680000, 0.000001, 9007199254740993, -2.50, {"b":1,"2":2,"1":3,"01":4,"4294967295":5}]"#;
        let value: serde_json::Value = serde_json::from_str(raw).unwrap();
        assert_eq!(
            json(&value),
            r#"[3,0,1e+21,1.5e-7,123456789012345680000,0.000001,9007199254740992,-2.5,{"1":3,"2":2,"b":1,"01":4,"4294967295":5}]"#
        );
    }

    #[test]
    fn a_template_literal_writes_a_number_as_ecmascript_does() {
        let value: Value = serde_json::from_str("[3.0, 1e21]").unwrap();
        assert_eq!(text(Some(&value)), "3,1e+21");
        assert_eq!(text(None), "undefined");
    }
}
