//! Reconciliation planner: plan, then apply, one narrow repair of a guard or a projection of the dispatch
//! runtime, with the plan bound to the facts it was made from.
//!
//! A plan names an action, the snapshot of the facts it rests on, and a key that binds the two to an expiry; an
//! apply re-derives the plan from the trusted root and the run id alone, so a caller-supplied path is never the
//! mutation target until it is proven identical to what a fresh plan computes now.
//!
//! One door per decision. What a Run is, who owns it and what its result says is the runtime inspection's, reached
//! through [`RuntimeView`] (this planner re-derives none of it). The per-cwd dispatch lock is the run
//! supervisor's (`dispatch_cwd_holder`), the Run's real control epoch is its control ledger's
//! (`list_generations`), the canonical bytes of a hashed value are `fgos-canonical-json`'s, the civil time is
//! `fgos_host_runtime::civil_time`'s and a durable file replace is `fgos-durable-file`'s. The apply mutex is a
//! kernel lock the caller provides through [`ApplyLock`], so this module starts no process.

use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use fgos_canonical_json::canonical_json;
use fgos_durable_file::replace_durably_with_mode;
use fgos_execution::handoff::sha256_hex;
use fgos_host_runtime::civil_time::{format_unix_millis_rfc3339, parse_rfc3339_millis};
use fgos_run_supervisor::controller::cwd_lock::dispatch_cwd_holder;
use fgos_run_supervisor::controller::lease::list_generations;
use serde_json::{json, Value};

pub const RECONCILE_RUN_REQUIRES_ACTION: &str = "dispatch reconcile plan with --run requires --action (e.g. collect-result or repair-projection)";
const SETTLED_STATUS: &str = "settled";
const DEFAULT_TTL_MS: i64 = 300_000;

/// The read-only views of the dispatch runtime this planner reads: the `--run` and `--assignment` inspections. An
/// inspection that cannot answer ends the plan with its message, as the Node planner let it throw.
pub trait RuntimeView {
    fn inspect_run(&self, root: &Path, run_id: &str) -> Result<Value, String>;
    fn inspect_assignment(&self, root: &Path, assignment_id: &str) -> Result<Value, String>;
}

/// A held apply mutex; released when dropped.
pub trait ApplyGuard {}

/// One reconcile apply at a time per repo: the kernel mutex at `<fgosDir>/locks/reconcile.lock`, one try. A crashed
/// apply released it when it died, so nothing ever judges a holder alive or dead.
pub trait ApplyLock {
    fn try_acquire(&self, fgos_dir: &Path) -> Option<Box<dyn ApplyGuard>>;
}

/// A failure that is not an outcome: the filesystem, or a value the planner cannot read.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReconcileError {
    pub name: &'static str,
    pub message: String,
}

impl ReconcileError {
    fn io(error: io::Error) -> Self {
        ReconcileError {
            name: "Error",
            message: error.to_string(),
        }
    }

    fn inspection(message: String) -> Self {
        ReconcileError {
            name: "Error",
            message,
        }
    }

    fn invalid_time() -> Self {
        ReconcileError {
            name: "RangeError",
            message: "Invalid time value".into(),
        }
    }
}

impl std::fmt::Display for ReconcileError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for ReconcileError {}

type Outcome = Result<Value, ReconcileError>;

/// The project's `.fgos`, through the one join of a root onto it (Node's `fgosDirFromRoot`).
pub fn fgos_dir_of(root: &Path) -> PathBuf {
    PathBuf::from(fgos_execution::runner_config::fgos_dir_from_root(
        &root.to_string_lossy(),
    ))
}

fn action_log(root: &Path) -> PathBuf {
    fgos_dir_of(root)
        .join("dispatch")
        .join("reconciliation-actions.jsonl")
}

fn result_file(run_dir: &Path) -> PathBuf {
    run_dir.join("result.json")
}

/// The canonical form a plan is hashed and compared in; a number outside finite binary64 has none.
fn canonical(value: &Value) -> Result<String, ReconcileError> {
    canonical_json(value).map_err(|error| ReconcileError {
        name: "Error",
        message: format!("a reconcile plan value is not hashable: {error}"),
    })
}

fn digest(value: &Value) -> Result<String, ReconcileError> {
    Ok(format!(
        "sha256:{}",
        sha256_hex(canonical(value)?.as_bytes())
    ))
}

fn action_key(
    snapshot: &Value,
    action: &Value,
    expires_at: &str,
) -> Result<String, ReconcileError> {
    let bound = json!({ "snapshot": snapshot, "action": action, "expiresAt": expires_at });
    Ok(format!(
        "reconcile_{}",
        sha256_hex(canonical(&bound)?.as_bytes())
    ))
}

