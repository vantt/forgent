//! The owning proofs of the native `fgos dispatch` reads: each against a copy of the Node-era record corpus, read
//! back field for field against what the Node use cases answered over the same copy
//! (`packages/execution/contracts/dispatch-subs/corpus.v1.json`, recorded by
//! `test/golden-recorders/dispatch-subs.recorder.mjs`), and the apply and watch paths against real files.

use super::observe::{show_run_at, watch_run};
use super::recover::{apply_params_of, recover_apply, recover_observe, ApplyParams};
use super::{inspect, reconcile, Answer};
use super::{probes, Flags, SubRequest};
use fgos_execution_engine::transport_round::inspection::{
    inspect_dispatch_runtime, InspectionOptions, RunsCache,
};
use fgos_host_runtime::CategorisedRefusal;
use fgos_run_supervisor::adopt::Verdict;
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, SystemTime};

static SERIAL: AtomicU64 = AtomicU64::new(0);

const CONTRACTS: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/execution/contracts"
);

/// A project whose `.fgos/assignments` holds the corpus samples at the ids their records name, every file with the
/// modification time the recorder gave it; removed when dropped.
struct Project(PathBuf);

impl Project {
    fn new(tag: &str) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "fgos-dispatch-subs-{tag}-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let dir = std::fs::canonicalize(&dir).unwrap();
        let vectors = vectors();
        let mtime =
            fgos_host_runtime::civil_time::parse_rfc3339_millis(vectors["mtime"].as_str().unwrap())
                .unwrap();
        let at = SystemTime::UNIX_EPOCH + Duration::from_millis(mtime as u64);
        for (sample, id) in vectors["samples"].as_object().unwrap() {
            copy_tree(
                &Path::new(CONTRACTS).join("corpus").join(sample),
                &dir.join(".fgos/assignments").join(id.as_str().unwrap()),
                at,
            );
        }
        Project(dir)
    }

    fn root(&self) -> &Path {
        &self.0
    }

    /// The adopt probe as the recorder's host answered it for each corpus attempt directory. Any other directory
    /// fails the test: a replay never asks this host's live probe, whose gate judgement depends on the host name and
    /// the pid namespace the test runs in.
    fn recorded_probe(&self) -> impl Fn(&Path) -> Value + '_ {
        let recorded = vectors()["probes"].clone();
        move |dir: &Path| {
            let key = dir
                .strip_prefix(&self.0)
                .unwrap_or_else(|_| panic!("probe asked outside the project: {}", dir.display()))
                .to_string_lossy()
                .replace('\\', "/");
            let line = recorded
                .get(&key)
                .unwrap_or_else(|| panic!("no recorded probe answer for {key}"));
            let root = self.0.to_string_lossy();
            serde_json::from_str(&line.to_string().replace("<ROOT>", &root)).unwrap()
        }
    }

    /// A value with this project's root written as the recorder's placeholder.
    fn normalized(&self, value: &Value) -> Value {
        let text = value.to_string();
        let root = serde_json::to_string(&self.0.to_string_lossy()).unwrap();
        let root = &root[1..root.len() - 1];
        serde_json::from_str(&text.replace(root, "<ROOT>")).unwrap()
    }
}

impl Drop for Project {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

fn copy_tree(from: &Path, to: &Path, mtime: SystemTime) {
    std::fs::create_dir_all(to).unwrap();
    for entry in std::fs::read_dir(from).unwrap().flatten() {
        let target = to.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_tree(&entry.path(), &target, mtime);
        } else {
            std::fs::copy(entry.path(), &target).unwrap();
            std::fs::File::options()
                .write(true)
                .open(&target)
                .unwrap()
                .set_modified(mtime)
                .unwrap();
        }
    }
}

/// The first place two values differ, as a JSON pointer with both sides; `None` when they are equal.
fn first_difference(got: &Value, want: &Value, at: &str) -> Option<String> {
    match (got, want) {
        (Value::Object(a), Value::Object(b)) => {
            for key in a.keys().chain(b.keys()) {
                let here = format!("{at}/{key}");
                match (a.get(key), b.get(key)) {
                    (Some(x), Some(y)) => {
                        if let Some(found) = first_difference(x, y, &here) {
                            return Some(found);
                        }
                    }
                    (x, y) => return Some(format!("{here}: got {x:?}, want {y:?}")),
                }
            }
            None
        }
        (Value::Array(a), Value::Array(b)) if a.len() == b.len() => a
            .iter()
            .zip(b)
            .enumerate()
            .find_map(|(i, (x, y))| first_difference(x, y, &format!("{at}/{i}"))),
        _ if got == want => None,
        _ => Some(format!("{at}: got {got}, want {want}")),
    }
}

