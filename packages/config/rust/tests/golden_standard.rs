//! Owning proof of the standard layer: what it holds, the order it merges in, and where each value
//! came from. Every case is built twice and must give the same layer.
mod common;

use common::{cases, files, refs};
use fgos_config::schema::Schemas;
use fgos_config::standard::Standard;
use fgos_yaml_doc::path::parse_path;
use serde_json::Value;

#[test]
fn standard_cases() {
    for case in cases("standard.v1.json") {
        let (id, input, expect) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let (schema_files, standard_files) = (
            files(&input["schemas"], true),
            files(&input["standard"], false),
        );
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let build = || Standard::parse(&refs(&standard_files), &schemas);
        let standard = match build() {
            Ok(standard) => standard,
            Err(refusal) => {
                assert_eq!(refusal.code, expect["code"], "{id}");
                continue;
            }
        };
        assert_eq!(
            standard.value(),
            build().unwrap().value(),
            "{id}: not deterministic"
        );
        if !expect["value"].is_null() || case["expect"].get("value").is_some() {
            assert_eq!(standard.value(), &expect["value"], "{id}: value");
        }
        if let Some(order) = expect["order"].as_array() {
            let names: Vec<&str> = standard.files.iter().map(|f| f.name.as_str()).collect();
            assert_eq!(
                Value::from(names),
                Value::from(order.clone()),
                "{id}: order"
            );
        }
        for span in expect["spans"].as_array().into_iter().flatten() {
            let path = parse_path(span["path"].as_str().unwrap()).unwrap();
            let (file, at) = standard
                .span_of(&path)
                .unwrap_or_else(|| panic!("{id}: no span"));
            assert_eq!(
                (file, at.line as u64, at.column as u64),
                (
                    span["file"].as_str().unwrap(),
                    span["line"].as_u64().unwrap(),
                    span["column"].as_u64().unwrap()
                ),
                "{id}"
            );
        }
        for path in expect["absent"].as_array().into_iter().flatten() {
            let path = parse_path(path.as_str().unwrap()).unwrap();
            assert!(
                standard.value_at(&path).is_none(),
                "{id}: {path:?} should hold no value"
            );
        }
    }
}
