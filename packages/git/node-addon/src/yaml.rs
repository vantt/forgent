//! `yaml` namespace: parse one document with the `tool` profile; the meaning lives in `fgos-yaml-doc`.
use crate::check;
use crate::marshal::{guarded, Failure};
use fgos_yaml_doc::{parse, Profile, Value};
use napi::Result;
use napi_derive::napi;
use serde_json::{json, Number, Value as Json};

/// JSON text in document order (a JSON map type sorts keys); a float with no JSON form is `null`, listed in `special`.
fn write(value: &Value, path: &mut Vec<Json>, out: &mut String, special: &mut Vec<Json>) {
    let mut child = |seg: Json, item: &Value, i: usize, out: &mut String| {
        out.push_str(if i > 0 { "," } else { "" });
        path.push(seg);
        write(item, path, out, special);
        path.pop();
    };
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(&b.to_string()),
        Value::Int(i) => out.push_str(&i.to_string()),
        Value::Str(s) => out.push_str(&Json::from(s.as_str()).to_string()),
        Value::Float(f) => match Number::from_f64(*f) {
            Some(n) => out.push_str(&n.to_string()),
            None => {
                out.push_str("null");
                let word = match f.partial_cmp(&0.0) {
                    None => "nan",
                    Some(std::cmp::Ordering::Greater) => "inf",
                    _ => "-inf",
                };
                special.push(json!([path, word]));
            }
        },
        Value::Seq(items) => {
            out.push('[');
            for (i, x) in items.iter().enumerate() {
                child(json!(i), x, i, out);
            }
            out.push(']');
        }
        Value::Map(entries) => {
            out.push('{');
            for (i, (key, x)) in entries.iter().enumerate() {
                out.push_str(&format!(
                    "{}{}:",
                    if i > 0 { "," } else { "" },
                    Json::from(key.as_str())
                ));
                child(json!(key), x, 0, out);
            }
            out.push('}');
        }
    }
}

/// The document as JSON text plus its non-finite floats.
pub fn to_parts(text: &str, filename: &str) -> std::result::Result<(String, Vec<Json>), Failure> {
    let document = parse(text.as_bytes(), Profile::Tool, filename)?;
    let (mut out, mut special) = (String::new(), Vec::new());
    write(document.value(), &mut Vec::new(), &mut out, &mut special);
    Ok((out, special))
}

/// `{ json, special }`; a refusal is the JSON message of the error (`marshal::Failure`).
#[napi(namespace = "yaml", js_name = "parse")]
pub fn parse_document(text: String, filename: Option<String>) -> Result<Json> {
    check()?;
    let (json, special) = guarded(|| to_parts(&text, filename.as_deref().unwrap_or("YAML input")))?;
    Ok(json!({ "json": json, "special": special }))
}
