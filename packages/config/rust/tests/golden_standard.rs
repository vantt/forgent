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

/// A project that configures nothing must work on a machine that holds only Claude or only Codex.
/// A `prefer` list narrows the seat walk and never widens it (seat binding §6.3), so every producer
/// pool of agent executors in the standard names both `claude` and `openai`, and every
/// `tierFallback` tier names both families. Checker role pools (`roles.<role>.prefer`) are left
/// out: a checker must differ in family from the producer, so one provider alone can never serve
/// it whatever it lists.
#[test]
fn every_standard_producer_pool_can_be_served_by_claude_alone_or_openai_alone() {
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    let runner = &standard.value()["runner"];
    let names = |list: &Value| -> Vec<String> {
        list.as_array()
            .unwrap()
            .iter()
            .map(|entry| match entry {
                Value::String(name) => name.clone(),
                other => other["executor"].as_str().unwrap().to_string(),
            })
            .collect()
    };
    let mut gaps = Vec::new();
    let mut need_both = |path: String, names: Vec<String>| {
        for family in ["claude", "openai"] {
            if !names.iter().any(|name| name == family) {
                gaps.push(format!("{path} lacks {family}"));
            }
        }
    };
    let mut pools = 0;
    for (capability, entry) in runner["capabilities"].as_object().unwrap() {
        let mut lists = vec![(format!("{capability}.prefer"), &entry["prefer"])];
        for group in ["seats", "personas"] {
            for (key, scope) in entry[group].as_object().into_iter().flatten() {
                lists.push((format!("{capability}.{group}.{key}.prefer"), &scope["prefer"]));
            }
        }
        for (path, list) in lists {
            if !list.is_array() {
                continue;
            }
            let listed = names(list);
            if listed.iter().all(|name| runner["executors"][name]["kind"] == "agent") {
                pools += 1;
                need_both(format!("capabilities.{path}"), listed);
            }
        }
    }
    for (tier, list) in runner["tierFallback"].as_object().unwrap() {
        need_both(format!("tierFallback.{tier}"), names(list));
    }
    assert!(pools > 30, "the standard's agent pools were not found ({pools})");
    assert!(gaps.is_empty(), "{gaps:#?}");
}