fn assert_same(got: &Value, want: &Value, label: &str) {
    if let Some(found) = first_difference(got, want, "") {
        panic!("{label}: {found}");
    }
}

fn vectors() -> Value {
    let text =
        std::fs::read_to_string(Path::new(CONTRACTS).join("dispatch-subs/corpus.v1.json")).unwrap();
    serde_json::from_str(&text).unwrap()
}

fn now(vectors: &Value) -> String {
    vectors["now"].as_str().unwrap().to_owned()
}

/// What an answer reads as in a vector: `{ ok }` for data, `{ error: { category, message } }` for a refusal.
fn recorded(project: &Project, answered: Result<Answer, CategorisedRefusal>) -> Value {
    match answered {
        Ok(Answer::Json(value)) => json!({ "ok": project.normalized(&value) }),
        Ok(Answer::Verb(verb)) => json!({ "ok": project.normalized(&verb.data) }),
        Err(refusal) => json!({ "error": {
            "category": refusal.category,
            "message": project.normalized(&json!(refusal.message)),
        } }),
    }
}

/// The Node answer with only the fields a refusal carries across the CLI (its category and message).
fn expected(case: &Value) -> Value {
    match case["answer"].get("error") {
        Some(error) => {
            json!({ "error": { "category": error["category"], "message": error["message"] } })
        }
        None => case["answer"].clone(),
    }
}

fn cases<'a>(vectors: &'a Value, sub: &str) -> Vec<&'a Value> {
    vectors["cases"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|case| case["sub"] == sub)
        .collect()
}

#[test]
fn show_run_reads_every_corpus_run_as_the_node_use_case_did() {
    let project = Project::new("show-run");
    let vectors = vectors();
    let cases = cases(&vectors, "show-run");
    assert!(cases.len() >= 5);
    for case in cases {
        let run_id = case["runId"].as_str().unwrap();
        let got = recorded(
            &project,
            show_run_at(project.root(), run_id, &project.recorded_probe()),
        );
        assert_same(&got, &expected(case), &format!("show-run {run_id}"));
    }
}

#[test]
fn recover_recommends_for_every_corpus_run_as_the_node_use_case_did() {
    let project = Project::new("recover");
    let vectors = vectors();
    for case in cases(&vectors, "recover") {
        let run_id = case["runId"].as_str().unwrap();
        let intent = case["intent"].as_str().unwrap();
        let got = recorded(
            &project,
            recover_observe(
                project.root(),
                run_id,
                intent,
                &now(&vectors),
                &project.recorded_probe(),
            ),
        );
        assert_same(&got, &expected(case), &format!("recover {run_id} {intent}"));
    }
}

#[test]
fn inspect_reads_every_corpus_run_and_assignment_with_its_attempt_view_as_node_did() {
    let project = Project::new("inspect");
    let vectors = vectors();
    let stamp = now(&vectors);
    for case in cases(&vectors, "inspect") {
        let options = InspectionOptions {
            run: case["selector"]["run"].as_str().map(str::to_owned),
            assignment: case["selector"]["assignment"].as_str().map(str::to_owned),
            ..InspectionOptions::default()
        };
        let inspected = inspect_dispatch_runtime(
            project.root(),
            &options,
            &|| stamp.clone(),
            false,
            Some(&mut RunsCache::default()),
        )
        .unwrap();
        let got = inspect::with_attempt_view(project.root(), inspected, &project.recorded_probe());
        assert_same(
            &json!({ "ok": project.normalized(&got) }),
            &expected(case),
            &format!("inspect {}", case["selector"]),
        );
    }
}

#[test]
fn the_attention_view_reads_the_corpus_project_with_attempt_views_as_node_did() {
    let project = Project::new("attention");
    let vectors = vectors();
    let stamp = now(&vectors);
    let case = cases(&vectors, "attention")[0];
    let got = inspect::attention_at(
        project.root(),
        case["since"].as_str().unwrap(),
        &|| stamp.clone(),
        &project.recorded_probe(),
        None,
        &mut RunsCache::default(),
    )
    .unwrap();
    assert_same(
        &json!({ "ok": project.normalized(&Value::Object(got)) }),
        &expected(case),
        "attention",
    );
}

