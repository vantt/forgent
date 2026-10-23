//! Coverage only, no behaviour: every failure id this crate produces has an owning proof, and an id
//! named `not-produced-here` is never expected. The owning case lives in the fixture of the
//! behaviour (one proof per behaviour); this test only finds the ids nobody owns.
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;

use serde_json::Value;

fn json(path: &Path) -> Value {
    serde_json::from_str(
        &fs::read_to_string(path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn ids(list: &Value) -> BTreeSet<String> {
    list.as_array()
        .unwrap()
        .iter()
        .map(|row| row["id"].as_str().unwrap().to_string())
        .collect()
}

/// Every string below `value`: an expectation names a failure id as `code` or inside a list.
fn strings(value: &Value, out: &mut BTreeSet<String>) {
    match value {
        Value::String(text) => drop(out.insert(text.clone())),
        Value::Array(items) => items.iter().for_each(|v| strings(v, out)),
        Value::Object(map) => map.values().for_each(|v| strings(v, out)),
        _ => {}
    }
}

#[test]
fn every_producible_failure_id_has_an_owning_proof() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let contracts = root.join("../contracts");
    let codes = json(&contracts.join("failure-codes.v1.json"));
    let matrix = json(&contracts.join("fixtures/failure-matrix.v1.json"));
    let (produced, never) = (ids(&codes["codes"]), ids(&codes["not-produced-here"]));
    let mut expected = BTreeSet::new();
    for entry in fs::read_dir(contracts.join("fixtures")).unwrap().flatten() {
        if entry.path().extension().is_some_and(|e| e == "json") {
            for case in json(&entry.path())["cases"]
                .as_array()
                .into_iter()
                .flatten()
            {
                strings(&case["expect"], &mut expected);
            }
        }
    }
    assert!(
        expected.is_disjoint(&never),
        "an id that is never produced here is expected: {:?}",
        expected.intersection(&never)
    );
    let named = |key: &str| matrix[key].as_object().unwrap().clone();
    for (id, file) in named("proven-in-rust")
        .into_iter()
        .chain(named("unreachable-on-this-platform"))
    {
        let text = fs::read_to_string(root.join(file.as_str().unwrap())).unwrap();
        assert!(text.contains(&id), "{id}: {file} does not mention it");
        assert!(
            produced.contains(&id),
            "{id} is not a failure id of this crate"
        );
        assert!(
            !expected.contains(&id),
            "{id} has a fixture case now: drop it from the matrix"
        );
    }
    let owned: BTreeSet<String> = ["proven-in-rust", "unreachable-on-this-platform"]
        .iter()
        .flat_map(|key| matrix[key].as_object().unwrap().keys().cloned())
        .collect();
    let uncovered: Vec<_> = produced
        .iter()
        .filter(|id| !expected.contains(*id) && !owned.contains(*id))
        .collect();
    assert!(
        uncovered.is_empty(),
        "failure ids with no owning proof: {uncovered:?}"
    );
}
