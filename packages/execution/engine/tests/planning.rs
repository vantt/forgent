//! Dispatch planning replays the vectors the Node modules recorded
//! (`test/golden-recorders/planning.recorder.mjs`). Every produced value is compared with its key order.

// The reconciliation replay runs under a fixed absolute POSIX root (a plan's key hashes it), so its helpers are
// unused where that test is not built.
#![cfg_attr(not(unix), allow(dead_code, unused_imports))]

use std::fs;
use std::path::PathBuf;

use fgos_execution_engine::planning::recovery::{
    check_apply, collect_evidence, compute_snapshot_hash, derive_recovery_facts, is_action_legal,
    plan, ApplyRequest, DEFAULT_TTL_MS,
};
use fgos_execution_engine::planning::resolve::{
    lookup_executor, resolve_capability_details_from_hints, resolve_executor_config,
    CapabilityHints,
};
use serde_json::{json, Value};

fn vector(name: &str) -> Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/planning")
        .join(name);
    let text = fs::read_to_string(&path).unwrap_or_else(|e| panic!("{name}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("{name}: {e}"))
}

fn same_bytes(label: &str, got: &Value, want: &Value) {
    let (got, want) = (
        serde_json::to_string(got).unwrap(),
        serde_json::to_string(want).unwrap(),
    );
    if got != want {
        let at = got
            .bytes()
            .zip(want.bytes())
            .take_while(|(a, b)| a == b)
            .count();
        let near = |text: &str| {
            let from = text.floor_char_boundary(at.saturating_sub(60));
            let to = text.floor_char_boundary((at + 160).min(text.len()));
            text[from..to].to_string()
        };
        panic!(
            "{label}: differs at byte {at}\n got: ...{}\nwant: ...{}",
            near(&got),
            near(&want)
        );
    }
}

fn list<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("{key} is not a list"))
}

fn array(v: &Value) -> &Vec<Value> {
    v.as_array().expect("a list")
}

/// A thrown error as the vectors state it: `{ error: { name, code, message } }`.
fn expect<E: std::fmt::Display>(
    label: &str,
    got: Result<Value, E>,
    describe: impl Fn(&E) -> Value,
    want: &Value,
) {
    match (got, want.get("ok"), want.get("error")) {
        (Ok(value), Some(ok), _) => same_bytes(label, &value, ok),
        (Err(error), _, Some(want)) => {
            let got = describe(&error);
            assert_eq!(got["name"], want["name"], "{label}: error class");
            assert_eq!(got["code"], want["code"], "{label}: error code");
            assert_eq!(got["message"], want["message"], "{label}: message");
        }
        (Ok(value), _, Some(_)) => panic!("{label}: expected a refusal, got {value}"),
        (Err(error), Some(_), _) => panic!("{label}: expected a value, got {error}"),
        _ => panic!("{label}: malformed vector"),
    }
}

fn recovery_error(e: &fgos_execution_engine::planning::recovery::RecoveryPlannerError) -> Value {
    e.to_json()
}

fn refusal(e: &fgos_execution_engine::assignment::Refusal) -> Value {
    json!({ "name": "RunnerConfigError", "code": e.code, "message": e.message })
}

#[test]
fn recovery_default_ttl_is_five_minutes() {
    let v = vector("recovery.json");
    assert_eq!(v["defaultTtlMs"], json!(DEFAULT_TTL_MS));
}

#[test]
fn recovery_planner_judges_every_snapshot_the_way_node_did() {
    let v = vector("recovery.json");
    let now = v["now"].as_str().unwrap();
    for case in list(&v, "plan") {
        let name = case["name"].as_str().unwrap();
        let snapshot = &case["snapshot"];
        let evidence = array(&case["evidence"]);
        let intent = case["intent"].as_str().unwrap();
        same_bytes(
            &format!("{name} evidence"),
            &json!(collect_evidence(snapshot)),
            &case["evidence"],
        );
        expect(
            &format!("{name} facts"),
            derive_recovery_facts(snapshot, evidence, intent).map(|f| f.to_json()),
            recovery_error,
            &case["facts"],
        );
        expect(
            &format!("{name} plan"),
            plan(snapshot, evidence, intent, now, DEFAULT_TTL_MS),
            recovery_error,
            &case["plan"],
        );
        expect(
            &format!("{name} plan with a short ttl"),
            plan(snapshot, evidence, intent, now, 1000),
            recovery_error,
            &case["planDefaultTtl"],
        );
    }
}