#[test]
fn reconcile_plans_every_corpus_run_as_the_node_planner_did() {
    let project = Project::new("reconcile");
    let vectors = vectors();
    for case in cases(&vectors, "reconcile") {
        let got = recorded(
            &project,
            reconcile::plan_at(
                project.root(),
                case["action"].as_str(),
                case["runId"].as_str(),
                project.root(),
                &now(&vectors),
            ),
        );
        // A plan's key hashes its snapshot, which names the run directory by its absolute path, so it differs with
        // the temporary root; the snapshot it binds is compared field for field.
        let without_key = |mut value: Value| {
            if let Some(plan) = value.get_mut("ok").and_then(Value::as_object_mut) {
                plan.remove("actionKey");
            }
            value
        };
        assert_same(
            &without_key(got),
            &without_key(expected(case)),
            &format!("reconcile {}", case["action"]),
        );
    }
}

#[test]
fn a_plan_naming_a_run_without_a_repair_action_is_refused_before_anything_is_read() {
    let project = Project::new("reconcile-refused");
    let refused = reconcile::plan_at(
        project.root(),
        None,
        Some("run_x"),
        project.root(),
        "2026-11-22T00:00:00.000Z",
    );
    let Err(refusal) = refused else {
        panic!("a run without an action must refuse");
    };
    assert_eq!(refusal.category, "validation");
    assert!(
        refusal.message.contains("requires --action"),
        "{}",
        refusal.message
    );
}

/// The open Node-era attempt's recommendation, from the observe path.
fn open_attempt_recommendation(project: &Project, now: &str) -> (String, Map<String, Value>) {
    let run_id = "run_unit-run-1794987012087-5f3337a8/producer/1_01";
    let Ok(Answer::Json(Value::Object(recommendation))) = recover_observe(
        project.root(),
        run_id,
        "resume",
        now,
        &project.recorded_probe(),
    ) else {
        panic!("the open attempt must give a recommendation");
    };
    assert_eq!(recommendation["kind"], "recommendation");
    (run_id.to_owned(), recommendation)
}

fn params_of(run_id: &str, recommendation: &Map<String, Value>) -> ApplyParams {
    ApplyParams {
        run_id: run_id.to_owned(),
        action: recommendation["action"].clone(),
        expected_snapshot: recommendation["snapshotHash"].as_str().unwrap().to_owned(),
        expected_control_epoch: recommendation["expectedControlEpoch"].clone(),
        expected_expires_at: recommendation["expiresAt"].as_str().unwrap().to_owned(),
        action_key: recommendation["actionKey"].as_str().unwrap().to_owned(),
    }
}

/// An adopt door a test does not expect to be reached.
fn no_adopt(dir: &Path) -> Verdict {
    panic!("the adopt door was reached for {}", dir.display())
}

/// An adopt door that answers `state` (with `outcome`, the step left pending and the reason).
fn adopt_answering(
    state: &'static str,
    outcome: Option<&str>,
    pending: Option<&str>,
    reason: Option<&str>,
) -> impl Fn(&Path) -> Verdict {
    let (outcome, pending, reason) = (
        outcome.map(str::to_owned),
        pending.map(str::to_owned),
        reason.map(str::to_owned),
    );
    move |_| Verdict {
        state,
        outcome: outcome.clone(),
        pending_step: pending.clone(),
        reason: reason.clone(),
        adoptable: None,
        gone: Vec::new(),
        lane: None,
    }
}

#[test]
fn an_apply_whose_expectations_no_longer_hold_is_stale_and_writes_nothing() {
    let project = Project::new("apply-stale");
    let now = "2026-11-22T12:00:00.000Z";
    let (run_id, recommendation) = open_attempt_recommendation(&project, now);
    let mut params = params_of(&run_id, &recommendation);
    params.expected_snapshot = "0".repeat(64);
    let Ok(Answer::Json(answer)) = recover_apply(
        project.root(),
        &params,
        now,
        &project.recorded_probe(),
        &no_adopt,
    ) else {
        panic!("a stale apply answers, it does not refuse");
    };
    assert_eq!(answer["outcome"], "plan-stale");
    let run_dir = PathBuf::from(answer["runDir"].as_str().unwrap());
    assert!(!run_dir.join("recovery-commands.jsonl").exists());
    let late = "2026-11-22T13:00:00.000Z";
    let params = params_of(&run_id, &recommendation);
    let Ok(Answer::Json(answer)) = recover_apply(
        project.root(),
        &params,
        late,
        &project.recorded_probe(),
        &no_adopt,
    ) else {
        panic!("an expired apply answers, it does not refuse");
    };
    assert_eq!(answer["outcome"], "plan-expired");
}

