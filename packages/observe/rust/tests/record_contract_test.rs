//! The v2 record envelope: its JSON schema and its Rust shape agree, and it round-trips unchanged.

use fgos_observe::record::types::{Basis, Record};
use std::path::{Path, PathBuf};

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../test/fixtures/observe/record")
}

fn read_json(path: &Path) -> serde_json::Value {
    serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap()
}

#[test]
fn record_round_trips_through_the_envelope_unchanged() {
    let original = read_json(&fixtures().join("records/run-attempt.json"));
    let record: Record = serde_json::from_value(original.clone()).unwrap();
    assert_eq!(record.basis, Basis::Derived);
    assert_eq!(serde_json::to_value(&record).unwrap(), original);
}

#[test]
fn record_ignores_fields_added_by_a_later_revision() {
    let mut value = read_json(&fixtures().join("records/run-attempt.json"));
    value["addedLater"] = serde_json::json!({ "x": 1 });
    value["origin"]["addedLater"] = serde_json::json!("y");
    let record: Record = serde_json::from_value(value).unwrap();
    assert_eq!(record.id, "sha256:unit-run-1/producer/1/01");
}

#[test]
fn record_refuses_a_float_attr_and_an_unknown_basis() {
    let mut value = read_json(&fixtures().join("records/run-attempt.json"));
    value["attrs"]["fixture.attempt"] = serde_json::json!(1.5);
    assert!(serde_json::from_value::<Record>(value).is_err());
    let mut value = read_json(&fixtures().join("records/run-attempt.json"));
    value["basis"] = serde_json::json!("guessed");
    assert!(serde_json::from_value::<Record>(value).is_err());
}

#[test]
fn schema_names_every_field_the_record_writes_and_requires_the_envelope() {
    let schema = read_json(
        &Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts/observe.record.v2.json"),
    );
    let properties = schema["properties"].as_object().unwrap();
    let written = read_json(&fixtures().join("records/run-attempt.json"));
    for key in written.as_object().unwrap().keys() {
        assert!(
            properties.contains_key(key),
            "schema lacks property '{key}'"
        );
    }
    let required: Vec<&str> = schema["required"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    for key in &required {
        assert!(written.get(key).is_some(), "fixture lacks required '{key}'");
    }
    let bases: Vec<&str> = properties["basis"]["enum"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    assert_eq!(
        bases,
        ["observed", "reported", "transcript", "owner", "derived"]
    );
    assert_eq!(properties["v"]["const"], 2);
}