#[test]
fn recovery_action_legality_follows_the_same_gate_as_the_plan() {
    let v = vector("recovery.json");
    for case in list(&v, "actionLegal") {
        let name = case["name"].as_str().unwrap();
        let verdict = is_action_legal(&case["snapshot"], array(&case["evidence"]), &case["action"]);
        same_bytes(
            &format!("{name} {}", case["action"]),
            &verdict.to_json(),
            &case["result"]["ok"],
        );
    }
}

#[test]
fn recovery_apply_check_refuses_a_stale_or_expired_plan() {
    let v = vector("recovery.json");
    for case in list(&v, "apply") {
        let name = case["name"].as_str().unwrap();
        let i = &case["input"];
        let got = check_apply(&ApplyRequest {
            snapshot: &i["snapshot"],
            evidence: array(&i["evidence"]),
            action: &i["action"],
            expected_snapshot: i["expectedSnapshot"].as_str().unwrap(),
            expected_control_epoch: &i["expectedControlEpoch"],
            expected_expires_at: i["expectedExpiresAt"].as_str().unwrap(),
            action_key: i["actionKey"].as_str().unwrap(),
            now: &i["now"],
        });
        same_bytes(name, &got, &case["result"]["ok"]);
    }
}

#[test]
fn recovery_snapshot_hash_ignores_property_order() {
    let v = vector("recovery.json");
    for case in list(&v, "hash") {
        assert_eq!(
            Value::String(compute_snapshot_hash(&case["snapshot"])),
            case["hash"],
            "{}",
            case["snapshot"]
        );
    }
}

#[test]
fn executor_lookup_finds_a_registered_entry_or_the_default() {
    let v = vector("resolve.json");
    let state = |l: fgos_execution::executor_model::Lookup<'_>| {
        let mut out = serde_json::Map::new();
        out.insert("executorId".into(), json!(l.executor_id));
        if let Some(executor) = l.executor {
            out.insert("executor".into(), executor.clone());
        }
        out.insert("configured".into(), json!(l.configured));
        out.insert("bindingSource".into(), json!(l.binding_source));
        Value::Object(out)
    };
    for case in list(&v, "lookups") {
        let id = case["id"].as_str();
        same_bytes(
            &format!("lookup {id:?}"),
            &state(lookup_executor(&v["cfg"], id)),
            &case["result"],
        );
    }
    for case in list(&v, "lookupBare") {
        let id = case["id"].as_str();
        same_bytes(
            &format!("bare lookup {id:?}"),
            &state(lookup_executor(&case["cfg"], id)),
            &case["result"],
        );
    }
}

#[test]
fn executor_resolution_gates_egress_and_picks_the_invocation() {
    let v = vector("resolve.json");
    for case in list(&v, "config") {
        let runner = case.get("cfgOverride").unwrap_or(&v["cfg"]);
        let label = format!(
            "{} carries={} invocation={}",
            case["executorId"], case["contentCarries"], case["invocationId"]
        );
        expect(
            &label,
            resolve_executor_config(
                runner,
                case["executorId"].as_str(),
                case["contentCarries"].as_str(),
                case["resolvedAgentType"].as_str(),
                case["invocationId"].as_str(),
            ),
            refusal,
            &case["result"],
        );
    }
}

