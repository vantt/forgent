//! Owning proof of fixture integrity: every contract and fixture file is well-formed, names only
//! known rules, and every case of the Node YAML test is mapped to a fixture. It proves no behaviour
//! of the parser; each behaviour is proven by the golden runner that owns its fixture file.
mod common;

use std::collections::{BTreeSet, HashSet};

use common::*;
use fgos_yaml_doc::path::parse_path;
use fgos_yaml_doc::{rule, Profile};
use serde_json::Value as Json;

const FIXTURE_FILES: [&str; 6] = ["parse", "prescan", "path", "comment", "edit", "merge"];

fn object_keys(json: &Json) -> BTreeSet<&str> {
    json.as_object()
        .map(|o| o.keys().map(String::as_str).collect())
        .unwrap_or_default()
}

fn rule_ids() -> BTreeSet<String> {
    read_json("refusal-rules.v1.json")["rules"]
        .as_array()
        .expect("rules array")
        .iter()
        .map(|r| r["id"].as_str().expect("rule id").to_string())
        .collect()
}

#[test]
fn contract_files_are_json_with_version_one() {
    for file in [
        "limits.v1.json",
        "profiles.v1.json",
        "refusal-rules.v1.json",
        "fixtures/yaml-test-mapping.v1.json",
    ] {
        assert_eq!(read_json(file)["version"], 1, "{file}");
    }
    for name in FIXTURE_FILES {
        fixture_cases(name);
    }
}

#[test]
fn refusal_rule_list_is_closed_and_matches_the_code() {
    let in_file = rule_ids();
    assert_eq!(
        in_file.len(),
        rule::ALL.len(),
        "duplicate id in refusal-rules.v1.json"
    );
    let in_code: BTreeSet<String> = rule::ALL.iter().map(|r| r.to_string()).collect();
    assert_eq!(
        in_file, in_code,
        "refusal-rules.v1.json and rule::ALL must list the same ids"
    );
}

#[test]
fn limits_contract_holds_the_bounds_of_the_spec() {
    let strict = Profile::StrictConfig.limits();
    assert_eq!(
        (
            strict.input_bytes,
            strict.depth,
            strict.nodes,
            strict.scalar_bytes,
            strict.expanded_bytes,
            strict.key_bytes,
            strict.aliases
        ),
        (1 << 20, 32, 100_000, 64 << 10, None, 1024, None)
    );
    let tool = Profile::Tool.limits();
    assert_eq!(
        (
            tool.input_bytes,
            tool.depth,
            tool.nodes,
            tool.scalar_bytes,
            tool.expanded_bytes,
            tool.key_bytes,
            tool.aliases
        ),
        (
            8 << 20,
            64,
            100_000,
            1 << 20,
            Some(16 << 20),
            1024,
            Some(100)
        )
    );
}

#[test]
fn profile_table_has_a_row_for_every_rule_of_the_spec() {
    let table = read_json("profiles.v1.json");
    let want: BTreeSet<&str> = [
        "duplicate-key",
        "tags",
        "yes-no-on-off",
        "anchors-aliases",
        "merge-key",
        "multiple-documents",
        "zero-documents",
        "complex-keys",
        "non-string-keys",
        "prototype-keys",
        "bidi-controls",
        "zero-width",
        "numbers-edge",
        "timestamps",
        "limits",
    ]
    .into_iter()
    .collect();
    assert_eq!(
        object_keys(&table["rows"]),
        want,
        "one row per rule of spec section 4"
    );
    let actions: HashSet<&str> = [
        "refuse",
        "refuse-outside-core",
        "refuse-keys-only",
        "allow",
        "allow-bounded",
        "string",
        "stringify",
        "null",
        "bounded",
    ]
    .into_iter()
    .collect();
    let rules = rule_ids();
    for (row, profiles) in table["rows"].as_object().expect("rows") {
        for profile in Profile::ALL {
            let cell = &profiles[profile.name()];
            let action = cell["action"]
                .as_str()
                .unwrap_or_else(|| panic!("{row}/{}: no action", profile.name()));
            assert!(
                actions.contains(action),
                "{row}/{}: unknown action {action}",
                profile.name()
            );
            if let Some(rule) = cell["rule"].as_str() {
                assert!(
                    rules.contains(rule),
                    "{row}/{}: unknown rule {rule}",
                    profile.name()
                );
            }
        }
    }
}

