//! Replays the vectors of `packages/execution/contracts/core-unit/`, recorded from the Node modules by
//! `test/golden-recorders/core-unit.recorder.mjs`: the Unit contract, the run request and the pattern catalog.
//! The vectors are read, never copied. Three kinds of answer come from sibling modules and are replayed from
//! what Node answered to the same question: the declared-seat check and the run-timeout rule (Unit), the
//! `--timeout` text parse (run request), the loop tables and declared-seat check (catalog), and the seats, launch
//! bound and checker plan of a resolved pattern (collaboration).

use fgos_execution::patterns::{
    check_catalog, deep_equal, detect_retired_pattern_keys, format_retired_key_sentence, loop_of,
    resolve_collaboration, CollaborationError, CollaborationFailure, DeclaredSeat, LoopTables,
    ParamDef, ResolveOptions, SeatError, Seating, RESERVED_PATTERN_NAMES, RETIRED_CONFIG_KEYS,
    RETIRED_GATED_NAME, SEAT_BINDING_MARKER_PATH,
};
use fgos_execution::run_request::{
    build_run_request, fold_run_setting, plan_from_flags, request_from_flags, GitRoots,
    RunRequestHost,
};
use fgos_execution::unit::{
    normalize_plan_ref, normalize_stance_options, normalize_workflow_link, validate_unit, Refusal,
    UnitHost, RIGOR_VALUES,
};
use serde_json::{json, Map, Value};
use std::path::PathBuf;

fn vectors(file: &str) -> Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/core-unit")
        .join(file);
    serde_json::from_str(
        &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn list(value: &Value) -> &Vec<Value> {
    value.as_array().expect("an array of vectors")
}

/// Node's own text for a refusal that quotes something only its runtime can spell (a JSON parse error, the
/// write-scope sentence) is compared up to that quote; every other message is compared whole.
fn same_message(expected: &str, got: &str) -> bool {
    for marker in [
        "must be valid JSON: ",
        "invalid JSON for --override: ",
        "repo-relative path: ",
    ] {
        if let Some(at) = expected.find(marker) {
            let cut = at + marker.len();
            return got.len() >= cut && expected[..cut] == got[..cut];
        }
    }
    expected == got
}

fn check_refusal(what: &str, expected: &Value, got: &Refusal) {
    let message = expected["message"].as_str().unwrap();
    assert!(
        same_message(message, &got.message),
        "{what}: message\n  node: {message}\n  rust: {}",
        got.message
    );
    assert_eq!(expected["name"], json!(got.name), "{what}: error class");
    assert_eq!(
        expected.get("code").and_then(Value::as_str),
        got.code.as_deref(),
        "{what}: code"
    );
    assert_eq!(
        expected.get("phase").and_then(Value::as_str),
        got.phase.as_deref(),
        "{what}: phase"
    );
}

/// `expect` is `{ok}` or `{error}`: compare a result of any value type.
fn check_result<T>(
    what: &str,
    expected: &Value,
    got: Result<T, Refusal>,
    show: impl Fn(T) -> Value,
) {
    match got {
        Ok(value) => {
            assert!(
                expected.get("ok").is_some(),
                "{what}: Node refused ({}) but Rust accepted",
                expected["error"]["message"]
            );
            assert_eq!(expected["ok"], show(value), "{what}");
        }
        Err(refusal) => {
            assert!(
                expected.get("error").is_some(),
                "{what}: Node accepted {} but Rust refused: {}",
                expected["ok"],
                refusal.message
            );
            check_refusal(what, &expected["error"], &refusal);
        }
    }
}

// ---------------------------------------------------------------- unit

struct VectorUnitHost<'a> {
    tiers: Vec<String>,
    seats: Option<&'a Value>,
    timeout_problem: Option<&'a Value>,
}

impl UnitHost for VectorUnitHost<'_> {
    fn tiers(&self) -> Vec<String> {
        self.tiers.clone()
    }

    fn check_declared_seats(
        &self,
        _raw: &Value,
        _label: &str,
        _tiers: &[String],
    ) -> Result<Value, String> {
        let answer = self
            .seats
            .expect("the vector records the seat answer of a unit that declares seats");
        match answer.get("ok") {
            Some(seats) => Ok(seats.clone()),
            None => Err(answer["error"]["message"].as_str().unwrap().to_string()),
        }
    }

    fn run_timeout_problem(&self, _value: &Value, _label: &str) -> Option<String> {
        self.timeout_problem
            .and_then(Value::as_str)
            .map(str::to_string)
    }
}