#[test]
fn capability_resolution_prefers_confinement_then_registration() {
    let v = vector("resolve.json");
    for case in list(&v, "capabilityHints") {
        let a = &case["args"];
        let strings = |key: &str| -> Vec<String> {
            a["hints"][key]
                .as_array()
                .map(|l| {
                    l.iter()
                        .filter_map(|s| s.as_str().map(str::to_string))
                        .collect()
                })
                .unwrap_or_default()
        };
        let hints = CapabilityHints {
            candidates: strings("candidates"),
            preferred: a["hints"]["preferred"].as_str().map(str::to_string),
            fallback_label: a["hints"]["fallbackLabel"].as_str().map(str::to_string),
        };
        let got = resolve_capability_details_from_hints(
            &v["cfg"],
            a["executorId"].as_str(),
            a.get("resolvedExecutor"),
            a["purpose"].as_str(),
            &hints,
        );
        same_bytes(&format!("{a}"), &got.to_json(), &case["result"]["ok"]);
    }
}

// ---- the bind facade -------------------------------------------------------------------------------------------

use fgos_execution::bind::BindSession;
use fgos_execution::ports::{Backend, Machine};
use fgos_execution::seat_resolver::SeatLedger;
use fgos_execution_engine::planning::bind_facade::{
    ask_for, bind, bind_work_seat, binding_identity, explain_seat, preflight_of,
    simulate_unit_bindings, AskOptions, BindContext, BindError, DryBindOptions, PreflightRequest,
    SeatRequest, BIND_CONTRACT_VERSION,
};

/// A described machine: the commands on PATH, a stated home, no confinement registry, no herdr.
struct DescribedMachine(Vec<String>);

impl DescribedMachine {
    fn of(names: &Value) -> Self {
        DescribedMachine(
            array(names)
                .iter()
                .filter_map(|n| n.as_str().map(str::to_string))
                .collect(),
        )
    }
}

impl Machine for DescribedMachine {
    fn on_path(&self, program: &str) -> bool {
        !program.contains('/') && self.0.iter().any(|c| c == program)
    }
    fn posture_backend(&self, _id: &str) -> Option<Backend> {
        None
    }
    fn herdr_present(&self) -> bool {
        false
    }
    fn home_dir(&self) -> Option<String> {
        Some("/home/vector".to_string())
    }
}

fn bind_error(e: &BindError) -> Value {
    e.to_json()
}

fn strings(v: &Value) -> Vec<String> {
    array(v)
        .iter()
        .filter_map(|s| s.as_str().map(str::to_string))
        .collect()
}

fn launch_session() -> BindSession {
    BindSession {
        headless: true,
        has_native_agent: false,
        posture_at_launch: true,
    }
}

#[test]
fn bind_facade_reports_the_contract_version_the_host_answers_under() {
    let v = vector("bind-facade.json");
    assert_eq!(BIND_CONTRACT_VERSION, "v1alpha1");
    assert_eq!(
        v["hostVersion"],
        json!(format!("fgos {}", env!("CARGO_PKG_VERSION")))
    );
}

#[test]
fn bind_facade_builds_the_ask_of_a_seat_from_the_ledger() {
    let v = vector("bind-facade.json");
    for case in list(&v, "askFor") {
        let mut ledger = SeatLedger::new();
        for op in array(&case["ops"]) {
            let op = array(op);
            match op[0].as_str().unwrap() {
                "note" => ledger.note(op[1].as_str().unwrap(), op[2].as_str().unwrap()),
                "noteDependence" => {
                    ledger.note_dependence(op[1].as_str().unwrap(), &strings(&op[2]))
                }
                other => panic!("unknown ledger operation {other}"),
            }
        }
        let options = &case["options"];
        let ask = ask_for(
            &SeatRequest {
                seat: &case["seat"],
                unit: &case["unit"],
                independent_of: &strings(&case["independentOf"]),
                prefer_independent_of: &strings(&case["preferIndependentOf"]),
            },
            &ledger,
            &AskOptions {
                overrides: options["overrides"].as_array().cloned().unwrap_or_default(),
                workflow_id: options["workflowId"].as_str(),
                raise_authorized: options["raiseAuthorized"] == json!(true),
                blind: options["blind"] == json!(true),
            },
        );
        same_bytes(case["name"].as_str().unwrap(), &ask, &case["ask"]);
    }
}

