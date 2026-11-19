//! Replays the vectors of `packages/execution/contracts/core-loops/` (recorded by
//! `test/golden-recorders/core-loops.recorder.mjs` from the Node modules that owned these rules), and replays the
//! Node-era record corpus through the Rust readers. The vectors are read, never copied.

use fgos_execution::admission::{self, UnitFacts};
use fgos_execution::case_paths;
use fgos_execution::handoff::{self, Accept};
use fgos_execution::loops::{self, Command, LoopInput, LoopRun, RoleAsk, Step};
use fgos_execution::outcome;
use fgos_execution::seat_resolver::{self as seats, ResolveOptions, SeatResolutionError};
use fgos_execution::unit_record::{self, AttemptState, SummaryInput};
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};

fn contracts() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts")
}

fn load(name: &str) -> Value {
    let file = contracts()
        .join("core-loops")
        .join(format!("{name}.v1.json"));
    serde_json::from_str(
        &std::fs::read_to_string(&file).unwrap_or_else(|e| panic!("{}: {e}", file.display())),
    )
    .unwrap()
}

type Answer = Result<Value, Value>;

fn err_view(e: &SeatResolutionError) -> Value {
    let mut m = Map::new();
    m.insert("class".into(), json!(e.class));
    m.insert("code".into(), json!(e.code));
    m.insert("message".into(), json!(e.message));
    if let Some(at) = &e.at {
        m.insert("at".into(), json!(at));
    }
    if let Some(d) = &e.detail {
        m.insert("detail".into(), json!(d));
    }
    Value::Object(m)
}

fn seat_err(e: SeatResolutionError) -> Value {
    err_view(&e)
}

fn check(case: &Value, got: Answer) {
    let id = case["id"].as_str().unwrap_or("?");
    let want = &case["expected"];
    let got_wrapped = match &got {
        Ok(v) => json!({ "ok": v }),
        Err(e) => json!({ "error": e }),
    };
    assert_eq!(&got_wrapped, want, "case: {id}");
}

fn arg(case: &Value, i: usize) -> &Value {
    case["args"].get(i).unwrap_or(&Value::Null)
}

fn text(v: &Value) -> &str {
    v.as_str().unwrap_or("")
}

fn opt_str(v: Option<&str>) -> Value {
    v.map_or(Value::Null, |s| json!(s))
}

fn nn(v: &Value) -> Option<&Value> {
    (!v.is_null()).then_some(v)
}

fn owned(v: &Value) -> Option<Value> {
    nn(v).cloned()
}

// ---------------------------------------------------------------------------------------------------- outcome

#[test]
fn outcome_tables_match_the_recorded_vocabulary() {
    let doc = load("outcome");
    let t = &doc["tables"];
    assert_eq!(json!(outcome::VALID_OUTCOMES), t["validOutcomes"]);
    assert_eq!(json!(outcome::ERROR_OUTCOMES), t["errorOutcomes"]);
    assert_eq!(json!(outcome::NOT_STARTED_OUTCOME), t["notStarted"]);
    assert_eq!(json!(outcome::UNDETERMINED_OUTCOME), t["undetermined"]);
    let codes: Map<String, Value> = outcome::OUTCOME_EXIT_CODES
        .iter()
        .map(|(k, v)| ((*k).to_string(), json!(v)))
        .collect();
    assert_eq!(Value::Object(codes), t["exitCodes"]);
}

#[test]
fn outcome_rules_replay() {
    for case in load("outcome")["cases"].as_array().unwrap() {
        let a0 = arg(case, 0);
        let got: Value = match text(&case["fn"]) {
            "outcomeClass" => opt_str(outcome::outcome_class(text(a0))),
            "isVerdict" => json!(outcome::is_verdict(text(a0))),
            "isInfrastructure" => json!(outcome::is_infrastructure(text(a0))),
            "rebindsOnResume" => json!(outcome::rebinds_on_resume(text(a0))),
            "exitCodeForOutcome" => json!(outcome::exit_code_for_outcome(text(a0))),
            "infrastructure" => json!(outcome::infrastructure(a0)),
            "outcomeAfterScopeRule" => {
                let out_of_scope: Vec<String> = arg(case, 1)
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| text(v).to_string())
                    .collect();
                json!(outcome::outcome_after_scope_rule(text(a0), &out_of_scope))
            }
            "evaluationsOf" => json!(outcome::evaluations_of(a0.as_array().unwrap())),
            other => panic!("unknown outcome fn {other}"),
        };
        check(case, Ok(got));
    }
}

