use fgos_seat_binding::{bind, ladder, BindInput, BindOutput};
use serde_json::{json, Value};

const GOLDEN: &str = include_str!("../../contracts/seat-binding.golden.v1.json");

/// Objects merge by key, null deletes a key, anything else replaces.
fn merge(base: &Value, patch: &Value) -> Value {
    match (base, patch) {
        (Value::Object(b), Value::Object(p)) => {
            let mut out = b.clone();
            for (key, value) in p {
                if value.is_null() {
                    out.remove(key);
                } else if let Some(existing) = b.get(key) {
                    out.insert(key.clone(), merge(existing, value));
                } else {
                    out.insert(key.clone(), value.clone());
                }
            }
            Value::Object(out)
        }
        _ => patch.clone(),
    }
}

/// `expected` is a subset of `actual`: object keys must match, arrays match over the expected
/// prefix, and an expected null also accepts an absent key.
fn subset(expected: &Value, actual: Option<&Value>, path: &str, failures: &mut Vec<String>) {
    match (expected, actual) {
        (Value::Null, None) | (Value::Null, Some(Value::Null)) => {}
        (_, None) => failures.push(format!("{path}: missing, expected {expected}")),
        (Value::Object(e), Some(Value::Object(a))) => {
            for (key, value) in e {
                subset(value, a.get(key), &format!("{path}.{key}"), failures);
            }
        }
        (Value::Array(e), Some(Value::Array(a))) => {
            if a.len() < e.len() {
                failures.push(format!("{path}: has {} elements, expected at least {}", a.len(), e.len()));
            }
            for (index, value) in e.iter().enumerate() {
                subset(value, a.get(index), &format!("{path}[{index}]"), failures);
            }
        }
        (e, Some(a)) => {
            if e != a {
                failures.push(format!("{path}: expected {e}, got {a}"));
            }
        }
    }
}

fn run(base: &Value, case: &Value) -> (BindOutput, Value) {
    let input_json = merge(base, &case["patch"]);
    let input: BindInput = serde_json::from_value(input_json)
        .unwrap_or_else(|err| panic!("{}: input does not parse: {err}", case["name"]));
    let output = bind(&input);
    let value = serde_json::to_value(&output).unwrap();
    (output, value)
}

#[test]
fn golden_cases_are_the_behavior_source() {
    let fixture: Value = serde_json::from_str(GOLDEN).expect("golden fixture parses");
    assert_eq!(fixture["contract"], "seat-binding.golden.v1");
    let base = &fixture["base"];
    let cases = fixture["cases"].as_array().unwrap();
    assert!(cases.len() >= 70, "the golden file is the shared contract");
    let mut failures = Vec::new();
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let (output, value) = run(base, case);
        let mut local = Vec::new();
        subset(&case["expected"], Some(&value), "$", &mut local);
        if let Some(list) = case.get("executors") {
            let actual: Vec<Value> = output
                .ranked
                .as_ref()
                .map(|r| r.candidates.iter().map(|c| json!(c.executor)).collect())
                .unwrap_or_default();
            if &Value::Array(actual.clone()) != list {
                local.push(format!("executors: expected {list}, got {}", Value::Array(actual)));
            }
        }
        if let Some(list) = case.get("skippedReasons") {
            let actual: Vec<Value> = output
                .ranked
                .as_ref()
                .map(|r| r.skipped.iter().map(|s| json!(s.reason)).collect())
                .unwrap_or_default();
            if &Value::Array(actual.clone()) != list {
                local.push(format!("skippedReasons: expected {list}, got {}", Value::Array(actual)));
            }
        }
        if let Some(parts) = case.get("explainContains").and_then(Value::as_array) {
            let text = output.explain.text();
            for part in parts {
                let part = part.as_str().unwrap();
                if !text.contains(part) {
                    local.push(format!("explain lacks {part:?}; explain was:\n{text}"));
                }
            }
        }
        failures.extend(local.into_iter().map(|f| format!("[{name}] {f}")));
    }
    assert!(failures.is_empty(), "{} golden failures:\n{}", failures.len(), failures.join("\n"));
}

#[test]
fn every_case_is_deterministic() {
    let fixture: Value = serde_json::from_str(GOLDEN).unwrap();
    for case in fixture["cases"].as_array().unwrap() {
        let (_, first) = run(&fixture["base"], case);
        let (_, second) = run(&fixture["base"], case);
        assert_eq!(first, second, "{}", case["name"]);
    }
}

#[test]
fn the_replayable_input_carries_no_config_body_or_account_facts() {
    let fixture: Value = serde_json::from_str(GOLDEN).unwrap();
    let (output, value) = run(&fixture["base"], &fixture["cases"][0]);
    let text = value["bindingInput"].to_string();
    assert!(value["bindingInput"]["protocol"] == 1);
    for forbidden in ["modelPolicies", "\"accountView\":", "\"launchView\":", "clis", "tierFallback"] {
        assert!(!text.contains(forbidden), "bindingInput leaks {forbidden}");
    }
    let replay: fgos_seat_binding::BindingInput = serde_json::from_value(value["bindingInput"].clone()).unwrap();
    assert_eq!(replay, output.binding_input);
}

#[test]
fn ranked_round_trips_through_json_for_replay() {
    let fixture: Value = serde_json::from_str(GOLDEN).unwrap();
    for case in fixture["cases"].as_array().unwrap() {
        let (output, value) = run(&fixture["base"], case);
        let back: BindOutput = serde_json::from_value(value).unwrap();
        assert_eq!(back, output, "{}", case["name"]);
    }
}

#[test]
fn the_ladder_text_is_the_source_of_the_config_comment() {
    let ladder = ladder();
    assert_eq!(ladder.vocabulary.len(), 6);
    let text = serde_json::to_string(&ladder).unwrap();
    assert!(text.contains("\"frontier\"") && text.contains("selfCheck"));
}