#[test]
fn an_apply_missing_an_expectation_or_naming_a_gone_run_refuses_with_the_node_wording() {
    let project = Project::new("apply-refused");
    let mut params = ApplyParams {
        run_id: "run_x".into(),
        action: Value::Null,
        expected_snapshot: "h".into(),
        expected_control_epoch: json!(0),
        expected_expires_at: String::new(),
        action_key: "k".into(),
    };
    let Err(refusal) = recover_apply(
        project.root(),
        &params,
        "2026-11-22T00:00:00.000Z",
        &project.recorded_probe(),
        &no_adopt,
    ) else {
        panic!("missing expectations refuse");
    };
    assert_eq!(refusal.category, "validation");
    assert!(
        refusal
            .message
            .ends_with("missing: action, expectedExpiresAt"),
        "{}",
        refusal.message
    );
    params.action = json!({ "type": "adopt" });
    params.expected_expires_at = "2026-11-22T00:05:00.000Z".into();
    let Err(refusal) = recover_apply(
        project.root(),
        &params,
        "2026-11-22T00:00:00.000Z",
        &project.recorded_probe(),
        &no_adopt,
    ) else {
        panic!("an unknown run refuses");
    };
    assert_eq!(refusal.category, "precondition");
    assert!(
        refusal.message.starts_with("no run \"run_x\" under "),
        "{}",
        refusal.message
    );
}

#[test]
fn a_consumed_action_key_returns_the_recorded_outcome_without_acting_again() {
    let project = Project::new("apply-replay");
    let now = "2026-11-22T12:00:00.000Z";
    let (run_id, recommendation) = open_attempt_recommendation(&project, now);
    let params = params_of(&run_id, &recommendation);
    let run_dir = PathBuf::from(recommendation["runDir"].as_str().unwrap());
    let record = json!({ "actionKey": params.action_key, "action": params.action, "appliedAt": now, "adoptState": "adopted" });
    std::fs::write(
        run_dir.join("recovery-commands.jsonl"),
        format!("{record}\n"),
    )
    .unwrap();
    let Ok(Answer::Json(answer)) = recover_apply(
        project.root(),
        &params,
        now,
        &project.recorded_probe(),
        &no_adopt,
    ) else {
        panic!("a replay answers");
    };
    assert_eq!(answer["outcome"], "already-applied");
    assert_eq!(answer["adoptState"], "adopted");
    let lines = std::fs::read_to_string(run_dir.join("recovery-commands.jsonl")).unwrap();
    assert_eq!(lines.lines().count(), 1);
}

#[test]
fn watch_stops_on_a_settled_run_and_spends_its_tick_budget_on_a_live_one() {
    let project = Project::new("watch");
    let assignments = project.root().join(".fgos/assignments");
    let settled = assignments.join("unit-run-1795056603528-44eb3ca1/producer/1/runs/01");
    let mut lines = Vec::new();
    let watched = watch_run(
        &settled,
        f64::INFINITY,
        &mut |tick| lines.push(tick.clone()),
        &mut || {},
    )
    .ok()
    .unwrap();
    assert_eq!((watched.ticks, watched.stopped_because), (1, "terminal"));
    let open = assignments.join("unit-run-1794987012087-5f3337a8/producer/1/runs/01");
    std::fs::write(open.join("stdout.log"), "one\r\ntwo\n\nthree\n").unwrap();
    let mut sleeps = 0;
    let watched = watch_run(&open, 3.0, &mut |_| {}, &mut || sleeps += 1)
        .ok()
        .unwrap();
    assert_eq!(
        (watched.ticks, watched.stopped_because, sleeps),
        (3, "tick-budget", 2)
    );
    assert_eq!(watched.snapshot["tail"], json!(["one", "two", "three"]));
}