// ---------------------------------------------------------------------------------------------------- seats

fn resolve_options(v: &Value) -> ResolveOptions {
    ResolveOptions {
        loop_name: v.get("loop").and_then(Value::as_str).map(str::to_string),
        pattern: owned(&v["pattern"]),
        params: owned(&v["params"]),
        floors: owned(&v["floors"]),
        unit: v.get("unit").cloned().unwrap_or(Value::Null),
        runner_config: v.get("runnerConfig").cloned().unwrap_or(Value::Null),
        shipped_checkers_by_rigor: owned(&v["shippedCheckersByRigor"]),
        slot: v.get("slot").and_then(Value::as_str).map(str::to_string),
    }
}

fn plan_value(plan: Vec<seats::CheckerPlanEntry>) -> Value {
    Value::Array(
        plan.into_iter()
            .map(|p| json!({ "seat": p.seat, "contributions": p.contributions }))
            .collect(),
    )
}

#[test]
fn seat_tables_match_the_recorded_ones() {
    let doc = load("seats");
    let t = &doc["tables"];
    assert_eq!(json!(seats::SEAT_ROLES), t["roles"]);
    assert_eq!(json!(seats::LOOP_NAMES), t["loops"]);
    assert_eq!(json!(seats::RESERVED_SEAT_IDS), t["reserved"]);
    assert_eq!(json!(seats::VERIFY_SEAT), t["verifySeat"]);
    assert_eq!(json!(seats::SYNC_SEAT), t["syncSeat"]);
    let checkers: Vec<Value> = seats::CHECKER_SEATS
        .iter()
        .map(|(n, role, verdict)| (n, role, verdict))
        .map(|(n, role, verdict)| json!([n, { "role": role, "verdict": verdict }]))
        .collect();
    let recorded: Vec<Value> = t["checkerSeats"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| json!([k, v]))
        .collect();
    assert_eq!(checkers, recorded);
}

#[test]
fn seat_rules_replay() {
    for case in load("seats")["cases"].as_array().unwrap() {
        let (a0, a1, a2) = (arg(case, 0), arg(case, 1), arg(case, 2));
        let got: Answer = match text(&case["fn"]) {
            "resolveSeats" => seats::resolve_seats(&resolve_options(a0))
                .map(Value::Array)
                .map_err(seat_err),
            "checkDeclaredSeats" => {
                let tiers: Option<Vec<String>> = a2
                    .get("tiers")
                    .and_then(Value::as_array)
                    .map(|l| l.iter().map(|v| text(v).to_string()).collect());
                seats::check_declared_seats(a0, text(a1), tiers.as_deref())
                    .map(Value::Array)
                    .map_err(seat_err)
            }
            "seatLaunchesOf" => seats::seat_launches_of(&resolve_options(a0))
                .map(|n| json!(n))
                .map_err(seat_err),
            "seatKind" => Ok(json!(seats::seat_kind(a0))),
            "bindSeatOf" => Ok(seats::bind_seat_of(a0, text(a1))),
            "workflowTierOf" => {
                Ok(seats::workflow_tier_of(a0, a1, a2.as_str()).unwrap_or(Value::Null))
            }
            "assertNoSeatTier" => seats::assert_no_seat_tier(a0, text(a1))
                .map(|()| Value::Null)
                .map_err(seat_err),
            "assertNoUnitTier" => seats::assert_no_unit_tier(a0, text(a1))
                .map(|()| Value::Null)
                .map_err(seat_err),
            "effectiveRigorOf" => {
                seats::unit_rigor(a0, a1, a2.get("fallback").and_then(Value::as_str))
                    .map(|r| opt_str(r.as_deref()))
                    .map_err(seat_err)
            }
            "requiresDistinctFamilies" => seats::requires_distinct_families(a0, a1)
                .map(|b| json!(b))
                .map_err(seat_err),
            "checkerPlanOf" => {
                let options = if a2.is_array() {
                    seats::PlanOptions {
                        requested: Some(a2),
                        ..Default::default()
                    }
                } else {
                    seats::PlanOptions {
                        requested: nn(&a2["requested"]),
                        floors: nn(&a2["floors"]),
                        slot: a2.get("slot").and_then(Value::as_str),
                        shipped_checkers_by_rigor: nn(&a2["shippedCheckersByRigor"]),
                    }
                };
                seats::checker_plan_of(a0, a1, &options)
                    .map(plan_value)
                    .map_err(seat_err)
            }
            other => panic!("unknown seats fn {other}"),
        };
        check(case, got);
    }
}