fn expires(now: &str, ttl_ms: i64) -> Result<String, ReconcileError> {
    parse_rfc3339_millis(now)
        .and_then(|ms| ms.checked_add(ttl_ms))
        .and_then(|ms| format_unix_millis_rfc3339(ms, 0))
        .ok_or_else(ReconcileError::invalid_time)
}

/// The Run's REAL control epoch, off its control ledger, never a `controlEpoch` copied onto some other blob.
fn real_control_epoch(run_dir: &Path) -> u64 {
    list_generations(&run_dir.join("control").join("generations"))
        .ok()
        .and_then(|generations| generations.last().map(|g| g.epoch))
        .unwrap_or(0)
}

fn outcome(kind: &str, reason: impl Into<String>) -> Outcome {
    Ok(json!({ "outcome": kind, "reason": reason.into() }))
}

fn nonblank(value: Option<&str>) -> Option<&str> {
    value.filter(|v| !v.trim().is_empty())
}

/// The result file of a run: its text, `None` when absent. Invalid UTF-8 reads with replacement characters.
fn read_result(run_dir: &Path) -> Result<Option<String>, ReconcileError> {
    match fs::read(result_file(run_dir)) {
        Ok(bytes) => Ok(Some(String::from_utf8_lossy(&bytes).into_owned())),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(ReconcileError::io(e)),
    }
}

/// What the inspection says about a Run, as the two actions read it.
enum Located {
    Done(Value),
    Run { run_dir: PathBuf, view: Value },
}

fn locate(
    view: &dyn RuntimeView,
    root: &Path,
    run_id: &str,
    action: &str,
) -> Result<Located, ReconcileError> {
    let run = view
        .inspect_run(root, run_id)
        .map_err(ReconcileError::inspection)?;
    let missing =
        || outcome("blocked", format!("no matching Run was found for {action}")).map(Located::Done);
    match run.get("inspectionStatus").and_then(Value::as_str) {
        Some("not-found") => return missing(),
        Some("ambiguous") => {
            return outcome(
                "needs-input",
                "more than one Run repository owns this run id",
            )
            .map(Located::Done)
        }
        _ => {}
    }
    let Some(path) = run
        .pointer("/subject/locations/0/path")
        .and_then(Value::as_str)
        .map(PathBuf::from)
    else {
        return missing();
    };
    Ok(Located::Run {
        run_dir: path,
        view: run,
    })
}

fn plan_collect_result(
    view: &dyn RuntimeView,
    root: &Path,
    run_id: Option<&str>,
    now: &str,
    ttl_ms: i64,
) -> Outcome {
    let Some(run_id) = nonblank(run_id) else {
        return outcome("refused", "collect-result requires a runId");
    };
    let (run_dir, run) = match locate(view, root, run_id, "collect-result")? {
        Located::Done(done) => return Ok(done),
        Located::Run { run_dir, view } => (run_dir, view),
    };
    let result = run.get("runResult").filter(|r| !r.is_null());
    let Some(result) = result else {
        return outcome("blocked", "no result exists yet to collect");
    };
    if super::truthy(result.get("corrupt")) || super::truthy(result.get("contractCorrupt")) {
        return outcome(
            "needs-input",
            "result is corrupt or fails RunResult validation and cannot be auto-collected",
        );
    }
    let Some(hint) = run.get("recoveryAuthority").filter(|h| !h.is_null()) else {
        return outcome(
            "needs-input",
            "owner authority for this Run is incomplete or inconsistent",
        );
    };
    let text = |key: &str| crate::assignment::js_str(hint.get(key));
    if hint.get("kind").and_then(Value::as_str) == Some("coordination-session") {
        return outcome(
            "refused",
            format!(
                "owning authority is a CoordinationSession (\"{}\"); result linking belongs to its own recovery door ({}), not dispatch.runtime.reconcile",
                text("id"),
                text("observeCommand")
            ),
        );
    }
    if let Some(assignment_id) = run
        .pointer("/links/assignmentIds/0")
        .and_then(Value::as_str)
    {
        let assignment = view
            .inspect_assignment(root, assignment_id)
            .map_err(ReconcileError::inspection)?;
        let current: Vec<&str> = assignment
            .pointer("/observations/0/value/currentRunIds")
            .and_then(Value::as_array)
            .map(|ids| ids.iter().filter_map(Value::as_str).collect())
            .unwrap_or_default();
        if !current.contains(&run_id) {
            let listed = if current.is_empty() {
                "none".to_string()
            } else {
                current.join(", ")
            };
            return outcome(
                "blocked",
                format!("a newer current Run supersedes this one for assignment \"{assignment_id}\" (current: {listed})"),
            );
        }
    }
    let Some(raw) = read_result(&run_dir)? else {
        return outcome("blocked", "no result exists yet to collect");
    };
    let expires_at = expires(now, ttl_ms)?;
    let snapshot = json!({
        "digest": digest(&json!({ "raw": raw }))?,
        "runId": run_id,
        "ownerAuthority": { "kind": hint.get("kind"), "id": hint.get("id") },
        "controlEpoch": real_control_epoch(&run_dir),
        "expiresAt": expires_at,
    });
    let action =
        json!({ "kind": "collect-result", "runId": run_id, "path": run_dir.join("run.json") });
    Ok(json!({
        "outcome": "planned",
        "actionKey": action_key(&snapshot, &action, &expires_at)?,
        "snapshot": snapshot,
        "proposedAction": action,
        "preconditions": ["result-valid", "owner-authority-standalone", "not-superseded"],
    }))
}

