use fgos_convention::operations::{
    check_all, check_paths, classify, convention_name, convention_path, ConventionError, NameInput,
};
use fgos_convention::provider::ConventionRequest;
use fgos_convention::rules::{packaged_rules, parse_rules};
use serde::Deserialize;
use serde_json::Value;

const GOLDEN: &str = include_str!("../../contracts/convention.golden.v1.json");

#[derive(Deserialize)]
struct GoldenFile {
    contract: String,
    cases: Vec<GoldenCase>,
    #[serde(rename = "invalidRules")]
    invalid_rules: Vec<InvalidRuleCase>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct InvalidRuleCase {
    name: String,
    rule_index: usize,
    shape: String,
    expected_error: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoldenCase {
    name: String,
    operation: String,
    input: Value,
    expected: Option<Value>,
    expected_error: Option<String>,
}

#[test]
fn golden_cases_are_the_behavior_source() {
    let fixture: GoldenFile = serde_json::from_str(GOLDEN).expect("golden fixture parses");
    assert_eq!(fixture.contract, "convention.golden.v1");
    for case in fixture.cases {
        let result = run_case(&case);
        match (&case.expected, &case.expected_error) {
            (Some(expected), None) => assert_eq!(result.unwrap(), *expected, "{}", case.name),
            (None, Some(expected_error)) => {
                assert_eq!(result.unwrap_err(), *expected_error, "{}", case.name);
            }
            _ => panic!("{} has an invalid expectation", case.name),
        }
    }
}

#[test]
fn every_initial_kind_has_generation_path_and_check_coverage() {
    let fixture: GoldenFile = serde_json::from_str(GOLDEN).unwrap();
    for kind in ["report", "plan", "journal"] {
        for operation in ["name", "path"] {
            assert!(
                fixture.cases.iter().any(|case| {
                    case.operation == operation && case.input["kind"].as_str() == Some(kind)
                }),
                "missing {operation} golden for {kind}"
            );
        }
    }
    for (kind, marker) in [
        ("report", "plans/reports/"),
        ("plan", "plans/261399-"),
        ("journal", "plans/journals/"),
    ] {
        assert!(
            fixture.cases.iter().any(|case| {
                case.operation == "check"
                    && case.expected.as_ref().is_some_and(|expected| {
                        expected["violations"].as_array().is_some_and(|violations| {
                            violations.iter().any(|violation| {
                                violation["path"]
                                    .as_str()
                                    .is_some_and(|path| path.starts_with(marker))
                            })
                        })
                    })
            }),
            "missing failing check golden for {kind}"
        );
    }
    assert!(fixture.cases.iter().any(|case| case.operation == "classify"
        && case
            .expected_error
            .as_deref()
            .is_some_and(|error| error.starts_with("unknown-kind:"))));
}

#[test]
fn every_stable_rule_error_has_a_golden_failure() {
    let fixture: GoldenFile = serde_json::from_str(GOLDEN).unwrap();
    let mut covered = std::collections::HashSet::new();
    for case in &fixture.cases {
        if let Some(error) = &case.expected_error {
            covered.insert(error.split(':').next().unwrap());
        }
        if let Some(violations) = case
            .expected
            .as_ref()
            .and_then(|expected| expected["violations"].as_array())
        {
            for violation in violations {
                covered.insert(violation["code"].as_str().unwrap());
            }
        }
    }
    for case in &fixture.invalid_rules {
        covered.insert(case.expected_error.split(':').next().unwrap());
    }
    for code in &packaged_rules().error_codes {
        assert!(covered.contains(code.as_str()), "missing golden for {code}");
    }
}

#[test]
fn rules_reject_unknown_shapes_from_golden_data() {
    let fixture: GoldenFile = serde_json::from_str(GOLDEN).unwrap();
    for case in fixture.invalid_rules {
        let mut value: Value =
            serde_json::from_str(include_str!("../../contracts/convention.rules.v1.json")).unwrap();
        value["rules"][case.rule_index]["shape"] = Value::String(case.shape);
        let error = parse_rules(&serde_json::to_string(&value).unwrap()).unwrap_err();
        assert_eq!(error.to_string(), case.expected_error, "{}", case.name);
    }
}

#[test]
fn rules_reject_equal_specificity_placement_overlap() {
    let mut value: Value =
        serde_json::from_str(include_str!("../../contracts/convention.rules.v1.json")).unwrap();
    value["rules"][4]["glob"] = Value::String("fixtures/<name>/spec.md".into());
    let error = parse_rules(&serde_json::to_string(&value).unwrap()).unwrap_err();
    assert_eq!(
        error.to_string(),
        "invalid-rule: placement rules 'fixture-singleton' and 'fixture-collection' overlap at equal specificity"
    );
}

#[test]
fn typed_request_uses_the_versioned_wire_keys_and_defaults() {
    let request: ConventionRequest = serde_json::from_value(serde_json::json!({
        "operation": "name",
        "kind": "report",
        "type": "report",
        "slug": "x"
    }))
    .unwrap();
    assert!(request.paths.is_empty());
    assert!(!request.all);
    assert!(request.root.as_os_str().is_empty());
    let encoded = serde_json::to_value(request).unwrap();
    assert_eq!(encoded["type"], "report");
    assert!(encoded.get("artifactType").is_none());
    assert!(encoded.get("root").is_none());
    let schema: Value =
        serde_json::from_str(include_str!("../../contracts/convention.query.v1.json")).unwrap();
    assert_eq!(schema["$id"], "convention.query.request");
    assert_eq!(
        schema["definitions"]["outcome"]["$id"],
        "convention.query.outcome"
    );
}
#[test]
fn packaged_rules_reserve_only_synthetic_placement_kinds() {
    let placement = packaged_rules()
        .placement_rules()
        .map(|rule| rule.kind.as_str())
        .collect::<Vec<_>>();
    assert_eq!(placement, ["fixture-singleton", "fixture-collection"]);
}

#[cfg(unix)]
#[test]
fn check_all_does_not_follow_a_scoped_directory_symlink() {
    use std::os::unix::fs::symlink;

    let root = std::env::temp_dir().join(format!(
        "fgos-convention-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let outside = root.with_extension("outside");
    std::fs::create_dir_all(outside.join("reports")).unwrap();
    std::fs::write(outside.join("reports/bad.md"), b"x").unwrap();
    std::fs::create_dir_all(&root).unwrap();
    symlink(&outside, root.join("plans")).unwrap();

    let result = check_all(&root).unwrap();
    assert_eq!(result.checked, 0, "{result:?}");
    assert!(result.violations.is_empty());

    std::fs::remove_dir_all(&root).unwrap();
    std::fs::remove_dir_all(&outside).unwrap();
}

fn run_case(case: &GoldenCase) -> Result<Value, String> {
    match case.operation.as_str() {
        "name" => {
            serde_json::to_value(convention_name(&name_input(&case.input)).map_err(error_code)?)
                .map_err(|error| error.to_string())
        }
        "path" => serde_json::to_value(
            convention_path(&name_input(&case.input), case.input["plan"].as_str())
                .map_err(error_code)?,
        )
        .map_err(|error| error.to_string()),
        "check" => {
            let paths = case.input["paths"]
                .as_array()
                .unwrap()
                .iter()
                .map(|value| value.as_str().unwrap().to_owned())
                .collect::<Vec<_>>();
            serde_json::to_value(check_paths(&paths).map_err(error_code)?)
                .map_err(|error| error.to_string())
        }
        "classify" => serde_json::to_value(
            classify(case.input["path"].as_str().unwrap()).map_err(error_code)?,
        )
        .map_err(|error| error.to_string()),
        other => panic!("unsupported golden operation {other}"),
    }
}

fn name_input(value: &Value) -> NameInput<'_> {
    NameInput {
        kind: value["kind"].as_str().unwrap(),
        artifact_type: value["type"].as_str(),
        slug: value["slug"].as_str().unwrap(),
        at: value["at"].as_str(),
        now_millis: 0,
        local_offset_seconds: 0,
    }
}

fn error_code(error: ConventionError) -> String {
    error.to_string()
}