// ---------------------------------------------------------------------------------------------------- legacy

#[test]
fn legacy_seat_reads_replay() {
    for case in load("legacy")["cases"].as_array().unwrap() {
        let (a0, a1) = (arg(case, 0), arg(case, 1));
        let got: Value = match text(&case["fn"]) {
            "legacySeatsOf" => json!(seats::legacy_seats_of(a0)),
            "isSeatRecord" => json!(seats::is_seat_record(a0)),
            "seatsOfRecord" => json!(seats::seats_of_record(a0)),
            "collaborationOfRecord" => seats::collaboration_of_record(a0, nn(&a1["shipped"])),
            "isVerdictResult" => json!(seats::is_verdict_result(a0)),
            "isVerifyResult" => json!(seats::is_verify_result(a0)),
            "seatKeyOf" => seats::seat_key_of(a0).cloned().unwrap_or(Value::Null),
            "legacyFamilyOf" => seats::legacy_family_of(a0).cloned().unwrap_or(Value::Null),
            other => panic!("unknown legacy fn {other}"),
        };
        check(case, Ok(got));
    }
}

// ---------------------------------------------------------------------------------------------------- loops

fn param_table_value(table: Option<Vec<loops::ParamSpec>>) -> Value {
    let Some(table) = table else {
        return Value::Null;
    };
    let mut map = Map::new();
    for spec in table {
        let mut entry = Map::new();
        entry.insert("type".into(), json!(spec.kind));
        if let Some(domain) = spec.domain {
            entry.insert("domain".into(), json!(domain));
        }
        entry.insert("scalar".into(), json!(spec.scalar));
        entry.insert("requestable".into(), json!(spec.requestable));
        map.insert(spec.name.to_string(), Value::Object(entry));
    }
    Value::Object(map)
}

#[test]
fn loop_tables_match_the_recorded_ones() {
    let doc = load("loops");
    for name in ["solo", "reviewed", "panel", "debate"] {
        assert_eq!(
            param_table_value(loops::param_table_of(name)),
            doc["paramTables"][name],
            "param table {name}"
        );
    }
    assert_eq!(json!(loops::DEFAULT_REBUTTAL), doc["defaultRebuttal"]);
}

#[test]
fn loop_helpers_replay() {
    for case in load("loops")["cases"].as_array().unwrap() {
        let (a0, a1) = (arg(case, 0), arg(case, 1));
        let got: Value = match text(&case["fn"]) {
            "roleUnit" => {
                let params = a1.get("params").cloned().unwrap_or_else(|| json!({}));
                let findings: Vec<Value> = a1
                    .get("findings")
                    .and_then(Value::as_array)
                    .cloned()
                    .unwrap_or_default();
                let seat = text(&a1["seat"]);
                let kind = a1.get("kind").and_then(Value::as_str).unwrap_or(seat);
                let mut ask = RoleAsk::new(seat, &params).kind(kind).findings(&findings);
                if a1.get("stance") == Some(&json!(true)) {
                    ask = ask.stance();
                }
                loops::role_unit(a0, &ask)
            }
            "verifySeatResult" => loops::verify_seat_result(nn(a0), a1.as_u64().unwrap()),
            "verifyCommandOf" => opt_str(loops::verify_command_of(a0, a1).as_deref()),
            "extractFindings" => json!(loops::extract_findings(a0)),
            "loopRunsVerify" => json!(loops::loop_runs_verify(text(a0))),
            "paramTableOf" => param_table_value(loops::param_table_of(text(a0))),
            other => panic!("unknown loops fn {other}"),
        };
        check(case, Ok(got));
    }
}