#[test]
fn validate_unit_answers_as_node_does_for_every_recorded_input() {
    let doc = vectors("unit.v1.json");
    let tiers: Vec<String> = list(&doc["tiers"])
        .iter()
        .map(|t| t.as_str().unwrap().to_string())
        .collect();
    assert_eq!(doc["rigorValues"], json!(RIGOR_VALUES), "rigor scale");
    let cases = list(&doc["validateUnit"]);
    assert!(cases.len() > 100);
    for case in cases {
        let host = VectorUnitHost {
            tiers: tiers.clone(),
            seats: case["host"].get("seats"),
            timeout_problem: case["host"].get("timeoutProblem"),
        };
        let name = case["name"].as_str().unwrap();
        check_result(
            name,
            &case["expect"],
            validate_unit(&case["input"], &host),
            |unit| unit.to_json(),
        );
    }
}

#[test]
fn unit_normalizers_answer_as_node_does() {
    let doc = vectors("unit.v1.json");
    let cases = list(&doc["normalizers"]);
    assert!(cases.len() > 50);
    for case in cases {
        let input = &case["input"];
        let absent = input.get("$undefined") == Some(&json!(true));
        let arg = (!absent).then_some(input);
        let what = format!("{} {}", case["fn"], input);
        match case["fn"].as_str().unwrap() {
            "normalizeStanceOptions" => {
                check_result(&what, &case["expect"], normalize_stance_options(arg), |o| {
                    json!(o)
                })
            }
            "normalizeWorkflowLink" => check_result(
                &what,
                &case["expect"],
                normalize_workflow_link(arg),
                |link| link.map_or(Value::Null, |l| l.to_json()),
            ),
            "normalizePlanRef" => {
                check_result(&what, &case["expect"], normalize_plan_ref(arg), |plan| {
                    plan.map_or(Value::Null, |p| p.to_json())
                })
            }
            other => panic!("unknown normalizer {other}"),
        }
    }
}

// ---------------------------------------------------------------- run request

fn flags_of(value: &Value) -> Map<String, Value> {
    value.as_object().cloned().unwrap_or_default()
}

/// A host for vectors that never reach the machine: asking it anything outside the flags is a failure.
struct FlagsOnlyHost;

impl RunRequestHost for FlagsOnlyHost {
    fn cwd(&self) -> String {
        unreachable!("no vector of the flag rules reads the working directory")
    }
    fn process_cwd(&self) -> String {
        unreachable!()
    }
    fn git_roots(&self, _dir: &str) -> Result<GitRoots, String> {
        unreachable!()
    }
    fn confined_write_refusal(&self, _main_root: &str, _case_id: Option<&str>) -> Option<String> {
        unreachable!()
    }
    fn activity_unit_of(
        &self,
        _main_root: Option<&str>,
        _case_id: &str,
        _activity: &str,
    ) -> Option<Value> {
        unreachable!()
    }
    fn dispatch_depth(&self) -> f64 {
        unreachable!()
    }
    fn random_hex4(&self) -> String {
        unreachable!()
    }
    fn parse_run_timeout(&self, _text: &str) -> Result<u64, String> {
        unreachable!()
    }
    fn provider_ids(&self, _main_root: &str) -> Result<Vec<String>, Refusal> {
        unreachable!()
    }
    fn check_agent_definition(&self, _name: &str, _project_root: &str) -> Result<(), String> {
        unreachable!()
    }
    fn plan_dir_problem(&self, _name: &str, _main_root: &str) -> Result<Option<String>, String> {
        unreachable!("these vectors are refused before the Convention plan rule is asked")
    }
    fn is_plan_directory(&self, _main_root: &str, _plan_dir: &str) -> bool {
        unreachable!()
    }
}

#[test]
fn request_flags_answer_as_node_does() {
    let doc = vectors("run-request.v1.json");
    for case in list(&doc["requestFromFlags"]) {
        let flags = flags_of(&case["flags"]);
        let what = format!("requestFromFlags {}", case["flags"]);
        check_result(
            &what,
            &case["expect"],
            request_from_flags(flags.get("params"), flags.get("param")),
            |r| r.to_json(),
        );
    }
}

