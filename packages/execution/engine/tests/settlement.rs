//! Settlement and the post-receipt steps replay the vectors the Node modules recorded
//! (`test/golden-recorders/settlement.recorder.mjs`): the files a settlement writes from a run directory, the
//! helpers around it, the three steps and the entry that runs them. Each scenario is a run directory built from
//! the recorded fixture files; the files Rust writes must be the bytes Node wrote, which is also what the previous
//! Node release reads back.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_execution_engine::settlement::evidence::find_mutated_dirty_before_files;
use fgos_execution_engine::settlement::{
    classify_evidence_to_outcome_facts, compute_changed_files, declare_report,
    is_substantive_report_text, settle_refused_lease, settle_run_outcome, AccountsFaultSink,
    EvidenceInput, FaultRecordInput, FrictionSink, GitDoor, LeaseRefusal, ProviderFaultSink,
    RefusedLease, SettleInput, SettlementGit, SettlementPorts,
};
use fgos_execution_engine::steps::{
    cleanup_trust, finalize_home, find_worker_claim, provider_stop_of,
    resolve_worker_artifact_path, run_attempt_step, settle_attempt, terminal_stop_message,
    watch_writes_outside_workspace, AttemptHomeFinalizer, ConfinementHomes, FinalizedHome,
    HomeState, PaneScreen, StepError, StepOutcome, StepPorts,
};
use fgos_run_supervisor::controller::lease::{
    acquire_run_control, build_run_control_holder, settle_run_control, AcquireOptions,
    AcquireOutcome,
};
use serde_json::{json, Value};

// ---- fixtures ----------------------------------------------------------------------------------------------

fn contracts() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/settlement")
}

fn vector(name: &str) -> Value {
    let text =
        std::fs::read_to_string(contracts().join(name)).unwrap_or_else(|e| panic!("{name}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{name}: {e}"))
}

fn scratch(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-settlement-{label}-{}-{}",
        std::process::id(),
        next_id()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn next_id() -> u64 {
    use std::sync::atomic::{AtomicU64, Ordering};
    static NEXT: AtomicU64 = AtomicU64::new(0);
    NEXT.fetch_add(1, Ordering::Relaxed)
}

/// A file tree `{relative/path: string | object}`; objects are written as pretty JSON with a trailing newline.
fn lay(dir: &Path, files: &Value) {
    for (rel, body) in files.as_object().into_iter().flatten() {
        let file = dir.join(rel);
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        let text = match body {
            Value::String(text) => text.clone(),
            other => format!("{}\n", serde_json::to_string_pretty(other).unwrap()),
        };
        std::fs::write(file, text).unwrap();
    }
}

fn strings(value: &Value) -> Vec<String> {
    value
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|v| v.as_str().map(str::to_string))
        .collect()
}

/// A checkout with nothing in it: settlement tests hand over the dirty paths themselves.
struct NoGit;
impl SettlementGit for NoGit {
    fn head(&self, _: &Path) -> Option<String> {
        None
    }
    fn status_files(&self, _: &Path) -> Vec<String> {
        Vec::new()
    }
    fn committed_diff_files(&self, _: &Path, _: &str, _: &str) -> Vec<String> {
        Vec::new()
    }
}
struct NoFaults;
impl ProviderFaultSink for NoFaults {
    fn record(&self, _: &FaultRecordInput<'_>, _: Option<&Path>) -> Option<Value> {
        None
    }
}
#[derive(Default)]
struct Frictions(std::sync::Mutex<Vec<String>>);
impl FrictionSink for Frictions {
    fn record(&self, _: &Path, input: fgos_observe::friction::FrictionInput) -> Result<(), String> {
        self.0
            .lock()
            .unwrap()
            .push(format!("{}:{}", input.layer, input.error_class));
        Ok(())
    }
}
struct NoPane;
impl PaneScreen for NoPane {
    fn visible_screen(&self, _: &Path, _: &Value) -> String {
        String::new()
    }
}
struct NoHomes;
impl AttemptHomeFinalizer for NoHomes {
    fn finalize(&self, _: &Path, _: &str) -> Result<FinalizedHome, StepError> {
        Err(StepError::new("internal", "no homes in this test"))
    }
}

fn token_free(text: &str, token: &str) -> String {
    text.replace(token, "<token>")
}

const KEPT: [&str; 6] = [
    "exit.json",
    "evidence.json",
    "result.json",
    "run.json",
    "stdout.log",
    "stderr.log",
];

fn harvest(run_dir: &Path, names: &[&str], token: &str) -> BTreeMap<String, String> {
    names
        .iter()
        .filter_map(|name| {
            std::fs::read_to_string(run_dir.join(name))
                .ok()
                .map(|text| ((*name).to_string(), token_free(&text, token)))
        })
        .collect()
}

fn expected_files(written: &Value) -> BTreeMap<String, String> {
    written
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
        .collect()
}

fn acquire(run_dir: &Path) -> (u64, String) {
    let outcome = acquire_run_control(
        run_dir,
        &AcquireOptions {
            holder: build_run_control_holder("settlement-test"),
            purpose: Some("recorder".into()),
            ..AcquireOptions::default()
        },
    )
    .unwrap();
    match outcome {
        AcquireOutcome::Acquired {
            control_epoch,
            control_token,
        } => (control_epoch, control_token),
        other => panic!("run control not acquired: {other:?}"),
    }
}

// ---- pure helpers --------------------------------------------------------------------------------------------

