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

/// Read an envelope file and check what every consumer checks first: it is
/// JSON, `v` is 3, `protocolId` is 1 and the digest matches its content.
pub fn read_verified(path: &std::path::Path) -> Result<Value, String> {
    let text = std::fs::read_to_string(path).map_err(|e| format!("envelope unreadable: {e}"))?;
    let value: Value = serde_json::from_str(&text).map_err(|e| format!("envelope is not JSON: {e}"))?;
    if value["v"] != 3 {
        return Err("envelope version is not 3".into());
    }
    if value["protocolId"] != 1 {
        return Err("envelope protocolId is not 1".into());
    }
    let claimed = value["digest"].as_str().ok_or("envelope has no digest")?;
    let actual = digest(&value).map_err(|e| format!("envelope has no canonical form: {e:?}"))?;
    if claimed != actual {
        return Err("envelope digest mismatch".into());
    }
    Ok(value)
}

/// Whether `hostBin` names the binary that is running now (both resolved
/// through symlinks). A release that wrote the envelope and a binary that
/// reads it must be the same one.
pub fn host_bin_is_current(envelope: &Value) -> bool {
    let Some(named) = envelope["hostBin"].as_str().and_then(|p| std::fs::canonicalize(p).ok()) else { return false };
    std::env::current_exe().ok().and_then(|p| std::fs::canonicalize(p).ok()).is_some_and(|me| me == named)
}