#[test]
fn bind_facade_names_a_candidate_by_executor_invocation_pool_model_and_effort() {
    let v = vector("bind-facade.json");
    for case in list(&v, "identity") {
        assert_eq!(
            Value::String(binding_identity(&case["binding"])),
            case["identity"],
            "{}",
            case["binding"]
        );
    }
}

#[test]
fn bind_facade_binds_one_seat_and_fences_a_bypass_invocation_to_head_launches() {
    let v = vector("bind-facade.json");
    let machine = DescribedMachine::of(&v["pathCommands"]);
    let now = v["now"].as_u64().unwrap();
    for case in list(&v, "bind") {
        let cfg = if case["cfg"].is_null() {
            &v["runner"]
        } else {
            &case["cfg"]
        };
        let ctx = BindContext {
            runner_config: cfg,
            session: launch_session(),
            machine: &machine,
            accounts: None,
        };
        expect(
            case["name"].as_str().unwrap(),
            bind(
                &case["ask"],
                &ctx,
                &case["walk"],
                case["headLaunch"] == json!(true),
                now,
            ),
            bind_error,
            &case["result"],
        );
    }
}

#[test]
fn bind_facade_binds_a_work_seat_or_refuses_it_by_name() {
    let v = vector("bind-facade.json");
    let machine = DescribedMachine::of(&v["pathCommands"]);
    let now = v["now"].as_u64().unwrap();
    for case in list(&v, "workSeat") {
        let args = &case["args"];
        expect(
            case["name"].as_str().unwrap(),
            bind_work_seat(
                &args["runnerConfig"],
                &args["unit"],
                args["role"].as_str().unwrap_or("producer"),
                args["readOnly"] == json!(true),
                args["overrides"].as_array().cloned().unwrap_or_default(),
                &machine,
                now,
            ),
            bind_error,
            &case["result"],
        );
    }
}

#[test]
fn bind_facade_explains_a_seat_with_its_walk() {
    let v = vector("bind-facade.json");
    let machine = DescribedMachine::of(&v["pathCommands"]);
    let now = v["now"].as_u64().unwrap();
    for case in list(&v, "explain") {
        let ctx = BindContext {
            runner_config: &v["runner"],
            session: launch_session(),
            machine: &machine,
            accounts: None,
        };
        expect(
            case["name"].as_str().unwrap(),
            explain_seat(&case["ask"], &ctx, &case["walk"], now),
            bind_error,
            &case["result"],
        );
    }
}

#[test]
fn bind_facade_answers_the_pre_admission_facts_of_a_run_start() {
    let v = vector("bind-facade.json");
    let now = v["now"].as_u64().unwrap();
    for case in list(&v, "preflight") {
        let machine = DescribedMachine::of(&case["pathCommands"]);
        let pin = case["pin"]
            .as_object()
            .map(|pin| fgos_execution::bind::AccountPin {
                pool: pin["pool"].as_str().unwrap().to_string(),
                id: pin["id"].as_str().unwrap().to_string(),
            });
        let facts = preflight_of(
            &PreflightRequest {
                runner_config: &v["runner"],
                session: BindSession {
                    headless: true,
                    ..BindSession::default()
                },
                pin,
                accounts: None,
            },
            &machine,
            now,
        );
        expect(
            case["name"].as_str().unwrap(),
            serde_json::to_value(&facts).map_err(|e| BindError {
                name: "Error".into(),
                code: None,
                message: e.to_string(),
            }),
            bind_error,
            &case["result"],
        );
    }
}

#[test]
fn bind_facade_simulates_the_seats_a_pattern_would_bind_without_running_them() {
    let v = vector("bind-facade.json");
    let machine = DescribedMachine::of(&v["pathCommands"]);
    let now = v["now"].as_u64().unwrap();
    for case in list(&v, "dryBind") {
        let options = &case["options"];
        let result = simulate_unit_bindings(
            &case["unit"],
            &v["runner"],
            &case["effective"],
            &DryBindOptions {
                session: BindSession {
                    posture_at_launch: true,
                    ..BindSession::default()
                },
                overrides: options["overrides"].as_array().cloned().unwrap_or_default(),
                raise_authorized: false,
                workflow_id: options["workflowId"].as_str(),
            },
            &machine,
            now,
        );
        expect(
            case["name"].as_str().unwrap(),
            result,
            bind_error,
            &case["result"],
        );
    }
}