/// The engine's part, played from the scenario's table of answers.
fn play(scenario: &Value) -> (Answer, Vec<Value>) {
    let input = {
        let mut input = LoopInput::from_effective(
            &scenario["effective"],
            scenario["unit"].clone(),
            scenario["cfg"].clone(),
        );
        input.history = scenario["history"].as_array().cloned().unwrap_or_default();
        input.launch_room = scenario["launchRoom"].as_u64();
        input.shipped_checkers_by_rigor = owned(&scenario["shippedCheckersByRigor"]);
        input
    };
    let results = &scenario["results"];
    let mut verify: std::collections::VecDeque<Value> = scenario["verify"]
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into();
    let mut calls = Vec::new();
    let mut run = match LoopRun::new(input) {
        Ok(run) => run,
        Err(e) => return (Err(seat_err(e)), calls),
    };
    let mut answers: Option<Vec<Value>> = None;
    loop {
        match run.step(answers.take()) {
            Err(e) => return (Err(seat_err(e)), calls),
            Ok(Step::Done(done)) => return (Ok(done.to_value()), calls),
            Ok(Step::Dispatch(commands)) => {
                let mut out = Vec::new();
                for command in commands {
                    let mut described = command.to_value();
                    match &command {
                        Command::Role(call) => {
                            let key =
                                format!("{}/{}", text(&call.seat["seat"]), call.round.unwrap_or(1));
                            out.push(
                                results
                                    .get(&key)
                                    .unwrap_or_else(|| panic!("scenario has no result for {key}"))
                                    .clone(),
                            );
                        }
                        Command::Verify { .. } => {
                            described.as_object_mut().unwrap().remove("round");
                            out.push(verify.pop_front().expect("scenario has a verify answer"));
                        }
                    }
                    calls.push(described);
                }
                answers = Some(out);
            }
        }
    }
}

#[test]
fn scripted_loop_runs_replay() {
    let doc = load("loops");
    let runs = doc["runs"].as_array().unwrap();
    assert!(runs.len() > 40);
    for scenario in runs {
        let id = text(&scenario["id"]);
        let (got, calls) = play(scenario);
        let want = &scenario["expected"];
        match (&got, want.get("ok"), want.get("error")) {
            (Ok(v), Some(ok), _) => assert_eq!(v, ok, "run result: {id}"),
            (Err(e), _, Some(error)) => assert_eq!(e, error, "run error: {id}"),
            _ => panic!("run {id}: got {got:?}, recorded {want}"),
        }
        assert_eq!(&Value::Array(calls), &want["calls"], "run calls: {id}");
    }
}

#[test]
fn history_outcomes_replay() {
    for case in load("loops")["history"].as_array().unwrap() {
        let a = &case["args"];
        let seats_in = a["seats"].as_array().cloned().unwrap_or_default();
        let history = a["history"].as_array().cloned().unwrap_or_default();
        let got = loops::pattern_history_outcome(
            text(&a["loop"]),
            &a["params"],
            &a["unit"],
            &a["cfg"],
            &seats_in,
            &history,
        )
        .map(|o| opt_str(o.as_deref()))
        .map_err(seat_err);
        check(case, got);
    }
}

// ---------------------------------------------------------------------------------------------------- records

