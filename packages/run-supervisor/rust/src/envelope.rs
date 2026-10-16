//! Envelope digest: `"sha256:" + hex(sha256(canonical JSON without "digest"))`,
//! byte-identical to `computeSha256Digest(canonicalJson(...))` in
//! `src/runner/dispatch/proof-helpers.mjs`.

use serde_json::Value;
use sha2::{Digest, Sha256};

/// Largest integer both JavaScript and Rust represent exactly.
const MAX_SAFE_INTEGER: u64 = (1 << 53) - 1;

/// Why a value has no canonical form.
#[derive(Debug, PartialEq, Eq)]
pub enum CanonicalError {
    /// A number that is not an integer in the JavaScript safe range.
    UnsafeNumber(String),
}

/// Canonical JSON: object keys sorted, no whitespace, integers only.
pub fn canonical_json(value: &Value) -> Result<String, CanonicalError> {
    let mut out = String::new();
    write_canonical(value, &mut out)?;
    Ok(out)
}

fn write_canonical(value: &Value, out: &mut String) -> Result<(), CanonicalError> {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Number(n) => match n.as_i64() {
            Some(i) if i.unsigned_abs() <= MAX_SAFE_INTEGER => out.push_str(&i.to_string()),
            _ => return Err(CanonicalError::UnsafeNumber(n.to_string())),
        },
        Value::String(s) => out.push_str(&quote(s)),
        Value::Array(items) => {
            out.push('[');
            for (i, item) in items.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                write_canonical(item, out)?;
            }
            out.push(']');
        }
        Value::Object(map) => {
            // JavaScript sorts keys by UTF-16 code units; the contract allows
            // only ASCII keys, where that order equals byte order.
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort_by(|a, b| a.encode_utf16().cmp(b.encode_utf16()));
            out.push('{');
            for (i, key) in keys.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                out.push_str(&quote(key));
                out.push(':');
                write_canonical(&map[*key], out)?;
            }
            out.push('}');
        }
    }
    Ok(())
}

/// String escaping of `JSON.stringify` for well-formed strings.
fn quote(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{08}' => out.push_str("\\b"),
            '\u{0c}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Digest of an envelope object: the `digest` key is excluded first.
pub fn digest(envelope: &Value) -> Result<String, CanonicalError> {
    let canonical = match envelope {
        Value::Object(map) => {
            let mut without = map.clone();
            without.remove("digest");
            canonical_json(&Value::Object(without))?
        }
        other => canonical_json(other)?,
    };
    Ok(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())))
}