fn generates(input: &Json) -> Vec<&Json> {
    if let Some(parts) = input["parts"].as_array() {
        return parts.iter().flat_map(generates).collect();
    }
    if input["generate"].is_object() {
        vec![input]
    } else {
        Vec::new()
    }
}

fn check_floats(case: &str, value: &Json) {
    match value {
        Json::Object(map) if map.contains_key("$float") => {
            assert_eq!(map.len(), 1, "{case}: $float stands alone");
            assert!(
                ["nan", "inf", "-inf", "-0"].contains(&map["$float"].as_str().unwrap_or("")),
                "{case}: bad $float"
            );
        }
        Json::Object(map) => map.values().for_each(|v| check_floats(case, v)),
        Json::Array(items) => items.iter().for_each(|v| check_floats(case, v)),
        _ => {}
    }
}

/// Exactly one of the listed key sets must describe `expect`.
fn expect_form(case: &str, expect: &Json, forms: &[&[&str]]) {
    let keys = object_keys(expect);
    assert!(
        forms
            .iter()
            .any(|form| keys == form.iter().copied().collect()),
        "{case}: expect has keys {keys:?}, none of {forms:?}"
    );
}

fn check_refusal(case: &str, expect: &Json, rules: &BTreeSet<String>) {
    let refusal = &expect["refusal"];
    let rule = refusal["rule"]
        .as_str()
        .unwrap_or_else(|| panic!("{case}: refusal.rule"));
    assert!(rules.contains(rule), "{case}: unknown rule {rule}");
    assert_eq!(
        refusal["line"].is_u64(),
        refusal["column"].is_u64(),
        "{case}: line and column come together"
    );
    for key in refusal.as_object().expect("refusal object").keys() {
        assert!(
            ["rule", "line", "column", "path", "detail"].contains(&key.as_str()),
            "{case}: refusal key {key}"
        );
    }
}

#[test]
fn every_fixture_case_is_well_formed() {
    let rules = rule_ids();
    let mut seen = HashSet::new();
    for file in FIXTURE_FILES {
        for case in fixture_cases(file) {
            let name = id(&case).to_string();
            assert!(
                seen.insert(name.clone()),
                "{name}: id used twice across fixture files"
            );
            assert!(
                name.chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-'),
                "{name}: ids are kebab-case"
            );
            assert!(
                case["why"].as_str().is_some_and(|w| !w.is_empty()),
                "{name}: why"
            );
            assert!(!profiles_of(&case).is_empty(), "{name}: profiles");
            let expect = &case["expect"];
            let refused = expect["refusal"].is_object();
            if refused {
                check_refusal(&name, expect, &rules);
            }
            check_floats(&name, expect);
            match file {
                "parse" => {
                    resolve_input(&case["input"]);
                    if !refused {
                        expect_form(&name, expect, &[&["value"], &["checks"]]);
                    }
                    for check in expect["checks"].as_array().into_iter().flatten() {
                        parse_path(check["path"].as_str().expect("check path"))
                            .unwrap_or_else(|e| panic!("{name}: {e}"));
                        assert!(
                            check["length"].is_u64() || check["string_bytes"].is_u64(),
                            "{name}: check needs length or string_bytes"
                        );
                    }
                }
                "prescan" => {
                    resolve_input(&case["input"]);
                    if !refused {
                        expect_form(&name, expect, &[&["ok"]]);
                    }
                }
                "path" => {
                    assert!(case["input"]["text"].is_string(), "{name}: input.text");
                    if !refused {
                        expect_form(&name, expect, &[&["segments"], &["segments", "canonical"]]);
                        segments_from_json(&expect["segments"]);
                    }
                }
                "comment" => {
                    assert!(case["input"]["text"].is_string(), "{name}: input.text");
                    assert!(
                        ["block", "inline"].contains(&case["kind"].as_str().unwrap_or("")),
                        "{name}: kind"
                    );
                    if !refused {
                        let form: &[&str] = if case["kind"] == "block" {
                            &["lines"]
                        } else {
                            &["line"]
                        };
                        expect_form(&name, expect, &[form]);
                    }
                }
                "edit" => {
                    resolve_input(&case["input"]);
                    if !refused {
                        expect_form(&name, expect, &[&["output"], &["unchanged"], &["comments"]]);
                    }
                    let known = [
                        "set",
                        "insert",
                        "remove",
                        "setCommentBlock",
                        "setInlineComment",
                        "commentsAt",
                    ];
                    for op in case["ops"].as_array().expect("ops") {
                        assert!(
                            known.contains(&op["op"].as_str().unwrap_or("")),
                            "{name}: unknown op"
                        );
                        parse_path(op["path"].as_str().expect("op path"))
                            .unwrap_or_else(|e| panic!("{name}: {e}"));
                    }
                }
                "merge" => {
                    assert!(
                        case["input"]["layers"].is_array() && case["input"]["rules"].is_object(),
                        "{name}: layers and rules"
                    );
                    for path in case["input"]["rules"].as_object().expect("rules").keys() {
                        parse_path(path).unwrap_or_else(|e| panic!("{name}: {e}"));
                    }
                    if !refused {
                        expect_form(&name, expect, &[&["value", "origins"]]);
                        for path in expect["origins"].as_object().expect("origins").keys() {
                            parse_path(path).unwrap_or_else(|e| panic!("{name}: {e}"));
                        }
                    }
                }
                _ => unreachable!(),
            }
        }
    }
}