fn facts_of(v: &Value) -> UnitFacts {
    let list = |k: &str| v[k].as_array().cloned().unwrap_or_default();
    UnitFacts {
        outcome: text(&v["outcome"]).to_string(),
        infrastructure: v["infrastructure"].as_bool().unwrap(),
        out_of_scope: list("outOfScope"),
        out_of_scope_on_branch: list("outOfScopeOnBranch"),
        evaluations: list("evaluations"),
        started: v["started"].clone(),
        launches: v["launches"].clone(),
        results: list("results"),
    }
}

#[test]
fn record_rules_replay() {
    for case in load("records")["cases"].as_array().unwrap() {
        let (a0, a1, a2) = (arg(case, 0), arg(case, 1), arg(case, 2));
        let got: Answer = match text(&case["fn"]) {
            "isCaseId" => Ok(json!(case_paths::is_case_id(text(a0)))),
            "runsRoot" => Ok(json!(case_paths::runs_root(Path::new(text(a0))))),
            "runDirOf" => case_paths::run_dir_of(Path::new(text(a0)), text(a1))
                .map(|p| json!(p))
                .map_err(|e| json!({ "class": "RunnerConfigError", "code": case_paths::InvalidCaseId::CODE, "message": e.message })),
            "gateAnswerFile" => Ok(case_paths::gate_answer_file(Path::new(text(a0)), text(a1), text(a2)).map_or(Value::Null, |p| json!(p))),
            "anonymousInputName" => Ok(json!(handoff::anonymous_input_name(a0.as_u64().unwrap() as usize))),
            "isSeatInput" => Ok(json!(handoff::is_seat_input(text(a0)))),
            "plainInputName" => Ok(json!(handoff::plain_input_name(a0.as_u64().unwrap() as usize, Path::new(text(a1)), Path::new(text(a2))))),
            "extractStance" => Ok(unit_record::extract_stance(nn(a0), a1.as_array().unwrap())),
            "workflowLinkOf" => Ok(unit_record::workflow_link_of(nn(a0)).unwrap_or(Value::Null)),
            "planRefOf" => Ok(unit_record::plan_ref_of(nn(a0)).unwrap_or(Value::Null)),
            "lastAttempts" => Ok(json!(unit_record::last_attempts(a0))),
            "unitRunSettle" => Ok(admission::unit_run_settle(text(&a0["caseId"]), a0["unitRunId"].as_str(), &facts_of(a1))),
            "releasedUnitRunSettle" => Ok(admission::released_unit_run_settle(text(a0))),
            "normalizeCaseRef" => admission::normalize_case_ref(nn(a0))
                .map(|v| v.unwrap_or(Value::Null))
                .map_err(|e| json!({ "class": "RunnerConfigError", "code": "", "message": e.to_string() })),
            "briefNeverReached" => Ok(json!(admission::brief_never_reached(a0))),
            "noBriefDelivered" => Ok(json!(admission::no_brief_delivered(a0))),
            "seatLaunchesUsed" => Ok(json!(admission::seat_launches_used(a0))),
            "caseAdmissionRefusedMessage" => Ok(json!(
                admission::CaseAdmissionRefused {
                    refusal: admission::Refusal { code: text(&a0["code"]).into(), condition: text(&a0["condition"]).into(), violations: None }
                }
                .to_string()
            )),
            "admissionCodes" => Ok(json!({
                "portMissing": admission::PORT_MISSING,
                "ceiling": admission::SEAT_LAUNCH_CEILING,
                "contract": admission::unit_run_result_contract(),
            })),
            other => panic!("unknown records fn {other}"),
        };
        check(case, got);
    }
}

