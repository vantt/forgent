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

#[test]
fn nested_unsafe_numbers_keep_their_original_error() {
    for raw in [
        "1.0",
        "-0.0",
        "1.5",
        "9007199254740992",
        "-9007199254740992",
        "18446744073709551615",
    ] {
        let number: Value = serde_json::from_str(raw).unwrap();
        let value = serde_json::json!({"nested": [null, {"number": number}]});
        assert_eq!(
            canonical_json(&value),
            Err(CanonicalError::UnsafeNumber(number.to_string()))
        );
    }
}

#[test]
fn unicode_key_order_and_all_control_escapes_keep_golden_bytes() {
    let value = serde_json::json!({"\u{e000}": 9007199254740991_i64, "😀": -9007199254740991_i64,
        "controls": (0u8..32).map(char::from).collect::<String>()});
    let expected = concat!(
        r#"{"controls":"\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f"#,
        r#"\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f","😀":-9007199254740991,"":9007199254740991}"#
    );
    assert_eq!(canonical_json(&value).unwrap(), expected);
}
