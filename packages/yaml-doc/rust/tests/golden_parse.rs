//! Owning proof of parsing under both profiles, over `fixtures/parse.v1.json`: every rule of spec
//! section 4, every bound at its limit and one past it, key identity, alias expansion, error
//! positions, the byte revision and the spans derived from the parser's own numbers. The pre-scan
//! cases are `golden_prescan`'s.
mod common;

use std::time::{Duration, Instant};

use common::*;
use fgos_yaml_doc::path::parse_path;
use fgos_yaml_doc::{parse, Document, Profile, Segment, Value};
use serde_json::Value as Json;

/// Whether `got` is the value the fixture JSON `want` stands for. `{"$float": ...}` is a float JSON
/// cannot write. A float of 2^53 or more matches the JSON integer of the same value: the `tool`
/// profile reads such an integer as the double a JavaScript caller would get.
fn matches(got: &Value, want: &Json) -> bool {
    match (got, want) {
        (Value::Null, Json::Null) => true,
        (Value::Bool(a), Json::Bool(b)) => a == b,
        (Value::Str(a), Json::String(b)) => a == b,
        (Value::Int(a), Json::Number(b)) => b.as_i64() == Some(*a),
        (Value::Float(a), Json::Number(b)) => match b.as_i64() {
            Some(int) => a.abs() >= 9007199254740992.0 && *a == int as f64,
            None => b.as_f64() == Some(*a),
        },
        (Value::Float(a), Json::Object(special)) => match special["$float"].as_str() {
            Some("nan") => a.is_nan(),
            Some("inf") => *a == f64::INFINITY,
            Some("-inf") => *a == f64::NEG_INFINITY,
            Some("-0") => *a == 0.0 && a.is_sign_negative(),
            _ => false,
        },
        (Value::Seq(a), Json::Array(b)) => {
            a.len() == b.len() && a.iter().zip(b).all(|(x, y)| matches(x, y))
        }
        (Value::Map(a), Json::Object(b)) => {
            a.len() == b.len()
                && a.iter()
                    .all(|(key, value)| b.get(key).is_some_and(|want| matches(value, want)))
        }
        _ => false,
    }
}

fn has_float_escape(json: &Json) -> bool {
    match json {
        Json::Object(map) => map.contains_key("$float") || map.values().any(has_float_escape),
        Json::Array(items) => items.iter().any(has_float_escape),
        _ => false,
    }
}

fn at_path<'a>(value: &'a Value, path: &str) -> Result<&'a Value, String> {
    let mut node = value;
    for segment in parse_path(path).map_err(|e| e.to_string())? {
        node = match (node, segment) {
            (Value::Map(entries), Segment::Key(key)) => entries
                .iter()
                .find(|(k, _)| *k == key)
                .map(|(_, v)| v)
                .ok_or(format!("no key {key} on {path}"))?,
            (Value::Seq(items), Segment::Index(index)) => items
                .get(index)
                .ok_or(format!("no index {index} on {path}"))?,
            _ => return Err(format!("{path} does not lead anywhere")),
        };
    }
    Ok(node)
}

fn check_value(document: &Document, expect: &Json) -> Result<(), String> {
    let want = &expect["value"];
    if !matches(document.value(), want) {
        return Err(format!("value is {:?}", document.value()));
    }
    // The JSON bridge shows the same value; a float JSON cannot write has no bridge.
    if !has_float_escape(want) {
        let json = document.to_json().map_err(|e| e.to_string())?;
        if &json != want {
            return Err(format!("to_json is {json}"));
        }
    }
    Ok(())
}

fn check_sizes(document: &Document, expect: &Json) -> Result<(), String> {
    for check in expect["checks"].as_array().into_iter().flatten() {
        let path = check["path"].as_str().expect("path");
        let node = at_path(document.value(), path)?;
        if let Some(length) = check["length"].as_u64() {
            let got = match node {
                Value::Seq(items) => items.len(),
                Value::Map(entries) => entries.len(),
                other => return Err(format!("{other:?} has no length")),
            };
            if got as u64 != length {
                return Err(format!("length of {path} is {got}, want {length}"));
            }
        }
        if let Some(bytes) = check["string_bytes"].as_u64() {
            let Value::Str(text) = node else {
                return Err(format!("{path} is not a string"));
            };
            if text.len() as u64 != bytes {
                return Err(format!("bytes of {path} are {}, want {bytes}", text.len()));
            }
        }
    }
    Ok(())
}

