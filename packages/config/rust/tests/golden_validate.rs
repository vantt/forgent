//! Owning proof of how the effective value is judged against the section schemas (wiring of
//! `Schemas::validate`): section lookup, paths, `required` on the merged value, null, sorted output
//! and no input value in a finding. Keyword semantics are proven in `validator_acceptance.rs`.
mod common;

use common::{cases, files, refs};
use fgos_config::schema::Schemas;
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, Profile};

fn found(schemas: &Schemas, effective: &str) -> Vec<(String, String)> {
    let doc = parse(
        effective.as_bytes(),
        Profile::StrictConfig,
        "effective.yaml",
    )
    .unwrap();
    let violations = schemas.validate(doc.value()).unwrap();
    violations
        .into_iter()
        .map(|v| (format_path(&v.path), v.keyword))
        .collect()
}

#[test]
fn validate_cases() {
    for case in cases("validate.v1.json") {
        let (id, input) = (case["id"].as_str().unwrap(), &case["input"]);
        let schema_files = files(&input["schemas"], true);
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let want: Vec<(String, String)> = case["expect"]["violations"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| (v[0].as_str().unwrap().into(), v[1].as_str().unwrap().into()))
            .collect();
        assert_eq!(
            found(&schemas, &common::text(&input["effective"])),
            want,
            "{id}"
        );
    }
}

#[test]
fn a_violation_carries_no_value_of_the_input() {
    let schema_files = files(
        &serde_json::json!({"s": ["properties:", "  a: {type: integer, pattern: '^x'}"]}),
        true,
    );
    let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
    let doc = parse(
        b"s:\n  a: sentinel-7c1e\n",
        Profile::StrictConfig,
        "effective.yaml",
    )
    .unwrap();
    let violations = schemas.validate(doc.value()).unwrap();
    assert!(!violations.is_empty());
    assert!(!format!("{violations:?}").contains("sentinel-7c1e"));
}