// ---- the effective dispatch policy -----------------------------------------------------------------------------

use fgos_execution_engine::planning::policy::{effective_dispatch_policy, launch_pin_of};

#[test]
fn dispatch_policy_resolves_each_field_with_where_it_came_from() {
    let v = vector("policy.json");
    let machine = DescribedMachine::of(&vector("bind-facade.json")["pathCommands"]);
    let now = vector("bind-facade.json")["now"].as_u64().unwrap();
    for case in list(&v, "cases") {
        expect(
            case["name"].as_str().unwrap(),
            effective_dispatch_policy(&case["params"], &machine, now),
            bind_error,
            &case["result"],
        );
    }
}

#[test]
fn dispatch_policy_launch_pin_prefers_the_bound_seat_over_the_override() {
    let v = vector("policy.json");
    for case in list(&v, "launchPin") {
        let args = &case["args"];
        same_bytes(
            &format!("{args}"),
            &launch_pin_of(args.get("binding"), args.get("cliOverride")),
            &case["result"],
        );
    }
}

// ---- run admission ---------------------------------------------------------------------------------------------

use fgos_execution_engine::planning::admission::{
    admit_run_attempt, AdmissionError, AdmitRequest, EFFECTIVE_EXECUTION_CONTRACT_FILE,
};
use std::path::Path;

/// `admittedAt` and the identity of the admitting process name the recording moment and machine.
fn mask(value: &Value) -> Value {
    match value {
        Value::Array(items) => Value::Array(items.iter().map(mask).collect()),
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(key, v)| {
                    let masked = match key.as_str() {
                        "admittedAt" => json!("<time>"),
                        "admittedBy" | "holder" if !v.is_null() => json!("<holder>"),
                        _ => mask(v),
                    };
                    (key.clone(), masked)
                })
                .collect(),
        ),
        other => other.clone(),
    }
}

fn tree_of(root: &Path) -> Value {
    fn walk(root: &Path, dir: &Path, out: &mut Vec<(String, Value)>) {
        let mut entries: Vec<_> = fs::read_dir(dir).unwrap().flatten().collect();
        entries.sort_by_key(|e| e.file_name());
        for entry in entries {
            let full = entry.path();
            let rel = full
                .strip_prefix(root)
                .unwrap()
                .to_string_lossy()
                .into_owned();
            if full.is_dir() {
                out.push((format!("{rel}/"), Value::Null));
                walk(root, &full, out);
            } else if rel.ends_with(".json") {
                let value: Value =
                    serde_json::from_str(&fs::read_to_string(&full).unwrap()).unwrap();
                out.push((rel, mask(&value)));
            } else {
                out.push((rel, json!("<file>")));
            }
        }
    }
    let mut out = Vec::new();
    walk(root, root, &mut out);
    out.sort_by(|a, b| a.0.encode_utf16().cmp(b.0.encode_utf16()));
    Value::Object(out.into_iter().collect())
}

fn admission_error(e: &AdmissionError) -> Value {
    mask(&e.to_json())
}

fn scratch(label: &str) -> PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static COUNTER: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!(
        "planning-admission-{label}-{}-{}",
        std::process::id(),
        COUNTER.fetch_add(1, Ordering::SeqCst)
    ));
    fs::create_dir_all(dir.join("asg/runs")).unwrap();
    dir
}