#[test]
fn generated_inputs_meet_the_size_claims_they_make() {
    for file in ["parse", "prescan", "edit"] {
        for case in fixture_cases(file) {
            let name = id(&case);
            for single in generates(&case["input"]) {
                let generate = &single["generate"];
                let len = resolve_input(single).len();
                if let Some(min) = generate["min_bytes"].as_u64() {
                    assert!(
                        len as u64 >= min,
                        "{name}: generated {len} bytes, claims at least {min}"
                    );
                }
                match generate["size"].as_str() {
                    Some("over-input-limit") => profiles_of(&case).iter().for_each(|p| {
                        assert_eq!(
                            len,
                            p.limits().input_bytes + 1,
                            "{name}: one byte over the {} bound",
                            p.name()
                        )
                    }),
                    Some("at-input-limit") => profiles_of(&case).iter().for_each(|p| {
                        assert_eq!(
                            len,
                            p.limits().input_bytes,
                            "{name}: exactly the {} bound",
                            p.name()
                        )
                    }),
                    Some(other) => panic!("{name}: unknown size claim {other}"),
                    None => {}
                }
            }
        }
    }
}

fn node_test_titles() -> Vec<String> {
    let file =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../test/util/yaml.test.mjs");
    let text = std::fs::read_to_string(&file).unwrap_or_else(|e| panic!("{}: {e}", file.display()));
    text.lines()
        .filter_map(|line| line.strip_prefix("test('"))
        .map(|rest| rest.split("', ").next().expect("title").to_string())
        .collect()
}

#[test]
fn every_case_of_the_node_yaml_test_is_mapped_to_fixtures() {
    let mapping = read_json("fixtures/yaml-test-mapping.v1.json");
    let tests = mapping["tests"].as_array().expect("tests");
    let mapped: Vec<&str> = tests
        .iter()
        .map(|t| t["title"].as_str().expect("title"))
        .collect();
    let titles = node_test_titles();
    assert_eq!(
        titles.len(),
        15,
        "the Node test file holds 14 behaviour tests and the vendored-bundle hash test"
    );
    for title in &titles {
        assert!(
            mapped.contains(&title.as_str()),
            "Node test not mapped to fixtures: {title}"
        );
    }
    for title in &mapped {
        assert!(
            titles.iter().any(|t| t == title),
            "mapping names a Node test that does not exist: {title}"
        );
    }
    let parse_ids: HashSet<String> = fixture_cases("parse")
        .iter()
        .map(|c| id(c).to_string())
        .collect();
    let mut retired = 0;
    for test in tests {
        let ids = test["ids"].as_array().expect("ids");
        if test["retired"].is_string() {
            assert!(ids.is_empty(), "a retired test owns no fixture");
            retired += 1;
            continue;
        }
        assert!(!ids.is_empty(), "{}: mapped to no fixture", test["title"]);
        for fixture in ids {
            assert!(
                parse_ids.contains(fixture.as_str().expect("id")),
                "{}: unknown fixture {fixture}",
                test["title"]
            );
        }
    }
    assert_eq!(
        retired, 1,
        "only the vendored-bundle hash test is retired, with the bundle"
    );
}
