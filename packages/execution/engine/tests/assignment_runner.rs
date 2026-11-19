//! The assignment runner replays the vectors recorded from the Node modules it ports
//! (`packages/execution/contracts/assignment-runner/`, recorded by
//! `test/golden-recorders/assignment-runner.recorder.mjs`), and proves the decisions Node's tests never pinned
//! against fakes (the attempt's give-back order, the resumed run, the handover of the attempt lock to a supervisor).

use std::cell::RefCell;
use std::path::{Path, PathBuf};

use fgos_execution::bind::{seat_config_digest, BindSession};
use fgos_execution::decide::CheckoutFacts;
use fgos_execution::ports::Machine;
use fgos_execution_engine::assignment_runner::attempt::*;
use fgos_execution_engine::assignment_runner::execute::*;
use fgos_execution_engine::assignment_runner::inputs::*;
use fgos_execution_engine::assignment_runner::lease::*;
use fgos_execution_engine::assignment_runner::legality::*;
use fgos_execution_engine::assignment_runner::outcome::*;
use fgos_execution_engine::assignment_runner::seat::{CommandAsk, PaneAsk, PaneSeat, SeatPorts};
use fgos_execution_engine::assignment_runner::terminal_args::*;
use fgos_execution_engine::assignment_runner::RunnerConfigError;
use fgos_run_supervisor::adopt::Verdict;
use fgos_run_supervisor::controller::launch::{lane_transport, LaneSettings};
use serde_json::{json, Map, Value};

fn vectors(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/assignment-runner")
        .join(name);
    serde_json::from_str(
        &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn scratch(tag: &str) -> PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static N: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!(
        "fgos-assignment-runner-{tag}-{}-{}",
        std::process::id(),
        N.fetch_add(1, Ordering::SeqCst)
    ));
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::canonicalize(&dir).unwrap()
}

/// A vector's `$ROOT` is the scratch directory the test rebuilds the same layout in.
fn rooted(value: &Value, root: &Path) -> Value {
    serde_json::from_str(&value.to_string().replace("$ROOT", &root.to_string_lossy())).unwrap()
}

fn unrooted(value: &Value, root: &Path) -> Value {
    serde_json::from_str(&value.to_string().replace(&*root.to_string_lossy(), "$ROOT")).unwrap()
}

// ---- legality ----------------------------------------------------------------------------------------------

struct NoCheckout;
impl CheckoutFacts for NoCheckout {
    fn repo_root(&self, _: &str) -> Result<String, String> {
        Err("no checkout".into())
    }
    fn main_checkout_root(&self, _: &str) -> Option<String> {
        None
    }
}

struct FakeCheckout {
    main: String,
    root: Option<String>,
}
impl CheckoutFacts for FakeCheckout {
    fn repo_root(&self, _: &str) -> Result<String, String> {
        self.root.clone().ok_or_else(|| "toplevel unknown".into())
    }
    fn main_checkout_root(&self, _: &str) -> Option<String> {
        Some(self.main.clone())
    }
}

struct NoMachine;
impl Machine for NoMachine {
    fn on_path(&self, _: &str) -> bool {
        false
    }
    fn posture_backend(&self, _: &str) -> Option<fgos_execution::ports::Backend> {
        None
    }
    fn herdr_present(&self) -> bool {
        false
    }
    fn home_dir(&self) -> Option<String> {
        None
    }
}

fn check(
    assignment: &Value,
    options: &LegalityOptions<'_>,
    checkout: &dyn CheckoutFacts,
    config: &Value,
) -> Result<(), RunnerConfigError> {
    let load = |_: &Path| Ok(config.clone());
    let fgos_dir = |root: &Path| root.join(".fgos");
    validate_assignment_legality(
        assignment,
        options,
        &LegalityFacts {
            checkout,
            machine: &NoMachine,
            load_runner_config: &load,
            fgos_dir_of_root: &fgos_dir,
        },
    )
}

#[test]
fn every_legality_refusal_reads_as_node_stated_it() {
    let doc = vectors("legality.v1.json");
    let root = scratch("legality");
    let main = root.join("main");
    for case in doc["cases"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let assignment = rooted(&case["assignment"], &root);
        let options = rooted(&case["options"], &root);
        let operations = options.get("operations").and_then(Value::as_array).cloned();
        let cwd = options
            .get("cwd")
            .and_then(Value::as_str)
            .map(str::to_string);
        let read_only_mode = options.get("isReadOnlyMode").and_then(Value::as_bool);
        std::fs::create_dir_all(main.join(".fgos/assignments/unit-run-1")).unwrap();
        let result = check(
            &assignment,
            &LegalityOptions {
                operations: operations.as_deref(),
                is_read_only_mode: read_only_mode,
                cwd: cwd.as_deref(),
                repo_root: Some(&main),
                ..Default::default()
            },
            &NoCheckout,
            &json!({}),
        );
        let got = match result {
            Ok(()) => json!({ "ok": null }),
            Err(error) => {
                let mut error = error.to_json();
                error["message"] = unrooted(&error["message"], &root);
                json!({ "error": error })
            }
        };
        assert_eq!(got, case["result"], "{name}");
    }
}

/// The checkout facts Node's Git gave for a case's cwd, as its vector recorded them.
struct RecordedCheckout {
    repo_root: Option<String>,
    main_checkout_root: Option<String>,
}
impl CheckoutFacts for RecordedCheckout {
    fn repo_root(&self, _: &str) -> Result<String, String> {
        self.repo_root
            .clone()
            .ok_or_else(|| "not a git checkout".into())
    }
    fn main_checkout_root(&self, _: &str) -> Option<String> {
        self.main_checkout_root.clone()
    }
}

#[test]
fn every_git_half_refusal_of_a_mutating_unit_run_reads_as_node_stated_it() {
    let doc = vectors("legality.v1.json");
    let root = scratch("legality-git");
    for dir in [
        "git/main/.fgos/assignments/unit-run-1",
        "git/linked",
        "git/outside",
    ] {
        std::fs::create_dir_all(root.join(dir)).unwrap();
    }
    let cases = doc["gitCases"].as_array().unwrap();
    assert!(!cases.is_empty());
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let assignment = rooted(&case["assignment"], &root);
        let options = rooted(&case["options"], &root);
        let facts = rooted(&case["checkout"], &root);
        std::fs::write(
            root.join("git/main/.fgos/assignments/unit-run-1/unit.json"),
            rooted(&case["unitJson"], &root).to_string(),
        )
        .unwrap();
        let checkout = RecordedCheckout {
            repo_root: facts["repoRoot"].as_str().map(str::to_string),
            main_checkout_root: facts["mainCheckoutRoot"].as_str().map(str::to_string),
        };
        let repo_root = PathBuf::from(options["repoRoot"].as_str().unwrap());
        let result = check(
            &assignment,
            &LegalityOptions {
                is_read_only_mode: options["isReadOnlyMode"].as_bool(),
                cwd: options["cwd"].as_str(),
                repo_root: Some(&repo_root),
                committed_runner_config: options.get("committedRunnerConfig"),
                session: BindSession::default(),
                ..Default::default()
            },
            &checkout,
            &json!({}),
        );
        let got = match result {
            Ok(()) => json!({ "ok": null }),
            Err(error) => {
                let mut error = error.to_json();
                error["message"] = unrooted(&error["message"], &root);
                json!({ "error": error })
            }
        };
        assert_eq!(got, case["result"], "{name}");
    }
}

