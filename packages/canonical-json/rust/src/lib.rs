//! RFC 8785 JSON over IEEE-754 numbers and well-formed Unicode strings.
//! `canonical_json` excludes framing; `canonical_line` adds exactly one LF.
use serde_json::Value;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NonFiniteNumber;
impl std::fmt::Display for NonFiniteNumber {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("number is outside finite IEEE-754 binary64")
    }
}
impl std::error::Error for NonFiniteNumber {}

pub fn canonical_json(value: &Value) -> Result<String, NonFiniteNumber> {
    let mut out = String::new();
    write(value, &mut out)?;
    Ok(out)
}
pub fn canonical_line(value: &Value) -> Result<Vec<u8>, NonFiniteNumber> {
    let mut out = canonical_json(value)?.into_bytes();
    out.push(b'\n');
    Ok(out)
}
fn write(value: &Value, out: &mut String) -> Result<(), NonFiniteNumber> {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Number(n) => {
            let n = n
                .as_f64()
                .filter(|n| n.is_finite())
                .ok_or(NonFiniteNumber)?;
            out.push_str(ryu_js::Buffer::new().format_finite(n));
        }
        Value::String(s) => out.push_str(&serde_json::to_string(s).expect("string serialization")),
        Value::Array(items) => {
            out.push('[');
            for (i, item) in items.iter().enumerate() {
                if i != 0 {
                    out.push(',');
                }
                write(item, out)?;
            }
            out.push(']');
        }
        Value::Object(map) => {
            let mut keys: Vec<_> = map.keys().collect();
            keys.sort_by(|a, b| a.encode_utf16().cmp(b.encode_utf16()));
            out.push('{');
            for (i, key) in keys.into_iter().enumerate() {
                if i != 0 {
                    out.push(',');
                }
                out.push_str(&serde_json::to_string(key).expect("key serialization"));
                out.push(':');
                write(&map[key], out)?;
            }
            out.push('}');
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn shared_vectors() {
        let vectors: Value =
            serde_json::from_str(include_str!("../../contracts/vectors/canonical.v1.json"))
                .unwrap();
        for v in vectors.as_array().unwrap() {
            let input = match v["rawInput"].as_str() {
                Some(raw) => serde_json::from_str(raw).unwrap(),
                None => v["input"].clone(),
            };
            assert_eq!(
                canonical_json(&input).unwrap(),
                v["canonical"].as_str().unwrap()
            );
            assert_eq!(
                canonical_line(&input).unwrap(),
                format!("{}\n", v["canonical"].as_str().unwrap()).as_bytes()
            );
        }
    }
}