#[test]
fn run_setting_folds_into_overrides_without_touching_the_input() {
    let doc = vectors("run-request.v1.json");
    for case in list(&doc["foldRunSetting"]) {
        let overrides = list(&case["overrides"]).clone();
        let before = overrides.clone();
        let folded = fold_run_setting(&overrides, case["key"].as_str().unwrap(), &case["value"]);
        assert_eq!(overrides, before, "the input list is not changed");
        assert_eq!(case["inputUnchanged"], json!(true));
        assert_eq!(
            case["expect"]["ok"],
            Value::Array(folded),
            "fold {} of {}",
            case["key"],
            case["overrides"]
        );
    }
}

#[test]
fn plan_flags_are_refused_with_node_sentences() {
    let doc = vectors("run-request.v1.json");
    for case in list(&doc["planFromFlags"]) {
        let flags = flags_of(&case["flags"]);
        let what = format!("planFromFlags {}", case["flags"]);
        let main_root = case["mainRoot"].as_str().unwrap();
        check_result(
            &what,
            &case["expect"],
            plan_from_flags(&flags, main_root, &FlagsOnlyHost),
            |plan| plan.map_or(Value::Null, |p| p.to_json()),
        );
    }
}

struct VectorRunHost<'a> {
    roots: &'a Value,
    depth: f64,
    timeout: Option<&'a Value>,
}

impl RunRequestHost for VectorRunHost<'_> {
    fn cwd(&self) -> String {
        self.roots["cwd"].as_str().unwrap().to_string()
    }
    fn process_cwd(&self) -> String {
        "/process-cwd".to_string()
    }
    fn git_roots(&self, dir: &str) -> Result<GitRoots, String> {
        if self.roots.get("gitFails") == Some(&json!(true)) {
            return Err("not a git repository".to_string());
        }
        let linked_at = self.roots["linkedAt"].as_str().unwrap();
        Ok(GitRoots {
            main_checkout_root: self.roots["main"].as_str().unwrap().to_string(),
            is_linked_worktree: dir == linked_at || linked_at == "*",
        })
    }
    fn confined_write_refusal(&self, _main_root: &str, _case_id: Option<&str>) -> Option<String> {
        self.roots
            .get("confined")
            .and_then(Value::as_str)
            .map(str::to_string)
    }
    fn activity_unit_of(
        &self,
        _main_root: Option<&str>,
        case_id: &str,
        activity: &str,
    ) -> Option<Value> {
        let mut unit = self.roots.get("activityUnit")?.as_object()?.clone();
        unit.insert("caseId".into(), json!(case_id));
        unit.insert("activity".into(), json!(activity));
        Some(Value::Object(unit))
    }
    fn dispatch_depth(&self) -> f64 {
        self.depth
    }
    fn random_hex4(&self) -> String {
        "HEX4".to_string()
    }
    fn parse_run_timeout(&self, _text: &str) -> Result<u64, String> {
        let answer = self
            .timeout
            .expect("the vector records the timeout parse of a --timeout text");
        match answer.get("ok") {
            Some(ms) => Ok(ms.as_u64().unwrap()),
            None => Err(answer["error"]["message"].as_str().unwrap().to_string()),
        }
    }
    fn provider_ids(&self, _main_root: &str) -> Result<Vec<String>, Refusal> {
        unreachable!("no vector names --provider: the runner config read needs the host")
    }
    fn check_agent_definition(&self, _name: &str, _project_root: &str) -> Result<(), String> {
        unreachable!("no vector names --persona")
    }
    fn plan_dir_problem(&self, _name: &str, _main_root: &str) -> Result<Option<String>, String> {
        unreachable!("no vector names an existing --plan")
    }
    fn is_plan_directory(&self, _main_root: &str, _plan_dir: &str) -> bool {
        unreachable!()
    }
}

/// `Number(text)` of the dispatch depth variable, `0` unless it is a finite non-negative number.
fn dispatch_depth_of(text: Option<&str>) -> f64 {
    match text {
        None | Some("") => 0.0,
        Some(raw) => raw
            .trim()
            .parse::<f64>()
            .ok()
            .filter(|n| n.is_finite() && *n >= 0.0)
            .unwrap_or(0.0),
    }
}