#[test]
fn a_reconcile_plan_applies_once_under_the_repo_mutex_and_a_replay_is_stale() {
    let project = Project::new("reconcile-apply");
    let now = "2026-11-22T12:00:00.000Z";
    let run_id = "run_asgn_8e8e56bb_00a0_4158_ad04_ec29cabf8204_op_001_01";
    let Ok(Answer::Json(plan)) = reconcile::plan_at(
        project.root(),
        Some("collect-result"),
        Some(run_id),
        project.root(),
        now,
    ) else {
        panic!("a settled standalone run plans a collect");
    };
    assert_eq!(plan["outcome"], "planned");
    let Ok(Answer::Json(applied)) = reconcile::apply_at(project.root(), &plan, now) else {
        panic!("a fresh plan applies");
    };
    assert_eq!(applied["outcome"], "applied", "{applied}");
    assert!(project.root().join(".fgos/locks/reconcile.lock").exists());
    let Ok(Answer::Json(replayed)) = reconcile::apply_at(project.root(), &plan, now) else {
        panic!("a replay answers");
    };
    assert_ne!(replayed["outcome"], "applied", "{replayed}");
}

#[test]
fn the_replays_follow_the_recorded_probe_answer_not_the_host_they_run_on() {
    // The same corpus read with the open attempt's recorded answer swapped for a held gate: the recommendation
    // follows the answer it is handed, so nothing in a replay comes from this host's process facts.
    let project = Project::new("probe-swap");
    let recorded = project.recorded_probe();
    let held = |dir: &Path| {
        let mut line = recorded(dir);
        if line["state"] == "needs-adopt" {
            line = json!({ "v": 1, "protocol": 1, "attemptDir": dir, "state": "running", "reason": "gate-alive" });
        }
        line
    };
    let run_id = "run_unit-run-1794987012087-5f3337a8/producer/1_01";
    let Ok(Answer::Json(parked)) = recover_observe(
        project.root(),
        run_id,
        "resume",
        "2026-11-22T12:00:00.000Z",
        &held,
    ) else {
        panic!("a held attempt answers");
    };
    assert_ne!(parked["kind"], "recommendation", "{parked}");
    let Ok(Answer::Json(shown)) = show_run_at(project.root(), run_id, &held) else {
        panic!("show-run answers");
    };
    assert_eq!(shown["attemptState"], "running");
}

fn recovery_log(run_dir: &Path) -> Vec<Value> {
    std::fs::read_to_string(run_dir.join("recovery-commands.jsonl"))
        .unwrap_or_default()
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect()
}

#[test]
fn an_adopt_that_settles_the_attempt_writes_one_recovery_line_with_the_node_fields() {
    for (state, outcome) in [("adopted", Some("abandoned-crash")), ("closed", None)] {
        let project = Project::new("apply-applied");
        let now = "2026-11-22T12:00:00.000Z";
        let (run_id, recommendation) = open_attempt_recommendation(&project, now);
        let params = params_of(&run_id, &recommendation);
        let adopt = adopt_answering(state, outcome, None, None);
        let Ok(Answer::Json(answer)) = recover_apply(
            project.root(),
            &params,
            now,
            &project.recorded_probe(),
            &adopt,
        ) else {
            panic!("a fresh apply answers");
        };
        assert_eq!(answer["outcome"], "applied", "{answer}");
        let run_dir = PathBuf::from(answer["runDir"].as_str().unwrap());
        let mut expected = json!({
            "actionKey": params.action_key,
            "action": params.action,
            "appliedAt": now,
            "controlEpochBefore": params.expected_control_epoch,
            "controlEpochAfter": params.expected_control_epoch,
            "snapshotHash": params.expected_snapshot,
            "adoptState": state,
        });
        if let Some(outcome) = outcome {
            expected["adoptOutcome"] = json!(outcome);
        }
        assert_eq!(recovery_log(&run_dir), vec![expected.clone()]);
        for (key, value) in expected.as_object().unwrap() {
            assert_eq!(&answer[key], value, "{key}");
        }
    }
}

