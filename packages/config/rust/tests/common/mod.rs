//! Shared by the golden runners: fixture loading and the inline-YAML conventions of the fixtures.
#![allow(dead_code)]
use std::path::{Path, PathBuf};

use serde_json::Value;

pub fn contracts() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts")
}

pub fn cases(file: &str) -> Vec<Value> {
    let path = contracts().join("fixtures").join(file);
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    let doc: Value = serde_json::from_str(&text).unwrap_or_else(|e| panic!("{file}: {e}"));
    doc["cases"]
        .as_array()
        .unwrap_or_else(|| panic!("{file}: cases"))
        .clone()
}

/// A file is an array of lines in the fixtures.
pub fn text(lines: &Value) -> String {
    let lines: Vec<&str> = lines
        .as_array()
        .expect("lines")
        .iter()
        .map(|l| l.as_str().expect("line"))
        .collect();
    lines.join("\n") + "\n"
}

/// `(section, bytes)` of a `{section: lines}` map in the map's order. A schema gets its `$id` line
/// first unless it states one itself.
pub fn files(map: &Value, schema: bool) -> Vec<(String, Vec<u8>)> {
    let Some(map) = map.as_object() else {
        return Vec::new();
    };
    map.iter()
        .map(|(name, lines)| {
            let mut body = text(lines);
            if schema && !body.contains("$id:") {
                body = format!("$id: urn:fgos:config-schema:{name}:v1\n{body}");
            }
            (name.clone(), body.into_bytes())
        })
        .collect()
}

pub fn refs(files: &[(String, Vec<u8>)]) -> Vec<(&str, &[u8])> {
    files
        .iter()
        .map(|(n, b)| (n.as_str(), b.as_slice()))
        .collect()
}