fn plan_repair_projection(
    view: &dyn RuntimeView,
    root: &Path,
    run_id: Option<&str>,
    now: &str,
    ttl_ms: i64,
) -> Outcome {
    let Some(run_id) = nonblank(run_id) else {
        return outcome("refused", "repair-projection requires a runId");
    };
    let (run_dir, run) = match locate(view, root, run_id, "repair-projection")? {
        Located::Done(done) => return Ok(done),
        Located::Run { run_dir, view } => (run_dir, view),
    };
    let Some(result) = run.get("runResult").filter(|r| !r.is_null()) else {
        return outcome(
            "blocked",
            "no terminal result exists yet to prove settlement",
        );
    };
    if super::truthy(result.get("corrupt")) || super::truthy(result.get("contractCorrupt")) {
        return outcome(
            "needs-input",
            "result is corrupt or fails RunResult validation and cannot prove settlement",
        );
    }
    let Some(raw) = read_result(&run_dir)? else {
        return outcome(
            "blocked",
            "no terminal result exists yet to prove settlement",
        );
    };
    let meta: Value = fs::read_to_string(run_dir.join("run.json"))
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_else(|| json!({}));
    let current_status = meta
        .get("status")
        .filter(|s| !s.is_null())
        .cloned()
        .unwrap_or(Value::Null);
    if current_status.as_str() == Some(SETTLED_STATUS) {
        return outcome(
            "blocked",
            "run.json.status already reflects settlement; nothing to repair",
        );
    }
    let expires_at = expires(now, ttl_ms)?;
    let snapshot = json!({
        "digest": digest(&json!({ "raw": raw }))?,
        "runId": run_id,
        "currentStatus": current_status,
        "controlEpoch": real_control_epoch(&run_dir),
        "expiresAt": expires_at,
    });
    let action =
        json!({ "kind": "repair-projection", "runId": run_id, "path": run_dir.join("run.json") });
    Ok(json!({
        "outcome": "planned",
        "actionKey": action_key(&snapshot, &action, &expires_at)?,
        "snapshot": snapshot,
        "proposedAction": action,
        "preconditions": ["terminal-result-valid", "status-stale", "projection-epoch-matches"],
    }))
}

/// What a plan is asked: the action (`clear-cwd-lock` by default), the run, the cwd and the instant.
pub struct PlanRequest<'a> {
    pub action: Option<&'a str>,
    pub run_id: Option<&'a str>,
    pub cwd: &'a Path,
    /// An RFC 3339 instant.
    pub now: &'a str,
    pub ttl_ms: Option<i64>,
}

/// The one action whose target is derivable from the action kind and the cwd alone.
fn canonical_action(kind: Option<&str>, cwd: Option<&str>) -> Option<Value> {
    (kind == Some("clear-cwd-lock")).then(|| json!({ "kind": kind, "cwd": cwd }))
}

pub fn plan_reconciliation(
    view: &dyn RuntimeView,
    root: &Path,
    request: &PlanRequest<'_>,
) -> Outcome {
    let action = request.action.unwrap_or("clear-cwd-lock");
    let ttl_ms = request.ttl_ms.unwrap_or(DEFAULT_TTL_MS);
    if request.run_id.is_some() && (action.is_empty() || action == "clear-cwd-lock") {
        return outcome("refused", RECONCILE_RUN_REQUIRES_ACTION);
    }
    match action {
        "collect-result" => {
            return plan_collect_result(view, root, request.run_id, request.now, ttl_ms)
        }
        "repair-projection" => {
            return plan_repair_projection(view, root, request.run_id, request.now, ttl_ms)
        }
        "clear-cwd-lock" => {}
        other => {
            return outcome(
                "refused",
                format!("unsupported reconciliation action: {other}"),
            )
        }
    }
    // The per-cwd dispatch lock is a kernel lock: a holder that dies has already released it, so there is never a
    // dead holder's lock to clear. The plan only reports whether a live dispatch holds it.
    if dispatch_cwd_holder(&fgos_dir_of(root), request.cwd).is_some() {
        return outcome("refused", "cwd lock is held by a live dispatch");
    }
    outcome("blocked", "no cwd lock is held")
}

