//! Owning proof that the bundled standard files of the thirteen small sections equal what setup
//! seeds today except the named differences, that every `@fgos:doc` line in a bundled standard file
//! is the render of its schema node, and that the first-slice `global-only` paths are global-only.
//! The registry itself is proven by `test/setup/registrations.test.mjs`, not here.
mod common;

use std::collections::BTreeMap;

use common::contracts;
use fgos_config::bundle;
use fgos_config::grammar::doc_lines;
use fgos_config::schema::Schemas;
use fgos_config::standard::Standard;
use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::Segment;
use serde_json::Value;

fn fixture(name: &str) -> Value {
    let path = contracts().join("fixtures").join(name);
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{name}: {e}"))
}

/// Every leaf (a scalar, null or list) of a document by dotted path; an empty map is a leaf too.
fn leaves(value: &Value, prefix: &str, out: &mut BTreeMap<String, Value>) {
    match value.as_object() {
        Some(map) if !map.is_empty() => {
            for (key, child) in map {
                let path = if prefix.is_empty() {
                    key.clone()
                } else {
                    format!("{prefix}.{key}")
                };
                leaves(child, &path, out);
            }
        }
        _ => {
            out.insert(prefix.to_string(), value.clone());
        }
    }
}

fn difference_side(row: &Value, side: &str) -> Option<Value> {
    let side = &row[side];
    (!side["absent"].as_bool().unwrap_or(false)).then(|| side["value"].clone())
}

#[test]
fn standard_files_equal_what_setup_seeds_except_the_named_differences() {
    let seeded = fixture("registry-defaults.v1.json");
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    let schema_only: Vec<&str> = seeded["schema-only"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s.as_str().unwrap())
        .collect();
    let sections: Vec<&str> = seeded["defaults"]
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(sections.len(), 13, "thirteen small sections are seeded");

    let (mut registry, mut bundled) = (BTreeMap::new(), BTreeMap::new());
    leaves(&seeded["defaults"], "", &mut registry);
    let restricted: serde_json::Map<String, Value> = standard
        .value()
        .as_object()
        .unwrap()
        .iter()
        .filter(|(name, _)| sections.contains(&name.as_str()))
        .map(|(name, value)| (name.clone(), value.clone()))
        .collect();
    leaves(&Value::Object(restricted), "", &mut bundled);
    for name in &schema_only {
        assert!(
            schemas.section(name).is_some(),
            "{name}: schema-only section has a schema"
        );
    }

    let mut actual: BTreeMap<&str, (Option<&Value>, Option<&Value>)> = BTreeMap::new();
    for path in registry.keys().chain(bundled.keys()) {
        let (reg, std) = (registry.get(path), bundled.get(path));
        if reg != std {
            actual.insert(path, (reg, std));
        }
    }
    let named: BTreeMap<&str, &Value> = seeded["known-differences"]
        .as_array()
        .unwrap()
        .iter()
        .map(|row| (row["path"].as_str().unwrap(), row))
        .collect();
    assert_eq!(
        actual.keys().collect::<Vec<_>>(),
        named.keys().collect::<Vec<_>>(),
        "differences found vs differences named (a stale row fails too)"
    );
    for (path, (reg, std)) in actual {
        let row = named[path];
        assert_eq!(
            reg.cloned(),
            difference_side(row, "registry"),
            "{path}: registry side"
        );
        assert_eq!(
            std.cloned(),
            difference_side(row, "standard"),
            "{path}: standard side"
        );
        assert!(
            row["reason"].as_str().is_some_and(|r| !r.is_empty()),
            "{path}: reason"
        );
    }
}

/// The doc lines the standard value and the schema node render to.
fn rendered(schemas: &Schemas, standard: &Standard, path: &[Segment]) -> Vec<String> {
    schemas.resolve(path).map_or_else(Vec::new, |found| {
        doc_lines(&found.node, standard.value_at(path))
    })
}

#[test]
fn every_doc_line_in_a_bundled_standard_file_is_the_render_of_its_schema_node() {
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    let mut seen = 0;
    for (name, text) in bundle::STANDARD {
        let mut stack: Vec<(usize, String)> = Vec::new();
        let mut pending: Option<(usize, Vec<String>)> = None;
        for (index, line) in text.lines().enumerate() {
            let body = line.trim_start();
            let indent = line.len() - body.len();
            assert!(
                !body.starts_with("# @fgos:why"),
                "{name}:{}: a standard holds no reason",
                index + 1
            );
            if let Some(doc) = body
                .strip_prefix("# ")
                .filter(|d| d.starts_with("@fgos:doc "))
            {
                pending
                    .get_or_insert_with(|| (index + 1, Vec::new()))
                    .1
                    .push(doc.to_string());
                continue;
            }
            if body.starts_with('#') || body.starts_with('-') || body.is_empty() {
                continue;
            }
            let key = match body.strip_prefix('"') {
                Some(quoted) => quoted.split('"').next().unwrap().to_string(),
                None => body.split(':').next().unwrap().to_string(),
            };
            while stack.last().is_some_and(|(i, _)| *i >= indent) {
                stack.pop();
            }
            stack.push((indent, key));
            if let Some((at, doc)) = pending.take() {
                let path: Vec<Segment> =
                    stack.iter().map(|(_, k)| Segment::Key(k.clone())).collect();
                let want = rendered(&schemas, &standard, &path);
                assert_eq!(doc, want, "{name}:{at}: doc line of {}", format_path(&path));
                seen += 1;
            }
        }
        assert!(pending.is_none(), "{name}: a doc line with no key below it");
    }
    assert!(seen > 0, "no doc line was checked");
}

#[test]
fn the_first_slice_global_only_paths_are_global_only_in_the_bundled_set() {
    let (schemas, _) = Schemas::bundled().unwrap();
    let list = fixture("scope.v1.json");
    let paths = list["first-slice-global-only"].as_array().unwrap();
    assert!(!paths.is_empty());
    for path in paths {
        let path = path.as_str().unwrap();
        let found = schemas
            .resolve(&parse_path(path).unwrap())
            .unwrap_or_else(|| panic!("{path}: no schema node"));
        assert_eq!(found.scope, "global-only", "{path}");
    }
}