#[test]
fn run_admission_fences_retries_and_materializes_the_attempt_directory_atomically() {
    let v = vector("admission.json");
    let assignment_id = v["assignmentId"].as_str().unwrap();
    for (n, case) in list(&v, "cases").iter().enumerate() {
        let root = scratch(&n.to_string());
        for (i, step) in array(&case["steps"]).iter().enumerate() {
            let label = format!("{} / step {}", case["name"], i + 1);
            for item in array(&step["setup"]) {
                let full = root.join(item["path"].as_str().unwrap());
                fs::create_dir_all(full.parent().unwrap()).unwrap();
                fs::write(&full, serde_json::to_string_pretty(&item["json"]).unwrap()).unwrap();
            }
            let call = &step["call"];
            let names: Vec<&str> = call["builders"]
                .as_array()
                .map(|l| l.iter().filter_map(Value::as_str).collect())
                .unwrap_or_default();
            let run_meta = |r: &Value| {
                json!({
                    "runId": r["runId"], "attempt": r["attempt"], "retryId": r["retryId"],
                    "payloadDigest": r["admissionPayloadDigest"], "status": "admitted",
                })
            };
            let plan = |r: &Value| Some(json!({ "plan": "dispatch", "runId": r["runId"] }));
            let none = |_: &Value| None;
            let effective =
                |r: &Value| Some(json!({ "contract": "effective", "runId": r["runId"] }));
            let outcome = admit_run_attempt(
                &root.join("asg"),
                &root.join("asg/runs"),
                assignment_id,
                &AdmitRequest {
                    retry_id: call["retryId"].as_str(),
                    predecessor_run_id: call["predecessorRunId"].as_str(),
                    destination: call["destination"].as_str().unwrap_or("cli"),
                    payload_digest: call["payloadDigest"].as_str().unwrap_or("sha256:aaa"),
                    expected_run_id: call["expectedRunId"].as_str(),
                    force_new_attempt: call["forceNewAttempt"] == json!(true),
                    refuse_if_settled: call["refuseIfSettled"] == json!(true),
                    build_run_meta: &run_meta,
                    build_dispatch_plan: if names.contains(&"plan") {
                        Some(&plan)
                    } else if names.contains(&"plan-none") {
                        Some(&none)
                    } else {
                        None
                    },
                    build_effective_contract: names
                        .contains(&"effective")
                        .then_some(&effective as &dyn Fn(&Value) -> Option<Value>),
                },
            );
            let got = outcome.map(|admitted| {
                let mut json = admitted.to_json();
                json["runDir"] = json!(admitted.run_dir.strip_prefix(&root).unwrap());
                json
            });
            expect(&label, got, admission_error, &step["result"]);
            same_bytes(&format!("{label} tree"), &tree_of(&root), &step["tree"]);
        }
        fs::remove_dir_all(&root).ok();
    }
    assert_eq!(
        EFFECTIVE_EXECUTION_CONTRACT_FILE,
        "effective-execution-contract.json"
    );
}

// ---- reconciliation planner ------------------------------------------------------------------------------------

use fgos_execution_engine::planning::reconciliation::{
    apply_reconciliation, plan_reconciliation, ApplyGuard, ApplyLock, PlanRequest, ReconcileError,
    RuntimeView,
};

/// The views of the runtime inspection the recording took at this step; the inspection itself is not ported here.
struct RecordedViews {
    run: Value,
    assignment: Value,
}

impl RuntimeView for RecordedViews {
    fn inspect_run(&self, _root: &Path, _run_id: &str) -> Value {
        self.run.clone()
    }
    fn inspect_assignment(&self, _root: &Path, _assignment_id: &str) -> Value {
        self.assignment.clone()
    }
}

struct FreeLock;
struct Held;
impl ApplyGuard for Held {}
impl ApplyLock for FreeLock {
    fn try_acquire(&self, _fgos_dir: &Path) -> Option<Box<dyn ApplyGuard>> {
        Some(Box::new(Held))
    }
}

struct BusyLock;
impl ApplyLock for BusyLock {
    fn try_acquire(&self, _fgos_dir: &Path) -> Option<Box<dyn ApplyGuard>> {
        None
    }
}

fn reconcile_error(e: &ReconcileError) -> Value {
    json!({ "name": e.name, "message": e.message })
}

