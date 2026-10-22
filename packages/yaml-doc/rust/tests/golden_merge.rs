//! Owning proof of the merge primitive, over `fixtures/merge.v1.json`.
mod common;

use std::collections::BTreeMap;

use common::*;
use fgos_yaml_doc::merge::{merge, MergeRule};
use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::{Segment, Value};
use serde_json::Value as Json;

fn nested(key: &str, depth: usize, leaf: i64) -> Value {
    (0..depth).fold(Value::Int(leaf), |inner, _| {
        Value::Map(vec![(key.to_string(), inner)])
    })
}

fn layer(spec: &Json) -> Value {
    match spec.get("nested") {
        Some(n) => nested(
            n["key"].as_str().expect("key"),
            n["depth"].as_u64().expect("depth") as usize,
            n["leaf"].as_i64().expect("leaf"),
        ),
        None => Value::from_json(&spec["value"]),
    }
}

fn rules_of(spec: &Json) -> Vec<(Vec<Segment>, MergeRule)> {
    spec.as_object()
        .expect("rules")
        .iter()
        .map(|(path, rule)| {
            let rule = match rule.as_str().expect("rule") {
                "deep" => MergeRule::Deep,
                "replace" => MergeRule::Replace,
                "leaf" => MergeRule::Leaf,
                other => panic!("unknown merge rule {other}"),
            };
            (parse_path(path).expect("rule path"), rule)
        })
        .collect()
}

#[test]
fn merge_matches_the_golden_cases() {
    for case in fixture_cases("merge") {
        let name = id(&case);
        let layers: Vec<Value> = case["input"]["layers"]
            .as_array()
            .expect(name)
            .iter()
            .map(layer)
            .collect();
        let refs: Vec<&Value> = layers.iter().collect();
        let rules = rules_of(&case["input"]["rules"]);
        let by_path = |path: &[Segment]| rules.iter().find(|(p, _)| p == path).map(|(_, r)| *r);
        let result = merge(&refs, &by_path);
        if case["expect"]["refusal"].is_object() {
            assert_refusal(name, &result.expect_err(name), &case["expect"]);
            continue;
        }
        let merged = result.unwrap_or_else(|e| panic!("{name}: {e}"));
        assert_eq!(
            merged.value.to_json(),
            case["expect"]["value"],
            "{name}: value"
        );
        let got: BTreeMap<String, u64> = merged
            .origins
            .iter()
            .map(|(p, l)| (format_path(p), *l as u64))
            .collect();
        assert_eq!(
            got.len(),
            merged.origins.len(),
            "{name}: a leaf is listed once"
        );
        let want: BTreeMap<String, u64> = case["expect"]["origins"]
            .as_object()
            .expect(name)
            .iter()
            .map(|(k, v)| (k.clone(), v.as_u64().expect(name)))
            .collect();
        assert_eq!(got, want, "{name}: origins");
    }
}
