//! Shared fixture loading for the golden runners. Each runner loads only its own fixture file.
#![allow(dead_code)] // each test binary uses a different part of this module

use std::path::PathBuf;

use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::{CommentLoss, Document, Position, Profile, Refusal, Segment, Value};
use serde_json::Value as Json;

pub fn contracts_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts")
}

pub fn read_json(relative: &str) -> Json {
    let path = contracts_dir().join(relative);
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

/// The cases of `fixtures/<name>.v1.json`.
pub fn fixture_cases(name: &str) -> Vec<Json> {
    let doc = read_json(&format!("fixtures/{name}.v1.json"));
    assert_eq!(doc["version"], 1, "{name}: fixture version");
    let cases = doc["cases"]
        .as_array()
        .unwrap_or_else(|| panic!("{name}: cases is not an array"))
        .clone();
    assert!(!cases.is_empty(), "{name}: no cases");
    cases
}

pub fn id(case: &Json) -> &str {
    case["id"].as_str().expect("case id")
}

pub fn profiles_of(case: &Json) -> Vec<Profile> {
    case["profiles"]
        .as_array()
        .unwrap_or_else(|| panic!("{}: profiles", id(case)))
        .iter()
        .map(|p| {
            Profile::from_name(p.as_str().unwrap_or(""))
                .unwrap_or_else(|| panic!("{}: unknown profile", id(case)))
        })
        .collect()
}

/// Bytes of a case input: `lines` (each followed by LF), `text`, `hex`, `parts` (concatenated)
/// or `generate` (`prefix`, `unit` repeated `count` times joined by `separator`, `suffix`; in a
/// unit `{i}` is the index and `{indent}` is two spaces per index).
pub fn resolve_input(input: &Json) -> Vec<u8> {
    if let Some(lines) = input["lines"].as_array() {
        return lines
            .iter()
            .flat_map(|l| format!("{}\n", l.as_str().expect("line")).into_bytes())
            .collect();
    }
    if let Some(text) = input["text"].as_str() {
        return text.as_bytes().to_vec();
    }
    if let Some(hex) = input["hex"].as_str() {
        let digits: Vec<u8> = hex.bytes().filter(|b| !b.is_ascii_whitespace()).collect();
        return digits
            .chunks(2)
            .map(|pair| {
                u8::from_str_radix(std::str::from_utf8(pair).expect("hex"), 16).expect("hex")
            })
            .collect();
    }
    if let Some(parts) = input["parts"].as_array() {
        return parts.iter().flat_map(resolve_input).collect();
    }
    let generate = &input["generate"];
    assert!(generate.is_object(), "input has no known form");
    let text = |key: &str| generate[key].as_str().unwrap_or("").to_string();
    let unit = generate["unit"].as_str().expect("generate.unit");
    let count = generate["count"].as_u64().expect("generate.count") as usize;
    let separator = text("separator");
    let numbered = unit.contains("{i}") || unit.contains("{indent}");
    let mut out = text("prefix");
    for i in 0..count {
        if i > 0 {
            out.push_str(&separator);
        }
        if numbered {
            out.push_str(
                &unit
                    .replace("{i}", &i.to_string())
                    .replace("{indent}", &" ".repeat(2 * i)),
            );
        } else {
            out.push_str(unit);
        }
    }
    out.push_str(&text("suffix"));
    out.into_bytes()
}

/// A JSON string is a key, a JSON number an index.
pub fn segments_from_json(json: &Json) -> Vec<Segment> {
    json.as_array()
        .expect("segments array")
        .iter()
        .map(|s| match s {
            Json::String(key) => Segment::Key(key.clone()),
            Json::Number(n) => Segment::Index(n.as_u64().expect("index") as usize),
            other => panic!("bad segment {other}"),
        })
        .collect()
}

/// Checks a refusal against `expect.refusal`: rule always; line, column, path text and detail
/// when the fixture pins them.
pub fn assert_refusal(case: &str, got: &Refusal, expect: &Json) {
    let want = &expect["refusal"];
    assert_eq!(
        got.rule,
        want["rule"].as_str().expect("refusal.rule"),
        "{case}: rule ({got})"
    );
    if let Some(line) = want["line"].as_u64() {
        assert_eq!(got.line, Some(line as u32), "{case}: line ({got})");
    }
    if let Some(column) = want["column"].as_u64() {
        assert_eq!(got.column, Some(column as u32), "{case}: column ({got})");
    }
    if let Some(path) = want["path"].as_str() {
        assert_eq!(format_path(&got.path), path, "{case}: path ({got})");
    }
    if let Some(detail) = want["detail"].as_str() {
        assert_eq!(
            got.detail.as_deref(),
            Some(detail),
            "{case}: detail ({got})"
        );
    }
}

/// Applies one operation; `Ok(Some(comments))` for a read.
pub fn apply_op(doc: &mut Document, op: &Json) -> Result<Option<Json>, fgos_yaml_doc::Refusal> {
    let name = op["op"].as_str().expect("op");
    let path = parse_path(op["path"].as_str().expect("op path")).expect("op path parses");
    let value = || Value::from_json(&op["value"]);
    let ack = if op["acknowledge"].as_bool().unwrap_or(false) {
        CommentLoss::Acknowledge
    } else {
        CommentLoss::Refuse
    };
    match name {
        "set" => doc.set(&path, value(), ack).map(|()| None),
        "insert" => {
            let key = op["key"].as_str().expect("insert key");
            let position = match op["after"].as_str() {
                Some(after) => Position::After(after),
                None => Position::End,
            };
            doc.insert(&path, key, value(), position, ack)
                .map(|()| None)
        }
        "remove" => doc.remove(&path, ack).map(|()| None),
        "setCommentBlock" => {
            let lines: Vec<String> = op["lines"]
                .as_array()
                .expect("lines")
                .iter()
                .map(|l| l.as_str().expect("line").to_string())
                .collect();
            doc.set_comment_block(&path, &lines).map(|()| None)
        }
        "setInlineComment" => doc
            .set_inline_comment(&path, op["text"].as_str())
            .map(|()| None),
        "commentsAt" => doc.comments_at(&path).map(|c| {
            Some(serde_json::json!({
                "block": c.above,
                "inline": c.inline,
            }))
        }),
        other => panic!("unknown op {other}"),
    }
}