#[test]
fn report_text_is_substantive_the_way_node_judged_it() {
    for case in vector("pure.json")["substantiveReport"].as_array().unwrap() {
        let text = case["text"].as_str().unwrap();
        assert_eq!(
            is_substantive_report_text(text),
            case["out"].as_bool().unwrap(),
            "{text:?}"
        );
    }
}

#[test]
fn a_receipt_reason_names_the_provider_stop_node_named() {
    for case in vector("pure.json")["providerStop"].as_array().unwrap() {
        let got = provider_stop_of(&case["receipt"], case["claimed"].as_bool().unwrap()).map(|stop| {
            json!({"adapterOutcome": stop.adapter_outcome, "cause": stop.cause, "signal": stop.signal.unwrap_or(Value::Null)})
        });
        assert_eq!(got.unwrap_or(Value::Null), case["out"], "{case}");
    }
}

#[test]
fn a_terminal_stop_reads_to_a_person_as_node_worded_it() {
    for case in vector("pure.json")["terminalStopMessage"]
        .as_array()
        .unwrap()
    {
        assert_eq!(
            terminal_stop_message(&case["receipt"], case["screen"].as_str().unwrap()),
            case["out"].as_str().unwrap(),
            "{case}"
        );
    }
}

#[test]
fn the_worker_claim_and_report_are_found_by_round_number_and_directory_order() {
    for case in vector("pure.json")["workerArtifacts"].as_array().unwrap() {
        let dir = scratch("artifacts");
        let files: Value = case["files"]
            .as_array()
            .unwrap()
            .iter()
            .map(|f| (f.as_str().unwrap().to_string(), json!("{}")))
            .collect::<serde_json::Map<_, _>>()
            .into();
        lay(&dir, &files);
        let rel = |p: PathBuf| p.strip_prefix(&dir).unwrap().to_string_lossy().into_owned();
        let name = &case["name"];
        assert_eq!(
            rel(resolve_worker_artifact_path(
                &dir,
                "result-",
                ".json",
                "agent-result.json"
            )),
            case["result"].as_str().unwrap(),
            "{name}"
        );
        assert_eq!(
            rel(resolve_worker_artifact_path(
                &dir,
                "report-",
                ".md",
                "agent-report.md"
            )),
            case["report"].as_str().unwrap(),
            "{name}"
        );
        let claim = find_worker_claim(&dir).map(rel);
        assert_eq!(claim.as_deref(), case["claim"].as_str(), "{name}");
    }
}

#[test]
fn changed_files_are_the_new_dirt_sorted() {
    for case in vector("pure.json")["changedFiles"].as_array().unwrap() {
        let got = compute_changed_files(
            &NoGit,
            Path::new("."),
            Some("same"),
            Some("same"),
            &strings(&case["before"]),
            &strings(&case["after"]),
        );
        assert_eq!(json!(got.changed_files), case["out"]["changedFiles"]);
        assert_eq!(
            Value::Object(got.reasons),
            case["out"]["changedFileReasons"]
        );
    }
}

#[test]
fn a_pre_launch_dirty_file_that_changed_or_went_missing_is_mutated() {
    let case = &vector("pure.json")["mutatedDirtyBefore"];
    let dir = scratch("mutated");
    lay(&dir, &case["files"]);
    let snapshots = fgos_execution_engine::settlement::evidence::snapshots_of(&case["snapshots"]);
    assert_eq!(
        json!(find_mutated_dirty_before_files(&dir, &snapshots)),
        case["out"]
    );
}

#[test]
fn a_report_is_declared_complete_only_when_the_seat_finished_on_its_own() {
    let report = [json!({"path": "r.md", "sha256": "x"})];
    let claim = json!({"status": "done"});
    assert_eq!(
        declare_report(&[], Some(&claim), false, None),
        json!({"complete": false, "incompleteReason": "no-report"})
    );
    assert_eq!(
        declare_report(&report, Some(&claim), true, None)["incompleteReason"],
        "seat-did-not-finish"
    );
    assert_eq!(
        declare_report(&report, Some(&claim), false, Some("SIGKILL"))["incompleteReason"],
        "seat-did-not-finish"
    );
    assert_eq!(
        declare_report(&report, None, false, None)["incompleteReason"],
        "seat-did-not-finish"
    );
    assert_eq!(
        declare_report(&report, Some(&claim), false, None),
        json!({"complete": true, "incompleteReason": null})
    );
}

#[test]
fn a_failed_claim_with_a_report_from_a_reviewer_is_findings_not_a_failure() {
    let assignment = json!({"role": "reviewer"});
    let claim = json!({"status": "failed"});
    let facts = classify_evidence_to_outcome_facts(&EvidenceInput {
        exit_code: Some(0),
        signal: None,
        is_timeout: false,
        agent_claim: Some(&claim),
        claim_invalid: false,
        worker_artifacts: &["run/outbox/report-1.md".to_string()],
        changed_files: &[],
        edited_sync_conflicts: &[],
        is_read_only: true,
        attribution_refusal_code: None,
        role: Some("reviewer"),
        assignment: &assignment,
    });
    assert_eq!(
        (facts.exec_status, facts.verdict),
        ("completed", "findings")
    );
}

// ---- settlement ----------------------------------------------------------------------------------------------