#[test]
fn an_adopt_that_leaves_the_attempt_open_or_held_writes_nothing() {
    for (state, outcome, reason) in [
        (
            "open",
            "adopt-incomplete",
            "adopt left the attempt open (step settle is not done): gate gone",
        ),
        (
            "running",
            "held",
            "adopt left the attempt running: gate-alive",
        ),
    ] {
        let project = Project::new("apply-incomplete");
        let now = "2026-11-22T12:00:00.000Z";
        let (run_id, recommendation) = open_attempt_recommendation(&project, now);
        let params = params_of(&run_id, &recommendation);
        let (pending, why) = if state == "open" {
            (Some("settle"), Some("gate gone"))
        } else {
            (None, Some("gate-alive"))
        };
        let adopt = adopt_answering(state, None, pending, why);
        let Ok(Answer::Json(answer)) = recover_apply(
            project.root(),
            &params,
            now,
            &project.recorded_probe(),
            &adopt,
        ) else {
            panic!("an incomplete adopt answers");
        };
        assert_eq!(
            (answer["outcome"].as_str(), answer["reason"].as_str()),
            (Some(outcome), Some(reason))
        );
        let run_dir = PathBuf::from(answer["runDir"].as_str().unwrap());
        assert!(recovery_log(&run_dir).is_empty());
    }
}

#[test]
fn an_adopt_of_a_run_a_coordination_session_owns_is_refused_before_any_lock() {
    let project = Project::new("apply-session");
    let now = "2026-11-22T12:00:00.000Z";
    let (run_id, recommendation) = open_attempt_recommendation(&project, now);
    let sessions = project.root().join(".fgos/coordination/sessions/cs-1");
    std::fs::create_dir_all(&sessions).unwrap();
    std::fs::write(
        sessions.join("session.json"),
        json!({ "assignmentRefs": ["unit-run-1794987012087-5f3337a8/producer/1"] }).to_string(),
    )
    .unwrap();
    let params = params_of(&run_id, &recommendation);
    let Err(refusal) = recover_apply(
        project.root(),
        &params,
        now,
        &project.recorded_probe(),
        &no_adopt,
    ) else {
        panic!("a session-owned run refuses");
    };
    assert_eq!(refusal.category, "validation");
    assert_eq!(refusal.message, format!("run \"{run_id}\" (assignment \"unit-run-1794987012087-5f3337a8/producer/1\") is owned by CoordinationSession \"cs-1\" -- adopt recovery belongs to that session's own recovery door (fgos coordination recover cs-1), not dispatch recover"));
    let run_dir = PathBuf::from(recommendation["runDir"].as_str().unwrap());
    assert!(!run_dir.join("locks").exists());
}

#[test]
fn an_apply_while_another_holds_the_run_recovery_lock_is_refused_as_busy() {
    let project = Project::new("apply-busy");
    let now = "2026-11-22T12:00:00.000Z";
    let (run_id, recommendation) = open_attempt_recommendation(&project, now);
    let run_dir = PathBuf::from(recommendation["runDir"].as_str().unwrap());
    let params_map = std::collections::BTreeMap::from([(
        "runDir".to_owned(),
        run_dir.to_string_lossy().into_owned(),
    )]);
    let mut holder = fgos_holder_lock::LockScope::seeded(Vec::new()).unwrap();
    holder
        .acquire("recovery", &params_map, fgos_holder_lock::Wait::Ms(0))
        .unwrap();
    let params = params_of(&run_id, &recommendation);
    let Err(refusal) = recover_apply(
        project.root(),
        &params,
        now,
        &project.recorded_probe(),
        &no_adopt,
    ) else {
        panic!("a held lock refuses");
    };
    assert_eq!(refusal.category, "validation");
    assert!(
        refusal
            .message
            .starts_with("a recovery apply is already in progress for this run ("),
        "{}",
        refusal.message
    );
    drop(holder);
    assert!(recovery_log(&run_dir).is_empty());
}

fn args(words: &[&str]) -> Vec<std::ffi::OsString> {
    words.iter().map(std::ffi::OsString::from).collect()
}

fn request_at(root: &Path, words: &[&str]) -> (SubRequest, Flags) {
    let args = args(words);
    (
        SubRequest {
            args: args.clone(),
            process_cwd: root.to_path_buf(),
            root: root.to_path_buf(),
            json: false,
        },
        Flags::of(&args),
    )
}

fn refusal_of(answered: Result<Answer, CategorisedRefusal>) -> (&'static str, String) {
    match answered {
        Err(refusal) => (refusal.category, refusal.message),
        Ok(_) => panic!("expected a refusal"),
    }
}