fn applied_records(root: &Path) -> Vec<Value> {
    fs::read_to_string(action_log(root))
        .ok()
        .and_then(|text| {
            text.trim()
                .split('\n')
                .filter(|line| !line.is_empty())
                .map(|line| serde_json::from_str::<Value>(line).ok())
                .collect::<Option<Vec<_>>>()
        })
        .unwrap_or_default()
}

/// The two actions that rewrite a run record. Their re-derivation and their write differ; the guards do not.
enum Rewrite {
    CollectResult,
    RepairProjection,
}

impl Rewrite {
    fn plan(
        &self,
        view: &dyn RuntimeView,
        root: &Path,
        run_id: &str,
        now: &str,
        ttl_ms: i64,
    ) -> Outcome {
        match self {
            Rewrite::CollectResult => plan_collect_result(view, root, Some(run_id), now, ttl_ms),
            Rewrite::RepairProjection => {
                plan_repair_projection(view, root, Some(run_id), now, ttl_ms)
            }
        }
    }

    fn stale_facts(&self) -> &'static str {
        match self {
            Rewrite::CollectResult => "run facts changed since planning",
            Rewrite::RepairProjection => "projection facts changed since planning",
        }
    }

    /// `{ ...runMeta, resultCollectedAt: now }` or `{ ...runMeta, status: 'settled', settledAt: now }`.
    fn rewritten(&self, mut meta: Value, now: &str) -> Value {
        if let Some(map) = meta.as_object_mut() {
            match self {
                Rewrite::CollectResult => {
                    map.insert("resultCollectedAt".into(), json!(now));
                }
                Rewrite::RepairProjection => {
                    map.insert("status".into(), json!(SETTLED_STATUS));
                    map.insert("settledAt".into(), json!(now));
                }
            }
        }
        meta
    }
}

fn stale(reason: &str) -> Outcome {
    outcome("plan-stale", reason)
}