fn run_settle(
    case: &Value,
) -> (
    PathBuf,
    Result<(), fgos_execution_engine::settlement::SettlementError>,
    u64,
    String,
) {
    let repo_root = scratch("settle");
    let run_dir = repo_root.join("run");
    std::fs::create_dir_all(&run_dir).unwrap();
    lay(&run_dir, &case["files"]);
    std::fs::write(
        run_dir.join("run.json"),
        format!(
            "{}\n",
            serde_json::to_string_pretty(&case["runMeta"]).unwrap()
        ),
    )
    .unwrap();
    let (epoch, token) = acquire(&run_dir);
    if case["preSettled"] == json!(true) {
        settle_run_control(&run_dir, epoch, &token, None).unwrap();
    }
    let args = &case["args"];
    let (epoch, token) = match (
        args.get("controlEpoch").and_then(Value::as_u64),
        args.get("controlToken").and_then(Value::as_str),
    ) {
        (Some(e), Some(t)) => (e, t.to_string()),
        _ => (epoch, token),
    };
    let text = |key: &str| args.get(key).and_then(Value::as_str);
    let list = |key: &str| strings(&args[key]);
    let dirty_before = list("dirtyBefore");
    let dirty_after = list("dirtyAfter");
    let model_warnings: Vec<Value> = args
        .get("modelWarnings")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let result_path: Option<Option<PathBuf>> = match args.get("agentResultPath") {
        None => None,
        Some(Value::Null) => Some(None),
        Some(path) => Some(Some(run_dir.join(path.as_str().unwrap()))),
    };
    let error = args.get("executionError").map(|e| {
        (
            e["message"].as_str().unwrap().to_string(),
            e.get("code").and_then(Value::as_str).map(str::to_string),
        )
    });
    let ports = SettlementPorts {
        git: &NoGit,
        faults: &NoFaults,
    };
    let input = SettleInput {
        run_dir: &run_dir,
        run_meta: &case["runMeta"],
        assignment: &case["assignment"],
        control_epoch: epoch,
        control_token: &token,
        exit_code: args["exitCode"].as_i64(),
        signal: text("signal"),
        is_timeout: args["isTimeout"].as_bool().unwrap_or(false),
        duration_ms: args["durationMs"].as_i64(),
        settled_at: text("settledAt").unwrap(),
        stdout_text: text("stdoutText").unwrap_or(""),
        stderr_text: text("stderrText").unwrap_or(""),
        effective_cwd: &repo_root,
        git_before: text("gitBefore"),
        git_before_source: "pre-launch",
        git_after: text("gitAfter"),
        dirty_before: &dirty_before,
        dirty_after: Some(&dirty_after),
        dirty_before_snapshots: None,
        input_digests: args.get("inputDigests"),
        resolved_executor_id: text("resolvedExecutorId"),
        effective_policy: args.get("effectivePolicy"),
        executor_redirected: args["executorRedirected"].as_bool().unwrap_or(false),
        reasoning_effort: args.get("reasoningEffort"),
        model_warnings: &model_warnings,
        provider_capacity_selection: None,
        provider_capacity_evidence: None,
        execution_error: error.as_ref().map(|(m, c)| (m.as_str(), c.as_deref())),
        launch_command_id: text("launchCommandId"),
        adapter_outcome: text("adapterOutcome"),
        provider_stop_cause: text("providerStopCause"),
        provider_signal: args.get("providerSignal"),
        agent_result_path: result_path.as_ref().map(|p| p.as_deref()),
        attestation: None,
        dispatch_warnings: &[],
        adapter: text("adapter").unwrap(),
        repo_root: Some(&repo_root),
        cwd: Some(&repo_root),
        provider_capacity_runtime_dir: None,
        update_run_json: Some("settled"),
    };
    let outcome = settle_run_outcome(&ports, &input).map(|_| ());
    (run_dir, outcome, epoch, token)
}

#[test]
fn every_settlement_scenario_writes_the_files_node_wrote() {
    let vectors = vector("settle.json");
    for case in vectors["settle"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let (run_dir, outcome, _, token) = run_settle(case);
        let mut names: Vec<&str> = KEPT.to_vec();
        if case["written"].get("result.superseded.json").is_some() {
            names.push("result.superseded.json");
        }
        match case["outcome"].get("error") {
            Some(error) => {
                let got = outcome.expect_err(name);
                assert_eq!(got.code, error["code"].as_str().unwrap(), "{name}");
                assert_eq!(got.message, error["message"].as_str().unwrap(), "{name}");
            }
            None => assert!(outcome.is_ok(), "{name}: {outcome:?}"),
        }
        let written = harvest(
            &run_dir,
            &names,
            if name == "superseded-controller" {
                "stale-token"
            } else {
                &token
            },
        );
        let expected = expected_files(&case["written"]);
        for (file, want) in &expected {
            assert_eq!(written.get(file), Some(want), "{name}: {file}");
        }
        assert_eq!(
            written.keys().collect::<Vec<_>>(),
            expected.keys().collect::<Vec<_>>(),
            "{name}: files written"
        );
    }
}

#[test]
fn settling_twice_leaves_the_first_result_standing() {
    let case = &vector("settle.json")["settle"][0];
    let (run_dir, outcome, epoch, token) = run_settle(case);
    assert!(outcome.is_ok());
    let before = std::fs::read(run_dir.join("result.json")).unwrap();
    // The same token on a finished settlement is the retry of a crash after the commit: it never rewrites.
    let again = fgos_execution_engine::settlement::commit_run_settlement(
        &run_dir,
        "run_a_01",
        epoch,
        &token,
        &serde_json::from_slice(&before).unwrap(),
    );
    assert!(again.is_ok(), "{again:?}");
    assert_eq!(std::fs::read(run_dir.join("result.json")).unwrap(), before);
}