#[test]
fn recover_reads_its_action_and_expectations_and_refuses_an_epoch_that_is_no_number() {
    let flags = Flags::of(&args(&[
        "dispatch",
        "recover",
        "r",
        "--action",
        "{\"type\":\"adopt\"}",
        "--expected-snapshot",
        "h",
        "--expected-control-epoch",
        "2",
        "--expected-expires-at",
        "t",
        "--action-key",
        "k",
    ]));
    let params = apply_params_of(&flags, "r".into(), "{\"type\":\"adopt\"}")
        .ok()
        .unwrap();
    assert_eq!(params.action, json!({ "type": "adopt" }));
    assert_eq!(params.expected_control_epoch, json!(2));
    assert_eq!(
        (
            params.expected_snapshot.as_str(),
            params.expected_expires_at.as_str(),
            params.action_key.as_str()
        ),
        ("h", "t", "k")
    );
    for epoch in ["abc", "1.0", "1e0", ""] {
        let flags = Flags::of(&args(&[
            "dispatch",
            "recover",
            "r",
            "--action",
            "{}",
            "--expected-snapshot",
            "h",
            "--expected-control-epoch",
            epoch,
        ]));
        let Err(refusal) = apply_params_of(&flags, "r".into(), "{}") else {
            panic!("the epoch {epoch:?} must refuse");
        };
        let expected = if epoch.is_empty() {
            "dispatch recover --action requires --expected-control-epoch".to_owned()
        } else {
            format!("dispatch recover --expected-control-epoch must be an integer, got \"{epoch}\"")
        };
        assert_eq!(
            (refusal.category, refusal.message),
            ("validation", expected),
            "{epoch:?}"
        );
    }
    let flags = Flags::of(&args(&["dispatch", "recover", "r", "--action", "{}"]));
    let Err(refusal) = apply_params_of(&flags, "r".into(), "{}") else {
        panic!("a missing snapshot refuses");
    };
    assert_eq!(
        refusal.message,
        "dispatch recover --action requires --expected-snapshot"
    );
}

#[test]
fn reconcile_selects_its_mode_from_the_positionals() {
    let project = Project::new("reconcile-modes");
    let root = project.root();
    for (words, message) in [
        (&["dispatch", "reconcile", "apply"][..], "dispatch reconcile apply --plan must be valid JSON: dispatch reconcile apply requires --plan"),
        (&["dispatch", "reconcile", "bogus"][..], "dispatch reconcile expects plan or apply"),
        (&["dispatch", "reconcile", "provider-capacity", "bogus"][..], "dispatch reconcile expects plan or apply"),
        (&["dispatch", "reconcile", "provider-capacity", "quarantine"][..], "provider-capacity quarantine requires --provider"),
        (&["dispatch", "reconcile", "provider-capacity", "clear-quarantine", "--provider", "p"][..], "provider-capacity clear-quarantine requires --account"),
        (&["dispatch", "reconcile", "--run", "r"][..], fgos_execution_engine::planning::reconciliation::RECONCILE_RUN_REQUIRES_ACTION),
    ] {
        let (request, flags) = request_at(root, words);
        assert_eq!(refusal_of(reconcile::reconcile(&request, &flags)), ("validation", message.to_owned()), "{words:?}");
    }
    let (request, flags) = request_at(root, &["dispatch", "reconcile"]);
    let Ok(Answer::Json(planned)) = reconcile::reconcile(&request, &flags) else {
        panic!("a bare reconcile plans");
    };
    assert_eq!(planned["outcome"], "blocked");
}

#[test]
fn the_probes_refuse_a_malformed_call_before_any_config_is_read_or_seat_started() {
    let project = Project::new("probe-flags");
    let root = project.root();
    for (words, message) in [
        (&["dispatch", "probe-account"][..], "dispatch probe-account requires --provider <provider> --account <accountId>, or --all".to_owned()),
        (&["dispatch", "probe-account", "--all", "--account", "a", "--invocation", "x"][..], "dispatch probe-account --all probes every account and cannot be narrowed by --account, --invocation".to_owned()),
        (&["dispatch", "probe-account", "--all", "--leg", "both,"][..], "dispatch probe-account --leg must be one of direct, harness, both, got \"both,\"".to_owned()),
        (&["dispatch", "probe-account", "--all", "--timeout-ms", "0"][..], "--timeout-ms must be a positive integer (milliseconds), got \"0\"".to_owned()),
        (&["dispatch", "probe-session"][..], "dispatch probe-session requires an executor id: fgos dispatch probe-session <executorId> [--invocation <id>]".to_owned()),
    ] {
        let (request, flags) = request_at(root, words);
        let answered = if words[1] == "probe-session" {
            probes::probe_session(&request, &flags)
        } else {
            probes::probe_account(&request, &flags)
        };
        assert_eq!(refusal_of(answered), ("validation", message), "{words:?}");
    }
}