#[test]
fn run_request_is_built_from_flags_as_node_builds_it() {
    let doc = vectors("run-request.v1.json");
    let cases = list(&doc["buildRunRequest"]);
    assert!(cases.len() > 80);
    for case in cases {
        let host = VectorRunHost {
            roots: &case["roots"],
            depth: dispatch_depth_of(case.get("dispatchDepth").and_then(Value::as_str)),
            timeout: case.get("hostTimeout"),
        };
        let positional: Vec<String> = list(&case["positional"])
            .iter()
            .map(|p| p.as_str().unwrap().to_string())
            .collect();
        let name = case["name"].as_str().unwrap();
        let got = build_run_request(&flags_of(&case["flags"]), &positional, &host);
        match (&case["expect"]["ok"], got) {
            (expected, Ok(request)) if !expected.is_null() => {
                let json =
                    request.to_json(&|root| json!({ "port": "case-admission", "repoRoot": root }));
                assert_eq!(*expected, json, "{name}");
            }
            (_, Ok(_)) => panic!("{name}: Node refused but Rust built a request"),
            (_, Err(refusal)) => {
                let expected = &case["expect"]["error"];
                assert!(
                    expected.is_object(),
                    "{name}: Node built a request but Rust refused: {}",
                    refusal.message
                );
                check_refusal(name, expected, &refusal);
            }
        }
    }
}

// ---------------------------------------------------------------- patterns

struct VectorTables<'a> {
    host: &'a Value,
    seats: &'a Vec<Value>,
}

impl LoopTables for VectorTables<'_> {
    fn loop_names(&self) -> Vec<String> {
        list(&self.host["loopNames"])
            .iter()
            .map(|n| n.as_str().unwrap().to_string())
            .collect()
    }

    fn param_table_keys(&self, loop_name: &str) -> Option<Vec<String>> {
        self.host["paramTables"].get(loop_name).map(|keys| {
            list(keys)
                .iter()
                .map(|k| k.as_str().unwrap().to_string())
                .collect()
        })
    }

    fn param_defs(&self, loop_name: &str) -> Option<Vec<(String, ParamDef)>> {
        self.host["paramDefs"].get(loop_name).map(|defs| {
            defs.as_object()
                .unwrap()
                .iter()
                .map(|(name, def)| {
                    (
                        name.clone(),
                        ParamDef {
                            kind: def["type"].as_str().unwrap().to_string(),
                            scalar: def["scalar"] == json!(true),
                        },
                    )
                })
                .collect()
        })
    }

    fn default_rebuttal(&self) -> bool {
        self.host["defaultRebuttal"] == json!(true)
    }

    fn checker_seats(&self) -> Vec<(String, String)> {
        self.host["checkerSeats"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(name, seat)| (name.clone(), seat["role"].as_str().unwrap().to_string()))
            .collect()
    }

    fn check_declared_seats(
        &self,
        raw: &Value,
        label: &str,
    ) -> Result<Vec<DeclaredSeat>, SeatError> {
        let recorded = self
            .seats
            .iter()
            .find(|s| s["label"] == json!(label) && s["raw"] == *raw)
            .unwrap_or_else(|| panic!("the vector records no seat answer for {label} {raw}"));
        match recorded["expect"].get("ok") {
            Some(seats) => Ok(list(seats)
                .iter()
                .map(|s| DeclaredSeat {
                    seat: s["seat"].as_str().unwrap().to_string(),
                    role: s["role"].as_str().unwrap().to_string(),
                })
                .collect()),
            None => {
                let error = &recorded["expect"]["error"];
                Err(SeatError {
                    code: error["code"].as_str().unwrap().to_string(),
                    at: error.get("at").and_then(Value::as_str).map(str::to_string),
                    message: error["message"].as_str().unwrap().to_string(),
                })
            }
        }
    }
}

fn problem_json(problem: &CollaborationError) -> Value {
    let mut out = json!({ "name": "CollaborationError", "message": problem.message, "code": problem.code, "detail": problem.detail });
    if let Some(source) = &problem.source {
        out["source"] = json!(source);
    }
    if let Some(path) = &problem.path {
        out["path"] = json!(path);
    }
    out
}