#[test]
fn a_refused_lease_settles_as_a_provider_failure() {
    for case in vector("settle.json")["refused"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let repo_root = scratch("refused");
        let run_dir = repo_root.join("run");
        std::fs::create_dir_all(&run_dir).unwrap();
        std::fs::write(
            run_dir.join("run.json"),
            "{\n  \"runId\": \"run_a_01\",\n  \"status\": \"running\"\n}\n",
        )
        .unwrap();
        let refusal = &case["refusal"];
        let result = settle_refused_lease(&RefusedLease {
            refusal: LeaseRefusal {
                reason: refusal["reason"].as_str().unwrap(),
                detail: refusal.get("detail").and_then(Value::as_str),
            },
            provider: "codex",
            run_dir: &run_dir,
            run_id: "run_a_01",
            repo_root: &repo_root,
            assignment: &case["assignment"],
            executor_id: "codex-cli",
            policy: &case["policy"],
        })
        .unwrap_or_else(|e| panic!("{name}: {e}"));
        assert_eq!(
            std::fs::read_to_string(run_dir.join("stderr.log")).unwrap(),
            case["stderr"].as_str().unwrap(),
            "{name}"
        );
        assert_eq!(
            std::fs::read_to_string(run_dir.join("evidence.json")).unwrap(),
            case["evidence"].as_str().unwrap(),
            "{name}"
        );
        for key in [
            "runId",
            "assignmentId",
            "workId",
            "executorId",
            "role",
            "operation",
            "runtime",
            "classification",
        ] {
            assert_eq!(
                result.get(key).cloned().unwrap_or(Value::Null),
                case["resultFields"][key],
                "{name}: {key}"
            );
        }
    }
}

#[test]
fn a_refused_lease_that_was_settled_by_another_path_answers_with_that_result() {
    let case = &vector("settle.json")["refused"][0];
    let repo_root = scratch("refused-twice");
    let run_dir = repo_root.join("run");
    std::fs::create_dir_all(&run_dir).unwrap();
    std::fs::write(
        run_dir.join("run.json"),
        "{\n  \"runId\": \"run_a_01\",\n  \"status\": \"running\"\n}\n",
    )
    .unwrap();
    let ask = || RefusedLease {
        refusal: LeaseRefusal {
            reason: "provider-capacity.no-account",
            detail: None,
        },
        provider: "codex",
        run_dir: &run_dir,
        run_id: "run_a_01",
        repo_root: &repo_root,
        assignment: &case["assignment"],
        executor_id: "codex-cli",
        policy: &case["policy"],
    };
    let first = settle_refused_lease(&ask()).unwrap();
    let second = settle_refused_lease(&ask()).unwrap();
    assert_eq!(first["classification"], second["classification"]);
}

// ---- steps ---------------------------------------------------------------------------------------------------

#[test]
fn cleanup_trust_takes_back_only_what_the_controller_wrote() {
    for case in vector("steps.json")["cleanupTrust"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let run_dir = scratch("trust");
        let mut context = case["context"].clone();
        if let Some(object) = context.as_object_mut() {
            let store = object.remove("store");
            let target = object
                .get("target")
                .and_then(Value::as_str)
                .map(str::to_string);
            if let Some(rel) = target.as_deref().and_then(|t| t.strip_prefix("<run>/")) {
                object.insert("target".into(), json!(run_dir.join(rel).to_string_lossy()));
                if let Some(store) = store {
                    lay(&run_dir, &json!({ rel: store }));
                }
            }
        }
        if !context.is_null() {
            lay(&run_dir, &json!({"controller/trust-context.json": context}));
        }
        let step = cleanup_trust(&run_dir).unwrap();
        let StepOutcome::Done(detail) = step else {
            panic!("{name}: retry")
        };
        assert_eq!(detail, case["result"]["detail"], "{name}");
        for (rel, after) in case["storeAfter"].as_object().unwrap() {
            assert_eq!(
                std::fs::read_to_string(run_dir.join(rel)).unwrap(),
                after.as_str().unwrap(),
                "{name}: {rel}"
            );
        }
    }
}

fn attempt_fixture(case: &Value) -> (PathBuf, Value, String) {
    let repo_root = scratch("attempt");
    let run_dir = repo_root.join("attempt");
    let outbox_dir = run_dir.join("outbox");
    std::fs::create_dir_all(&run_dir).unwrap();
    lay(&outbox_dir, &case["outbox"]);
    let (epoch, token) = acquire(&run_dir);
    let mut files = serde_json::Map::new();
    let producer = json!({"assignmentId": "asgn_a", "workId": "w-1", "role": "producer", "operation": "edit", "mutation": "mutates-repo", "writes": ["src/**"]});
    files.insert("run.json".into(), case["runMeta"].clone());
    files.insert("assignment.json".into(), producer);
    let mut receipt = json!({"attemptId": "attempt-1"});
    receipt
        .as_object_mut()
        .unwrap()
        .extend(case["receipt"].as_object().unwrap().clone());
    files.insert("receipt.json".into(), receipt);
    files.insert(
        "side.json".into(),
        json!({"v": 1, "attemptId": "attempt-1", "controlEpoch": epoch, "controlToken": token}),
    );
    if case["noBaseline"] != json!(true) {
        files.insert(
            "controller/evaluator-baseline.json".into(),
            json!({"gitBefore": "aaa", "gitBeforeSource": "pre-launch", "dirtyBefore": []}),
        );
    }
    files.insert(
        "controller/settle-context.json".into(),
        json!({"repoRoot": repo_root.to_string_lossy(), "resolvedExecutorId": "claude"}),
    );
    files.insert("cap-out.log".into(), json!("captured stdout\n"));
    files.insert("cap-err.log".into(), json!(""));
    lay(&run_dir, &Value::Object(files));
    let envelope = json!({
        "v": 3, "attemptId": "attempt-1", "runDir": run_dir.to_string_lossy(), "cwd": repo_root.to_string_lossy(),
        "host": "direct", "sideFile": run_dir.join("side.json").to_string_lossy(),
        "launch": {"outboxDir": outbox_dir.to_string_lossy(), "capture": {"stdout": run_dir.join("cap-out.log").to_string_lossy(), "stderr": run_dir.join("cap-err.log").to_string_lossy()}},
        "steps": [{"stepId": "settle-attempt"}],
    });
    (run_dir, envelope, token)
}

