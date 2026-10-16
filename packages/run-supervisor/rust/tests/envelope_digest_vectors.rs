//! The shared digest vectors must reproduce byte for byte in Rust, exactly as
//! `test/run-supervisor/contracts.test.mjs` checks them in Node.

use fgos_run_supervisor::envelope::{canonical_json, digest, CanonicalError};
use serde_json::Value;

fn vectors() -> Value {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../contracts/vectors/envelope-digest.v1.json"
    );
    serde_json::from_str(&std::fs::read_to_string(path).expect("read vectors"))
        .expect("parse vectors")
}

#[test]
fn every_vector_matches_canonical_json_and_digest() {
    let vectors = vectors();
    let cases = vectors["cases"].as_array().expect("cases");
    assert!(!cases.is_empty());
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let input = &case["input"];
        assert_eq!(
            canonical_json(&strip_digest(input)).unwrap(),
            case["canonical"].as_str().unwrap(),
            "{name}"
        );
        assert_eq!(
            digest(input).unwrap(),
            case["digest"].as_str().unwrap(),
            "{name}"
        );
    }
}

#[test]
fn floats_have_no_canonical_form() {
    let value: Value = serde_json::from_str(r#"{"a":1.5}"#).unwrap();
    assert!(matches!(
        canonical_json(&value),
        Err(CanonicalError::UnsafeNumber(_))
    ));
}

fn strip_digest(value: &Value) -> Value {
    let mut value = value.clone();
    if let Some(map) = value.as_object_mut() {
        map.remove("digest");
    }
    value
}