fn raw_tree(root: &Path) -> Value {
    fn walk(root: &Path, dir: &Path, out: &mut Vec<(String, Value)>) {
        let mut entries: Vec<_> = fs::read_dir(dir).unwrap().flatten().collect();
        entries.sort_by_key(|e| e.file_name());
        for entry in entries {
            let full = entry.path();
            let rel = full
                .strip_prefix(root)
                .unwrap()
                .to_string_lossy()
                .into_owned();
            if rel == ".fgos/locks" {
                continue;
            }
            if full.is_dir() {
                out.push((format!("{rel}/"), Value::Null));
                walk(root, &full, out);
            } else if rel.ends_with(".json") {
                let text = fs::read_to_string(&full).unwrap();
                out.push((rel, serde_json::from_str(&text).unwrap()));
            } else {
                out.push((rel, json!(fs::read_to_string(&full).unwrap())));
            }
        }
    }
    let mut out = Vec::new();
    if root.exists() {
        walk(root, root, &mut out);
    }
    out.sort_by(|a, b| a.0.encode_utf16().cmp(b.0.encode_utf16()));
    Value::Object(out.into_iter().collect())
}

#[cfg(unix)]
#[test]
fn reconciliation_plans_and_applies_each_repair_bound_to_the_facts_it_was_made_from() {
    let v = vector("reconciliation.json");
    for case in list(&v, "cases") {
        // A plan's action key hashes the absolute path of the run record, so the replay runs where the recording ran.
        let root = PathBuf::from(case["root"].as_str().unwrap());
        fs::remove_dir_all(&root).ok();
        fs::create_dir_all(root.join(".fgos")).unwrap();
        let mut plans: Vec<Value> = Vec::new();
        for (i, step) in array(&case["steps"]).iter().enumerate() {
            let label = format!("{} / step {}", case["name"], i + 1);
            for item in array(&step["setup"]) {
                let full = root.join(".fgos").join(item["path"].as_str().unwrap());
                fs::create_dir_all(full.parent().unwrap()).unwrap();
                fs::write(&full, serde_json::to_string_pretty(&item["json"]).unwrap()).unwrap();
            }
            for rel in array(&step["remove"]) {
                fs::remove_file(root.join(".fgos").join(rel.as_str().unwrap())).unwrap();
            }
            let views = RecordedViews {
                run: step["views"]["run"].clone(),
                assignment: step["views"]["assignment"].clone(),
            };
            let now = step["now"].as_str().unwrap();
            let got = if step["op"] == "plan" {
                let args = &step["args"];
                let plan = plan_reconciliation(
                    &views,
                    &root,
                    &PlanRequest {
                        action: args["action"].as_str(),
                        run_id: args["runId"].as_str(),
                        cwd: Path::new("/nowhere"),
                        now,
                        ttl_ms: args["ttlMs"].as_i64(),
                    },
                );
                if let Ok(plan) = &plan {
                    plans.push(plan.clone());
                }
                plan
            } else {
                apply_reconciliation(&views, &FreeLock, &root, &step["plan"], now)
            };
            expect(&label, got, reconcile_error, &step["result"]);
            same_bytes(&format!("{label} tree"), &raw_tree(&root), &step["tree"]);
        }
        fs::remove_dir_all(&root).ok();
    }
}

#[test]
fn reconciliation_apply_waits_its_turn_when_another_apply_holds_the_mutex() {
    let plan = json!({ "actionKey": "k", "snapshot": { "x": 1 }, "proposedAction": { "kind": "collect-result", "runId": "run_x_01", "path": "/x/run.json" } });
    let views = RecordedViews {
        run: json!({}),
        assignment: json!({}),
    };
    let got = apply_reconciliation(
        &views,
        &BusyLock,
        Path::new("/nowhere"),
        &plan,
        "2026-11-19T02:00:00.000Z",
    )
    .unwrap();
    assert_eq!(
        got,
        json!({ "outcome": "blocked", "reason": "another reconcile apply is in progress" })
    );
}