/// The one posture Git cannot be made to give a recorder: a checkout whose main root is known but whose toplevel
/// is not. Node's message for it is read from `resolveMutatingCwdPosture`'s caller.
#[test]
fn a_mutating_unit_run_whose_toplevel_cannot_be_resolved_fails_closed() {
    let root = scratch("posture");
    let main = root.join("main");
    let linked = root.join("linked");
    std::fs::create_dir_all(main.join(".fgos/assignments/unit-run-1")).unwrap();
    std::fs::create_dir_all(&linked).unwrap();
    std::fs::write(
        main.join(".fgos/assignments/unit-run-1/unit.json"),
        json!({ "worktree": linked }).to_string(),
    )
    .unwrap();
    let assignment = json!({
        "assignmentId": "unit-run-1/producer/1", "role": "producer", "round": 1, "mutation": "mutating",
        "provenance": { "kind": "unit-run", "seat": "producer", "unitRunId": "unit-run-1" },
        "binding": { "executor": "a", "tier": "standard", "posture": "workspace-write" },
    });
    let unresolved = RecordedCheckout {
        repo_root: None,
        main_checkout_root: Some(main.to_string_lossy().into()),
    };
    let error = check(
        &assignment,
        &LegalityOptions {
            is_read_only_mode: Some(false),
            cwd: Some(&linked.to_string_lossy()),
            repo_root: Some(&main),
            ..Default::default()
        },
        &unresolved,
        &json!({}),
    )
    .unwrap_err();
    assert!(
        error
            .message
            .contains("toplevel could not be resolved; fail closed, never fail open"),
        "{error}"
    );
}

#[test]
fn the_replay_digest_is_the_bytes_node_recorded() {
    let doc = vectors("replay-digest.v1.json");
    for case in doc["cases"].as_array().unwrap() {
        assert_eq!(
            seat_config_digest(&case["runnerConfig"]),
            case["digest"].as_str().unwrap(),
            "{}",
            case["runnerConfig"]
        );
    }
}

// ---- lanes -------------------------------------------------------------------------------------------------

#[test]
fn the_envelope_lanes_field_is_present_at_depth_zero_only() {
    let doc = vectors("lanes.v1.json");
    for case in doc["cases"].as_array().unwrap() {
        let lanes = case["lanes"].as_object().map(|l| LaneSettings {
            ceiling: l.get("ceiling").and_then(Value::as_u64),
            lane_wait_sec: l["laneWaitSec"].as_u64().unwrap(),
        });
        let got =
            lane_transport(lanes.as_ref(), case["depth"].as_u64().unwrap()).unwrap_or(Value::Null);
        assert_eq!(got, case["lanesField"], "{case}");
    }
}

// ---- terminal args -----------------------------------------------------------------------------------------

fn terminal_rig() -> PathBuf {
    let root = scratch("terminal");
    std::fs::create_dir_all(root.join("unit/runs/01")).unwrap();
    std::fs::create_dir_all(root.join("unit/inputs")).unwrap();
    std::fs::create_dir_all(root.join("sibling")).unwrap();
    std::fs::write(root.join("sibling/report.md"), "r").unwrap();
    let refs = json!([
        root.join("sibling/report.md"),
        "relative.md",
        root.join("missing.md")
    ]);
    std::fs::write(
        root.join("unit/assignment.json"),
        json!({ "contextRefs": refs }).to_string(),
    )
    .unwrap();
    root
}

fn strings(value: &Value) -> Vec<String> {
    value
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap().to_string())
        .collect()
}

#[test]
fn the_argv_an_agent_starts_with_is_the_one_node_built() {
    let doc = vectors("terminal-args.v1.json");
    let root = terminal_rig();
    for case in doc["cases"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        if let Some(input) = case.get("input") {
            let input = rooted(input, &root);
            let case_context = input["caseContext"].as_object().map(|c| {
                (
                    c["caseId"].as_str().unwrap().to_string(),
                    c["reservationId"].as_str().unwrap().to_string(),
                )
            });
            let run_dir = PathBuf::from(input["runDir"].as_str().unwrap());
            let got = terminal_agent_args(&TerminalArgs {
                resolved_cmd: &input["resolvedCmd"],
                prompt: input["prompt"].as_str().unwrap(),
                model: input["model"].as_str().unwrap(),
                run_dir: &run_dir,
                writer_id: input["writerId"].as_str().unwrap(),
                case_context: case_context.as_ref().map(|(c, r)| CaseContext {
                    case_id: c,
                    reservation_id: r,
                }),
            });
            assert_eq!(unrooted(&json!(got), &root), case["args"], "{name}");
            assert_eq!(
                terminal_prompt_delivery(&input["resolvedCmd"]),
                case["delivery"].as_str().unwrap(),
                "{name}"
            );
        } else {
            let input = rooted(&case["accessInput"], &root);
            let args = strings(&input["args"]);
            let command = input["command"].as_str().unwrap_or_default().to_string();
            let outbox = input["outboxDir"].as_str().map(PathBuf::from);
            let run_dir = input["runDir"].as_str().map(PathBuf::from);
            let access = if input["adapter"] == "cli-spawn" {
                RunDirAccess::CliSpawn {
                    command: &command,
                    outbox_dir: outbox.as_deref(),
                }
            } else {
                RunDirAccess::HerdrSpawn {
                    interactive_kind: input["interactiveMode"]["kind"].as_str(),
                    run_dir: run_dir.as_deref(),
                }
            };
            let got = with_run_dir_access(&args, &access);
            assert_eq!(unrooted(&json!(got), &root), case["args"], "{name}");
        }
    }
    for case in doc["addDirs"].as_array().unwrap() {
        assert_eq!(
            json!(add_dirs_of(&strings(&case["argv"]))),
            case["dirs"],
            "{}",
            case["argv"]
        );
    }
}

// ---- inputs ------------------------------------------------------------------------------------------------

struct OnlyMain;
impl CheckoutRoots for OnlyMain {
    fn allowed_roots(&self, main_root: &Path) -> Vec<PathBuf> {
        vec![std::fs::canonicalize(main_root).unwrap()]
    }
}

#[test]
fn a_pinned_input_is_hashed_only_inside_an_allowed_root() {
    let doc = vectors("inputs.v1.json");
    let root = scratch("pins");
    let main = root.join("main");
    std::fs::create_dir_all(main.join("adir")).unwrap();
    std::fs::create_dir_all(root.join("linked/sub")).unwrap();
    std::fs::write(main.join("plan.md"), "plan body").unwrap();
    std::fs::write(root.join("outside.md"), "outside").unwrap();
    std::fs::write(root.join("linked/sub/doc.md"), "linked doc").unwrap();
    assert_eq!(doc["roots"], json!(["$ROOT/main"]));
    for case in doc["pins"].as_array().unwrap() {
        let pins: Vec<String> = strings(&rooted(&case["pins"], &root));
        let got = digest_pinned_inputs(&pins, &main, &OnlyMain);
        assert_eq!(
            unrooted(&json!(got), &root),
            case["digests"],
            "{}",
            case["name"]
        );
    }
}

#[test]
fn a_file_dirty_before_the_launch_is_recorded_with_its_hash_or_its_absence() {
    let doc = vectors("inputs.v1.json");
    let root = scratch("dirty");
    for (name, body) in doc["snapshots"]["files"].as_object().unwrap() {
        std::fs::write(root.join(name), body.as_str().unwrap()).unwrap();
    }
    let dirty = strings(&doc["snapshots"]["dirtyBefore"]);
    let got = snapshot_dirty_before_files(&root, &dirty);
    let got: Map<String, Value> = got
        .into_iter()
        .map(|(path, s)| (path, json!({ "exists": s.exists, "hash": s.hash })))
        .collect();
    assert_eq!(Value::Object(got), doc["snapshots"]["result"]);
}

