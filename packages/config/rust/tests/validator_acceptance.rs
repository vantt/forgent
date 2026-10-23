//! Acceptance of the pinned JSON Schema validator crate (`packages/config/upgrade-record.md`): the
//! official suite for the keywords fgOS schemas use, and one test per known defect that proves the
//! defect is still there, so a bump that fixes one fails here and says what to review.
mod common;

use jsonschema::Draft;
use serde_json::Value;

use common::contracts;

fn compile(schema: &Value) -> Result<jsonschema::Validator, String> {
    jsonschema::options()
        .with_draft(Draft::Draft202012)
        .build(schema)
        .map_err(|e| e.to_string())
}

/// Suite groups that need a document fetched from outside the schema (a remote `$ref`): the
/// crate is built without a retriever on purpose, and fgOS schemas reference only local `$defs`.
fn needs_retrieval(schema: &Value) -> bool {
    schema.to_string().contains("localhost:1234")
}

/// The one suite case the pinned crate fails under the product's feature set (finding F3 of the
/// upgrade record: objects compare as if keys were sorted). `schema-object-comparison` keeps object
/// values out of `const`, `enum` and `uniqueItems`. When a bump makes this case pass, the equality
/// below fails: delete the row, then review that rule and the F3 test.
const KNOWN_FAILURES: &[&str] =
    &["const.json: const with object: \"same object with different property order is valid\""];

#[test]
fn official_suite_passes_for_the_keywords_fgos_schemas_use() {
    let dir = contracts().join("fixtures/json-schema-suite");
    let (mut run, mut skipped) = (0, 0);
    let mut failures = Vec::new();
    for entry in std::fs::read_dir(&dir).unwrap() {
        let path = entry.unwrap().path();
        if path.extension().is_none_or(|e| e != "json") {
            continue;
        }
        let groups: Vec<Value> = serde_json::from_slice(&std::fs::read(&path).unwrap()).unwrap();
        for group in groups {
            let (name, schema) = (group["description"].as_str().unwrap(), &group["schema"]);
            if needs_retrieval(schema) {
                skipped += 1;
                continue;
            }
            let validator = match compile(schema) {
                Ok(v) => v,
                Err(e) => {
                    failures.push(format!("{}: {name}: build: {e}", path.display()));
                    continue;
                }
            };
            for test in group["tests"].as_array().unwrap() {
                run += 1;
                let got = validator.is_valid(&test["data"]);
                if got != test["valid"].as_bool().unwrap() {
                    failures.push(format!(
                        "{}: {name}: {}",
                        path.file_name().unwrap().to_string_lossy(),
                        test["description"]
                    ));
                }
            }
        }
    }
    assert!(run > 400, "suite files are missing: {run} cases ran");
    assert_eq!(failures, KNOWN_FAILURES, "{skipped} groups skipped");
}

/// F1. Out-of-range numbers: the crate assumes every number has an `f64` unless its own
/// `arbitrary-precision` feature is on, but a product build turns serde_json's `arbitrary_precision`
/// on, so `1e400` parses and then reaches an `unreachable!`. Guard: only values made by
/// `fgos-yaml-doc` enter `validate.rs` (finite floats and `i64`), proven by the second half.
/// When a bump makes the first half stop panicking, upstream fixed F1: review whether the
/// yaml-doc-only input type of `validate.rs` still earns its keep, then delete the first half.
#[test]
fn out_of_range_number_panics_the_crate_and_cannot_reach_it_through_the_port() {
    let huge: Value = serde_json::from_str(r#"{"type": "integer", "minimum": 1e400}"#).unwrap();
    let hit = std::panic::catch_unwind(|| compile(&huge).map(|v| v.is_valid(&Value::from(1))));
    assert!(
        hit.is_err(),
        "F1 is fixed upstream: the crate no longer panics on 1e400"
    );

    let schema = br#"{"$id": "urn:fgos:config-schema:demo:v1", "type": "object", "properties": {"n": {"type": "integer"}}}"#;
    let schemas = fgos_config::schema::Schemas::parse(&[("demo", schema)]).unwrap();
    let json: Value = serde_json::from_str(r#"{"demo": {"n": 1e400}}"#).unwrap();
    let found = schemas
        .validate(&fgos_yaml_doc::Value::from_json(&json))
        .unwrap();
    assert_eq!(
        found.len(),
        1,
        "the number arrives as null and fails `type`"
    );
    assert_eq!(found[0].keyword, "type");
    // A document read from YAML never holds such a number: strict-config refuses it.
    let yaml = fgos_yaml_doc::parse(
        b"n: 1e400\n",
        fgos_yaml_doc::Profile::StrictConfig,
        "f.yaml",
    );
    assert!(yaml.and_then(|d| d.to_json()).is_err());
}

/// F2. A `pattern` compiles in more than linear time (the crate re-parses the whole pattern once per
/// `\d`, `\s` or `\w`). Guard: `schema-pattern-length` (at most 256 characters), proven by
/// `golden_meta`. When a bump makes the ratio fall to about 4 (linear), upstream fixed F2: review
/// whether the 256 limit can go.
#[test]
fn pattern_compile_time_grows_faster_than_the_pattern() {
    let time = |digits: usize| {
        let schema = serde_json::json!({ "pattern": format!("^{}$", "\\d".repeat(digits)) });
        let start = std::time::Instant::now();
        compile(&schema).unwrap();
        start.elapsed().as_secs_f64()
    };
    let (small, large) = (time(500), time(2000));
    assert!(
        large > small * 8.0,
        "F2 is fixed upstream: 4x the pattern took {:.1}x the time",
        large / small
    );
}

/// F3. With serde_json keeping key order, two objects with the same members in another order
/// compare unequal. Guard: `schema-object-comparison` keeps object values out of `const`, `enum`
/// and `uniqueItems`, proven by `golden_meta`. When a bump makes this valid, upstream fixed F3:
/// review that rule and the row in `KNOWN_FAILURES`.
#[test]
fn objects_in_another_key_order_compare_unequal() {
    let validator = compile(&serde_json::json!({ "const": { "a": 1, "b": 2 } })).unwrap();
    let reordered: Value = serde_json::from_str(r#"{"b": 2, "a": 1}"#).unwrap();
    assert!(!validator.is_valid(&reordered), "F3 is fixed upstream");
}
