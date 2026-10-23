//! Owning proof of fixture integrity: every JSON file under `contracts/` parses, case ids are unique
//! across fixture files, and every `expect.code` is a failure id this crate can produce. It proves
//! no behaviour; each behaviour is proven by the runner that owns its fixture file.
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use serde_json::Value;

fn contracts() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts")
}

fn read_json(path: &Path) -> Value {
    let text = std::fs::read_to_string(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

fn json_files(dir: &Path) -> Vec<PathBuf> {
    let mut found = Vec::new();
    for entry in std::fs::read_dir(dir).unwrap_or_else(|e| panic!("{}: {e}", dir.display())) {
        let path = entry.expect("dir entry").path();
        if path.is_dir() {
            found.extend(json_files(&path));
        } else if path.extension().is_some_and(|e| e == "json") {
            found.push(path);
        }
    }
    found.sort();
    found
}

fn ids(list: &Value, key: &str) -> BTreeSet<String> {
    list[key]
        .as_array()
        .unwrap_or_else(|| panic!("{key} array"))
        .iter()
        .map(|row| row["id"].as_str().expect("id").to_string())
        .collect()
}

#[test]
fn contract_files_parse_and_carry_version_one() {
    let files = json_files(&contracts());
    assert!(files.len() >= 2, "failure-codes and annotations exist");
    for file in files {
        let doc = read_json(&file);
        // A JSON Schema document carries its revision in its `$id`, not a `version` member.
        if doc.get("$schema").is_none() {
            assert_eq!(doc["version"], 1, "{}", file.display());
        }
    }
}

#[test]
fn failure_ids_are_unique_and_not_produced_here_ids_never_appear_in_an_expectation() {
    let codes = read_json(&contracts().join("failure-codes.v1.json"));
    let produced = ids(&codes, "codes");
    assert_eq!(
        produced.len(),
        codes["codes"].as_array().unwrap().len(),
        "duplicate id in failure-codes.v1.json"
    );
    let not_produced = ids(&codes, "not-produced-here");
    assert!(produced.is_disjoint(&not_produced));
    let yaml_rules = ids(
        &read_json(&contracts().join("../../yaml-doc/contracts/refusal-rules.v1.json")),
        "rules",
    );
    let prefixes: Vec<&str> = codes["reserved-prefixes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| p["prefix"].as_str().expect("prefix"))
        .collect();

    let mut seen = BTreeSet::new();
    for file in json_files(&contracts().join("fixtures")) {
        for case in read_json(&file)["cases"].as_array().into_iter().flatten() {
            let id = case["id"].as_str().expect("case id");
            assert!(
                seen.insert(id.to_string()),
                "{id}: id used twice across fixture files"
            );
            let Some(code) = case["expect"]["code"].as_str() else {
                continue;
            };
            assert!(
                !not_produced.contains(code),
                "{id}: {code} is never produced here"
            );
            assert!(
                produced.contains(code)
                    || yaml_rules.contains(code)
                    || prefixes.iter().any(|p| code.starts_with(p)),
                "{id}: unknown failure id {code}"
            );
        }
    }
}
