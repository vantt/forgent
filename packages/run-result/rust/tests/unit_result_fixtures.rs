//! The golden Unit run results (`../contracts/fixtures/unit-result.*.v1.json`) agree with the category authority:
//! the outcome of each attempt is the one `derive_outcome` gives its classification.

use fgos_run_result::derive_outcome;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn fixture_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/fixtures")
}

/// The category the Rust derivation gives each seat outcome of the closed table.
fn category_of(outcome: &str) -> &'static str {
    match outcome {
        "pass" => "ok",
        "findings" => "verdict",
        "blocked" => "blocked",
        "policy-refusal" => "policy",
        "provider-limit" => "provider",
        "execution-failure" => "infra",
        other => panic!("{other} is not a seat outcome"),
    }
}

#[test]
fn every_attempt_with_a_run_result_has_the_outcome_its_classification_derives() {
    let mut checked = 0;
    let mut files = 0;
    for entry in fs::read_dir(fixture_dir()).unwrap() {
        let path = entry.unwrap().path();
        let name = path.file_name().unwrap().to_string_lossy().to_string();
        if !(name.starts_with("unit-result.") && name.ends_with(".v1.json")) {
            continue;
        }
        files += 1;
        let fixture: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
        for result in fixture["data"]["results"].as_array().unwrap() {
            let Some(run_result) = result.get("runResult") else {
                continue;
            };
            let outcome = result["outcome"].as_str().unwrap();
            let derived = derive_outcome(&run_result["classification"]);
            assert_eq!(
                derived.category,
                category_of(outcome),
                "{name}: seat {} ended {outcome}",
                result["seat"]
            );
            checked += 1;
        }
    }
    assert_eq!(
        files, 10,
        "one golden file per outcome, the crash-recovered and the out-of-scope runs included"
    );
    assert!(
        checked >= 8,
        "the fixtures carry attempts with a classification"
    );
}