/// A scratch directory of attention definitions holding a copy of the shipped `head-gone` definition, and a store
/// root beside it.
fn definitions_scratch(tag: &str) -> (PathBuf, PathBuf) {
    let base = std::env::temp_dir().join(format!(
        "fgos-dispatch-subs-defs-{tag}-{}-{}",
        std::process::id(),
        SERIAL.fetch_add(1, Ordering::Relaxed)
    ));
    let (defs, store) = (base.join("definitions"), base.join("store"));
    std::fs::create_dir_all(&defs).unwrap();
    std::fs::create_dir_all(&store).unwrap();
    let shipped = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../core/attention/definitions/head-gone.query.json");
    std::fs::copy(shipped, defs.join("head-gone.query.json")).unwrap();
    (defs, store)
}

fn measured(answer: &Value) -> Vec<(String, Option<String>)> {
    answer["definitions"]
        .as_array()
        .unwrap_or_else(|| panic!("no definitions in {answer}"))
        .iter()
        .map(|d| {
            (
                d["name"].as_str().unwrap_or_default().to_owned(),
                d["unmeasured"].as_str().map(str::to_owned),
            )
        })
        .collect()
}

const SINCE: &str = "2026-11-01T00:00:00.000Z";
const NOW: &str = "2026-11-22T00:00:00.000Z";

#[test]
fn the_attention_definitions_reader_measures_a_definition_file_added_after_an_earlier_read() {
    let (defs, store) = definitions_scratch("added");
    let read = inspect::definitions_at(defs.clone(), store.clone());
    let names = |answer: &Value| {
        measured(answer)
            .into_iter()
            .map(|(n, _)| n)
            .collect::<Vec<_>>()
    };
    assert_eq!(names(&read(SINCE, NOW)), ["head-gone"]);
    let added = std::fs::read_to_string(defs.join("head-gone.query.json"))
        .unwrap()
        .replacen("\"head-gone\"", "\"head-gone-again\"", 1);
    std::fs::write(defs.join("head-gone-again.query.json"), added).unwrap();
    let mut second = names(&read(SINCE, NOW));
    second.sort();
    assert_eq!(
        second,
        ["head-gone", "head-gone-again"],
        "the next read measures the new file"
    );
    let _ = std::fs::remove_dir_all(defs.parent().unwrap());
}

#[test]
fn the_attention_definitions_reader_reports_a_definition_the_host_cannot_measure_beside_the_others()
{
    let (defs, store) = definitions_scratch("unmeasured");
    std::fs::write(
        defs.join("no-source.query.json"),
        json!({
            "name": "no-source",
            "requires": ["fgos.no-such.kind"],
            "window": "own",
            "query": { "since": "-30d", "kind": ["fgos.no-such.kind"], "agg": ["count"] },
            "row": { "kind": "no-source", "reason": "never measured", "nextCommand": "fgos doctor" },
        })
        .to_string(),
    )
    .unwrap();
    let read = inspect::definitions_at(defs.clone(), store);
    let answer = read(SINCE, NOW);
    let by_name = measured(&answer);
    let unmeasurable = by_name
        .iter()
        .find(|(name, _)| name == "no-source")
        .unwrap_or_else(|| panic!("no-source is listed: {answer}"));
    assert!(
        unmeasurable
            .1
            .as_deref()
            .is_some_and(|r| r.contains("fgos.no-such.kind")),
        "the reason names the kind it cannot read: {answer}"
    );
    let shipped = by_name
        .iter()
        .find(|(name, _)| name == "head-gone")
        .unwrap();
    assert_eq!(
        shipped.1, None,
        "the shipped definition is still measured: {answer}"
    );
    let _ = std::fs::remove_dir_all(defs.parent().unwrap());
}