#[test]
fn pattern_catalog_is_checked_and_merged_as_node_does() {
    let doc = vectors("patterns.v1.json");
    let cases = list(&doc["checkCatalog"]);
    assert!(cases.len() > 90);
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let options = &case["options"];
        let tables = VectorTables {
            host: &doc["host"],
            seats: list(&case["hostSeats"]),
        };
        let got = check_catalog(
            options.get("shipped"),
            options.get("effective"),
            options.get("origins"),
            options.get("throwOnError") == Some(&json!(true)),
            &tables,
        );
        match (case["expect"].get("ok"), got) {
            (Some(expected), Ok(check)) => {
                assert_eq!(
                    expected["entries"],
                    Value::Object(check.entries),
                    "{name}: entries"
                );
                assert_eq!(expected["mergedEqualsEntries"], json!(true));
                let problems: Vec<Value> = check.problems.iter().map(problem_json).collect();
                assert_eq!(
                    expected["problems"],
                    Value::Array(problems),
                    "{name}: problems"
                );
            }
            (None, Err(first)) => assert_eq!(
                case["expect"]["error"],
                problem_json(&first),
                "{name}: thrown problem"
            ),
            (Some(_), Err(first)) => {
                panic!("{name}: Rust threw {} where Node did not", first.message)
            }
            (None, Ok(_)) => panic!("{name}: Node threw but Rust returned"),
        }
    }
}

/// Node compares one JavaScript number where `serde_json` keeps an integer and a float apart; no recorded vector can
/// show the difference, since `JSON.stringify` writes both as `1`.
#[test]
fn deep_equal_reads_a_whole_number_and_its_float_spelling_as_one_number() {
    let whole: Value = serde_json::from_str(r#"{"rounds": 2, "list": [1, {"x": 3}]}"#).unwrap();
    let float: Value =
        serde_json::from_str(r#"{"list": [1.0, {"x": 3.0}], "rounds": 2.0}"#).unwrap();
    assert!(deep_equal(&whole, &float));
    assert!(!deep_equal(&json!({"rounds": 2}), &json!({"rounds": 2.5})));
    assert!(!deep_equal(
        &json!({"rounds": 2}),
        &json!({"rounds": 2, "x": 1})
    ));
    assert!(!deep_equal(&json!([1, 2]), &json!([2, 1])));
}

#[test]
fn loop_of_reads_the_loop_of_a_pattern_as_node_does() {
    let doc = vectors("patterns.v1.json");
    for case in list(&doc["loopOf"]) {
        let absent = |v: &Value| v.get("$undefined") == Some(&json!(true));
        let name = (!absent(&case["name"])).then_some(&case["name"]);
        let options = (!absent(&case["options"])).then_some(&case["options"]);
        assert_eq!(
            case["expect"]["ok"],
            json!(loop_of(name, options)),
            "loopOf {} {}",
            case["name"],
            case["options"]
        );
    }
}

#[test]
fn retired_pattern_keys_are_found_and_worded_as_node_does() {
    let doc = vectors("patterns.v1.json");
    let absent = |v: &Value| v.get("$undefined") == Some(&json!(true));
    for case in list(&doc["detectRetiredPatternKeys"]) {
        let input = (!absent(&case["input"])).then_some(&case["input"]);
        let found: Vec<Value> = detect_retired_pattern_keys(input)
            .iter()
            .map(|f| f.to_json())
            .collect();
        assert_eq!(
            case["expect"]["ok"],
            Value::Array(found),
            "detect {}",
            case["input"]
        );
    }
    for case in list(&doc["formatRetiredKeySentence"]) {
        let item = (!absent(&case["item"])).then_some(&case["item"]);
        assert_eq!(
            case["expect"]["ok"],
            json!(format_retired_key_sentence(item, None)),
            "sentence {}",
            case["item"]
        );
    }
    let constants = &doc["constants"];
    assert_eq!(constants["retiredGatedName"], json!(RETIRED_GATED_NAME));
    assert_eq!(
        constants["reservedPatternNames"],
        json!(RESERVED_PATTERN_NAMES)
    );
    assert_eq!(
        constants["seatBindingMarkerPath"],
        json!(SEAT_BINDING_MARKER_PATH)
    );
    let table: Map<String, Value> = RETIRED_CONFIG_KEYS
        .iter()
        .map(|k| {
            (
                k.key.to_string(),
                json!({ "replacement": k.replacement, "instruction": k.instruction }),
            )
        })
        .collect();
    assert_eq!(constants["retiredConfigKeys"], Value::Object(table));
    let order: Vec<&str> = constants["retiredConfigKeys"]
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(
        order,
        RETIRED_CONFIG_KEYS
            .iter()
            .map(|k| k.key)
            .collect::<Vec<_>>(),
        "the order the keys are reported in"
    );
}

#[test]
fn collaboration_errors_carry_code_detail_and_source_as_node_builds_them() {
    let doc = vectors("patterns.v1.json");
    for case in list(&doc["collaborationError"]) {
        let message = case["message"].as_str();
        let options = &case["options"];
        let source = options.get("source").and_then(Value::as_str);
        let path = options.get("path").and_then(Value::as_str);
        let err = CollaborationError::new(case["code"].as_str().unwrap(), message, source, path);
        assert_eq!(
            case["expect"],
            problem_json(&err),
            "{} {}",
            case["code"],
            case["message"]
        );
    }
}

// ---------------------------------------------------------------- collaboration

fn seat_error_of(answer: &Value) -> SeatError {
    let error = &answer["error"];
    SeatError {
        code: error["code"].as_str().unwrap().to_string(),
        at: error.get("at").and_then(Value::as_str).map(str::to_string),
        message: error["message"].as_str().unwrap().to_string(),
    }
}

/// The seat modules' answers to the input Node built for the same case; an input Rust builds differently has no
/// recorded answer and fails here, which is how the replay proves the parameters, floors and slots agree.
struct VectorSeating<'a> {
    recorded: &'a Value,
}

impl VectorSeating<'_> {
    fn input_of(&self, input: &Value) -> &Value {
        let seating = &self.recorded["hostSeating"];
        assert_eq!(
            seating["input"], *input,
            "Rust asked the seat modules a different question than Node did"
        );
        seating
    }
}