fn step_json(result: Result<StepOutcome, StepError>) -> Value {
    match result {
        Ok(StepOutcome::Done(detail)) => json!({"result": "done", "detail": detail}),
        Ok(StepOutcome::Retry(reason)) => json!({"result": "retry", "reason": reason}),
        Err(err) => json!({"error": {"code": err.code, "message": err.message}}),
    }
}

#[test]
fn settle_attempt_settles_once_and_finds_its_receipt_on_a_second_run() {
    let friction = Frictions::default();
    let ports = StepPorts {
        git: &NoGit,
        faults: &NoFaults,
        friction: &friction,
        pane: &NoPane,
        finalizer: &NoHomes,
    };
    for case in vector("steps.json")["settleAttempt"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let (run_dir, envelope, token) = attempt_fixture(case);
        let first = step_json(settle_attempt(&run_dir, &envelope, &ports));
        let second = step_json(settle_attempt(&run_dir, &envelope, &ports));
        if case["first"].get("error").is_some() {
            assert_eq!(
                first["error"]["code"], case["first"]["error"]["code"],
                "{name}"
            );
            let want = case["first"]["error"]["message"].as_str().unwrap();
            let got = first["error"]["message"].as_str().unwrap();
            // The recorder's scratch path differs from this run's: compare the message up to its path.
            assert_eq!(
                got.split(" at ").next(),
                want.split(" at ").next(),
                "{name}"
            );
            assert_eq!(
                second["error"]["code"], case["second"]["error"]["code"],
                "{name}"
            );
            continue;
        }
        assert_eq!(
            token_free(&first.to_string(), &token),
            case["first"].to_string(),
            "{name}"
        );
        assert_eq!(second, case["second"], "{name}");
        let written = harvest(&run_dir, &KEPT, &token);
        for (file, want) in expected_files(&case["written"]) {
            assert_eq!(written.get(&file), Some(&want), "{name}: {file}");
        }
    }
}

#[test]
fn a_worker_friction_is_recorded_after_the_outcome_and_never_moves_it() {
    let friction = Frictions::default();
    let ports = StepPorts {
        git: &NoGit,
        faults: &NoFaults,
        friction: &friction,
        pane: &NoPane,
        finalizer: &NoHomes,
    };
    let claim = json!({"contract": {"id": "agent-result-claim", "version": 2}, "status": "done", "summary": "s",
        "frictions": [{"kind": "awkward", "layer": "cli", "errorClass": "slow-start", "detail": "d"}, {"layer": "-bad", "errorClass": "x"}, {"layer": "cli", "errorClass": "Not-Lower"}]});
    let case = json!({"receipt": {"outcome": "exited", "outboxResult": "result-1.json", "gateExit": {"exitCode": 0, "exitedAt": "2026-11-19T00:00:00.000Z"}},
        "outbox": {"result-1.json": claim}, "runMeta": {"runId": "run_a_01", "assignmentId": "asgn_a", "workId": "w-1", "executorId": "claude", "status": "running"}});
    let (run_dir, envelope, _) = attempt_fixture(&case);
    let first = step_json(settle_attempt(&run_dir, &envelope, &ports));
    assert_eq!(first["detail"]["settled"], "now");
    assert_eq!(
        *friction.0.lock().unwrap(),
        vec!["cli:slow-start".to_string()]
    );
}

#[test]
fn the_entry_answers_one_line_and_the_exit_code_the_host_route_expects() {
    let friction = Frictions::default();
    let ports = StepPorts {
        git: &NoGit,
        faults: &NoFaults,
        friction: &friction,
        pane: &NoPane,
        finalizer: &NoHomes,
    };
    let entry = &vector("steps.json")["entry"];
    for case in entry.as_array().unwrap() {
        let run_dir = scratch("entry");
        if case.get("noEnvelope").is_none() {
            lay(
                &run_dir,
                &json!({"envelope.json": {"v": 3, "attemptId": "a", "steps": [{"stepId": "cleanup-trust"}]}}),
            );
        }
        let env: BTreeMap<String, String> = case
            .get("env")
            .and_then(Value::as_object)
            .map(|o| {
                o.iter()
                    .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
                    .collect()
            })
            .unwrap_or_else(|| {
                [
                    ("FGOS_STATE_ROOT".to_string(), "/s".to_string()),
                    ("HOME".to_string(), "/h".to_string()),
                ]
                .into()
            });
        let run = run_attempt_step(case["stepId"].as_str().unwrap(), &run_dir, &env, &ports);
        assert_eq!(
            i64::from(run.exit),
            case["exit"].as_i64().unwrap(),
            "{case}"
        );
        assert_eq!(run.line, case["line"], "{case}");
    }
}