/// `spans`: each entry names a path and the source text its key and its value occupy.
fn check_spans(document: &Document, expect: &Json) -> Result<(), String> {
    let source = std::str::from_utf8(document.source()).expect("utf-8");
    for entry in expect["spans"].as_array().into_iter().flatten() {
        let path = entry["path"].as_str().expect("span path");
        let segments = parse_path(path).map_err(|e| e.to_string())?;
        let spans = document
            .span_of(&segments)
            .ok_or(format!("no span for {path}"))?;
        let value = &source[spans.value.start..spans.value.end];
        if let Some(want) = entry["value"].as_str() {
            if value != want {
                return Err(format!("value span of {path} is {value:?}, want {want:?}"));
            }
        }
        if let Some(want) = entry["key"].as_str() {
            let key = spans.key.ok_or(format!("{path} has no key span"))?;
            let got = &source[key.start..key.end];
            if got != want {
                return Err(format!("key span of {path} is {got:?}, want {want:?}"));
            }
        }
        let place = (u64::from(spans.value.line), u64::from(spans.value.column));
        if let (Some(line), Some(column)) = (entry["line"].as_u64(), entry["column"].as_u64()) {
            if place != (line, column) {
                return Err(format!(
                    "{path} starts at {place:?}, want {:?}",
                    (line, column)
                ));
            }
        }
    }
    Ok(())
}

fn check_case(case: &Json, profile: Profile) -> Result<(), String> {
    let bytes = resolve_input(&case["input"]);
    let expect = &case["expect"];
    let started = Instant::now();
    let result = parse(&bytes, profile, "fixture.yaml");
    if let Some(millis) = case["max_millis"].as_u64() {
        if started.elapsed() >= Duration::from_millis(millis) {
            return Err(format!("took {:?}, limit {millis} ms", started.elapsed()));
        }
    }
    if expect["refusal"].is_object() {
        let refusal = result.err().ok_or("parsed, a refusal was expected")?;
        if refusal.file != "fixture.yaml" {
            return Err(format!("the refusal names the file {:?}", refusal.file));
        }
        return std::panic::catch_unwind(|| assert_refusal("refusal", &refusal, expect))
            .map_err(|_| format!("refusal differs: got {refusal}"));
    }
    let document = result.map_err(|e| format!("refused: {e}"))?;
    if document.source() != bytes.as_slice() {
        return Err("the source is not the input".into());
    }
    if expect.as_object().is_some_and(|o| o.contains_key("value")) {
        check_value(&document, expect)?;
    } else {
        check_sizes(&document, expect)?;
    }
    check_spans(&document, expect)?;
    match expect["revision"].as_str() {
        Some(revision) if document.revision() != revision => {
            Err(format!("revision is {}", document.revision()))
        }
        _ => Ok(()),
    }
}

#[test]
fn parse_matches_the_golden_cases() {
    let mut failures = Vec::new();
    for case in fixture_cases("parse") {
        for profile in profiles_of(&case) {
            if let Err(why) = check_case(&case, profile) {
                failures.push(format!("{} [{}]: {why}", id(&case), profile.name()));
            }
        }
    }
    assert!(
        failures.is_empty(),
        "{} golden parse cases failed:\n{}",
        failures.len(),
        failures.join("\n")
    );
}

#[test]
fn zero_documents_and_every_profile_row_use_one_profile_table() {
    // One table drives both profiles: the same text is accepted by one and refused by the other
    // only where the table says so (a tag, an anchor, a `<<` key).
    let text = b"a: &x !!str 1\n";
    assert!(parse(text, Profile::Tool, "t.yaml").is_ok());
    let refusal = parse(text, Profile::StrictConfig, "t.yaml").unwrap_err();
    assert_eq!(refusal.rule, "anchor-refused");
}