impl Seating for VectorSeating<'_> {
    fn resolve_seats(&self, input: &Value) -> Result<Vec<Value>, SeatError> {
        let answer = &self.input_of(input)["resolveSeats"];
        match answer.get("ok") {
            Some(seats) => Ok(list(seats).clone()),
            None => Err(seat_error_of(answer)),
        }
    }

    fn seat_launches(&self, input: &Value) -> Result<Option<Value>, SeatError> {
        let answer = &self.input_of(input)["seatLaunchesOf"];
        match answer.get("ok") {
            Some(Value::Null) => Ok(None),
            Some(bound) => Ok(Some(bound.clone())),
            None => Err(seat_error_of(answer)),
        }
    }

    fn checker_plan(
        &self,
        unit: &Value,
        runner_config: &Value,
        options: &Value,
    ) -> Result<Vec<Value>, SeatError> {
        let plan = &self.recorded["hostSeating"]["checkerPlan"];
        assert_eq!(plan["unit"], *unit, "checker plan unit");
        assert_eq!(
            plan["runnerConfig"], *runner_config,
            "checker plan runner config"
        );
        assert_eq!(plan["options"], *options, "checker plan options");
        match plan["expect"].get("ok") {
            Some(seats) => Ok(list(seats).clone()),
            None => Err(seat_error_of(&plan["expect"])),
        }
    }
}

#[test]
fn collaboration_is_resolved_with_params_seats_and_pin_as_node_resolves_it() {
    let doc = vectors("patterns.v1.json");
    let cases = list(&doc["resolveCollaboration"]);
    assert!(cases.len() > 100);
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let options = &case["options"];
        let tables = VectorTables {
            host: &doc["host"],
            seats: list(&case["hostSeats"]),
        };
        let seating = VectorSeating { recorded: case };
        let resolve = ResolveOptions {
            unit: options.get("unit"),
            selectors: options.get("selectors"),
            request: options.get("request"),
            in_case: options.get("inCase") == Some(&json!(true)),
            reason: options.get("reason").and_then(Value::as_str),
            runner_config: options.get("runnerConfig"),
            shipped: options.get("shipped"),
            origins: options.get("origins"),
        };
        match (
            case["expect"].get("ok"),
            resolve_collaboration(&resolve, &tables, &seating),
        ) {
            (Some(expected), Ok(resolved)) => assert_eq!(*expected, resolved.to_json(), "{name}"),
            (None, Err(CollaborationFailure::Collaboration(err))) => {
                assert_eq!(case["expect"]["error"], problem_json(&err), "{name}")
            }
            (None, Err(CollaborationFailure::Seat(err))) => {
                let expected = &case["expect"]["error"];
                assert_eq!(expected["name"], json!("SeatResolutionError"), "{name}");
                assert_eq!(expected["message"], json!(err.message), "{name}");
                assert_eq!(expected["code"], json!(err.code), "{name}");
            }
            (Some(_), Err(err)) => panic!("{name}: Rust refused ({err}) where Node resolved"),
            (None, Ok(_)) => panic!("{name}: Node refused but Rust resolved"),
        }
    }
}