#[test]
fn a_stray_write_is_a_path_outside_the_workspace_that_became_dirty_during_the_round() {
    struct Dirty(std::sync::Mutex<Vec<String>>);
    impl SettlementGit for Dirty {
        fn head(&self, _: &Path) -> Option<String> {
            None
        }
        fn status_files(&self, _: &Path) -> Vec<String> {
            self.0.lock().unwrap().clone()
        }
        fn committed_diff_files(&self, _: &Path, _: &str, _: &str) -> Vec<String> {
            Vec::new()
        }
    }
    let repo = Path::new("/repo");
    let git = Dirty(std::sync::Mutex::new(vec![
        "old.txt".into(),
        "work/inside.txt".into(),
    ]));
    let watch = watch_writes_outside_workspace(&git, repo, Path::new("/repo/work"), None);
    assert!(watch.watching());
    assert_eq!(watch.before(), ["old.txt".to_string()]);
    git.0
        .lock()
        .unwrap()
        .extend(["new.txt".to_string(), "work/also-inside.txt".to_string()]);
    assert_eq!(watch.stray_paths(), vec!["new.txt".to_string()]);
    // A worker given the repo root itself has no outside to write to.
    let root_watch = watch_writes_outside_workspace(&git, repo, repo, None);
    assert!(!root_watch.watching());
    assert!(root_watch.stray_paths().is_empty());
}

#[test]
fn the_git_door_reads_nothing_from_a_directory_that_is_no_repository() {
    let state = scratch("state");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&state, std::fs::Permissions::from_mode(0o700)).unwrap();
    }
    let dir = scratch("not-a-repo");
    let door = GitDoor::new(&state).expect("git door opens on a state root");
    assert_eq!(door.head(&dir), None);
    assert!(door.status_files(&dir).is_empty());
    assert!(door.committed_diff_files(&dir, "a", "b").is_empty());
}