fn apply_rewrite(
    view: &dyn RuntimeView,
    lock: &dyn ApplyLock,
    root: &Path,
    plan: &Value,
    now: &str,
    rewrite: Rewrite,
) -> Outcome {
    let run_id = plan
        .pointer("/proposedAction/runId")
        .and_then(Value::as_str);
    let key = plan
        .get("actionKey")
        .and_then(Value::as_str)
        .filter(|k| !k.is_empty());
    let (Some(run_id), Some(key), true) =
        (nonblank(run_id), key, super::truthy(plan.get("snapshot")))
    else {
        return outcome(
            "refused",
            "apply requires a reconcile plan for a supported action",
        );
    };
    let Some(_guard) = lock.try_acquire(&fgos_dir_of(root)) else {
        return outcome("blocked", "another reconcile apply is in progress");
    };
    fs::create_dir_all(action_log(root).parent().unwrap_or(root)).map_err(ReconcileError::io)?;
    if let Some(prior) = applied_records(root)
        .iter()
        .find(|r| r.get("actionKey").and_then(Value::as_str) == Some(key))
    {
        return Ok(
            json!({ "outcome": "already-applied", "priorOutcome": prior.get("outcome"), "actionKey": key }),
        );
    }
    let expires_at = plan
        .pointer("/snapshot/expiresAt")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let (now_ms, expires_ms) = (parse_rfc3339_millis(now), parse_rfc3339_millis(expires_at));
    if let (Some(now_ms), Some(expires_ms)) = (now_ms, expires_ms) {
        if now_ms > expires_ms {
            return stale("reconcile plan expired");
        }
    }
    // Full re-derivation from root and run id alone: the caller-supplied path is never trusted as the mutation
    // target until it is proven identical to what a fresh, from-scratch plan computes right now.
    let ttl_ms = (expires_ms.ok_or_else(ReconcileError::invalid_time)?
        - now_ms.ok_or_else(ReconcileError::invalid_time)?)
    .max(0);
    let fresh = rewrite.plan(view, root, run_id, now, ttl_ms)?;
    let planned = fresh.get("outcome").and_then(Value::as_str) == Some("planned");
    let same = |key: &str| -> Result<bool, ReconcileError> {
        Ok(match fresh.get(key).zip(plan.get(key)) {
            Some((a, b)) => canonical(a)? == canonical(b)?,
            None => false,
        })
    };
    if !(planned && same("proposedAction")? && same("snapshot")?) {
        let kind = if fresh.get("outcome").and_then(Value::as_str) == Some("blocked") {
            "blocked"
        } else {
            "plan-stale"
        };
        let reason = fresh
            .get("reason")
            .and_then(Value::as_str)
            .unwrap_or(rewrite.stale_facts());
        return outcome(kind, reason);
    }
    let expected = action_key(
        &fresh["snapshot"],
        &fresh["proposedAction"],
        fresh
            .pointer("/snapshot/expiresAt")
            .and_then(Value::as_str)
            .unwrap_or_default(),
    )?;
    if key != expected {
        return stale("reconcile action key does not bind the canonical snapshot and target");
    }
    let target = PathBuf::from(
        plan.pointer("/proposedAction/path")
            .and_then(Value::as_str)
            .unwrap_or_default(),
    );
    let run_dir = target.parent().unwrap_or(root).to_path_buf();
    // Re-read before the write: the goal state is never satisfied by an absent file, so a missing result is always
    // a stale plan (facts changed), never "goal already achieved".
    let Some(raw) = read_result(&run_dir)? else {
        return stale("the result was removed since planning");
    };
    if digest(&json!({ "raw": raw }))?
        != plan
            .pointer("/snapshot/digest")
            .and_then(Value::as_str)
            .unwrap_or_default()
    {
        return stale("the result changed since planning");
    }
    let meta: Value = match fs::read_to_string(&target) {
        Ok(text) => serde_json::from_str(&text).map_err(|e| ReconcileError {
            name: "SyntaxError",
            message: e.to_string(),
        })?,
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            return stale("the run record was removed since planning")
        }
        Err(e) => return Err(ReconcileError::io(e)),
    };
    let mut text = serde_json::to_string_pretty(&rewrite.rewritten(meta, now)).map_err(|e| {
        ReconcileError {
            name: "Error",
            message: e.to_string(),
        }
    })?;
    text.push('\n');
    let dir = target.parent().unwrap_or(root);
    let name = target
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("run.json");
    replace_durably_with_mode(dir, name, text.as_bytes(), 0o644)
        .map_err(|e| ReconcileError::io(e.source))?;
    let mut log = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(action_log(root))
        .map_err(ReconcileError::io)?;
    writeln!(
        log,
        "{}",
        json!({ "actionKey": key, "outcome": "applied", "at": now })
    )
    .map_err(ReconcileError::io)?;
    Ok(json!({ "outcome": "applied", "actionKey": key }))
}

/// Applies a plan: only the actions this module plans, each re-derived and re-checked under the apply mutex.
pub fn apply_reconciliation(
    view: &dyn RuntimeView,
    lock: &dyn ApplyLock,
    root: &Path,
    plan: &Value,
    now: &str,
) -> Outcome {
    let kind = plan.pointer("/proposedAction/kind").and_then(Value::as_str);
    match kind {
        Some("collect-result") => {
            return apply_rewrite(view, lock, root, plan, now, Rewrite::CollectResult)
        }
        Some("repair-projection") => {
            return apply_rewrite(view, lock, root, plan, now, Rewrite::RepairProjection)
        }
        _ => {}
    }
    let cwd = plan.pointer("/proposedAction/cwd").and_then(Value::as_str);
    let canonical_target = canonical_action(kind, cwd);
    let key_set = plan
        .get("actionKey")
        .is_some_and(|k| super::truthy(Some(k)));
    let (true, true, Some(target)) = (
        key_set,
        super::truthy(plan.get("snapshot")),
        canonical_target,
    ) else {
        return outcome(
            "refused",
            "apply requires a reconcile plan for a supported action",
        );
    };
    if plan.get("proposedAction").map(canonical).transpose()? != Some(canonical(&target)?) {
        return stale("reconcile action target is not the canonical guard target");
    }
    // clear-cwd-lock never plans a mutation (a kernel lock has no dead holder's file to clear), so applying one only
    // reports today's facts.
    let fresh = plan_reconciliation(
        view,
        root,
        &PlanRequest {
            action: kind,
            run_id: None,
            cwd: Path::new(cwd.unwrap_or_default()),
            now,
            ttl_ms: None,
        },
    )?;
    let blocked = fresh.get("outcome").and_then(Value::as_str) == Some("blocked");
    Ok(
        json!({ "outcome": if blocked { "blocked" } else { "plan-stale" }, "reason": fresh.get("reason") }),
    )
}