#[test]
fn report_refs_replay() {
    for case in load("records")["reportRefs"].as_array().unwrap() {
        let accept = match &case["accept"] {
            Value::Null => Accept::Nothing,
            Value::String(_) => Accept::Any,
            other => Accept::Digests(
                other["digests"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| text(v).to_string())
                    .collect(),
            ),
        };
        let files = case["files"].as_object().unwrap();
        let record = &case["record"];
        let got = handoff::report_ref_of_record(record)
            .and_then(|r| match r {
                handoff::ReportRef::Artifact(path) => Ok(path),
                handoff::ReportRef::Settled { path, sha256 } => {
                    let actual = files
                        .get(&path)
                        .map(|c| handoff::sha256_hex(text(c).as_bytes()));
                    handoff::settled_report_stands(
                        record,
                        sha256.as_deref(),
                        actual.as_deref(),
                        &accept,
                    )
                    .map(|()| path)
                }
            })
            .map(|p| json!(p))
            .map_err(|e| json!({ "reason": format!("{}: {}", e.subject, e.reason) }));
        check(case, got);
    }
}

#[test]
fn timestamps_read_as_date_parse_does() {
    for case in load("records")["timestamps"].as_array().unwrap() {
        let got = unit_record::parse_timestamp_ms(text(&case["text"]));
        assert_eq!(
            got.map_or(Value::Null, |ms| json!(ms)),
            case["ms"],
            "timestamp {:?}",
            case["text"]
        );
    }
}

fn corpus_dir(name: &str) -> PathBuf {
    contracts().join("corpus").join(name)
}

fn read_json(file: &Path) -> Value {
    serde_json::from_str(
        &std::fs::read_to_string(file).unwrap_or_else(|e| panic!("{}: {e}", file.display())),
    )
    .unwrap()
}

fn summary_of(entry: &Value) -> (Result<Value, String>, String) {
    let (record, unit_run_id) = match entry.get("corpus").and_then(Value::as_str) {
        Some(name) => (
            read_json(&corpus_dir(name).join("unit.json")),
            name.to_string(),
        ),
        None => (
            entry["record"].clone(),
            text(&entry["unitRunId"]).to_string(),
        ),
    };
    let raw_seats = entry["rawSeats"].as_array().unwrap();
    let input = SummaryInput {
        record: &record,
        unit_run_id: &unit_run_id,
        raw_seats,
        shipped: None,
        legacy_completion: nn(&entry["legacyCompletion"]),
        active: entry["active"].as_bool().unwrap_or(false),
    };
    match unit_record::build_unit_summary(&input) {
        Ok(summary) => {
            let serialized = unit_record::serialize_unit_summary(&summary);
            (Ok(summary), serialized)
        }
        Err(e) => (Err(e.0), String::new()),
    }
}

#[test]
fn unit_summaries_replay() {
    for entry in load("records")["summaries"].as_array().unwrap() {
        let id = text(&entry["id"]);
        let (got, serialized) = summary_of(entry);
        let want = &entry["expected"];
        if entry.get("corpus").is_some() {
            assert_eq!(got.unwrap(), *want, "summary: {id}");
            assert_eq!(serialized, entry["serialized"], "serialized summary: {id}");
        } else if let Some(ok) = want.get("ok") {
            assert_eq!(got.unwrap(), *ok, "summary: {id}");
        } else {
            assert_eq!(
                got.unwrap_err(),
                text(&want["error"]),
                "summary error: {id}"
            );
        }
    }
}

#[test]
fn unit_states_replay() {
    for case in load("records")["unitStates"].as_array().unwrap() {
        let attempts = case["attempts"].as_object().unwrap();
        let got = unit_record::derive_unit_state(
            text(&case["unitRunId"]),
            nn(&case["summary"]),
            || false,
            nn(&case["record"]),
            |id| match attempts.get(id).and_then(Value::as_str) {
                Some("open") => AttemptState::Open,
                Some("closed") => AttemptState::Closed,
                Some("abandoned-legacy") => AttemptState::AbandonedLegacy,
                _ => AttemptState::NotAdmitted,
            },
        );
        assert_eq!(got, case["expected"], "unit state: {}", text(&case["id"]));
    }
}