#[test]
fn the_evaluator_baseline_names_its_digest_and_is_published_once() {
    let root = scratch("baseline");
    let dirty = vec!["a.txt".to_string()];
    let snaps = vec![(
        "a.txt".to_string(),
        DirtySnapshot {
            hash: Some("h".into()),
            exists: true,
        },
    )];
    let baseline = Baseline {
        run_dir: &root,
        run_id: "run_x_01",
        assignment_id: "x",
        cwd: "/c",
        git_before: Some("abc"),
        dirty_before: &dirty,
        dirty_before_snapshots: &snaps,
        captured_at: Some("2026-11-19T00:00:00.000Z"),
    };
    let digest = publish_evaluator_baseline(&baseline).unwrap();
    let written: Value = serde_json::from_str(
        &std::fs::read_to_string(root.join("controller/evaluator-baseline.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(written["digest"], json!(digest));
    assert_eq!(written["contract"], "evaluator-baseline.v1");
    assert_eq!(
        written["dirtyBeforeSnapshots"]["a.txt"],
        json!({ "exists": true, "sha256": "h" })
    );
    assert_eq!(
        evaluator_baseline_body(&baseline)["gitBeforeSource"],
        "pre-launch"
    );
    // A baseline already published stands.
    let again = publish_evaluator_baseline(&Baseline {
        git_before: Some("other"),
        ..baseline
    })
    .unwrap();
    assert_ne!(again, digest);
    let still: Value = serde_json::from_str(
        &std::fs::read_to_string(root.join("controller/evaluator-baseline.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(still["gitBefore"], "abc");
}

// ---- lease -------------------------------------------------------------------------------------------------

fn lease_cfg() -> Value {
    json!({
        "executor": { "kind": "agent", "command": "claude" },
        "executors": {
            "multi": { "kind": "agent", "invocations": [
                { "id": "one", "via": "cli", "command": "/usr/bin/codex", "credentialStore": { "use": "codex" } },
                { "id": "two", "via": "cli", "command": "claude" },
                { "id": "api", "via": "http" },
                { "id": "three", "via": "cli", "command": "claude" },
            ] },
            "plain": { "kind": "agent", "command": "agy" },
        },
    })
}

#[test]
fn the_login_stores_a_launch_may_read_follow_the_pinned_invocation_then_declaration_order() {
    let cfg = lease_cfg();
    assert_eq!(
        launch_candidate_clis(&cfg, "multi", None),
        ["codex", "claude"]
    );
    assert_eq!(
        launch_candidate_clis(&cfg, "multi", Some("two")),
        ["claude"]
    );
    assert_eq!(
        launch_candidate_clis(&cfg, "multi", Some("unknown")),
        ["codex", "claude"]
    );
    assert_eq!(launch_candidate_clis(&cfg, "plain", None), ["agy"]);
    assert_eq!(launch_candidate_clis(&cfg, "missing", None), ["claude"]);
    assert_eq!(
        declared_store_cli(&cfg, "multi", None).as_deref(),
        Some("codex")
    );
    assert_eq!(declared_store_cli(&cfg, "multi", Some("two")), None);
    assert_eq!(declared_store_cli(&cfg, "plain", None), None);
}

struct Renewals(RefCell<Vec<String>>, bool);
impl CredentialRenewal for Renewals {
    fn renew(&self, ask: &RenewAsk<'_>) -> Result<Option<Value>, String> {
        self.0.borrow_mut().push(format!(
            "{}/{}:{}:{}",
            ask.provider,
            ask.account_id,
            ask.credential_source["cli"].as_str().unwrap_or("-"),
            ask.runtime_dir.display()
        ));
        if self.1 {
            Err("renewal broke".into())
        } else {
            Ok(Some(json!({ "status": "fresh", "reason": "not-due" })))
        }
    }
}

fn selected() -> Value {
    json!({
        "status": "selected", "provider": "openai", "accountId": "a1",
        "credentialSources": { "codex": { "cli": "codex", "path": "/h/codex" }, "claude": { "cli": "claude", "path": "/h/claude" } },
    })
}

#[test]
fn a_login_is_renewed_only_when_the_caller_opted_in_and_the_launch_may_copy_it() {
    let cfg = lease_cfg();
    let dir = Path::new("/rt");
    let renewals = Renewals(RefCell::new(Vec::new()), false);
    // No renewal given, or an unconfined launch of an unconfined executor: the lease is what it was.
    assert_eq!(
        renew_leased_login(
            &selected(),
            None,
            &cfg,
            "multi",
            None,
            Some("confined"),
            Some(dir)
        ),
        selected()
    );
    assert_eq!(
        renew_leased_login(
            &selected(),
            Some(&renewals),
            &cfg,
            "multi",
            None,
            Some("unconfined"),
            Some(dir)
        ),
        selected()
    );
    assert!(renewals.0.borrow().is_empty());
    // A refused selection is never renewed.
    let refused = json!({ "status": "refused", "provider": "openai" });
    assert_eq!(
        renew_leased_login(
            &refused,
            Some(&renewals),
            &cfg,
            "multi",
            None,
            Some("confined"),
            Some(dir)
        ),
        refused
    );

    // A confined launch renews the store of each CLI it may still run, in declaration order, and carries the opt-in.
    let renewed = renew_leased_login(
        &selected(),
        Some(&renewals),
        &cfg,
        "multi",
        None,
        Some("confined"),
        Some(dir),
    );
    assert_eq!(
        renewals.0.borrow().as_slice(),
        ["openai/a1:codex:/rt", "openai/a1:claude:/rt"]
    );
    assert_eq!(
        renewed["credentialWriteBack"],
        json!({ "runtimeDir": "/rt" })
    );
    // A pinned invocation renews only its own store.
    renewals.0.borrow_mut().clear();
    renew_leased_login(
        &selected(),
        Some(&renewals),
        &cfg,
        "multi",
        Some("two"),
        Some("confined"),
        Some(dir),
    );
    assert_eq!(renewals.0.borrow().as_slice(), ["openai/a1:claude:/rt"]);
    // An executor that declares a confinement of its own counts even when the posture asks for none.
    let confined_executor = json!({ "executors": { "c": { "kind": "agent", "command": "claude", "confinement": { "mode": "bwrap" } } } });
    renewals.0.borrow_mut().clear();
    let single = json!({ "status": "selected", "provider": "p", "accountId": "a", "credentialSource": { "cli": "claude" } });
    renew_leased_login(
        &single,
        Some(&renewals),
        &confined_executor,
        "c",
        None,
        Some("unconfined"),
        Some(dir),
    );
    assert_eq!(renewals.0.borrow().as_slice(), ["p/a:claude:/rt"]);
}

#[test]
fn a_renewal_that_fails_never_blocks_the_dispatch() {
    let broken = Renewals(RefCell::new(Vec::new()), true);
    let renewed = renew_leased_login(
        &selected(),
        Some(&broken),
        &lease_cfg(),
        "multi",
        None,
        Some("confined"),
        Some(Path::new("/rt")),
    );
    assert_eq!(broken.0.borrow().len(), 2, "each store is still tried");
    assert_eq!(renewed["credentialWriteBack"]["runtimeDir"], "/rt");
}

// ---- resumed run -------------------------------------------------------------------------------------------

struct FakeAdopt(&'static str, Option<&'static str>);
impl AdoptDoor for FakeAdopt {
    fn adopt(&self, _: &Path) -> Verdict {
        Verdict {
            state: self.0,
            outcome: None,
            pending_step: None,
            reason: self.1.map(str::to_string),
            adoptable: None,
            gone: Vec::new(),
            lane: None,
        }
    }
}

#[test]
fn a_resume_never_launches_a_second_worker_over_what_the_run_already_has() {
    let root = scratch("resume");
    assert!(
        resumed_run_outcome(&root, "run_x_01", &FakeAdopt("closed", None))
            .unwrap()
            .is_none()
    );

    std::fs::write(root.join("result.json"), "{ torn").unwrap();
    let error = resumed_run_outcome(&root, "run_x_01", &FakeAdopt("closed", None)).unwrap_err();
    assert_eq!(
        (error.code.as_deref(), error.phase.as_deref()),
        (Some("result-corrupt"), Some("post-admission"))
    );
    std::fs::remove_file(root.join("result.json")).unwrap();

    std::fs::write(root.join("envelope.json"), "{}").unwrap();
    let live = resumed_run_outcome(&root, "run_x_01", &FakeAdopt("running", None)).unwrap_err();
    assert_eq!(live.code.as_deref(), Some("run-in-flight"));
    assert_eq!(live.facts["reconcileStatus"], "running");
    assert!(
        live.message.contains(
            "found its attempt in state \"running\" -- refusing to launch a second worker over it"
        ),
        "{live}"
    );
    let dead = resumed_run_outcome(&root, "run_x_01", &FakeAdopt("legacy-run", Some("no-lock")))
        .unwrap_err();
    assert_eq!(dead.code.as_deref(), Some("run-unreconciled"));
    assert_eq!(dead.facts["reconcileReason"], "no-lock");
    assert!(dead.message.contains("(no-lock)"), "{dead}");
    std::fs::remove_file(root.join("envelope.json")).unwrap();

    std::fs::create_dir_all(root.join("controller/commands")).unwrap();
    let legacy = resumed_run_outcome(&root, "run_x_01", &FakeAdopt("closed", None)).unwrap_err();
    assert_eq!(legacy.code.as_deref(), Some("run-unreconciled"));
    assert_eq!(legacy.facts["reconcileReason"], "legacy-run");
}

// ---- the attempt's give-back -------------------------------------------------------------------------------

#[derive(Default)]
struct Recorded {
    calls: RefCell<Vec<String>>,
    home_given_back: bool,
}
impl GiveBack for Recorded {
    fn give_back_attempt_home(&self, _: &Path, attempt_id: &str) -> bool {
        self.calls.borrow_mut().push(format!("home:{attempt_id}"));
        self.home_given_back
    }
    fn release_provider_lease(&self, selection: &Value, run_id: &str, _: Option<&Path>) {
        self.calls.borrow_mut().push(format!(
            "lease:{}:{run_id}",
            selection["accountId"].as_str().unwrap()
        ));
    }
}

struct Pane(std::rc::Rc<RefCell<Vec<String>>>);
impl TerminalPrep for Pane {
    fn abandon(&self) {
        self.0.borrow_mut().push("pane".into());
    }
}

fn attempt_in(dir: &Path) -> Attempt {
    open_attempt(OpenAttempt {
        run_dir: dir.to_path_buf(),
        run_id: "run_x_01".into(),
        attempt_id: "cmd_1_aa".into(),
        unit_run_id: "x".into(),
        terminal: false,
        cwd: dir.to_string_lossy().into(),
        host: None,
        step_env: Map::new(),
        custody: true,
        lease_runtime_dir: None,
        session: false,
    })
}

#[test]
fn an_attempt_that_never_reached_its_supervisor_gives_back_the_pane_then_the_home_then_the_control()
{
    let root = scratch("close");
    let order = std::rc::Rc::new(RefCell::new(Vec::new()));
    let give_back = Recorded {
        home_given_back: true,
        ..Default::default()
    };
    let mut attempt = attempt_in(&root);
    attempt.terminal_prep = Some(Box::new(Pane(order.clone())));
    attempt.locks = Some(fgos_run_supervisor::controller::launch::AttemptLocks {
        attempt: None,
        cwd_lease: None,
        cwd_lease_is_custody: true,
    });
    attempt.lease = Some(json!({ "status": "selected", "provider": "p", "accountId": "acct" }));
    attempt.control = Some(Control {
        epoch: 1,
        token: "t".into(),
    });
    close_attempt(&mut attempt, &give_back);
    let mut all = order.borrow().clone();
    all.extend(give_back.calls.borrow().iter().cloned());
    assert_eq!(all, ["pane", "home:cmd_1_aa", "lease:acct:run_x_01"]);
}

#[test]
fn a_supervised_attempt_that_never_produced_its_result_keeps_its_lease_and_control() {
    let root = scratch("handed");
    let give_back = Recorded {
        home_given_back: true,
        ..Default::default()
    };
    let mut attempt = attempt_in(&root);
    attempt.handed_over = true;
    attempt.locks = Some(fgos_run_supervisor::controller::launch::AttemptLocks {
        attempt: None,
        cwd_lease: None,
        cwd_lease_is_custody: true,
    });
    attempt.lease = Some(json!({ "status": "selected", "provider": "p", "accountId": "acct" }));
    attempt.control = Some(Control {
        epoch: 1,
        token: "t".into(),
    });
    close_attempt(&mut attempt, &give_back);
    assert!(
        give_back.calls.borrow().is_empty(),
        "{:?}",
        give_back.calls.borrow()
    );
}

#[test]
fn a_settled_attempt_releases_what_it_owns_and_the_lease_follows_the_result() {
    let root = scratch("settled");
    let give_back = Recorded {
        home_given_back: true,
        ..Default::default()
    };
    let mut attempt = attempt_in(&root);
    attempt.handed_over = true;
    attempt.settled = true;
    attempt.lease = Some(json!({ "status": "selected", "provider": "p", "accountId": "acct" }));
    attempt.control = Some(Control {
        epoch: 1,
        token: "t".into(),
    });
    close_attempt(&mut attempt, &give_back);
    assert_eq!(give_back.calls.borrow().as_slice(), ["lease:acct:run_x_01"]);
}

// ---- the handover ------------------------------------------------------------------------------------------

/// A script written and executed while another thread forks inherits the writer's descriptor and fails to exec
/// (`ETXTBSY`); tests that write a script then start it take this lock from the write to the exec.
static SCRIPT_EXEC: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[cfg(unix)]
#[test]
fn the_attempt_lock_moves_to_the_supervisor_and_the_controller_keeps_no_copy() {
    use fgos_execution_engine::assignment_runner::launch::start_and_bind;
    use fgos_holder_lock::{probe, Probe, Resource};
    use fgos_run_supervisor::controller::launch::{
        acquire_attempt_locks, AttemptLockRequest, Binding,
    };
    use std::os::unix::fs::PermissionsExt;

    let _exec = SCRIPT_EXEC.lock().unwrap_or_else(|e| e.into_inner());
    let root = scratch("handover");
    let cwd = root.join("cwd");
    let run_dir = root.join(".fgos/assignments/u1/runs/01");
    std::fs::create_dir_all(&cwd).unwrap();
    std::fs::create_dir_all(&run_dir).unwrap();
    let locks = acquire_attempt_locks(AttemptLockRequest {
        fgos_dir: &root.join(".fgos"),
        assignment_dir: &root.join(".fgos/assignments/u1"),
        attempt_str: "01",
        cwd: &cwd,
        mutating: false,
        custody: None,
        executor_id: None,
        capability: None,
    })
    .unwrap();
    let lock_path = locks.attempt.as_ref().unwrap().path().to_path_buf();
    let mut attempt = attempt_in(&run_dir);
    attempt.locks = Some(locks);

    // A stub supervisor: it marks the lock descriptor close-on-exec as the real route does, checks that descriptor 3 is
    // the attempt lock, binds, and waits for the controller to say it closed its copy.
    let supervisor = root.join("host.py");
    std::fs::write(
        &supervisor,
        "#!/usr/bin/env python3\nimport fcntl, os, sys, time\nrun = os.path.dirname(sys.argv[4])\nfcntl.fcntl(3, fcntl.F_SETFD, fcntl.FD_CLOEXEC)\nif os.path.realpath('/proc/self/fd/3') != open(os.path.join(run, 'expected-lock')).read():\n    sys.exit(9)\nopen(os.path.join(run, 'supervisor-binding.json'), 'w').close()\nfor _ in range(400):\n    if os.path.exists(os.path.join(run, 'controller-released')):\n        break\n    time.sleep(0.05)\n",
    )
    .unwrap();
    std::fs::set_permissions(&supervisor, std::fs::Permissions::from_mode(0o755)).unwrap();
    std::fs::write(
        run_dir.join("expected-lock"),
        std::fs::canonicalize(&lock_path)
            .unwrap()
            .to_string_lossy()
            .as_bytes(),
    )
    .unwrap();
    let side = run_dir.join("attempt-secrets.json");
    std::fs::write(&side, "{}").unwrap();
    let envelope = json!({ "runDir": run_dir, "hostBin": supervisor, "sideFile": side });

    let handing = std::time::Instant::now();
    let (bound, mut started) =
        start_and_bind(&mut attempt, &envelope, &Map::new()).expect("started");
    assert_eq!(bound, Binding::Bound);
    assert!(attempt.handed_over);
    assert!(
        handing.elapsed()
            < std::time::Duration::from_millis(fgos_holder_lock::DEFAULT_KILL_WAIT_MS / 4),
        "the handover waited on the supervisor"
    );
    assert!(
        attempt.locks.as_ref().unwrap().attempt.is_none(),
        "the controller keeps no copy of the attempt lock"
    );
    assert_eq!(
        probe(&Resource::new("attempt", &lock_path)).unwrap(),
        Probe::Held,
        "the supervisor holds the lock"
    );
    std::fs::write(run_dir.join("controller-released"), "").unwrap();
    assert!(
        started.child.wait().unwrap().success(),
        "the supervisor saw the attempt lock at descriptor 3"
    );
    assert_eq!(
        probe(&Resource::new("attempt", &lock_path)).unwrap(),
        Probe::Free,
        "the lock ends with the supervisor"
    );
    fgos_run_supervisor::controller::cancel::unregister(&run_dir);
}

// ---- the loop's refusals -----------------------------------------------------------------------------------

/// Ports for a run that must be refused before anything is leased, prepared or launched: asking one of the
/// machine's effectful doors past the refusal is a failure of the test.
struct RefusalPorts {
    plan: Value,
    checkout: FakeCheckout,
}

impl SeatPorts for RefusalPorts {
    fn resolve_command(&self, _: &CommandAsk<'_>) -> Result<Value, RunnerConfigError> {
        unreachable!("no seat is prepared for a refused run")
    }
    fn prepare_confinement(
        &self,
        _: &Value,
    ) -> Result<fgos_execution_engine::confinement::request::Launch, RunnerConfigError> {
        unreachable!("no confinement is prepared for a refused run")
    }
    fn prepare_pane(
        &self,
        _: &mut Attempt,
        _: &PaneAsk<'_>,
    ) -> Result<PaneSeat, RunnerConfigError> {
        unreachable!("no pane is opened for a refused run")
    }
    fn controller_writer_id(&self) -> Option<String> {
        None
    }
}

impl ExecutePorts for RefusalPorts {
    fn checkout(&self) -> &dyn CheckoutFacts {
        &self.checkout
    }
    fn machine(&self) -> &dyn Machine {
        &NoMachine
    }
    fn git(&self) -> &dyn fgos_execution_engine::settlement::SettlementGit {
        unreachable!("a refused run reads no checkout")
    }
    fn roots(&self) -> &dyn CheckoutRoots {
        &OnlyMain
    }
    fn adopt(&self) -> &dyn AdoptDoor {
        unreachable!("a refused run adopts nothing")
    }
    fn give_back(&self) -> &dyn GiveBack {
        unreachable!("a refused run gives nothing back")
    }
    fn accounts_at(
        &self,
        _: Option<&Path>,
    ) -> Result<fgos_execution_engine::accounts::Accounts<'_>, RunnerConfigError> {
        unreachable!("a refused run leases nothing")
    }
    fn load_runner_config(&self, _: &Path) -> Result<Value, RunnerConfigError> {
        Ok(json!({ "executors": { "stub": { "kind": "agent", "command": "stub" } } }))
    }
    fn decided_dispatch_plan(
        &self,
        _: &Value,
        _: &Value,
        _: &ExecuteOptions,
    ) -> Result<Value, RunnerConfigError> {
        Ok(self.plan.clone())
    }
    fn posture_requirement(&self, _: &Value, _: &Value) -> Value {
        json!({ "mode": "unconfined", "policyId": null, "policy": null })
    }
    fn resolve_template(&self, _: &Value, _: &Path) -> Result<Value, RunnerConfigError> {
        unreachable!("the assignments here name no template")
    }
    fn render_prompt(
        &self,
        _: &Value,
        _: &fgos_execution_engine::assignment::builder::PromptOptions,
    ) -> Result<String, RunnerConfigError> {
        unreachable!("a refused run renders no prompt")
    }
    fn attempt_host(
        &self,
    ) -> Result<fgos_run_supervisor::controller::launch::AttemptHost, RunnerConfigError> {
        unreachable!("a refused run has no host")
    }
    fn step_env(&self) -> Map<String, Value> {
        Map::new()
    }
    fn launch_settings(
        &self,
        _: &Path,
    ) -> Result<fgos_run_supervisor::controller::launch::LaunchSettings, RunnerConfigError> {
        unreachable!("a refused run reads no launch settings")
    }
    fn fgos_dir_of_root(&self, root: &Path) -> PathBuf {
        root.join(".fgos")
    }
    fn clock(&self) -> fgos_execution_engine::confinement::request::BuildClock<'_> {
        unreachable!("a refused run builds no request")
    }
}

fn declared(mutation: &str) -> Value {
    json!({
        "assignmentId": "a1", "role": "producer", "operation": "op", "mutation": mutation,
        "provenance": { "kind": "declared" },
    })
}

fn refused(plan: Value, assignment: &Value, options: ExecuteOptions) -> (ExecuteError, PathBuf) {
    let root = scratch("refused");
    let ports = RefusalPorts {
        plan,
        checkout: FakeCheckout {
            main: root.to_string_lossy().into(),
            root: Some(root.to_string_lossy().into()),
        },
    };
    let options = ExecuteOptions {
        cwd: Some(root.clone()),
        repo_root: Some(root.clone()),
        ..options
    };
    let error = execute_assignment(assignment, &options, &ports, &mut |_, _| {})
        .expect_err("the run is refused");
    (error, root)
}

#[test]
fn a_decision_that_names_no_mechanism_refuses_the_run_by_its_reason() {
    let plan = json!({ "mechanism": "unavailable", "blockedReason": "governance: executor denied", "policy": {} });
    let (error, root) = refused(plan, &declared("read-only"), ExecuteOptions::default());
    let ExecuteError::Config(error) = error else {
        panic!("expected a runner refusal")
    };
    assert_eq!(
        error.message,
        "dispatch decide blocked operation \"op\": governance: executor denied"
    );
    // Nothing was admitted: no run directory exists.
    assert!(!root.join(".fgos/assignments/a1/runs/01").exists());
    let plan = json!({ "mechanism": null, "reasonCodes": ["tool.missing", "other"], "policy": {} });
    let (error, _) = refused(plan, &declared("read-only"), ExecuteOptions::default());
    let ExecuteError::Config(error) = error else {
        panic!("expected a runner refusal")
    };
    assert!(error.message.ends_with(": tool.missing, other"), "{error}");
}

#[test]
fn an_adapter_the_supervisor_cannot_run_is_refused_before_anything_is_admitted() {
    let plan = json!({ "mechanism": "out-of-process", "capability": "code:implement", "invocation": { "adapter": "http" }, "policy": { "executorId": "stub" } });
    let (error, root) = refused(plan, &declared("read-only"), ExecuteOptions::default());
    let ExecuteError::Dispatch(error) = error else {
        panic!("expected a dispatch refusal")
    };
    assert_eq!(error.code, "supervised-adapter-required");
    assert_eq!(error.detail["adapter"], "http");
    assert_eq!(error.detail["executorId"], "stub");
    assert_eq!(error.detail["capability"], "code:implement");
    assert!(
        error.message.contains("cli-spawn and herdr-spawn can"),
        "{error}"
    );
    assert!(!root.join(".fgos/assignments/a1/runs/01").exists());
}

#[test]
fn writes_cannot_share_a_cwd() {
    let plan = json!({ "mechanism": "out-of-process", "capability": "code:implement", "policy": { "executorId": "stub" } });
    let (error, _) = refused(
        plan,
        &declared("mutating"),
        ExecuteOptions {
            force_shared_cwd: true,
            is_read_only_mode: Some(false),
            ..Default::default()
        },
    );
    let ExecuteError::Dispatch(error) = error else {
        panic!("expected a dispatch refusal")
    };
    assert_eq!(error.code, "custody-required");
    assert_eq!(
        error.message,
        "--force-shared-cwd cannot be used with writes"
    );
}

#[test]
fn an_illegal_assignment_writes_nothing() {
    let plan = json!({ "mechanism": "out-of-process", "policy": {} });
    let mut assignment = declared("mutating");
    assignment["dispatch"] = json!("human-only");
    let (error, root) = refused(plan, &assignment, ExecuteOptions::default());
    let ExecuteError::Config(error) = error else {
        panic!("expected a runner refusal")
    };
    assert_eq!(
        error.message,
        "cannot execute human-only operation \"op\" via cli-spawn"
    );
    assert!(
        !root.join(".fgos").exists(),
        "legality is judged before any storage is set up"
    );
}

// ---- one direct assignment, end to end ---------------------------------------------------------------------

#[cfg(unix)]
mod end_to_end {
    use super::*;
    use fgos_execution_engine::accounts::{Accounts, SystemHost};
    use fgos_execution_engine::assignment::builder::PromptOptions;
    use fgos_execution_engine::confinement::driver::registry::DriverRegistry;
    use fgos_execution_engine::confinement::request::{
        prepare_confinement_for_launch, BuildClock, Launch, LaunchHost, ProbeVerdict, Probes,
    };
    use fgos_execution_engine::settlement::{commit_run_settlement, SettlementGit};
    use fgos_run_supervisor::controller::launch::{AttemptHost, LaneSettings, LaunchSettings};
    use std::os::unix::fs::PermissionsExt;

    struct NoProbe;
    impl Probes for NoProbe {
        fn verify_bwrap(&self, _: &Value, _: &str, _: &str, _: &Value) -> ProbeVerdict {
            panic!("an unconfined launch reaches no sandbox probe");
        }
    }

    struct QuietGit;
    impl SettlementGit for QuietGit {
        fn head(&self, _: &Path) -> Option<String> {
            Some("0123456789abcdef".into())
        }
        fn status_files(&self, _: &Path) -> Vec<String> {
            Vec::new()
        }
        fn committed_diff_files(&self, _: &Path, _: &str, _: &str) -> Vec<String> {
            Vec::new()
        }
    }

    struct Ports {
        root: PathBuf,
        agent: PathBuf,
        host_bin: PathBuf,
        checkout: FakeCheckout,
        host: SystemHost,
        give_back: Recorded,
        adopt: FakeAdopt,
        now: Box<dyn Fn() -> u64>,
        suffix: Box<dyn Fn() -> String>,
        depth: f64,
        terminal: bool,
        abandoned: std::rc::Rc<RefCell<Vec<String>>>,
    }

    impl SeatPorts for Ports {
        fn resolve_command(&self, ask: &CommandAsk<'_>) -> Result<Value, RunnerConfigError> {
            assert_eq!(ask.executor_id, "stub");
            if self.terminal {
                return Ok(json!({
                    "command": "claude", "args": ["-p", ask.prompt], "argsTemplate": ["-p", "{prompt}"],
                    "adapter": "herdr-spawn", "env": {}, "interactiveMode": { "kind": "claude", "exitCommand": "/exit" },
                }));
            }
            Ok(
                json!({ "command": self.agent, "args": ["--brief", ask.prompt], "adapter": "cli-spawn", "env": {} }),
            )
        }
        fn prepare_confinement(&self, request: &Value) -> Result<Launch, RunnerConfigError> {
            // The prepared attestations are written under the home of the environment the launch is given.
            let env: Vec<(String, String)> =
                vec![("HOME".into(), self.root.to_string_lossy().into_owned())];
            let drivers = DriverRegistry::new();
            let roots: Vec<String> = Vec::new();
            let now = || "2026-11-19T00:00:00.000Z".to_string();
            let discard = |_: &fgos_execution_engine::confinement::driver::Prepared| {};
            let approvals = |_: &Value, _: &str, _: &str| Vec::<String>::new();
            let host = LaunchHost {
                env: &env,
                drivers: &drivers,
                probes: &NoProbe,
                credential_scan_roots: &roots,
                now_iso: &now,
                discard_prepared: &discard,
                claude_mcp_approval_args: &approvals,
            };
            prepare_confinement_for_launch(request, &host)
                .map_err(|e| RunnerConfigError::new(e.to_string()))
        }
        fn prepare_pane(
            &self,
            attempt: &mut Attempt,
            ask: &PaneAsk<'_>,
        ) -> Result<PaneSeat, RunnerConfigError> {
            assert!(self.terminal, "a direct attempt has no pane");
            // The agent starts with the access to its run directory and the writer id of the attempt, never the prompt.
            assert!(
                ask.agent_args
                    .windows(2)
                    .any(|w| w[0] == "--add-dir" && w[1] == attempt.run_dir.to_string_lossy()),
                "{:?}",
                ask.agent_args
            );
            assert!(!ask.agent_args.iter().any(|a| a == "do the thing"));
            let outbox = attempt.run_dir.join("outbox");
            std::fs::create_dir_all(&outbox).unwrap();
            let endpoint = json!({ "HERDR_SOCKET_PATH": "/herdr.sock" });
            attempt.terminal_prep = Some(Box::new(Pane(self.abandoned.clone())));
            // A pane's key is named in the intent before it is allocated, so a controller killed from there on leaves
            // a record that names the pane to give back.
            publish_attempt_intent(attempt, Some(&json!({ "slot": { "key": attempt.attempt_id, "groupKey": "grp" }, "endpointEnv": endpoint }))).unwrap();
            Ok(PaneSeat {
                brief_path: attempt.run_dir.join("brief-1.md").to_string_lossy().into(),
                outbox_dir: outbox.to_string_lossy().into(),
                group_key: "grp".into(),
                endpoint_env: endpoint.as_object().unwrap().clone(),
            })
        }
        fn controller_writer_id(&self) -> Option<String> {
            Some("controller-writer".into())
        }
    }

    impl ExecutePorts for Ports {
        fn checkout(&self) -> &dyn CheckoutFacts {
            &self.checkout
        }
        fn machine(&self) -> &dyn Machine {
            &NoMachine
        }
        fn git(&self) -> &dyn SettlementGit {
            &QuietGit
        }
        fn roots(&self) -> &dyn CheckoutRoots {
            &OnlyMain
        }
        fn adopt(&self) -> &dyn AdoptDoor {
            &self.adopt
        }
        fn give_back(&self) -> &dyn GiveBack {
            &self.give_back
        }
        fn accounts_at(&self, _: Option<&Path>) -> Result<Accounts<'_>, RunnerConfigError> {
            Ok(Accounts::new(
                self.root.join("runtime"),
                self.root.join("locks"),
                &self.host,
            ))
        }
        fn load_runner_config(&self, _: &Path) -> Result<Value, RunnerConfigError> {
            Ok(
                json!({ "executors": { "stub": { "kind": "agent", "command": "stub" } }, "timeoutMs": 30000 }),
            )
        }
        fn decided_dispatch_plan(
            &self,
            _: &Value,
            _: &Value,
            _: &ExecuteOptions,
        ) -> Result<Value, RunnerConfigError> {
            Ok(json!({
                "mechanism": "out-of-process", "capability": "code:implement",
                "invocation": { "adapter": if self.terminal { "herdr-spawn" } else { "cli-spawn" } },
                "policy": { "executorId": "stub", "tier": "standard", "model": "m" },
            }))
        }
        fn posture_requirement(&self, _: &Value, _: &Value) -> Value {
            unreachable!("the assignment carries no binding")
        }
        fn resolve_template(&self, _: &Value, _: &Path) -> Result<Value, RunnerConfigError> {
            unreachable!("the assignment names no template")
        }
        fn render_prompt(
            &self,
            _: &Value,
            options: &PromptOptions,
        ) -> Result<String, RunnerConfigError> {
            assert!(options
                .run_dir
                .as_deref()
                .is_some_and(|d| d.ends_with("/runs/01")));
            Ok("do the thing".into())
        }
        fn attempt_host(&self) -> Result<AttemptHost, RunnerConfigError> {
            Ok(AttemptHost {
                host_bin: self.host_bin.to_string_lossy().into(),
                payload_root: self.root.to_string_lossy().into(),
            })
        }
        fn step_env(&self) -> Map<String, Value> {
            Map::new()
        }
        fn launch_settings(&self, _: &Path) -> Result<LaunchSettings, RunnerConfigError> {
            Ok(LaunchSettings {
                gate_kill_grace_ms: 1_000,
                kill_wait_ms: 1_000,
                lanes: LaneSettings {
                    ceiling: Some(4),
                    lane_wait_sec: 7,
                },
            })
        }
        fn fgos_dir_of_root(&self, root: &Path) -> PathBuf {
            root.join(".fgos")
        }
        fn clock(&self) -> BuildClock<'_> {
            BuildClock {
                now_ms: &*self.now,
                random_suffix: &*self.suffix,
            }
        }
        fn dispatch_depth(&self) -> f64 {
            // The test may itself run inside a dispatched worker; the depth is the one the rig names.
            self.depth
        }
    }

    fn rig(tag: &str, depth: f64) -> (Ports, PathBuf, PathBuf) {
        rig_for(tag, depth, false)
    }

    fn rig_for(tag: &str, depth: f64, terminal: bool) -> (Ports, PathBuf, PathBuf) {
        let root = scratch(tag);
        let agent = root.join("agent.sh");
        std::fs::write(
            &agent,
            "#!/bin/sh\nprintf '%s' \"$2\" > \"$PWD/agent-ran\"\n",
        )
        .unwrap();
        // The stub supervisor: it marks the lock descriptor close-on-exec as the real route does, binds, runs the
        // agent the envelope names, and ends when the answer is committed.
        let host_bin = root.join("host.py");
        std::fs::write(
            &host_bin,
            "#!/usr/bin/env python3\nimport fcntl, json, os, subprocess, sys, time\nenvelope = json.load(open(sys.argv[4]))\nrun = envelope['runDir']\nfcntl.fcntl(3, fcntl.F_SETFD, fcntl.FD_CLOEXEC)\nopen(os.path.join(run, 'supervisor-binding.json'), 'w').close()\nlaunch = envelope['launch']\nsubprocess.call([launch['command']] + launch['args'], cwd=run)\nfor _ in range(600):\n    if os.path.exists(os.path.join(run, 'result.json')):\n        break\n    time.sleep(0.05)\nopen(os.path.join(run, 'closed.json'), 'w').write('{}')\n",
        )
        .unwrap();
        for script in [&agent, &host_bin] {
            std::fs::set_permissions(script, std::fs::Permissions::from_mode(0o755)).unwrap();
        }
        let ports = Ports {
            root: root.clone(),
            agent,
            host_bin,
            checkout: FakeCheckout {
                main: root.to_string_lossy().into(),
                root: Some(root.to_string_lossy().into()),
            },
            host: SystemHost::new(),
            give_back: Recorded {
                home_given_back: true,
                ..Default::default()
            },
            adopt: FakeAdopt("closed", None),
            now: Box::new(|| 1_795_000_000_000),
            suffix: Box::new(|| "abcd1234".into()),
            depth,
            terminal,
            abandoned: Default::default(),
        };
        let run_dir = root.join(".fgos/assignments/a1/runs/01");
        (ports, root, run_dir)
    }

    /// What the settle step does after the receipt: take the run control token the side file carries and commit the
    /// answer under it.
    fn commit_when_the_agent_ran(run_dir: PathBuf) -> std::thread::JoinHandle<()> {
        commit_after(run_dir, "agent-ran")
    }

    fn commit_after(run_dir: PathBuf, marker: &'static str) -> std::thread::JoinHandle<()> {
        std::thread::spawn(move || {
            let marker = run_dir.join(marker);
            for _ in 0..400 {
                if marker.exists() {
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(50));
            }
            let envelope: Value = serde_json::from_str(
                &std::fs::read_to_string(run_dir.join("envelope.json")).unwrap(),
            )
            .unwrap();
            let side: Value = serde_json::from_str(
                &std::fs::read_to_string(envelope["sideFile"].as_str().unwrap()).unwrap(),
            )
            .unwrap();
            let record = fgos_execution_engine::run_result::normalize_run_result_v3(
                &json!({
                    "runId": "run_a1_01", "assignmentId": "a1", "executorId": "stub",
                    "policy": { "executorId": "stub" }, "settledAt": "2026-11-19T00:00:01.000Z",
                    "role": "producer", "operation": "op", "isReadOnlyOperation": true,
                    "runtime": { "exitCode": 0, "stdoutLog": "stdout.log", "stderrLog": "stderr.log" },
                    "evidence": { "operationMutability": "read-only", "changedFiles": [], "attribution": [], "artifacts": [], "tests": [] },
                }),
                "2026-11-19T00:00:01.000Z",
            );
            commit_run_settlement(
                &run_dir,
                "run_a1_01",
                side["controlEpoch"].as_u64().unwrap(),
                side["controlToken"].as_str().unwrap(),
                &record,
            )
            .unwrap();
        })
    }

    fn options(root: &Path) -> ExecuteOptions {
        ExecuteOptions {
            cwd: Some(root.to_path_buf()),
            repo_root: Some(root.to_path_buf()),
            timeout_ms: Some(30_000),
            ..Default::default()
        }
    }

    #[test]
    fn a_direct_assignment_is_admitted_launched_under_a_supervisor_and_settles() {
        let _exec = SCRIPT_EXEC.lock().unwrap_or_else(|e| e.into_inner());
        let (ports, root, run_dir) = rig("e2e", 0.0);
        let committer = commit_when_the_agent_ran(run_dir.clone());
        let assignment = declared("read-only");
        let mut chunks = Vec::new();
        let settled =
            execute_assignment(&assignment, &options(&root), &ports, &mut |stream, text| {
                chunks.push(format!("{stream}:{text}"))
            })
            .unwrap_or_else(|e| panic!("the run is refused: {e}"));
        committer.join().unwrap();
        // The immutable input and the run record exist; the run was admitted as attempt 01.
        assert_eq!(
            serde_json::from_str::<Value>(
                &std::fs::read_to_string(root.join(".fgos/assignments/a1/assignment.json"))
                    .unwrap()
            )
            .unwrap()["assignmentId"],
            "a1"
        );
        let run: Value =
            serde_json::from_str(&std::fs::read_to_string(run_dir.join("run.json")).unwrap())
                .unwrap();
        assert_eq!(run["contract"], "assignment-run.v2");
        assert_eq!(run["runId"], "run_a1_01");
        assert!(run["dispatchPlanDigest"]
            .as_str()
            .unwrap()
            .starts_with("sha256:"));
        assert!(
            root.join(".fgos/assignments/a1/dispatched/01").exists(),
            "the dispatched marker names the attempt"
        );
        // The envelope carries what the controller prepared: the agent command, the lanes, the attempt lock's paths.
        let envelope: Value =
            serde_json::from_str(&std::fs::read_to_string(run_dir.join("envelope.json")).unwrap())
                .unwrap();
        assert_eq!(envelope["launch"]["command"], json!(ports.agent));
        assert_eq!(envelope["lanes"], json!({ "ceiling": 4, "waitMs": 7000 }));
        assert!(envelope["digest"].as_str().is_some());
        // The agent ran under the supervisor with the brief the controller rendered.
        assert_eq!(
            std::fs::read_to_string(run_dir.join("agent-ran")).unwrap(),
            "do the thing"
        );
        // The evaluator baseline and the effective contract are persisted before the supervisor starts.
        let baseline: Value = serde_json::from_str(
            &std::fs::read_to_string(run_dir.join("controller/evaluator-baseline.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(baseline["gitBefore"], "0123456789abcdef");
        assert!(run_dir.join("effective-execution-contract.json").exists());
        assert!(run_dir.join("controller/settle-context.json").exists());
        // The settled answer is the one the settle step committed, and the controller took nothing it does not own:
        // the run control is released, the lease never existed.
        assert_eq!(settled.record["runId"], "run_a1_01");
        assert!(!settled.corrupt);
        assert!(
            ports.give_back.calls.borrow().is_empty(),
            "{:?}",
            ports.give_back.calls.borrow()
        );
    }

    #[test]
    fn a_resumed_run_returns_the_answer_it_already_settled_and_launches_no_second_worker() {
        let _exec = SCRIPT_EXEC.lock().unwrap_or_else(|e| e.into_inner());
        let (ports, root, run_dir) = rig("resume-e2e", 0.0);
        let committer = commit_when_the_agent_ran(run_dir.clone());
        let assignment = declared("read-only");
        let with_retry = ExecuteOptions {
            retry_id: Some("r1".into()),
            ..options(&root)
        };
        let first = execute_assignment(&assignment, &with_retry, &ports, &mut |_, _| {})
            .expect("first run");
        committer.join().unwrap();
        std::fs::remove_file(run_dir.join("agent-ran")).unwrap();
        // The same retry identity is admitted as the same attempt: it is a resume of the settled run.
        let again = execute_assignment(&assignment, &with_retry, &ports, &mut |_, _| {})
            .expect("resumed run");
        assert_eq!(again.record, first.record);
        assert!(
            !run_dir.join("agent-ran").exists(),
            "a resume never starts the agent again"
        );
    }

    #[test]
    fn a_dispatch_nested_too_deep_is_refused_and_gives_back_what_it_took() {
        let _exec = SCRIPT_EXEC.lock().unwrap_or_else(|e| e.into_inner());
        let (ports, root, run_dir) = rig("depth", 3.0);
        let error = execute_assignment(
            &declared("read-only"),
            &options(&root),
            &ports,
            &mut |_, _| {},
        )
        .expect_err("refused");
        let ExecuteError::Dispatch(error) = error else {
            panic!("expected a dispatch refusal: {error}")
        };
        assert_eq!(error.code, "dispatch-depth-exceeded");
        assert_eq!(error.detail["maxDepth"], 3);
        assert!(
            !run_dir.join("envelope.json").exists(),
            "no envelope is written for a refused launch"
        );
        // The run control the loop took is released: a fresh controller may take the run.
        let control = fgos_run_supervisor::controller::lease::acquire_run_control(
            &run_dir,
            &Default::default(),
        )
        .unwrap();
        assert!(
            matches!(
                control,
                fgos_run_supervisor::controller::lease::AcquireOutcome::Acquired { .. }
            ),
            "{control:?}"
        );
    }

    #[test]
    fn a_terminal_assignment_prepares_its_pane_before_the_handover_and_names_it_in_the_envelope() {
        let _exec = SCRIPT_EXEC.lock().unwrap_or_else(|e| e.into_inner());
        let (ports, root, run_dir) = rig_for("terminal-e2e", 0.0, true);
        let committer = commit_after(run_dir.clone(), "supervisor-binding.json");
        let settled = execute_assignment(
            &declared("read-only"),
            &options(&root),
            &ports,
            &mut |_, _| {},
        )
        .unwrap_or_else(|e| panic!("the run is refused: {e}"));
        committer.join().unwrap();
        assert_eq!(settled.record["runId"], "run_a1_01");
        let envelope: Value =
            serde_json::from_str(&std::fs::read_to_string(run_dir.join("envelope.json")).unwrap())
                .unwrap();
        assert_eq!(envelope["host"], "terminal");
        assert_eq!(
            envelope["slot"],
            json!({ "key": envelope["attemptId"], "groupKey": "grp" })
        );
        assert_eq!(envelope["terminal"]["exitCommand"], "/exit");
        assert_eq!(envelope["terminal"]["orphanSettleMs"], 5_000);
        assert_eq!(envelope["agentProtocol"]["cli"], "claude");
        assert_eq!(envelope["deadlines"]["idleMs"], 1_200_000);
        let steps: Vec<&str> = envelope["steps"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|s| s["stepId"].as_str())
            .collect();
        assert_eq!(
            steps,
            [
                "settle-attempt",
                "finalize-home",
                "cleanup-trust",
                "release-slot"
            ],
            "a pane attempt also gives back the seat trust entry and its slot"
        );
        // The intent that was published with the pane names it; past the handover the pane is the supervisor's.
        let intent: Value = serde_json::from_str(
            &std::fs::read_to_string(run_dir.join("attempt-intent.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(intent["host"], "terminal");
        assert_eq!(intent["terminal"]["slot"]["groupKey"], "grp");
        assert!(
            ports.abandoned.borrow().is_empty(),
            "the controller gives back no pane once the supervisor owns the attempt"
        );
    }

    #[test]
    fn herdr_is_probed_before_a_pane_run_is_claimed() {
        // A pane run is only proven where herdr is present; where it is not, this says so instead of passing silently.
        let present = std::env::var_os("PATH").is_some_and(|paths| {
            std::env::split_paths(&paths).any(|dir| dir.join("herdr").is_file())
        });
        eprintln!("herdr present on this machine: {present}");
        assert_eq!(
            fgos_execution_engine::transport::terminal_slot::resolve_herdr_bin(None, &|_| None),
            "herdr"
        );
    }
}
