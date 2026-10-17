//! Every vector of `state-root.vectors.v1.json` against the one resolution.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_holder_lock::state_root::state_root_from;
use serde_json::Value;

fn vectors() -> Vec<Value> {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts/state-root.vectors.v1.json");
    let doc: Value = serde_json::from_str(&std::fs::read_to_string(path).expect("vectors file")).expect("vectors json");
    doc["vectors"].as_array().expect("vectors array").clone()
}

#[test]
fn every_state_root_vector_resolves_as_the_contract_says() {
    let mut ran = 0;
    for v in vectors() {
        let name = v["name"].as_str().unwrap();
        let platforms: Vec<&str> = v["platforms"].as_array().map(|a| a.iter().filter_map(Value::as_str).collect()).unwrap_or_default();
        if !platforms.is_empty() && !platforms.contains(&std::env::consts::OS) {
            continue;
        }
        let env: BTreeMap<String, String> = v["env"].as_object().unwrap().iter().map(|(k, val)| (k.clone(), val.as_str().unwrap().to_string())).collect();
        let (root, source) = state_root_from(|key| env.get(key).cloned());
        let expect = &v["expect"];
        assert_eq!(source.as_str(), expect["source"].as_str().unwrap(), "{name}: source");
        if let Some(components_expected) = expect["stateRootComponents"].as_array() {
            // The first entry is a base path as the platform writes it (it may
            // hold separators and a drive prefix); the rest are single names.
            let mut parts = components_expected.iter().map(|c| c.as_str().unwrap());
            let mut want = PathBuf::from(parts.next().expect("a base component"));
            want.extend(parts);
            assert_eq!(root, want, "{name}: components");
        } else {
            assert_eq!(root, PathBuf::from(expect["stateRoot"].as_str().unwrap()), "{name}: stateRoot");
            assert_eq!(root.join("locks"), PathBuf::from(expect["lockRoot"].as_str().unwrap()), "{name}: lockRoot");
        }
        ran += 1;
    }
    assert!(ran >= 17, "only {ran} vectors ran");
}