/// The one answer a source checkout cannot record (the process-identity addon is not shipped there): a live
/// controller keeps the run `running`, whatever its attempts say, but a settled summary still wins.
#[test]
fn a_held_controller_keeps_a_unit_run_running() {
    let running =
        unit_record::derive_unit_state("u", None, || true, None, |_| AttemptState::Closed);
    assert_eq!(running, json!({ "unitRunId": "u", "unitState": "running" }));
    let settled = unit_record::derive_unit_state(
        "u",
        Some(&json!({ "outcome": "pass" })),
        || panic!("not asked"),
        None,
        |_| AttemptState::Closed,
    );
    assert_eq!(
        settled,
        json!({ "unitRunId": "u", "unitState": "completed" })
    );
}

// ---------------------------------------------------------------------------------------------------- corpus

#[test]
fn node_era_unit_records_read_through_the_rust_readers() {
    for name in ["v3-solo-settled", "v3-open-attempt"] {
        let dir = corpus_dir(name);
        let record = read_json(&dir.join("unit.json"));
        assert!(seats::is_seat_record(&record), "{name} is a fenced record");
        assert_eq!(
            json!(seats::seats_of_record(&record)),
            record["seats"],
            "{name} seats"
        );
        // a pinned record decodes to its own collaboration
        let decoded = seats::collaboration_of_record(&record, None);
        assert_eq!(
            decoded["collaboration"], record["collaboration"],
            "{name} collaboration"
        );
        assert_eq!(
            decoded["effective"], record["collaboration"]["effective"],
            "{name} effective"
        );
        // every seat of the record is a seat the resolver would list for its loop
        let effective = &record["collaboration"]["effective"];
        let listed = seats::resolve_seats(&ResolveOptions {
            loop_name: Some(text(&effective["loop"]).to_string()),
            params: Some(json!({ "seats": record["seats"] })),
            unit: record["unit"].clone(),
            ..Default::default()
        })
        .unwrap();
        assert_eq!(
            Value::Array(listed),
            record["seats"],
            "{name} resolved seats"
        );
    }
}

#[test]
fn a_stored_unit_summary_is_reproduced_from_its_run_directory() {
    // The corpus is scrubbed, so the binding records the account and the duration came from are absent; every other
    // field of the stored summary is rebuilt as stored.
    let doc = load("records");
    for entry in doc["summaries"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|e| e.get("corpus").is_some())
    {
        let name = text(&entry["corpus"]);
        let mut stored = read_json(&corpus_dir(name).join("unit-summary.json"));
        let (built, _) = summary_of(entry);
        let mut built = built.unwrap();
        let stored_id = text(&stored["unitRunId"]).to_string();
        built["unitRunId"] = json!(stored_id);
        for summary in [&mut stored, &mut built] {
            for seat in summary["seats"].as_array_mut().unwrap() {
                for key in ["accountId", "durationMs"] {
                    seat["final"].as_object_mut().unwrap().remove(key);
                    for attempt in seat["attempts"].as_array_mut().unwrap() {
                        attempt.as_object_mut().unwrap().remove(key);
                    }
                }
            }
        }
        assert_eq!(built, stored, "{name}");
    }
}

// ---------------------------------------------------------------------------------------------------- purity

#[test]
fn the_pure_core_touches_no_file_process_or_clock() {
    let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let mut checked = 0;
    for module in [
        "outcome",
        "loops",
        "seat_resolver",
        "case_paths",
        "handoff",
        "unit_record",
        "admission",
    ] {
        let mut dirs = vec![src.join(module)];
        while let Some(dir) = dirs.pop() {
            for entry in std::fs::read_dir(&dir).unwrap() {
                let path = entry.unwrap().path();
                if path.is_dir() {
                    dirs.push(path);
                } else if path.extension().is_some_and(|e| e == "rs") {
                    let body = std::fs::read_to_string(&path).unwrap();
                    for banned in [
                        "std::process",
                        "std::fs",
                        "SystemTime",
                        "std::env",
                        "Instant::now",
                    ] {
                        assert!(!body.contains(banned), "{} uses {banned}", path.display());
                    }
                    checked += 1;
                }
            }
        }
    }
    assert!(checked >= 20, "checked {checked} files");
}
