//! The accounts module replays the vectors the Node tier recorded
//! (`packages/execution/contracts/accounts/`, written by `test/golden-recorders/accounts.recorder.mjs`) and holds
//! the behaviours Node never recorded: real kernel locks, a real child process behind the probe, and the clock.
//!
//! Each behaviour has one owning proof here: the lease state document and its audit lines (byte for byte), the
//! fault classifier, the credential helpers, the probe judgments, the login homes, the session probe, and the
//! rotation and walk rules. The account inventory itself is `fgos-execution`'s; one test checks the engine reads it
//! as the vectors did.

use std::cell::Cell;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_execution::accounts::provider_account_inventory;
use fgos_execution::ports::{Backend, Machine};
use fgos_execution_engine::accounts::account_probe::{
    account_invocations, account_probe_verdict, classify_account_probe, probe_contract,
    probe_model_for, with_probe_binding, ProbeRun,
};
use fgos_execution_engine::accounts::credential::{
    account_credential_sources, command_cli, credential_source_for_cli, credential_store_problem,
    expand_credential_home, provider_capacity_for_invocation, redact_selection,
};
use fgos_execution_engine::accounts::credential_probe::credential_probe_command;
#[cfg(unix)]
use fgos_execution_engine::accounts::credential_probe::{with_kill_timeout, ProbePlan};
use fgos_execution_engine::accounts::fault::{
    classify_fault, describe_provider_signal, parse_quota_reset_clock_time,
    parse_quota_reset_window_ms, FaultInput,
};
use fgos_execution_engine::accounts::host::{Host, Liveness};
use fgos_execution_engine::accounts::pin::{
    config_pinned_to_account, parse_account_pin, runner_config_for_binding,
};
use fgos_execution_engine::accounts::rotation::{
    credential_fault_pools, failed_accounts_of, inspect_account_rotation, kept_binding_of,
    may_rotate_account, tried_bindings_of, walk_state_of, Rotation,
};
use fgos_execution_engine::accounts::session_probe::{
    describe_session_keep, session_category, session_probe_invocation, SESSION_PROBE_CATEGORIES,
};
use fgos_execution_engine::accounts::state::{
    credential_store_dir, provider_account_dir, Accounts, FaultRecord, NamedLease, ProbeRecord,
    QuarantineProbe, QuarantineSet, Reclaim,
};
use fgos_execution_engine::accounts::time::{iso_from_ms, ms_from_iso};
use fgos_execution_engine::accounts::AccountLease;
use serde_json::{json, Map, Value};

// ---- the vectors and the machine ---------------------------------------------------------------------------------------

fn vector(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/accounts")
        .join(name);
    serde_json::from_str(
        &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .expect("vector json")
}

fn scratch(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-accounts-{tag}-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// A machine with a clock the test sets and the process identity the recorder replaced: pid 4242, and pid 999 dead.
struct FixedHost {
    now: Cell<i64>,
    offset_min: i64,
    confined: bool,
}

impl FixedHost {
    fn new(now: i64) -> Self {
        Self {
            now: Cell::new(now),
            offset_min: 0,
            confined: false,
        }
    }
}

impl Host for FixedHost {
    fn now_ms(&self) -> i64 {
        self.now.get()
    }
    fn self_record(&self) -> Value {
        json!({ "host": "h", "bootId": "b", "pidNs": "n", "pid": 4242, "startTime": "1" })
    }
    fn liveness_of(&self, record: &Value) -> Liveness {
        if record.get("pid") == Some(&json!(999)) {
            Liveness::Dead
        } else {
            Liveness::Unknown
        }
    }
    fn confined(&self) -> bool {
        self.confined
    }
    fn utc_offset_min(&self, _at_ms: i64) -> i64 {
        self.offset_min
    }
    fn user(&self) -> Option<String> {
        Some("vector-user".into())
    }
    fn pid(&self) -> u32 {
        4242
    }
}

struct VectorMachine {
    home: String,
}

impl Machine for VectorMachine {
    fn on_path(&self, _program: &str) -> bool {
        true
    }
    fn posture_backend(&self, _id: &str) -> Option<Backend> {
        None
    }
    fn herdr_present(&self) -> bool {
        false
    }
    fn home_dir(&self) -> Option<String> {
        Some(self.home.clone())
    }
}

const SCRUBBED: &str = "<scrubbed>";

fn scrub(value: &Value) -> Value {
    match value {
        Value::Array(list) => Value::Array(list.iter().map(scrub).collect()),
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(k, v)| {
                    (
                        k.clone(),
                        if matches!(k.as_str(), "pid" | "processStartTime" | "record") {
                            json!(SCRUBBED)
                        } else {
                            scrub(v)
                        },
                    )
                })
                .collect(),
        ),
        other => other.clone(),
    }
}

fn state_bytes(dir: &Path) -> (Value, Value) {
    let Ok(raw) = std::fs::read_to_string(dir.join("state.json")) else {
        return (Value::Null, Value::Null);
    };
    match serde_json::from_str::<Value>(&raw) {
        Ok(parsed) => {
            let scrubbed = scrub(&parsed);
            let text = format!("{}\n", serde_json::to_string_pretty(&scrubbed).unwrap());
            (scrubbed, json!(text))
        }
        Err(_) => (Value::Null, json!(raw)),
    }
}

fn audit_lines(dir: &Path) -> Value {
    let lines = std::fs::read_to_string(dir.join("audit.jsonl")).unwrap_or_default();
    scrub(&Value::Array(
        lines
            .lines()
            .filter(|l| !l.is_empty())
            .map(|l| serde_json::from_str(l).unwrap())
            .collect(),
    ))
}

