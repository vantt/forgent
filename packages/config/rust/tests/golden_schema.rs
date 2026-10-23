//! Owning proof of schema loading: path resolution with annotation inheritance, `$ref`, the bundle
//! digest, undescribed paths, and that the bundle lists match the files under `core/`.
mod common;

use common::{cases, files, refs};
use fgos_config::bundle;
use fgos_config::schema::Schemas;
use fgos_yaml_doc::path::parse_path;
use serde_json::Value;

fn pairs(list: &Value) -> Vec<(String, Vec<u8>)> {
    list.as_array()
        .unwrap()
        .iter()
        .map(|p| {
            (
                p[0].as_str().unwrap().to_string(),
                p[1].as_str().unwrap().as_bytes().to_vec(),
            )
        })
        .collect()
}

#[test]
fn schema_cases() {
    for case in cases("schema.v1.json") {
        let (id, input, expect) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let owned = files(&input["schemas"], true);
        match input["op"].as_str().unwrap() {
            "resolve" => {
                let schemas = Schemas::parse(&refs(&owned)).unwrap_or_else(|e| panic!("{id}: {e}"));
                let path = parse_path(input["path"].as_str().unwrap()).unwrap();
                let Some(found) = schemas.resolve(&path) else {
                    assert_eq!(expect["miss"], true, "{id}: unexpected miss");
                    continue;
                };
                assert!(expect["miss"].is_null(), "{id}: expected a miss");
                for (key, got) in [
                    ("scope", found.scope),
                    ("sensitivity", found.sensitivity),
                    ("file", found.file),
                ] {
                    if let Some(want) = expect[key].as_str() {
                        assert_eq!(got, want, "{id}: {key}");
                    }
                }
                for (key, got) in [("merge", found.merge), ("absent", found.absent)] {
                    if let Some(want) = expect[key].as_str() {
                        assert_eq!(got, Some(want), "{id}: {key}");
                    }
                }
                if let Some(want) = expect["node_type"].as_str() {
                    assert_eq!(found.node["type"], want, "{id}: node type");
                }
            }
            "load" => {
                let refusal = Schemas::parse(&refs(&owned))
                    .err()
                    .unwrap_or_else(|| panic!("{id}: expected a refusal"));
                assert_eq!(refusal.code, expect["code"], "{id}");
            }
            "digest" => {
                let side = |s: &Value| {
                    let (schemas, standard) = (pairs(&s["schemas"]), pairs(&s["standard"]));
                    bundle::digest(&refs(&schemas), &refs(&standard))
                };
                assert_eq!(
                    side(&input["a"]) == side(&input["b"]),
                    expect["equal"],
                    "{id}"
                );
            }
            "undescribed" => {
                let schemas = Schemas::parse(&refs(&owned)).unwrap();
                let paths: Vec<String> = schemas
                    .undescribed(&input["value"])
                    .iter()
                    .map(|p| fgos_yaml_doc::path::format_path(p))
                    .collect();
                let want: Vec<&str> = expect["paths"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|p| p.as_str().unwrap())
                    .collect();
                assert_eq!(paths, want, "{id}");
            }
            op => panic!("{id}: unknown op {op}"),
        }
    }
}

fn stems(dir: &str, suffix: &str) -> Vec<String> {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .join(dir);
    let mut found: Vec<String> = std::fs::read_dir(root)
        .into_iter()
        .flatten()
        .filter_map(|e| {
            e.ok()?
                .file_name()
                .to_str()?
                .strip_suffix(suffix)
                .map(str::to_string)
        })
        .collect();
    found.sort();
    found
}

#[test]
fn bundle_lists_match_the_files_under_core() {
    let listed = |list: &[(&str, &str)]| -> Vec<String> {
        let mut names: Vec<String> = list.iter().map(|(n, _)| n.to_string()).collect();
        names.sort();
        names
    };
    assert_eq!(
        listed(bundle::SCHEMAS),
        stems("core/config-schema", ".schema.yaml"),
        "core/config-schema vs bundle::SCHEMAS"
    );
    assert_eq!(
        listed(bundle::STANDARD),
        stems("core/config-standard", ".yaml"),
        "core/config-standard vs bundle::STANDARD"
    );
}