#[test]
fn a_dead_login_quarantines_the_account_that_ran_the_attempt_and_the_evidence_says_so() {
    let root = scratch("capacity");
    let (runtime, locks) = (root.join("runtime"), root.join("locks"));
    let run_dir = root.join("run");
    std::fs::create_dir_all(&run_dir).unwrap();
    let run_meta = json!({"runId": "run_a_01", "assignmentId": "asgn_a", "workId": "w-1", "status": "running"});
    std::fs::write(
        run_dir.join("run.json"),
        serde_json::to_string_pretty(&run_meta).unwrap(),
    )
    .unwrap();
    let (epoch, token) = acquire(&run_dir);
    let selection = json!({"status": "selected", "provider": "codex", "accountId": "acct1"});
    let evidence = json!({"contract": "provider-capacity-selection", "reasonCodes": ["selected"]});
    let signal = json!({"status": 401});
    let assignment = json!({"assignmentId": "asgn_a", "role": "producer", "operation": "edit", "mutation": "mutates-repo"});
    let faults = AccountsFaultSink::new(&locks);
    let ports = SettlementPorts {
        git: &NoGit,
        faults: &faults,
    };
    let input = SettleInput {
        run_dir: &run_dir,
        run_meta: &run_meta,
        assignment: &assignment,
        control_epoch: epoch,
        control_token: &token,
        exit_code: Some(1),
        signal: None,
        is_timeout: false,
        duration_ms: None,
        settled_at: "2026-11-19T00:00:00.000Z",
        stdout_text: "",
        stderr_text: "",
        effective_cwd: &root,
        git_before: None,
        git_before_source: "pre-launch",
        git_after: None,
        dirty_before: &[],
        dirty_after: Some(&[]),
        dirty_before_snapshots: None,
        input_digests: None,
        resolved_executor_id: None,
        effective_policy: None,
        executor_redirected: false,
        reasoning_effort: None,
        model_warnings: &[],
        provider_capacity_selection: Some(&selection),
        provider_capacity_evidence: Some(&evidence),
        execution_error: None,
        launch_command_id: None,
        adapter_outcome: Some("provider-limit"),
        provider_stop_cause: Some("credential"),
        provider_signal: Some(&signal),
        agent_result_path: None,
        attestation: None,
        dispatch_warnings: &[],
        adapter: "cli-spawn",
        repo_root: Some(&root),
        cwd: Some(&root),
        provider_capacity_runtime_dir: Some(&runtime),
        update_run_json: None,
    };
    settle_run_outcome(&ports, &input).unwrap();

    let evidence_json: Value =
        serde_json::from_str(&std::fs::read_to_string(run_dir.join("evidence.json")).unwrap())
            .unwrap();
    let recorded = &evidence_json["providerCapacity"];
    assert_eq!(
        (
            recorded["action"].as_str(),
            recorded["reasonCode"].as_str(),
            recorded["quarantineKind"].as_str()
        ),
        (Some("quarantine"), Some("auth-token"), Some("manual-clear"))
    );
    assert_eq!(recorded["quarantine"]["kind"], "manual-clear");
    let selection_file: Value = serde_json::from_str(
        &std::fs::read_to_string(run_dir.join("provider-capacity-selection.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(
        selection_file["reasonCodes"],
        json!(["selected", "auth-token"])
    );
    let state: Value =
        serde_json::from_str(&std::fs::read_to_string(runtime.join("state.json")).unwrap())
            .unwrap();
    assert_eq!(
        state["providers"]["codex"]["accounts"]["acct1"]["quarantine"]["kind"],
        "manual-clear"
    );
}

fn git(path: &Path, args: &[&str]) -> String {
    let out = std::process::Command::new("git")
        .arg("-C")
        .arg(path)
        .args([
            "-c",
            "user.name=Fixture",
            "-c",
            "user.email=fixture@example.invalid",
            "-c",
            "commit.gpgsign=false",
        ])
        .args(args)
        .output()
        .unwrap();
    assert!(
        out.status.success(),
        "{args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8(out.stdout).unwrap().trim().to_string()
}

#[test]
fn the_git_door_reads_head_dirt_and_the_committed_diff_of_a_real_checkout() {
    let state = scratch("state-real");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&state, std::fs::Permissions::from_mode(0o700)).unwrap();
    }
    let repo = std::fs::canonicalize(scratch("repo")).unwrap();
    git(&repo, &["init", "-q", "--initial-branch=trunk"]);
    std::fs::write(repo.join("a.txt"), "one\n").unwrap();
    git(&repo, &["add", "a.txt"]);
    git(&repo, &["commit", "-q", "-m", "first"]);
    let first = git(&repo, &["rev-parse", "HEAD"]);
    let door = GitDoor::new(&state).unwrap();
    assert_eq!(door.head(&repo).as_deref(), Some(first.as_str()));
    // Untracked files one by one; the store (`.fgos`) is never a change of the run.
    std::fs::create_dir_all(repo.join("sub")).unwrap();
    std::fs::write(repo.join("sub").join("b.txt"), "b\n").unwrap();
    std::fs::create_dir_all(repo.join(".fgos")).unwrap();
    std::fs::write(repo.join(".fgos").join("x"), "x\n").unwrap();
    assert_eq!(door.status_files(&repo), vec!["sub/b.txt".to_string()]);
    std::fs::write(repo.join("a.txt"), "two\n").unwrap();
    git(&repo, &["add", "a.txt"]);
    git(&repo, &["commit", "-q", "-m", "second"]);
    let second = git(&repo, &["rev-parse", "HEAD"]);
    assert_eq!(
        door.committed_diff_files(&repo, &first, &second),
        vec!["a.txt".to_string()]
    );
    assert!(door
        .committed_diff_files(&repo, &first, "no-such-ref")
        .is_empty());
    let changed = compute_changed_files(
        &door,
        &repo,
        Some(&first),
        Some(&second),
        &[],
        &["sub/b.txt".to_string()],
    );
    assert_eq!(
        changed.changed_files,
        vec!["a.txt".to_string(), "sub/b.txt".to_string()]
    );
}

struct Homes(Result<HomeState, &'static str>);
impl AttemptHomeFinalizer for Homes {
    fn finalize(&self, _: &Path, attempt_id: &str) -> Result<FinalizedHome, StepError> {
        assert_eq!(attempt_id, "attempt-1");
        let state = self
            .0
            .map_err(|code| StepError::new(code, "home of another attempt"))?;
        Ok(FinalizedHome {
            state,
            homes: 1,
            transcript_path: Some("protected/session".into()),
            home_layout: vec![json!({"name": ".codex"})],
            warnings: vec![],
        })
    }
}

#[test]
fn finalize_home_retries_a_kept_home_and_removes_the_side_file_only_once_the_home_is_done() {
    // The step's own decisions over what the Confinement Authority reports; the authority is a port here.
    let cases: [(&str, Result<HomeState, &str>, Value, bool); 4] = [
        (
            "kept",
            Ok(HomeState::CredentialHomeKept),
            json!({"result": "retry", "reason": "credential-home-kept"}),
            true,
        ),
        (
            "cleaned",
            Ok(HomeState::Cleaned),
            json!({"result": "done", "detail": {"homes": 1, "transcriptPath": "protected/session", "homeLayout": [{"name": ".codex"}], "warnings": []}}),
            false,
        ),
        (
            "held",
            Ok(HomeState::CredentialHomeHeld),
            json!({"result": "done", "detail": {"homes": 1, "transcriptPath": "protected/session", "homeLayout": [{"name": ".codex"}], "warnings": [], "outcome": "credential-home-held"}}),
            false,
        ),
        (
            "marker-mismatch",
            Err("home-marker-mismatch"),
            json!({"error": {"code": "home-marker-mismatch", "message": "home of another attempt"}}),
            true,
        ),
    ];
    for (name, state, want, side_stays) in cases {
        let run_dir = scratch("finalize-home");
        let side = run_dir.join("side.json");
        std::fs::write(&side, "{}").unwrap();
        let envelope = json!({"runDir": run_dir, "attemptId": "attempt-1", "sideFile": side});
        let first = step_json(finalize_home(&envelope, &Homes(state)));
        assert_eq!(first, want, "{name}");
        assert_eq!(side.exists(), side_stays, "{name}: side file");
        // Run again after a crash: a removed side file is no error.
        let again = step_json(finalize_home(&envelope, &Homes(state)));
        assert_eq!(again, want, "{name}: second run");
    }
    let refused = finalize_home(
        &json!({"attemptId": "attempt-1"}),
        &Homes(Ok(HomeState::Cleaned)),
    );
    assert_eq!(refused.unwrap_err().code, "envelope-invalid");
}

/// A real attempt home on disk: a pi login renewed inside it, an ownership marker of the attempt, the finalization
/// descriptor that names where the login goes back to, and the side file of the attempt.
struct RealHome {
    root: PathBuf,
    run_dir: PathBuf,
    home: PathBuf,
    side: PathBuf,
    pending: PathBuf,
}

fn real_home(label: &str, marker_attempt: &str) -> RealHome {
    use fgos_execution_engine::confinement::cleanup::write_ownership_marker_v2;
    let root = std::fs::canonicalize(scratch(label)).unwrap();
    let (run_dir, source, runtime) = (root.join("run"), root.join("source"), root.join("runtime"));
    let home = root.join("tmp").join("d1").join("h1");
    for dir in [&run_dir, &source, &home] {
        std::fs::create_dir_all(dir).unwrap();
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as f64;
    let login = |refresh: &str, expires: f64| {
        json!({ "openai-codex": { "type": "oauth", "access": "a", "refresh": refresh, "expires": expires } })
            .to_string()
    };
    std::fs::write(source.join("auth.json"), login("old", now + 3_600_000.0)).unwrap();
    std::fs::write(
        home.join("auth.json"),
        login("renewed", now + 8.0 * 3_600_000.0),
    )
    .unwrap();
    std::fs::create_dir_all(home.join("sessions")).unwrap();
    std::fs::write(home.join("sessions").join("s1.jsonl"), "{\"turn\":1}\n").unwrap();
    write_ownership_marker_v2(
        &home,
        Some(marker_attempt),
        Some(run_dir.to_str().unwrap()),
        Some("d1"),
        "private-home",
    )
    .unwrap();
    let target = json!({ "provider": "openai-codex", "accountId": "acct", "kind": "home-files", "home": source, "layout": "pi-auth-json", "runtimeDir": runtime });
    let descriptor = json!({ "contract": "confinement-finalization.v1", "cleanupState": "pending", "resources": [
        { "resourceId": "private-home", "pathRef": home, "sessionDir": "sessions", "credentialWriteBack": target }
    ] });
    let dir = run_dir.join("protected").join("confinement-finalization");
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("attempt-1.json"), descriptor.to_string()).unwrap();
    let side = run_dir.join("side.json");
    std::fs::write(&side, "{}").unwrap();
    let pending = runtime.join("account-locks/openai-codex/acct/pending");
    RealHome {
        root,
        run_dir,
        home,
        side,
        pending,
    }
}

#[test]
fn finalize_home_stages_a_renewed_login_keeps_the_session_and_removes_a_real_attempt_home() {
    use fgos_execution_engine::confinement::request::StageRenewedLogin;
    use fgos_execution_engine::credentials::{NoLocks, NoSqlite};
    let stage = StageRenewedLogin {
        sqlite: &NoSqlite,
        locks: &NoLocks,
    };
    let homes = ConfinementHomes { stage: &stage };
    let envelope =
        |h: &RealHome| json!({ "runDir": h.run_dir, "attemptId": "attempt-1", "sideFile": h.side });

    // The renewed login goes back beside the account's store, the session is kept, the home and side file go.
    let h = real_home("real-home-staged", "attempt-1");
    let done = step_json(finalize_home(&envelope(&h), &homes));
    assert_eq!(done["result"], "done", "{done}");
    assert_eq!(done["detail"]["homes"], 1);
    assert_eq!(done["detail"]["transcriptPath"], "protected/session");
    assert!(!h.home.exists() && !h.side.exists());
    assert!(h.run_dir.join("protected/session/s1.jsonl").exists());
    let staged: Vec<PathBuf> = std::fs::read_dir(&h.pending)
        .unwrap()
        .map(|e| e.unwrap().path())
        .collect();
    assert_eq!(staged.len(), 1);
    assert!(std::fs::read_to_string(staged[0].join("auth.json"))
        .unwrap()
        .contains("renewed"));
    let descriptor: Value = serde_json::from_str(
        &std::fs::read_to_string(
            h.run_dir
                .join("protected/confinement-finalization/attempt-1.json"),
        )
        .unwrap(),
    )
    .unwrap();
    assert_eq!(descriptor["cleanupState"], "cleaned");
    // Run again after a crash: nothing left to finalize, still done.
    assert_eq!(
        step_json(finalize_home(&envelope(&h), &homes))["result"],
        "done"
    );
    let _ = std::fs::remove_dir_all(&h.root);

    // Staging fails where no copy is safe yet: the home and side file stay and the step asks to be run again.
    let h = real_home("real-home-kept", "attempt-1");
    std::fs::create_dir_all(h.pending.parent().unwrap()).unwrap();
    std::fs::write(&h.pending, "not a directory").unwrap();
    let kept = step_json(finalize_home(&envelope(&h), &homes));
    assert_eq!(
        kept,
        json!({"result": "retry", "reason": "credential-home-kept"})
    );
    assert!(h.home.join("auth.json").exists() && h.side.exists());
    let record: Value = serde_json::from_str(
        &std::fs::read_to_string(h.home.parent().unwrap().join("attempt-home.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(record["credentialKept"]["attempts"], 1);
    let _ = std::fs::remove_dir_all(&h.root);

    // A home of another attempt is refused before anything is removed.
    let h = real_home("real-home-other", "attempt-2");
    let refused = step_json(finalize_home(&envelope(&h), &homes));
    assert_eq!(refused["error"]["code"], "internal");
    assert!(refused["error"]["message"]
        .as_str()
        .unwrap()
        .starts_with("home-marker-mismatch: "));
    assert!(h.home.join("auth.json").exists() && h.side.exists());
    let _ = std::fs::remove_dir_all(&h.root);
}