fn listing(dir: &Path) -> Value {
    let mut names: Vec<String> = std::fs::read_dir(dir)
        .map(|rd| {
            rd.flatten()
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();
    names.sort();
    json!(names)
}

fn s<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

fn answer<T: Into<Value>>(
    result: Result<T, fgos_execution_engine::accounts::AccountsError>,
) -> Value {
    match result {
        Ok(value) => json!({ "value": value.into() }),
        Err(error) => json!({ "error": { "message": error.to_string(), "code": error.code() } }),
    }
}

fn opt(value: Option<Value>) -> Value {
    value.unwrap_or(Value::Null)
}

fn fault_input_of<'a>(classify: &'a Value, now: i64) -> FaultInput<'a> {
    FaultInput {
        provider: s(classify, "provider").unwrap_or_default(),
        adapter_outcome: s(classify, "adapterOutcome"),
        structured_stop_reason: classify
            .get("structuredAgent")
            .and_then(|a| s(a, "stopReason")),
        stop_cause: s(classify, "stopCause"),
        provider_signal: classify
            .get("providerSignal")
            .cloned()
            .unwrap_or(Value::Null),
        now_ms: now,
        utc_offset_min: 0,
    }
}

// ---- the lease state ----------------------------------------------------------------------------------------------------

fn replay(
    accounts: &Accounts,
    host: &FixedHost,
    runtime: &Path,
    inventory: &Map<String, Value>,
    op: &Value,
) -> Value {
    let args = op.get("args").cloned().unwrap_or(Value::Null);
    let now = host.now_ms();
    match s(op, "op").unwrap() {
        "clock" => {
            host.now.set(op["ms"].as_i64().unwrap());
            json!({ "value": null })
        }
        "reset" => {
            let _ = std::fs::remove_dir_all(runtime);
            json!({ "value": null })
        }
        "seed" => {
            std::fs::create_dir_all(runtime).unwrap();
            let text = op
                .get("text")
                .and_then(Value::as_str)
                .map(String::from)
                .unwrap_or_else(|| op["seed"].to_string());
            std::fs::write(runtime.join("state.json"), text).unwrap();
            json!({ "value": null })
        }
        "lease" => {
            let dead: Vec<String> = args
                .get("dead")
                .and_then(Value::as_array)
                .map(|l| {
                    l.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();
            let alive: Vec<String> = op
                .get("workerAlive")
                .and_then(Value::as_array)
                .map(|l| {
                    l.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();
            let run_is_dead = move |run: &str, _: &Value| dead.iter().any(|d| d == run);
            let worker_alive = move |run: &str, _: &Value| alive.iter().any(|d| d == run);
            let ask = NamedLease {
                provider: s(&args, "provider").unwrap_or_default(),
                account_id: s(&args, "accountId"),
                assignment_id: s(&args, "assignmentId"),
                run_id: s(&args, "runId").unwrap_or_default(),
                cli: s(&args, "cli"),
                account_view_digest: s(&args, "accountViewDigest"),
                lock_wait_ms: None,
            };
            answer(
                accounts
                    .acquire_named_account_lease(
                        inventory,
                        &ask,
                        &Reclaim {
                            run_is_dead: &run_is_dead,
                            is_run_worker_alive: &worker_alive,
                        },
                    )
                    .map(opt),
            )
        }
        "readStates" => {
            json!({ "value": accounts.read_account_states(s(&args, "provider").unwrap(), s(&args, "assignmentId"), now, None) })
        }
        "overlay" => {
            json!({ "value": accounts.read_account_state_overlay(s(&args, "assignmentId"), now, None) })
        }
        "fault" => {
            let classify = &args["classify"];
            let fault = classify_fault(&fault_input_of(classify, now));
            let signal = args.get("providerSignal").cloned();
            let ask = FaultRecord {
                provider: s(&args, "provider").unwrap(),
                account_id: s(&args, "accountId").unwrap(),
                fault,
                provider_signal: signal,
                run_id: s(&args, "runId"),
                assignment_id: s(&args, "assignmentId"),
                source: s(&args, "source").unwrap_or("run"),
            };
            answer(accounts.record_account_fault(&ask).map(opt))
        }
        "quarantine" => {
            let ask = QuarantineSet {
                provider: s(&args, "provider").unwrap(),
                account_id: s(&args, "accountId").unwrap(),
                reason_code: s(&args, "reasonCode").unwrap(),
                kind: s(&args, "quarantineKind").unwrap_or("temporary"),
                until: s(&args, "until"),
                reset_known: args.get("resetKnown").and_then(Value::as_bool),
                detail: args.get("detail").cloned(),
            };
            answer(accounts.quarantine_account(&ask))
        }
        "clear" => answer(accounts.clear_account_quarantine(
            inventory,
            s(&args, "provider").unwrap(),
            s(&args, "accountId").unwrap(),
            s(&args, "reason"),
            args.get("force") == Some(&json!(true)),
            s(&args, "caller"),
        )),
        "probeRecord" => {
            let source = s(&args, "source").unwrap_or("probe-account");
            let record = ProbeRecord {
                provider: s(&args, "provider").unwrap_or_default(),
                account_id: s(&args, "accountId").unwrap_or_default(),
                // A call without a row list is the refused shape: the recorded answer is the same refusal.
                direct: args
                    .get("direct")
                    .and_then(Value::as_array)
                    .cloned()
                    .unwrap_or_else(|| vec![Value::Null]),
                verdict: s(&args, "verdict"),
                source,
                now_ms: now,
            };
            if args.get("direct").is_none_or(|d| !d.is_array()) {
                return json!({ "error": { "message": "provider-capacity record-account-probe refused: provider, accountId and a direct row list are required", "code": null } });
            }
            answer(accounts.record_account_probe(&record).map(opt))
        }
        "probeQuarantined" => {
            let ask = QuarantineProbe {
                provider: s(&args, "provider").unwrap(),
                cli: s(&args, "cli"),
                model: s(&args, "model"),
                account_id: s(&args, "accountId"),
                run_key: s(&args, "runKey"),
                now_ms: now,
                cooldown_ms: args.get("cooldownMs").and_then(Value::as_i64),
                account_lock_wait_ms: None,
            };
            let reply = op["answer"].clone();
            let mut calls = Vec::new();
            let result = accounts.probe_quarantined_accounts(inventory, &ask, &mut |request, _lock| {
                calls.push(json!({ "accountId": request.account_id, "cli": request.cli, "model": request.model }));
                reply.clone()
            });
            answer(result.map(|tried| json!({ "tried": tried, "calls": calls })))
        }
        "release" => answer(accounts.release_account_lease(
            s(&args, "provider").unwrap_or_default(),
            s(&args, "accountId").unwrap_or_default(),
            s(&args, "runId").unwrap_or_default(),
        )),
        "drop" => {
            answer(accounts.drop_assignment_record(s(&args, "assignmentId").unwrap_or_default()))
        }
        "audit" => {
            json!({ "value": opt(accounts.audit_lease_receipt(op.get("receipt").filter(|r| !r.is_null()), s(&args, "assignmentId").unwrap()).map(Value::from)) })
        }
        "inspect" => {
            json!({ "value": accounts.inspect_provider_capacity(inventory, s(&args, "provider"), s(&args, "accountId")) })
        }
        "rotation" => json!({
            "value": inspect_account_rotation(accounts, inventory, s(op, "pool").unwrap())
                .map_or(Value::Null, |Rotation { pool, total, healthy }| json!({ "pool": pool, "total": total, "healthy": healthy })),
        }),
        other => panic!("unknown op {other}"),
    }
}

#[test]
fn lease_state_matches_every_node_recorded_scenario_byte_for_byte() {
    let v = vector("lease-state.v1.json");
    let inventory = v["inventory"].as_object().unwrap().clone();
    for scenario in v["scenarios"].as_array().unwrap() {
        let root = scratch("lease");
        let runtime = root.join("runtime");
        let host = FixedHost::new(scenario["startMs"].as_i64().unwrap());
        let accounts = Accounts::new(&runtime, root.join("locks"), &host);
        for (index, op) in scenario["ops"].as_array().unwrap().iter().enumerate() {
            let at = format!(
                "scenario {} op {index} ({})",
                s(scenario, "name").unwrap(),
                s(op, "op").unwrap()
            );
            let got = scrub(&replay(&accounts, &host, &runtime, &inventory, op));
            assert_eq!(got, op["expect"], "{at}: result");
            let (state, text) = state_bytes(&runtime);
            assert_eq!(state, op["state"], "{at}: state");
            assert_eq!(text, op["stateText"], "{at}: state bytes");
            assert_eq!(audit_lines(&runtime), op["audit"], "{at}: audit lines");
            assert_eq!(
                listing(&runtime),
                op["files"],
                "{at}: files in the runtime directory"
            );
        }
        let _ = std::fs::remove_dir_all(root);
    }
}

#[test]
fn the_engine_reads_the_account_inventory_the_lease_state_vectors_were_recorded_over() {
    let v = vector("lease-state.v1.json");
    let machine = VectorMachine {
        home: "/home/vector".into(),
    };
    let inventory = provider_account_inventory(&v["config"], &machine);
    assert_eq!(Value::Object(inventory), v["inventory"]);
}

#[test]
fn a_confined_session_is_refused_a_lease_by_name() {
    let v = vector("lease-state.v1.json");
    let inventory = v["inventory"].as_object().unwrap().clone();
    let root = scratch("confined");
    let host = FixedHost {
        now: Cell::new(0),
        offset_min: 0,
        confined: true,
    };
    let accounts = Accounts::new(root.join("runtime"), root.join("locks"), &host);
    let ask = NamedLease {
        provider: "openai-codex",
        account_id: Some("work"),
        run_id: "r",
        ..NamedLease::default()
    };
    let error = accounts
        .acquire_named_account_lease(&inventory, &ask, &Reclaim::NONE)
        .unwrap_err();
    assert_eq!(error.code(), Some("config-accounts-unavailable-confined"));
    assert!(
        !root.join("runtime").join("state.json").exists(),
        "a refused lease writes nothing"
    );
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn a_lease_is_released_through_the_handle_its_selection_gave() {
    let v = vector("lease-state.v1.json");
    let inventory = v["inventory"].as_object().unwrap().clone();
    let root = scratch("handle");
    let host = FixedHost::new(1_795_000_000_000);
    let accounts = Accounts::new(root.join("runtime"), root.join("locks"), &host);
    let ask = NamedLease {
        provider: "openai-codex",
        account_id: Some("work"),
        assignment_id: Some("asg"),
        run_id: "run-h",
        ..NamedLease::default()
    };
    let selection = accounts
        .acquire_named_account_lease(&inventory, &ask, &Reclaim::NONE)
        .unwrap()
        .unwrap();
    let lease = AccountLease::from_selection(&selection).expect("a selected lease has a handle");
    assert_eq!(
        (
            lease.provider.as_str(),
            lease.account_id.as_str(),
            lease.run_id.as_str()
        ),
        ("openai-codex", "work", "run-h")
    );
    assert!(lease.release(&accounts).unwrap());
    assert!(
        !lease.release(&accounts).unwrap(),
        "a second release finds nothing"
    );
    let refused = json!({ "status": "refused" });
    assert!(AccountLease::from_selection(&refused).is_none());
    let _ = std::fs::remove_dir_all(root);
}

// ---- the locks ----------------------------------------------------------------------------------------------------------

#[test]
fn the_state_lock_is_the_machine_wide_mutex_and_a_second_holder_waits_then_is_refused_by_name() {
    let root = scratch("state-lock");
    let host = FixedHost::new(0);
    let accounts = Accounts::new(root.join("runtime"), root.join("locks"), &host);
    let other = Accounts::new(root.join("runtime"), root.join("locks"), &host);
    let result = accounts.with_state_lock(Some(1000), || {
        // A lock taken here, on the same file, by another holder of the same machine.
        let busy = other.with_state_lock(Some(150), || Ok(()));
        assert_eq!(
            busy.as_ref().unwrap_err().code(),
            Some("provider-capacity-lock-stale"),
            "{busy:?}"
        );
        let message = busy.unwrap_err().to_string();
        assert!(
            message.starts_with("provider-capacity lock at \""),
            "{message}"
        );
        assert!(message.contains("provider-state.lock"), "{message}");
        assert!(
            message.contains("is still held by a live process after waiting 150ms"),
            "{message}"
        );
        Ok(())
    });
    result.unwrap();
    accounts
        .with_state_lock(Some(1000), || Ok(()))
        .expect("released when the first holder is done");
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn an_account_lock_is_one_per_account_and_independent_of_the_state_lock() {
    let root = scratch("account-lock");
    let host = FixedHost::new(0);
    let accounts = Accounts::new(root.join("runtime"), root.join("locks"), &host);
    let first = accounts
        .try_acquire_account_lock("openai-codex", "work")
        .unwrap()
        .expect("free");
    assert_eq!(
        first.dir,
        root.join("runtime")
            .join("account-locks")
            .join("openai-codex")
            .join("work")
    );
    assert!(
        accounts
            .try_acquire_account_lock("openai-codex", "work")
            .unwrap()
            .is_none(),
        "a held account is busy"
    );
    assert!(
        accounts
            .try_acquire_account_lock("openai-codex", "spare")
            .unwrap()
            .is_some(),
        "another account is free"
    );
    accounts
        .with_state_lock(Some(500), || Ok(()))
        .expect("the state lock is a different lock");
    let waited = accounts
        .acquire_account_lock("openai-codex", "work", Some(120))
        .unwrap_err();
    assert_eq!(waited.code(), Some("provider-capacity-lock-stale"));
    assert!(
        waited
            .to_string()
            .contains("provider-capacity account lock at \""),
        "{waited}"
    );
    first.release();
    assert!(
        accounts
            .try_acquire_account_lock("openai-codex", "work")
            .unwrap()
            .is_some(),
        "free again after release"
    );
    let unsafe_id = accounts
        .try_acquire_account_lock("../escape", "work")
        .unwrap_err();
    assert!(
        unsafe_id
            .to_string()
            .starts_with("provider-capacity account lock refused: unsafe provider/account"),
        "{unsafe_id}"
    );
    let _ = std::fs::remove_dir_all(root);
}

// ---- fault classification --------------------------------------------------------------------------------------------

#[test]
fn quota_windows_clock_times_and_faults_classify_as_the_node_classifier_did() {
    let v = vector("fault-classification.v1.json");
    for case in v["windowTexts"].as_array().unwrap() {
        let got = case["text"].as_str().and_then(parse_quota_reset_window_ms);
        assert_eq!(
            got.map(Value::from).unwrap_or(Value::Null),
            case["ms"],
            "window of {}",
            case["text"]
        );
    }
    for case in v["clockTimes"].as_array().unwrap() {
        let got = parse_quota_reset_clock_time(
            s(case, "text").unwrap(),
            case["now"].as_i64().unwrap(),
            case["utcOffsetMin"].as_i64().unwrap(),
        );
        assert_eq!(
            got.map(Value::from).unwrap_or(Value::Null),
            case["ms"],
            "clock time of {} in {} at {}",
            case["text"],
            case["tz"],
            case["now"]
        );
    }
    for case in v["describeSignal"].as_array().unwrap() {
        let got = describe_provider_signal(&case["signal"]);
        assert_eq!(
            got.map(Value::from).unwrap_or(Value::Null),
            case["text"],
            "signal {}",
            case["signal"]
        );
    }
    for case in v["classify"].as_array().unwrap() {
        let mut input = fault_input_of(&case["input"], case["now"].as_i64().unwrap());
        input.utc_offset_min = case["utcOffsetMin"].as_i64().unwrap();
        // A provider recorded as null is no provider at all.
        input.provider = s(&case["input"], "provider").unwrap_or_default();
        assert_eq!(
            classify_fault(&input),
            case["fault"],
            "fault of {} in {}",
            case["input"],
            case["tz"]
        );
    }
}

#[test]
fn iso_text_and_epoch_milliseconds_convert_as_date_does() {
    assert_eq!(iso_from_ms(0), "1970-01-01T00:00:00.000Z");
    assert_eq!(iso_from_ms(1_795_064_430_000), "2026-11-19T05:00:30.000Z");
    assert_eq!(iso_from_ms(-1), "1969-12-31T23:59:59.999Z");
    assert_eq!(iso_from_ms(951_782_400_000), "2000-02-29T00:00:00.000Z");
    for text in [
        "2026-11-19T05:00:30.000Z",
        "2026-11-19T05:00:30Z",
        "2026-11-19T12:00:30.5+07:00",
        "2026-11-19T05:00:30.123456Z",
    ] {
        assert!(ms_from_iso(text).is_some(), "{text}");
    }
    assert_eq!(
        ms_from_iso("2026-11-19T12:00:30.000+07:00"),
        ms_from_iso("2026-11-19T05:00:30.000Z")
    );
    assert_eq!(
        ms_from_iso("2026-11-19T05:00:30.5Z"),
        Some(1_795_064_430_500)
    );
    // A bare date is UTC midnight, as `Date.parse` reads it.
    assert_eq!(ms_from_iso("2026-11-19"), Some(1_795_046_400_000));
    for text in [
        "garbage",
        "",
        "2026-13-01T00:00:00Z",
        "2026-11-19Tzz:00:00Z",
    ] {
        assert_eq!(ms_from_iso(text), None, "{text}");
    }
    for ms in [0_i64, 1_795_064_430_123, 951_782_400_000, 4_102_444_799_999] {
        assert_eq!(ms_from_iso(&iso_from_ms(ms)), Some(ms));
    }
}

// ---- credential helpers --------------------------------------------------------------------------------------------------

#[test]
fn credential_stores_are_read_expanded_and_checked_as_the_node_helpers_did() {
    let v = vector("credential-helpers.v1.json");
    let home = s(&v, "home");
    for case in v["commandCli"].as_array().unwrap() {
        let got = case["command"]
            .as_str()
            .map_or(Some(String::new()), |c| Some(c.to_string()))
            .and_then(|c| command_cli(&c));
        let expected = case["cli"].as_str();
        // A command that is not text names no CLI, as an empty one does.
        assert_eq!(
            got.as_deref().filter(|_| !case["command"].is_null()),
            expected.filter(|_| !case["command"].is_null()),
            "{}",
            case["command"]
        );
    }
    let shapes = &v["accountShapes"];
    for case in v["sourceForCli"].as_array().unwrap() {
        let got = credential_source_for_cli(&shapes[s(case, "account").unwrap()], s(case, "cli"));
        assert_eq!(
            got.cloned().unwrap_or(Value::Null),
            case["source"],
            "{} / {}",
            case["account"],
            case["cli"]
        );
    }
    for case in v["sources"].as_array().unwrap() {
        let got: Vec<Value> = account_credential_sources(&shapes[s(case, "account").unwrap()])
            .into_iter()
            .cloned()
            .collect();
        assert_eq!(Value::Array(got), case["sources"], "{}", case["account"]);
    }
    for case in v["expandHome"].as_array().unwrap() {
        let got = expand_credential_home(case["home"].as_str(), home);
        assert_eq!(
            got.map(Value::from).unwrap_or(Value::Null),
            case["expanded"],
            "home {}",
            case["home"]
        );
    }
    for case in v["storeProblems"].as_array().unwrap() {
        assert_eq!(
            credential_store_problem(&case["store"])
                .map(Value::from)
                .unwrap_or(Value::Null),
            case["problem"],
            "store {}",
            case["store"]
        );
    }
    for case in v["forInvocation"].as_array().unwrap() {
        assert_eq!(
            provider_capacity_for_invocation(&case["selection"], &case["invocation"]),
            case["result"],
            "{}",
            case["invocation"]
        );
    }
    for case in v["redact"].as_array().unwrap() {
        assert_eq!(
            redact_selection(&case["selection"]),
            case["result"],
            "{}",
            case["selection"]
        );
    }
    for case in v["accountDirs"].as_array().unwrap() {
        let (provider, account) = (s(case, "provider").unwrap(), s(case, "accountId").unwrap());
        let dir = provider_account_dir(Path::new("/rt"), provider, account)
            .map(|p| Value::from(p.to_string_lossy().into_owned()));
        assert_eq!(
            dir.unwrap_or(Value::Null),
            case["dir"],
            "dir of {provider}/{account}"
        );
        let store = credential_store_dir(Path::new("/rt"), provider, account, s(case, "cli"))
            .map(|p| Value::from(p.to_string_lossy().into_owned()));
        assert_eq!(
            store.unwrap_or(Value::Null),
            case["storeDir"],
            "store dir of {provider}/{account}/{}",
            case["cli"]
        );
    }
}

#[test]
fn the_probe_call_is_built_per_credential_layout_as_node_built_it() {
    let v = vector("credential-helpers.v1.json");
    let home = s(&v, "home");
    for case in v["probeCommands"].as_array().unwrap() {
        let source = &v["sourcesForProbe"][s(case, "source").unwrap()];
        let model = s(case, "model");
        let got = credential_probe_command(source, case["noTools"] == json!(true), model, home)
            .map(|p| p.to_json());
        assert_eq!(
            got.unwrap_or(Value::Null),
            case["plan"],
            "{} noTools={} model={}",
            case["source"],
            case["noTools"],
            case["model"]
        );
    }
}

// Unix only: on Windows `timeout.exe` is another program, so the call is never wrapped there.
#[cfg(unix)]
#[test]
fn the_probe_call_ends_on_its_own_when_coreutils_timeout_exists_and_runs_as_it_is_when_not() {
    let plan = ProbePlan {
        command: "codex".into(),
        args: vec!["exec".into()],
        env: BTreeMap::new(),
        home: "/h".into(),
        cli: None,
    };
    let bin = scratch("path-with-timeout");
    let tool = bin.join("timeout");
    std::fs::write(&tool, "#!/bin/sh\n").unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&tool, std::fs::Permissions::from_mode(0o755)).unwrap();
    }
    let wrapped = with_kill_timeout(plan.clone(), 90_000, &bin.to_string_lossy());
    assert_eq!(wrapped.command, tool.to_string_lossy());
    assert_eq!(wrapped.args, vec!["--kill-after=5", "90", "codex", "exec"]);
    assert_eq!(
        wrapped.cli.as_deref(),
        Some("codex"),
        "the wrapped call is still judged as its own CLI"
    );
    assert_eq!(
        with_kill_timeout(plan.clone(), 500, &bin.to_string_lossy()).args[1],
        "1",
        "never under a second"
    );
    let empty = scratch("path-without-timeout");
    assert_eq!(
        with_kill_timeout(plan.clone(), 90_000, &empty.to_string_lossy()),
        plan
    );
    let _ = (std::fs::remove_dir_all(bin), std::fs::remove_dir_all(empty));
}

#[cfg(unix)]
#[test]
fn a_probe_call_is_judged_from_what_it_printed_and_how_it_ended_and_holds_the_account_lock_while_it_runs(
) {
    use fgos_execution_engine::accounts::credential_probe::{
        probe_env, run_credential_probe, HoldingRunner, ProcessRunner,
    };
    let home = scratch("probe-home");
    let make = |script: &str| ProbePlan {
        command: "sh".into(),
        args: vec!["-c".into(), script.into()],
        env: BTreeMap::from([("MARKER".into(), "set".into())]),
        home: home.to_string_lossy().into_owned(),
        cli: Some("codex".into()),
    };
    let inherited = BTreeMap::from([
        (
            "PATH".to_string(),
            std::env::var("PATH").unwrap_or_default(),
        ),
        ("SECRET_TOKEN".to_string(), "x".to_string()),
    ]);
    let env = probe_env(&inherited, &make("true"));
    assert!(
        env.contains_key("PATH") && !env.contains_key("SECRET_TOKEN"),
        "only the shell basics are inherited: {env:?}"
    );
    assert_eq!(
        (env["HOME"].as_str(), env["MARKER"].as_str()),
        (home.to_str().unwrap(), "set")
    );

    let ok = run_credential_probe(
        &make("echo OK; test \"$HOME\" = \"$(pwd)\""),
        &ProcessRunner,
        5000,
        &inherited,
    );
    assert_eq!(
        (
            ok["ok"].clone(),
            ok["exitCode"].clone(),
            ok["timedOut"].clone()
        ),
        (json!(true), json!(0), json!(false)),
        "{ok}"
    );
    let dead = run_credential_probe(
        &make("echo 'invalid_grant' >&2; exit 1"),
        &ProcessRunner,
        5000,
        &inherited,
    );
    assert_eq!(dead["ok"], json!(false), "{dead}");
    assert_eq!(
        dead["detail"],
        json!("the login is still rejected"),
        "{dead}"
    );
    assert_eq!(dead["reason"], json!("login"));
    let plain = run_credential_probe(&make("exit 3"), &ProcessRunner, 5000, &inherited);
    assert_eq!(
        (plain["ok"].clone(), plain["detail"].clone()),
        (json!(false), json!("the call exited with code 3")),
        "{plain}"
    );
    let slow = run_credential_probe(&make("sleep 5"), &ProcessRunner, 300, &inherited);
    assert_eq!(
        (
            slow["ok"].clone(),
            slow["timedOut"].clone(),
            slow["detail"].clone()
        ),
        (
            json!(false),
            json!(true),
            json!("the call did not finish in time")
        ),
        "{slow}"
    );
    let missing = run_credential_probe(
        &ProbePlan {
            command: "no-such-program-here".into(),
            ..make("")
        },
        &ProcessRunner,
        1000,
        &inherited,
    );
    assert!(
        missing["detail"]
            .as_str()
            .unwrap()
            .starts_with("could not start no-such-program-here"),
        "{missing}"
    );

    // Under the account lock: the lock stays held while the call lives and is free once it is judged.
    let root = scratch("holding");
    let host = FixedHost::new(0);
    let accounts = Accounts::new(root.join("runtime"), root.join("locks"), &host);
    let lock = accounts
        .try_acquire_account_lock("openai-codex", "work")
        .unwrap()
        .unwrap();
    let held = run_credential_probe(&make("echo OK"), &HoldingRunner(&lock), 5000, &inherited);
    assert_eq!(
        (held["ok"].clone(), held["exitCode"].clone()),
        (json!(true), json!(0)),
        "{held}"
    );
    assert!(
        accounts
            .try_acquire_account_lock("openai-codex", "work")
            .unwrap()
            .is_none(),
        "still held by this holder"
    );
    lock.release();
    assert!(accounts
        .try_acquire_account_lock("openai-codex", "work")
        .unwrap()
        .is_some());
    let _ = (std::fs::remove_dir_all(home), std::fs::remove_dir_all(root));
}

// ---- probes -------------------------------------------------------------------------------------------------------------

#[test]
fn account_probe_judgments_match_the_node_probe() {
    let v = vector("account-probe.v1.json");
    let home = s(&v, "home");
    let machine = VectorMachine {
        home: home.unwrap().into(),
    };
    let inventory = provider_account_inventory(&v["config"], &machine);
    assert_eq!(
        Value::Object(inventory.clone()),
        v["inventory"],
        "the inventory the plans are read over"
    );

    // The run directories the classifier reads, rebuilt from the recorded files.
    let root = scratch("probe-dirs");
    let mut dirs: BTreeMap<String, PathBuf> = BTreeMap::new();
    for (name, files) in v["runFiles"].as_object().unwrap() {
        let dir = root.join(name);
        std::fs::create_dir_all(&dir).unwrap();
        for (rel, content) in files.as_object().unwrap() {
            let text = content
                .as_str()
                .map(String::from)
                .unwrap_or_else(|| content.to_string());
            std::fs::create_dir_all(dir.join(rel).parent().unwrap()).unwrap();
            std::fs::write(dir.join(rel), text).unwrap();
        }
        dirs.insert(name.clone(), dir);
    }
    for case in v["classify"].as_array().unwrap() {
        let input = &case["input"];
        let run_dir = (s(case, "runFiles").unwrap() != "none")
            .then(|| dirs[s(case, "runFiles").unwrap()].clone());
        let run = ProbeRun {
            ok: input.get("ok") == Some(&json!(true)),
            text: s(input, "text").unwrap_or_default(),
            failure_code: s(input, "failureCode"),
            cause: s(input, "cause"),
            provider_signal: input.get("providerSignal").cloned().unwrap_or(Value::Null),
            run_dir,
        };
        assert_eq!(
            classify_account_probe(&run),
            case["result"],
            "{} with {}",
            case["input"],
            case["runFiles"]
        );
    }
    for case in v["verdict"].as_array().unwrap() {
        let rows = case["rows"].as_array().unwrap();
        assert_eq!(
            account_probe_verdict(rows),
            s(case, "verdict").unwrap(),
            "{}",
            case["rows"]
        );
    }
    for case in v["invocations"].as_array().unwrap() {
        let got = account_invocations(
            &v["config"],
            &inventory,
            s(case, "provider").unwrap(),
            s(case, "accountId").unwrap(),
            s(case, "executorId"),
            home,
        );
        assert_eq!(
            got, case["plan"],
            "{}/{}",
            case["provider"], case["accountId"]
        );
    }
    for case in v["probeModel"].as_array().unwrap() {
        let (model, source) = probe_model_for(
            &v["config"],
            s(case, "executorId").unwrap(),
            s(case, "family").unwrap(),
        );
        assert_eq!(
            json!([model, source]),
            case["result"].clone().pipe_model(),
            "{}/{}",
            case["executorId"],
            case["family"]
        );
    }
    for case in v["pinned"].as_array().unwrap() {
        assert_eq!(
            config_pinned_to_account(
                &v["config"],
                s(case, "provider").unwrap(),
                s(case, "accountId").unwrap()
            ),
            case["config"],
            "{}/{}",
            case["provider"],
            case["accountId"]
        );
    }
    assert_eq!(
        probe_contract(
            "Account probe: there is no task. Reply with the single word OK.",
            180_000
        ),
        v["contractOf"]
    );
    assert_eq!(probe_contract("p", 5), v["contractCustom"]);
    assert_eq!(
        with_probe_binding(
            &json!({ "assignmentId": "a", "policy": { "keep": 1 } }),
            "e",
            "i"
        ),
        v["binding"]
    );
    assert_eq!(
        with_probe_binding(&json!({ "assignmentId": "a" }), "e", "i"),
        v["bindingNoPolicy"]
    );
    for case in v["pins"].as_array().unwrap() {
        let got = match case["value"].as_str() {
            Some(text) => match parse_account_pin(text) {
                Ok(pin) => json!({ "pool": pin.pool, "id": pin.id }),
                Err(refused) => {
                    json!({ "refused": { "reason": refused.reason, "detail": refused.detail } })
                }
            },
            None => continue,
        };
        assert_eq!(got, case["result"], "pin {}", case["value"]);
    }
    for case in v["runnerConfigForBinding"].as_array().unwrap() {
        assert_eq!(
            runner_config_for_binding(&v["config"], &case["bound"]),
            case["config"],
            "{}",
            case["bound"]
        );
    }
    let _ = std::fs::remove_dir_all(root);
}

/// The recorded `probeModelFor` result is `{model, modelSource}`; the engine's is `(model, source)`.
trait PipeModel {
    fn pipe_model(self) -> Value;
}
impl PipeModel for Value {
    fn pipe_model(self) -> Value {
        json!([self["model"], self["modelSource"]])
    }
}

// ---- login homes and the session probe ----------------------------------------------------------------------------------

#[cfg(unix)]
fn homes_fixture() -> (PathBuf, Value) {
    let v = vector("login-homes.v1.json");
    let root = scratch("homes");
    std::fs::create_dir_all(root.join(".codex")).unwrap();
    std::fs::create_dir_all(root.join("real-pi")).unwrap();
    std::fs::create_dir_all(root.join(".pi")).unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(root.join("real-pi"), root.join(".pi").join("agent")).unwrap();
    (root, v)
}

#[cfg(unix)]
fn fill(value: &Value, home: &Path) -> Value {
    serde_json::from_str(&value.to_string().replace("<HOME>", &home.to_string_lossy())).unwrap()
}

#[cfg(unix)]
#[test]
fn login_directories_are_found_where_node_found_them() {
    use fgos_execution_engine::accounts::login_homes::{
        default_login_home_stores, machine_login_stores,
    };
    let (root, v) = homes_fixture();
    let home = root.to_string_lossy().into_owned();
    let runner = fill(&v["runner"], &root);
    for case in v["defaultStores"].as_array().unwrap() {
        let env = fill(&case["env"], &root);
        let lookup = |name: &str| env.get(name).and_then(Value::as_str).map(String::from);
        assert_eq!(
            Value::Array(default_login_home_stores(&runner, &home, &lookup)),
            case["hits"],
            "env {}",
            case["env"]
        );
    }
    for case in v["machineStores"].as_array().unwrap() {
        let env = fill(&case["env"], &root);
        let lookup = |name: &str| env.get(name).and_then(Value::as_str).map(String::from);
        let got = machine_login_stores(&runner, &home, &lookup, s(case, "inPlaceCli"));
        assert_eq!(
            json!(got),
            fill(&case["stores"], &root),
            "env {} in place {}",
            case["env"],
            case["inPlaceCli"]
        );
    }
    let _ = std::fs::remove_dir_all(root);
}

#[test]
fn the_session_probe_reads_what_the_run_left_and_names_the_fix() {
    let v = vector("session-probe.v1.json");
    let root = scratch("session");
    let mut dirs = BTreeMap::new();
    for (name, files) in v["runFiles"].as_object().unwrap() {
        let dir = root.join(name);
        std::fs::create_dir_all(&dir).unwrap();
        for (rel, content) in files.as_object().unwrap() {
            let text = content
                .as_str()
                .map(String::from)
                .unwrap_or_else(|| content.to_string());
            std::fs::create_dir_all(dir.join(rel).parent().unwrap()).unwrap();
            std::fs::write(dir.join(rel), text).unwrap();
        }
        dirs.insert(name.clone(), dir);
    }
    let invocations = v["config"]["executors"]["pi"]["invocations"]
        .as_array()
        .unwrap();
    for case in v["keep"].as_array().unwrap() {
        let invocation = invocations
            .iter()
            .find(|i| s(i, "id") == s(case, "invocation"))
            .unwrap();
        let run_dir = s(case, "runFiles").map(|n| dirs[n].clone());
        let keep = describe_session_keep(run_dir.as_deref(), invocation, "pi");
        let got = json!({
            "step": null,
            "declaredSessionDir": keep.declared_session_dir,
            "observedSessionPaths": keep.observed_session_paths,
            "transcriptPath": keep.transcript_path.as_ref().map(|p| p.replace(&dirs.get(s(case, "runFiles").unwrap_or("")).map_or(String::new(), |d| d.to_string_lossy().into_owned()), "<RUN-DIR>")),
            "files": keep.files,
            "bytes": keep.bytes,
            "warnings": keep.warnings,
            "fix": keep.fix,
            "hasHome": keep.has_home,
        });
        let mut expected = case["result"].clone();
        expected.as_object_mut().unwrap().remove("step");
        let mut got = got;
        got.as_object_mut().unwrap().remove("step");
        assert_eq!(
            got, expected,
            "keep {} / {}",
            case["runFiles"], case["invocation"]
        );
    }
    for case in v["invocations"].as_array().unwrap() {
        let got = session_probe_invocation(
            &v["config"],
            s(case, "executorId").unwrap(),
            s(case, "invocationId"),
        );
        match (got, case.get("error")) {
            (Ok(invocation), None) => assert_eq!(
                s(invocation, "id"),
                s(case, "id"),
                "{}/{}",
                case["executorId"],
                case["invocationId"]
            ),
            (Err(message), Some(expected)) => assert_eq!(
                Value::from(message),
                *expected,
                "{}/{}",
                case["executorId"],
                case["invocationId"]
            ),
            (got, expected) => panic!(
                "{}/{}: got {got:?}, recorded {expected:?}",
                case["executorId"], case["invocationId"]
            ),
        }
    }
    let names: Vec<&str> = v["categories"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(Value::as_str)
        .collect();
    assert_eq!(names, SESSION_PROBE_CATEGORIES);
    let ladder: Vec<&str> = fgos_seat_binding::tier::Tier::ALL
        .iter()
        .map(|t| t.name())
        .collect();
    assert_eq!(
        s(&v, "cheapestTier"),
        ladder.first().copied(),
        "the weakest tier of the ladder"
    );

    // The category follows the kept copy first, then the run, the home, the copy, the declaration, the fix.
    let keep_of = |run: &str, invocation: usize| {
        describe_session_keep(Some(&dirs[run]), &invocations[invocation], "pi")
    };
    assert_eq!(
        session_category(false, &keep_of("kept", 0)),
        "kept",
        "a kept copy wins over a failed seat"
    );
    assert_eq!(session_category(false, &keep_of("noStep", 0)), "run-failed");
    assert_eq!(
        session_category(true, &keep_of("noHome", 0)),
        "no-private-home"
    );
    assert_eq!(
        session_category(true, &keep_of("copyFailed", 0)),
        "copy-failed"
    );
    assert_eq!(
        session_category(true, &keep_of("mismatch", 0)),
        "dir-mismatch"
    );
    assert_eq!(
        session_category(true, &keep_of("mismatch", 1)),
        "dir-undeclared",
        "a declared folder is what a mismatch is judged against"
    );
    let _ = std::fs::remove_dir_all(root);
}

// ---- rotation and the walk ----------------------------------------------------------------------------------------------

#[test]
fn rotation_and_the_walk_state_follow_the_attempt_chain_as_node_read_it() {
    let v = vector("rotation-walk.v1.json");
    let unit = &v["unit"];
    for case in v["mayRotate"].as_array().unwrap() {
        let rotation = (!case["rotation"].is_null()).then(|| Rotation {
            pool: "p".into(),
            total: case["rotation"]["total"].as_u64().unwrap() as usize,
            healthy: case["rotation"]["healthy"].as_u64().unwrap() as usize,
        });
        assert_eq!(
            may_rotate_account(rotation.as_ref(), case["spent"].as_u64().unwrap() as usize),
            case["result"] == json!(true),
            "{case}"
        );
    }
    let attempts = unit["bindings"]["producer/1"].as_array().unwrap();
    for case in v["tried"].as_array().unwrap() {
        let at = case["at"].as_i64().unwrap();
        let got = if at < 0 {
            Vec::new()
        } else {
            tried_bindings_of(attempts, at as usize)
        };
        assert_eq!(Value::Array(got), case["result"], "tried at {at}");
    }
    assert_eq!(Value::Array(failed_accounts_of(attempts)), v["failed"][0]);
    assert_eq!(
        Value::Array(failed_accounts_of(&attempts[..2])),
        v["failed"][1]
    );
    assert_eq!(Value::Array(failed_accounts_of(&[])), v["failed"][2]);
    for case in v["kept"].as_array().unwrap() {
        let got = kept_binding_of(
            unit,
            s(case, "seat").unwrap(),
            case["round"].as_f64().unwrap(),
        );
        assert_eq!(
            got.unwrap_or(Value::Null),
            case["result"],
            "kept {}/{}",
            case["seat"],
            case["round"]
        );
    }
    for case in v["faultPools"].as_array().unwrap() {
        let bound = match &case["boundBefore"] {
            Value::String(_) => Some(i64::MIN),
            Value::Null => None,
            other => other.as_i64(),
        };
        assert_eq!(
            json!(credential_fault_pools(unit, bound)),
            case["pools"],
            "fault pools before {}",
            case["boundBefore"]
        );
    }
    for case in v["walkState"].as_array().unwrap() {
        let round = case["round"]
            .as_i64()
            .map_or_else(|| s(case, "round").unwrap().to_string(), |n| n.to_string());
        let got = walk_state_of(
            unit,
            s(case, "seat").unwrap(),
            &round,
            s(case, "assignmentId").unwrap(),
        );
        assert_eq!(
            got, case["result"],
            "walk state {}/{}/{}",
            case["seat"], case["round"], case["assignmentId"]
        );
    }
    assert_eq!(
        walk_state_of(&Value::Null, "producer", "1", "a1"),
        v["walkStateNoUnit"]
    );
}
