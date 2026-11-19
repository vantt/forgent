//! The run loop: one Unit end to end, the one execution door. Ported from `runUnit` and what it calls in
//! `runner/execution/run.mjs` (and the git-backed halves of `unit-sync.mjs` and `commit-unit-work.mjs`).
//!
//! Admission or resume ([`super::start`]), the record marked running, the seats a resume binds again, the pattern
//! run over the pure loop of `fgos-execution` ([`LoopRun`]), each seat bound and launched through the host's
//! assignment runner, a provider limit answered ([`super::provider_limit`]), a passing writing round committed
//! through the Git door after the admission's consent is checked again, and the end of the run settled once: the
//! record, the case reservation and the caller read one outcome.
//!
//! What it writes: `unit.json` (through the durable-file door, Node's bytes) and nothing else of its own; every
//! other file is the door's that owns it.

use std::cell::OnceCell;
use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard, PoisonError};
use std::time::{Duration, Instant};

use fgos_execution::admission::{
    brief_never_reached, no_brief_delivered, normalize_case_ref, seat_launches_used,
    unit_run_settle, CaseAdmission, Recheck, UnitFacts, SEAT_LAUNCH_CEILING,
};
use fgos_execution::loops::{
    loop_runs_verify, verify_command_of, Command, LoopInput, LoopResult, LoopRun, RoleCall, Step,
};
use fgos_execution::outcome::{
    evaluations_of, infrastructure, is_infrastructure, outcome_after_scope_rule, rebinds_on_resume,
    NOT_STARTED_OUTCOME,
};
use fgos_execution::seat_resolver::{SeatLedger, VERIFY_SEAT};
use fgos_git::{CommitBaseline, CommitRequest};
use fgos_holder_lock::Handle;
use fgos_run_supervisor::controller::cwd_lock::record_custody_handoff;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

use super::git_port::{
    foreign_index_detail, partition_paths, CommitArgs, Preflight, ResumeCommit, UnitGit,
};
use super::history::{outcome_of_run_result, read_unit_run_history};
use super::host::{SeatDispatch, UnitRunHost};
use super::partial_writes::{writes_since, WorktreeSnapshot};
use super::provider_limit::{
    answer_provider_limit, is_lease_conflict, launched_from, present, LimitAsk,
};
use super::record::publish_unit_record;
use super::run_unit_contract::{ok_result, RunUnitError};
use super::start::{
    admit_fresh_unit, left_by_dead_controller, load_resumed_unit, random_hex, truthy,
    writes_worktree, HeldCase, RunScope, StartBase, Started,
};
use super::sync::{
    effective_write_scope, owes_sync_only_pass, refused_sync_outcome, sync_brief, sync_only_pass,
    sync_summary,
};
use super::verify::{answer_of_verify, Verdict};
use crate::accounts::rotation::{credential_fault_pools, kept_binding_of};
use crate::planning::bind_facade::{ask_for, AskOptions, SeatRequest};

/// The error class of a cancelled run: never settled, the resume carries on.
pub const RUN_CANCELLED: &str = "run-cancelled";

type Res<T> = Result<T, RunUnitError>;

fn config(message: impl Into<String>) -> RunUnitError {
    RunUnitError::config(message, None, None)
}

fn git_error(cause: impl Into<String>) -> RunUnitError {
    RunUnitError::other("git-error", cause)
}

fn strs(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|v| v.as_str().map(str::to_string))
        .collect()
}

fn text(value: Option<&Value>) -> Option<&str> {
    value.and_then(Value::as_str)
}

fn object(value: &Value) -> Map<String, Value> {
    value.as_object().cloned().unwrap_or_default()
}

fn assert_not_cancelled<H: UnitRunHost>(host: &H) -> Res<()> {
    if host.cancelled() {
        return Err(RunUnitError::other(RUN_CANCELLED, "the run was cancelled"));
    }
    Ok(())
}

/// A problem the caller should know of: a structured warning on the result, and a line on stderr for a person.
fn warn_unit(scope: &mut RunScope, code: &str, message: String) {
    eprintln!("fgos: {message}");
    scope
        .warnings
        .push(json!({ "code": code, "message": message }));
}

/// Run one unit headless and return its result as the `run-unit` result document: `{ ok: true, result }`, or an
/// error with its type tag.
pub fn run_unit_result<H: UnitRunHost + Sync>(options: &Value, host: &H) -> Value {
    match run_unit(options, host) {
        Ok(result) => ok_result(result),
        Err(error) => error.to_json(),
    }
}

/// Run one unit headless: the one execution door. `options` are the `run-unit` request options.
pub fn run_unit<H: UnitRunHost + Sync>(options: &Value, host: &H) -> Res<Value> {
    assert_not_cancelled(host)?;
    let mut scope = RunScope::default();
    let outcome = run_unit_body(options, host, &mut scope);
    if outcome.is_ok() {
        // Hands the worktree's custody domain back; a failure to record that is a warning, not an error.
        if let Some(warning) = record_custody_handoff(scope.custody.as_ref()) {
            scope
                .warnings
                .push(json!({ "code": warning["code"], "message": warning["detail"] }));
        }
    }
    drop(scope.custody.take());
    if let Some(mut control) = scope.control.take() {
        // A seat that cannot be released is taken over as a dead holder.
        let _ = control.release();
    }
    // After custody is released: the worktree is quiet, so the port may release the binding it took for this run.
    let cancelled = matches!(&outcome, Err(e) if e.error_class == RUN_CANCELLED);
    settle_admission(host, &mut scope, outcome.as_ref().ok(), cancelled);
    outcome.map(|mut result| {
        // What settles after the result is built (the case reservation) reaches the caller too.
        if let Some(object) = result.as_object_mut() {
            object.insert("settled".into(), settled_of(&scope));
            object.insert("warnings".into(), json!(scope.warnings));
        }
        result
    })
}

fn settled_of(scope: &RunScope) -> Value {
    let mut out = Map::new();
    out.insert("unit".into(), json!(scope.settled_unit));
    out.insert(
        "case".into(),
        scope.settled_case.map_or(Value::Null, Value::Bool),
    );
    if let Some(error) = &scope.settle_error {
        out.insert("settleError".into(), json!(error));
    }
    Value::Object(out)
}

/// Seat launches (never retries) against the ceiling the case admission gave this run.
pub fn launches_of(scope: &RunScope) -> Value {
    let record = scope.unit_record.as_ref();
    json!({
        "ceiling": record.and_then(|r| r.get("seatLaunchCeiling")).filter(|v| !v.is_null()).cloned().unwrap_or(Value::Null),
        "used": record.map_or(0, seat_launches_used),
        "ceilingHit": scope.ceiling_hit,
    })
}

/// The facts of a Unit run that ended in an error before it produced a result: nothing was judged, nothing is
/// known to have been written.
pub fn failed_unit_facts(scope: &RunScope, held: &HeldCase) -> Value {
    json!({
        "outcome": if held.started { "execution-failure" } else { NOT_STARTED_OUTCOME },
        "infrastructure": true,
        "outOfScope": [],
        "outOfScopeOnBranch": [],
        "evaluations": [],
        "started": { "value": held.started, "reason": if held.started { Value::Null } else { json!("failed-before-start") } },
        "launches": launches_of(scope),
        "results": [],
    })
}

fn unit_facts_of(unit: &Value) -> UnitFacts {
    let list = |key: &str| {
        unit.get(key)
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default()
    };
    UnitFacts {
        outcome: text(unit.get("outcome")).unwrap_or_default().to_string(),
        infrastructure: unit.get("infrastructure") == Some(&json!(true)),
        out_of_scope: list("outOfScope"),
        out_of_scope_on_branch: list("outOfScopeOnBranch"),
        evaluations: list("evaluations"),
        started: unit.get("started").cloned().unwrap_or(Value::Null),
        launches: unit.get("launches").cloned().unwrap_or(Value::Null),
        results: list("results"),
    }
}

/// Hand the reservation back, once, with the Unit shape of the result. A cancelled run is not settled: it stays
/// live, and the resume carries on. A settle that fails is told on the result and as a warning, never thrown.
fn settle_admission<H: UnitRunHost>(
    host: &H,
    scope: &mut RunScope,
    result: Option<&Value>,
    cancelled: bool,
) {
    let Some(held) = scope.admission.clone() else {
        return;
    };
    if held.settled || cancelled {
        return;
    }
    let Some(port) = host.admission() else { return };
    if let Some(h) = scope.admission.as_mut() {
        h.settled = true;
    }
    let unit = result
        .cloned()
        .unwrap_or_else(|| failed_unit_facts(scope, &held));
    let settle = unit_run_settle(
        &held.case_id,
        Some(&held.unit_run_id),
        &unit_facts_of(&unit),
    );
    match port.settle(&held.reservation_id, &settle) {
        Ok(()) => scope.settled_case = Some(true),
        Err(error) => {
            scope.settled_case = Some(false);
            scope.settle_error = Some(error.to_string());
            warn_unit(
                scope,
                "case-settle-failed",
                format!(
                    "could not settle reservation \"{}\" of case \"{}\": {error}",
                    held.reservation_id, held.case_id
                ),
            );
        }
    }
}

fn run_unit_body<H: UnitRunHost + Sync>(
    options: &Value,
    host: &H,
    scope: &mut RunScope,
) -> Res<Value> {
    if options.get("resumeUnitRunId").is_some_and(|v| !v.is_null())
        && options.get("stanceOptions").is_some()
    {
        return Err(config("cannot provide stanceOptions when resuming a unit run: the stored question is immutable"));
    }
    let cwd = text(options.get("cwd"))
        .map(PathBuf::from)
        .or_else(|| std::env::current_dir().ok())
        .unwrap_or_default();
    let roots = host.git_roots(&cwd, true).map_err(|why| {
        config(format!(
            "fgos run must run inside a git repository (cwd: {}): {why}",
            cwd.display()
        ))
    });
    let main_root = text(options.get("repoRoot"))
        .map(|r| std::path::absolute(r).unwrap_or_else(|_| PathBuf::from(r)))
        .or_else(|| roots.as_ref().ok().map(|r| r.main_checkout_root.clone()));
    // Private homes of earlier runs whose pane has closed hold a login copy: reclaimed, best effort.
    if let Some(root) = &main_root {
        host.sweep_attempts(&host.fgos_dir(root).join("assignments"));
    }
    let roots = roots?;
    let main_root = main_root.unwrap_or_else(|| roots.main_checkout_root.clone());
    let case_ref = normalize_case_ref(options.get("caseRef")).map_err(|e| config(e.to_string()))?;
    let fgos_dir = host.fgos_dir(&main_root);
    let base = StartBase {
        options,
        worktree: text(options.get("worktree"))
            .map(|w| std::path::absolute(w).unwrap_or_else(|_| PathBuf::from(w)))
            .unwrap_or_else(|| roots.worktree_root.clone()),
        assignments_dir: fgos_dir.join("assignments"),
        fgos_dir,
        main_root,
        case_ref,
        live: OnceCell::new(),
        not_a_repository: roots.not_a_repository,
        cwd,
    };
    let resuming = options.get("resumeUnitRunId").is_some_and(|v| !v.is_null());
    let started = if resuming {
        load_resumed_unit(host, &base, scope)?
    } else {
        admit_fresh_unit(host, &base, scope)?
    };
    // The custody of a writing run is held here, outside the run's shared state, so seats that run together
    // borrow it while the record is locked by one of them at a time.
    let custody = scope.custody.take();
    let outcome = run_started(host, &base, scope, started, resuming, custody.as_ref());
    scope.custody = custody;
    outcome
}

/// What the seats of one run share: the run's record and its scope, one holder at a time.
struct State<'h, 'c, H: UnitRunHost> {
    ctx: Ctx<'h, 'c, H>,
    scope: RunScope,
}

type Shared<'h, 'c, H> = Mutex<State<'h, 'c, H>>;

fn lock<T>(shared: &Mutex<T>) -> MutexGuard<'_, T> {
    shared.lock().unwrap_or_else(PoisonError::into_inner)
}

fn run_started<'h, H: UnitRunHost + Sync>(
    host: &'h H,
    base: &StartBase<'h>,
    scope: &mut RunScope,
    started: Started,
    resuming: bool,
    custody: Option<&Handle>,
) -> Res<Value> {
    let ctx = Ctx::open(host, base, scope, started, resuming, custody)?;
    let shared = Mutex::new(State {
        ctx,
        scope: std::mem::take(scope),
    });
    let seated = lock(&shared).ctx.seat_state();
    let outcome = seated.and_then(|()| run_collaboration(&shared, host));
    let State {
        mut ctx,
        scope: mut inner,
    } = shared.into_inner().unwrap_or_else(PoisonError::into_inner);
    let outcome = match outcome {
        Ok(result) => Ok(result),
        Err(error) => {
            // A cancelled run is not a failed one. A settlement that cannot be recorded is told beside the error.
            if !ctx.settled && error.error_class != RUN_CANCELLED {
                let failed = json!({ "outcome": "execution-failure", "infrastructure": true, "infrastructureReason": "run-error", "refused": [] });
                if let Err(settle_error) = ctx.settle_unit_run(&mut inner, &failed, None) {
                    eprintln!(
                        "fgos: could not record the failed settlement of unit run \"{}\": {}",
                        ctx.unit_run_id, settle_error.message
                    );
                }
            }
            Err(error)
        }
    };
    *scope = inner;
    outcome
}

/// What one seat of the pattern is.
struct Role {
    seat: Value,
    seat_id: String,
    round: u64,
    inputs: Vec<Value>,
    unit: Value,
    key: String,
    read_only: bool,
    session: Value,
    independent_of: Vec<String>,
    prefer_independent_of: Vec<String>,
    batch: Option<usize>,
    write_scope: Vec<Value>,
}

impl Role {
    /// `{ seat, role, posture }` of a seat result.
    fn tag(&self, into: &mut Map<String, Value>) {
        into.insert("seat".into(), json!(self.seat_id));
        if let Some(role) = self.seat.get("role") {
            into.insert("role".into(), role.clone());
        }
        if let Some(posture) = self.seat.get("posture") {
            into.insert("posture".into(), posture.clone());
        }
    }

    fn result(&self, outcome: &str) -> Map<String, Value> {
        let mut out = Map::new();
        out.insert("outcome".into(), json!(outcome));
        self.tag(&mut out);
        out.insert("round".into(), json!(self.round));
        out
    }

    fn refused(&self, refused: Value) -> Value {
        let mut out = self.result("policy-refusal");
        out.insert("refused".into(), refused);
        Value::Object(out)
    }

    fn scope_strings(&self) -> Vec<String> {
        self.write_scope
            .iter()
            .filter_map(|v| v.as_str().map(str::to_string))
            .collect()
    }
}

/// The directory segment and assignment-id tail of a seat's attempt `n` in `round`: `1`, then `1-fb1`, ...
fn attempt_suffix(round: u64, n: usize) -> String {
    if n == 0 {
        round.to_string()
    } else {
        format!("{round}-fb{n}")
    }
}

struct Ctx<'h, 'c, H: UnitRunHost> {
    host: &'h H,
    options: &'h Value,
    /// The config read live, once (Node's `liveConfig`).
    live: OnceCell<Value>,
    main_root: PathBuf,
    assignments_dir: PathBuf,
    unit_dir: PathBuf,
    unit: Value,
    unit_run_id: String,
    record: Value,
    declared_op: Option<Value>,
    runner_for_loop: Option<Value>,
    settled: bool,
    seat_launch_ceiling: Option<u64>,
    overrides: Vec<Value>,
    workflow_id: Option<String>,
    raise_authorized: bool,
    blind: bool,
    seat_ledger: SeatLedger,
    rebind_keys: Vec<String>,
    fault_pools: Vec<String>,
    verify_round: u64,
    verify_facts: Option<Value>,
    git: Option<(fgos_git::GitDriver, fgos_git::RepoHandle)>,
    /// The unit's custody of its worktree, held from admission until the run ends.
    custody: Option<&'c Handle>,
}

impl<'h, 'c, H: UnitRunHost> Ctx<'h, 'c, H> {
    /// The unit run marked running on disk, with what every later step of it reads.
    fn open(
        host: &'h H,
        base: &StartBase<'h>,
        scope: &mut RunScope,
        started: Started,
        resuming: bool,
        custody: Option<&'c Handle>,
    ) -> Res<Self> {
        let Started {
            unit,
            unit_run_id,
            mut unit_record,
            declared_op,
            runner_config_for_loop,
        } = started;
        if writes_worktree(&unit, unit_record.get("sync"))
            && unit_record.get("gitWriter").is_none_or(Value::is_null)
        {
            unit_record["gitWriter"] = json!(host.git_writer());
        }
        let unit_dir = base.assignments_dir.join(&unit_run_id);
        let mut ctx = Ctx {
            host,
            options: base.options,
            live: base.live.clone(),
            main_root: base.main_root.clone(),
            assignments_dir: base.assignments_dir.clone(),
            unit_dir,
            blind: unit.get("blind") == Some(&json!(true)),
            unit,
            unit_run_id,
            seat_launch_ceiling: unit_record.get("seatLaunchCeiling").and_then(Value::as_u64),
            overrides: unit_record
                .get("overrides")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default(),
            workflow_id: text(unit_record.get("workflowId")).map(str::to_string),
            raise_authorized: base.options.get("raiseAuthorized") == Some(&json!(true)),
            record: unit_record,
            declared_op,
            runner_for_loop: runner_config_for_loop,
            settled: false,
            seat_ledger: SeatLedger::new(),
            rebind_keys: Vec::new(),
            fault_pools: Vec::new(),
            verify_round: 0,
            verify_facts: None,
            git: None,
            custody,
        };
        ctx.prepare(scope, resuming)?;
        Ok(ctx)
    }

    fn prepare(&mut self, scope: &mut RunScope, resuming: bool) -> Res<()> {
        let ctx = self;
        if resuming {
            ctx.assert_sync_resumable()?;
        }
        scope.unit_record = Some(ctx.record.clone());
        if resuming {
            let summary = ctx.unit_dir.join("unit-summary.json");
            match std::fs::symlink_metadata(&summary) {
                Ok(meta) if meta.is_file() => std::fs::remove_file(&summary).map_err(|e| {
                    config(format!(
                        "cannot invalidate published summary before resuming \"{}\": {e}",
                        ctx.unit_run_id
                    ))
                })?,
                Ok(_) => {}
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                Err(e) => {
                    return Err(config(format!(
                        "cannot invalidate published summary before resuming \"{}\": {e}",
                        ctx.unit_run_id
                    )))
                }
            }
        }
        if let Some(record) = ctx.record.as_object_mut() {
            record.shift_remove("settlement");
            record.insert("execution".into(), json!({ "status": "running" }));
        }
        ctx.persist(scope)
    }

    fn persist(&self, scope: &mut RunScope) -> Res<()> {
        scope.unit_record = Some(self.record.clone());
        publish_unit_record(&self.unit_dir, &self.record)
            .map_err(|e| RunUnitError::other("unit-record-not-written", e))
    }

    fn worktree(&self) -> PathBuf {
        PathBuf::from(text(self.record.get("worktree")).unwrap_or_default())
    }

    fn writer(&self) -> String {
        text(self.record.get("gitWriter"))
            .map(str::to_string)
            .unwrap_or_else(|| self.host.git_writer())
    }

    fn open_git(&mut self) -> Res<()> {
        if self.git.is_none() {
            self.git = Some(
                self.host
                    .git(&self.worktree(), &self.main_root)
                    .map_err(git_error)?,
            );
        }
        Ok(())
    }

    /// The Git door over the unit's worktree, under the unit's custody when `held`.
    fn with_git<T>(&mut self, held: bool, f: impl FnOnce(&UnitGit<'_>) -> T) -> Res<T> {
        self.open_git()?;
        let writer = self.writer();
        let (driver, repo) = self.git.as_ref().expect("opened");
        let custody = if held { self.custody } else { None };
        Ok(f(&UnitGit {
            driver,
            repo,
            custody,
            writer: &writer,
        }))
    }

    fn snapshot_runner(&self) -> Value {
        self.record
            .pointer("/configSnapshot/runner")
            .cloned()
            .unwrap_or_else(|| json!({}))
    }

    fn with_accounts(&self, runner: &Value) -> Res<Value> {
        super::start::with_accounts(self.host, self.options, &self.main_root, runner)
    }

    /// The config read live, read at first use.
    fn live_config(&self) -> Res<Value> {
        if let Some(cfg) = self.live.get() {
            return Ok(cfg.clone());
        }
        let cfg = match self.options.get("runnerConfig").filter(|c| !c.is_null()) {
            Some(c) => c.clone(),
            None => self.host.load_runner_config(&self.main_root)?,
        };
        Ok(self.live.get_or_init(|| cfg).clone())
    }

    fn bindings_mut(&mut self) -> &mut Map<String, Value> {
        if !self.record.get("bindings").is_some_and(Value::is_object) {
            self.record["bindings"] = json!({});
        }
        self.record["bindings"]
            .as_object_mut()
            .expect("bindings is an object")
    }

    fn attempts(&self, key: &str) -> Vec<Value> {
        self.record
            .pointer(&format!(
                "/bindings/{}",
                key.replace('~', "~0").replace('/', "~1")
            ))
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default()
    }

    fn attempt_mut(&mut self, key: &str, n: usize) -> &mut Value {
        let list = self
            .bindings_mut()
            .entry(key.to_string())
            .or_insert_with(|| json!([]));
        &mut list.as_array_mut().expect("attempts are an array")[n]
    }

    /// Before a resume: a merge the run left open must still be open (or concluded), never silently restarted.
    fn assert_sync_resumable(&mut self) -> Res<()> {
        let Some(sync) = self.record.get("sync").filter(|s| s.is_object()).cloned() else {
            return Ok(());
        };
        let id = self.unit_run_id.clone();
        let status = text(sync.get("status"));
        if status == Some("failed") && text(sync.get("reason")) == Some("committed-set-mismatch") {
            if let Some(sha) = text(sync.pointer("/commit/sha")).filter(|s| !s.is_empty()) {
                let sha = sha.to_string();
                let on_branch = self
                    .with_git(false, |g| g.commit_on_branch(&sha))?
                    .map_err(|e| git_error(e.cause))?;
                if on_branch {
                    let list = |k: &str| {
                        let l = strs(sync.get(k));
                        if l.is_empty() {
                            "none".to_string()
                        } else {
                            l.join(", ")
                        }
                    };
                    return Err(config(format!(
                        "cannot resume unit run \"{id}\": {} (unexpected: {}; missing: {}); inspect it and take it off the branch by hand (git reset --hard {} drops it with its files), then resume",
                        text(sync.get("error")).unwrap_or("undefined"),
                        list("unexpected"),
                        list("missing"),
                        text(sync.get("head")).unwrap_or("undefined"),
                    )));
                }
            }
        }
        if status != Some("conflicted") {
            return Ok(());
        }
        let operation = text(sync.get("operationId"))
            .unwrap_or_default()
            .to_string();
        let state = self
            .with_git(true, |g| g.sync_merge_state(&operation))?
            .map_err(|e| git_error(e.cause))?;
        match text(state.get("state")) {
            Some("in-progress") => {
                if state["rejected"] == json!(true)
                    && sync.get("nextOperationId").is_none_or(Value::is_null)
                {
                    self.record["sync"]["nextOperationId"] = json!(uuid()?);
                }
                Ok(())
            }
            Some("done") => {
                let s = &mut self.record["sync"];
                s["status"] = json!("merged");
                s["commit"] = json!({ "by": "outside" });
                s["nativeHead"] = state["head"].clone();
                Ok(())
            }
            other => {
                let what = if other == Some("not-started") {
                    "was aborted in the worktree".to_string()
                } else {
                    format!(
                        "is no longer in progress (MERGE_HEAD {}, HEAD {})",
                        text(state.get("mergeHead")).unwrap_or("none"),
                        text(state.get("head")).unwrap_or_default()
                    )
                };
                Err(config(format!(
                    "cannot resume unit run \"{id}\": the merge of {} ({}) it left for the worker {what}; start a new run",
                    text(sync.get("ref")).unwrap_or_default(),
                    text(sync.get("sha")).unwrap_or_default()
                )))
            }
        }
    }

    /// A producer attempt whose agent turn passed but whose runner commit failed, which a resume commits again
    /// without the agent; not when that commit is still on the branch with paths outside the scope.
    fn commit_pending(&mut self, attempt: Option<&Value>) -> Res<bool> {
        let Some(attempt) = attempt else {
            return Ok(false);
        };
        if text(attempt.pointer("/commitOperation/state")) == Some("pending") {
            return Ok(true);
        }
        let commit = attempt.get("commit");
        if text(commit.and_then(|c| c.get("status"))) != Some("failed") {
            return Ok(false);
        }
        let mismatch = text(commit.and_then(|c| c.get("reason"))) == Some("committed-set-mismatch");
        let sha = text(commit.and_then(|c| c.get("sha")))
            .filter(|s| !s.is_empty())
            .map(str::to_string);
        match (mismatch, sha) {
            (true, Some(sha)) => {
                let on = self
                    .with_git(true, |g| g.commit_on_branch(&sha))?
                    .map_err(|e| git_error(e.cause))?;
                Ok(!on)
            }
            _ => Ok(true),
        }
    }

    /// The seats a resume binds again, the ledger of which executors filled which seat, and the pools whose
    /// login failed in this unit.
    fn seat_state(&mut self) -> Res<()> {
        self.bindings_mut();
        let resuming = self
            .options
            .get("resumeUnitRunId")
            .is_some_and(|v| !v.is_null());
        let entries: Vec<(String, Vec<Value>)> = self.record["bindings"]
            .as_object()
            .map(|b| {
                b.iter()
                    .map(|(k, v)| (k.clone(), v.as_array().cloned().unwrap_or_default()))
                    .collect()
            })
            .unwrap_or_default();
        for (key, attempts) in &entries {
            let last = attempts.last();
            if resuming
                && rebinds_on_resume(text(last.and_then(|a| a.get("outcome"))).unwrap_or(""))
                && !self.commit_pending(last)?
            {
                self.rebind_keys.push(key.clone());
            }
        }
        for (key, attempts) in &entries {
            if self.rebind_keys.contains(key) {
                continue;
            }
            for attempt in attempts {
                if let (Some(seat), Some(executor)) = (
                    text(attempt.get("seat")),
                    text(attempt.pointer("/binding/executor")),
                ) {
                    self.seat_ledger.note(seat, executor);
                }
            }
        }
        self.fault_pools = credential_fault_pools(&self.record, None);
        Ok(())
    }

    /// The record keeps the facts the end of the run computed, so the unit summary copies them.
    fn settle_unit_run(
        &mut self,
        scope: &mut RunScope,
        facts: &Value,
        verify: Option<&Value>,
    ) -> Res<()> {
        self.settled = true;
        let mut settlement = Map::new();
        for key in [
            "outcome",
            "infrastructure",
            "infrastructureReason",
            "refused",
        ] {
            settlement.insert(key.into(), facts.get(key).cloned().unwrap_or(Value::Null));
        }
        if let Some(v) = verify.filter(|v| !v.is_null()) {
            settlement.insert("verify".into(), v.clone());
        }
        settlement.insert(
            "settledAt".into(),
            json!(crate::transport::visibility_session::iso_now()),
        );
        self.record["settlement"] = Value::Object(settlement);
        self.record["execution"] = json!({ "status": "settled" });
        self.persist(scope)?;
        scope.settled_unit = true;
        if let Err(e) = self.host.publish_unit_summary(&self.unit_dir) {
            warn_unit(
                scope,
                "unit-summary-not-written",
                format!(
                    "could not write derived unit summary for \"{}\": {e}",
                    self.unit_run_id
                ),
            );
        }
        Ok(())
    }

    /// The paths this Unit wrote outside its declared writes, and the outcome that follows. A check that cannot run
    /// is an infrastructure failure of the unit, never a throw out of the run.
    fn apply_scope_rule(&mut self, outcome: &str, results: &[Value]) -> ScopeRuled {
        let on_branch = if strs(self.record.pointer("/unit/writes")).is_empty() {
            Ok(Vec::new())
        } else {
            self.branch_paths_outside_scope()
        };
        scope_rule(&self.record, outcome, results, on_branch)
    }

    fn branch_paths_outside_scope(&mut self) -> Result<Vec<String>, String> {
        let (Some(branch), Some(base)) = (
            text(self.record.pointer("/branchBase/branch"))
                .filter(|s| !s.is_empty())
                .map(str::to_string),
            text(self.record.pointer("/branchBase/baseSha"))
                .filter(|s| !s.is_empty())
                .map(str::to_string),
        ) else {
            return Ok(Vec::new());
        };
        let scope = strs(
            self.record
                .get("writeScope")
                .filter(|v| !v.is_null())
                .or_else(|| self.record.pointer("/unit/writes")),
        );
        self.with_git(false, |g| g.paths_outside_scope(&branch, &base, &scope))
            .map_err(|e| e.message)?
    }

    fn activity_of(&self, result: &Value) -> Value {
        let key = format!(
            "{}/{}",
            text(result.get("seat")).unwrap_or_default(),
            round_of(result)
        );
        let dir = self
            .attempts(&key)
            .last()
            .and_then(|a| text(a.get("assignmentId")).map(str::to_string))
            .and_then(|id| self.host.current_attempt(&self.assignments_dir, &id))
            .map(|a| a.dir);
        let kept = dir.as_ref().and_then(|d| {
            let bytes = std::fs::read(d.join("steps").join("finalize-home.json")).ok()?;
            let step: Value = serde_json::from_slice(&bytes).ok()?;
            text(step.pointer("/detail/transcriptPath"))
                .filter(|s| !s.is_empty())
                .map(str::to_string)
        });
        let transcript = match (dir, kept) {
            (Some(d), Some(k)) => json!(d.join(k).display().to_string()),
            _ => Value::Null,
        };
        json!({ "turns": Value::Null, "toolUses": Value::Null, "transcriptPath": transcript })
    }

    fn duration_of(&self, result: &Value) -> Value {
        let key = format!(
            "{}/{}",
            text(result.get("seat")).unwrap_or_default(),
            round_of(result)
        );
        self.attempts(&key)
            .last()
            .and_then(|a| a.get("durationMs"))
            .and_then(Value::as_u64)
            .map_or(Value::Null, |d| json!(d))
    }

    fn output_of(&self, result: &Value) -> Option<Value> {
        let declaration = result
            .pointer("/runResult/reportDeclaration")
            .filter(|d| truthy(d))?;
        let mut out = Map::new();
        out.insert(
            "report".into(),
            self.host.report_digest(result, &self.main_root),
        );
        out.insert(
            "claim".into(),
            result
                .pointer("/runResult/agentClaim")
                .filter(|c| !c.is_null())
                .cloned()
                .unwrap_or(Value::Null),
        );
        if let Some(object) = present(declaration, &["complete", "incompleteReason"]).as_object() {
            out.extend(object.clone());
        }
        Some(Value::Object(out))
    }

    /// The one place the end of a Unit run becomes its record and its result.
    fn finish_unit(
        &mut self,
        scope: &mut RunScope,
        outcome: &str,
        rounds: Option<Value>,
        results: Vec<Value>,
        findings: Vec<Value>,
        rest: Map<String, Value>,
    ) -> Res<Value> {
        let ScopeRuled {
            outcome: ruled,
            error,
            out_of_scope,
            out_of_scope_on_branch,
        } = self.apply_scope_rule(outcome, &results);
        let started = if ruled != "pass" && no_brief_delivered(&self.record) {
            json!({ "value": false, "reason": "brief-not-delivered" })
        } else {
            json!({ "value": true, "reason": Value::Null })
        };
        let attempts: Vec<Value> = results
            .iter()
            .map(|result| {
                let mut out = object(result);
                out.insert(
                    "infrastructure".into(),
                    json!(is_infrastructure(text(result.get("outcome")).unwrap_or(""))),
                );
                if let Some(run_result) = result.get("runResult").filter(|r| truthy(r)) {
                    let mut extended = object(run_result);
                    extended.insert("activity".into(), self.activity_of(result));
                    extended.insert("durationMs".into(), self.duration_of(result));
                    out.insert("runResult".into(), Value::Object(extended));
                }
                if let Some(output) = self.output_of(result) {
                    out.insert("output".into(), output);
                }
                Value::Object(out)
            })
            .collect();
        let started_value = started["value"] == json!(true);
        let final_outcome = if started_value {
            ruled.clone()
        } else {
            NOT_STARTED_OUTCOME.to_string()
        };
        // A verify that ran wins over the `ran: false` form a caller passed.
        let verify_record = match &self.verify_facts {
            Some(facts) => {
                let mut v = Map::new();
                v.insert("ran".into(), json!(true));
                v.extend(object(facts));
                Some(Value::Object(v))
            }
            None => rest.get("verify").cloned(),
        };
        let unit_infrastructure = infrastructure(
            &json!({ "outcome": final_outcome, "outOfScope": out_of_scope, "results": attempts }),
        );
        let reason = if unit_infrastructure {
            json!(infrastructure_reason_of(
                started_value,
                error.is_some(),
                &attempts
            ))
        } else {
            Value::Null
        };
        let facts = json!({
            "outcome": ruled,
            "infrastructure": unit_infrastructure,
            "infrastructureReason": reason,
            "refused": refused_seats_of(&attempts),
        });
        self.settle_unit_run(scope, &facts, verify_record.as_ref())?;
        let mut out = Map::new();
        out.insert("unitRunId".into(), json!(self.unit_run_id));
        out.insert("outcome".into(), json!(final_outcome));
        if let Some(r) = rounds {
            out.insert("rounds".into(), r);
        }
        out.insert("results".into(), json!(attempts));
        out.insert("findings".into(), json!(findings));
        if let Some(e) = &error {
            out.insert("error".into(), json!(e));
        }
        out.insert("infrastructure".into(), json!(unit_infrastructure));
        out.insert("outOfScope".into(), json!(out_of_scope));
        out.insert("outOfScopeOnBranch".into(), json!(out_of_scope_on_branch));
        out.insert("evaluations".into(), json!(evaluations_of(&attempts)));
        out.insert("started".into(), started);
        out.insert("launches".into(), launches_of(scope));
        out.insert("settled".into(), settled_of(scope));
        out.insert("warnings".into(), json!(scope.warnings));
        out.extend(rest);
        if let Some(v) = verify_record {
            out.insert("verify".into(), v);
        }
        Ok(Value::Object(out))
    }

    /// The results the pattern may stand on: not a round whose commit is pending, whose controller died before
    /// reading its outcome, or whose seat is about to be bound again.
    fn history_of(&mut self) -> Res<Vec<Value>> {
        let entries: Vec<(String, Option<Value>)> = self
            .record
            .get("bindings")
            .and_then(Value::as_object)
            .map(|b| {
                b.iter()
                    .map(|(k, v)| (k.clone(), v.as_array().and_then(|a| a.last()).cloned()))
                    .collect()
            })
            .unwrap_or_default();
        let mut pending = Vec::new();
        for (key, last) in entries {
            if self.commit_pending(last.as_ref())?
                || left_by_dead_controller(self.host, last.as_ref(), &self.assignments_dir)
            {
                pending.push(key);
            }
        }
        let history = read_unit_run_history(&self.unit_dir)
            .map_err(|e| RunUnitError::other("unit-history-unreadable", e.to_string()))?;
        Ok(history
            .into_iter()
            .filter(|h| {
                let key = format!(
                    "{}/{}",
                    text(h.get("seat")).unwrap_or_default(),
                    round_of(h)
                );
                !pending.contains(&key) && !self.rebind_keys.contains(&key)
            })
            .collect())
    }

    /// A unit with a syncBase merges it before any seat runs. A refusal, or a sync-only unit whose merge needed no
    /// worker, ends the run here (`Some`); a conflicted merge stays open for the producer.
    fn run_pending_sync(&mut self, scope: &mut RunScope) -> Res<Option<Value>> {
        let Some(sync) = self.record.get("sync").filter(|s| s.is_object()).cloned() else {
            return Ok(None);
        };
        let status = text(sync.get("status")).unwrap_or_default().to_string();
        if status != "pending" && status != "failed" {
            return Ok(owes_sync_only_pass(&self.record).then(|| sync_only_pass(&sync)));
        }
        // A durable native operation id, not a matching MERGE_HEAD alone, owns resume.
        if status == "failed" || sync.get("operationId").is_none_or(Value::is_null) {
            self.record["sync"]["operationId"] = json!(uuid()?);
        }
        self.record["sync"]["started"] = json!(true);
        self.persist(scope)?;
        let s = self.record["sync"].clone();
        let (name, sha, op) = (
            text(s.get("ref")).unwrap_or_default().to_string(),
            text(s.get("sha")).unwrap_or_default().to_string(),
            text(s.get("operationId")).unwrap_or_default().to_string(),
        );
        let mut result = self.with_git(true, |g| g.start_sync_merge(&name, &sha, &op))?;
        let warnings: Vec<Value> = [
            s.get("warnings")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default(),
            result
                .get("warnings")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default(),
        ]
        .concat();
        result["warnings"] = json!(warnings);
        self.record["sync"] = result.clone();
        self.persist(scope)?;
        match text(result.get("status")) {
            Some("failed") => {
                let reason = text(result.get("reason")).unwrap_or_default();
                let outcome = refused_sync_outcome(reason);
                let mut seat = Map::new();
                seat.insert("outcome".into(), json!(outcome));
                seat.insert("seat".into(), json!("producer"));
                seat.insert("role".into(), json!("producer"));
                seat.insert("round".into(), json!(1));
                seat.insert(
                    "refused".into(),
                    json!({ "reason": result.get("reason"), "detail": result.get("error") }),
                );
                if !warnings.is_empty() {
                    seat.insert("warnings".into(), json!(warnings));
                }
                Ok(Some(json!({ "outcome": outcome, "results": [seat] })))
            }
            Some("conflicted") => {
                let scope_paths = strs(
                    self.record
                        .get("writeScope")
                        .filter(|v| !v.is_null())
                        .or_else(|| self.record.pointer("/unit/writes")),
                );
                let added: Vec<String> = strs(result.get("conflicts"))
                    .into_iter()
                    .filter(|p| {
                        !fgos_write_scope::matches(p.as_bytes(), &scope_paths).unwrap_or(false)
                    })
                    .collect();
                self.record["sync"]["scopeAdded"] = json!(added);
                self.persist(scope)?;
                Ok(None)
            }
            _ => Ok(
                (self.record.pointer("/unit/syncOnly") == Some(&json!(true)))
                    .then(|| sync_only_pass(&result)),
            ),
        }
    }

    /// The record marked running and a pending sync merged; the end of the run when the sync ends it (`Err`), else
    /// the effective loop and its input.
    fn loop_start(&mut self, scope: &mut RunScope) -> Res<Result<(Value, LoopRun), Value>> {
        let effective = self
            .record
            .pointer("/collaboration/effective")
            .filter(|v| !v.is_null())
            .cloned()
            .unwrap_or_else(|| json!({ "loop": text(self.record.get("pattern")).unwrap_or("solo"), "params": {} }));
        self.persist(scope)?;
        // A unit with a syncBase merges it before any seat runs. A refusal, or a sync-only unit whose merge
        // needed no worker, ends the run here; a conflicted merge stays open for the producer.
        if self.record.get("sync").is_some_and(truthy) {
            assert_not_cancelled(self.host)?;
            if let Some(early) = self.run_pending_sync(scope)? {
                let mut rest = Map::new();
                if let Some(summary) = sync_summary(self.record.get("sync")) {
                    rest.insert("sync".into(), summary);
                }
                let results = early
                    .get("results")
                    .and_then(Value::as_array)
                    .cloned()
                    .unwrap_or_default();
                return self
                    .finish_unit(
                        scope,
                        text(early.get("outcome")).unwrap_or_default(),
                        Some(json!(0)),
                        results,
                        Vec::new(),
                        rest,
                    )
                    .map(Err);
            }
        }
        let runner = self
            .runner_for_loop
            .clone()
            .unwrap_or_else(|| self.snapshot_runner());
        let mut input = LoopInput::from_effective(&effective, self.unit.clone(), runner);
        input.history = self.history_of()?;
        input.shipped_checkers_by_rigor = self
            .host
            .shipped_catalog()
            .pointer("/loops/reviewed/checkersByRigor")
            .cloned();
        input.launch_room = self.launch_room();
        let run = LoopRun::new(input).map_err(seat_resolution)?;
        Ok(Ok((effective, run)))
    }

    /// How many more seat launches the admission's ceiling allows now (`hasLaunchRoom`), `None` without a ceiling.
    fn launch_room(&self) -> Option<u64> {
        self.seat_launch_ceiling
            .map(|c| c.saturating_sub(seat_launches_used(&self.record)))
    }

    /// The end of a run whose pattern finished: the verify note, then the one settlement.
    fn loop_end(
        &mut self,
        scope: &mut RunScope,
        effective: &Value,
        pattern: LoopResult,
    ) -> Res<Value> {
        // A reviewed run with nothing to verify says so: a pass without a verify is not a verified pass.
        let loop_name = text(effective.get("loop"))
            .or_else(|| text(effective.get("pattern")))
            .unwrap_or_default();
        let verify_cmd = verify_command_of(&self.unit, &self.snapshot_runner());
        let unverified = (loop_name == "reviewed" && verify_cmd.is_none())
            || (!loop_runs_verify(loop_name) && verify_cmd.is_some());
        let mut rest = Map::new();
        if self.record.get("sync").is_some_and(truthy) {
            if let Some(summary) = sync_summary(self.record.get("sync")) {
                rest.insert("sync".into(), summary);
            }
        }
        if unverified {
            rest.insert(
                "verify".into(),
                json!({ "ran": false, "reason": "no verify command: set unit.verify, pass --verify, or declare capabilities.<capability>.verify" }),
            );
        }
        self.finish_unit(
            scope,
            &pattern.outcome,
            pattern.rounds.map(|r| json!(r)),
            pattern.results,
            pattern.findings.unwrap_or_default(),
            rest,
        )
    }

    fn assignment_id(&self, role: &Role, n: usize) -> String {
        format!(
            "{}/{}/{}",
            self.unit_run_id,
            role.seat_id,
            attempt_suffix(role.round, n)
        )
    }

    fn bind_with(&self, role: &Role, n: usize, walk: &Value) -> Res<Value> {
        let ask = ask_for(
            &SeatRequest {
                seat: &role.seat,
                unit: &role.unit,
                independent_of: &role.independent_of,
                prefer_independent_of: &role.prefer_independent_of,
            },
            &self.seat_ledger,
            &AskOptions {
                overrides: self.overrides.clone(),
                workflow_id: self.workflow_id.as_deref(),
                raise_authorized: self.raise_authorized,
                blind: self.blind,
            },
        );
        let accounts = json!({
            "runtimeDir": self.options.get("providerCapacityRuntimeDir"),
            "assignmentId": self.assignment_id(role, n),
        });
        self.host.bind(
            &ask,
            &self.with_accounts(&self.snapshot_runner())?,
            &role.session,
            &accounts,
            walk,
        )
    }

    /// The seat's first binding: an earlier round's executor is kept, a recorded attempt keeps its binding.
    fn bind_seat(
        &mut self,
        role: &Role,
        recorded: &[Value],
        rebinding: bool,
        n: usize,
    ) -> Res<Value> {
        let first = match recorded.last() {
            Some(last) if !rebinding => last.get("binding").cloned().unwrap_or(Value::Null),
            _ => {
                let walk = match kept_binding_of(&self.record, &role.seat_id, role.round as f64) {
                    Some(kept) => json!({ "continuity": kept }),
                    None => json!({}),
                };
                self.bind_with(role, n, &walk)?
            }
        };
        if first.get("refused").is_none_or(|r| !truthy(r)) {
            self.seat_ledger.note(
                &role.seat_id,
                text(first.get("executor")).unwrap_or_default(),
            );
            self.seat_ledger
                .note_dependence(&role.seat_id, &role.independent_of);
        }
        Ok(first)
    }

    /// A later binding of the seat, with pools whose login failed in this unit skipped.
    fn bind_in_queue(&mut self, role: &Role, n: usize, walk: &Value) -> Res<Value> {
        let mut walk = object(walk);
        walk.insert("excludePools".into(), json!(self.fault_pools));
        if let Some(kept) = kept_binding_of(&self.record, &role.seat_id, role.round as f64) {
            walk.insert("continuity".into(), kept);
        }
        let next = self.bind_with(role, n, &Value::Object(walk))?;
        if next.get("refused").is_none_or(|r| !truthy(r)) {
            self.seat_ledger.note(
                &role.seat_id,
                text(next.get("executor")).unwrap_or_default(),
            );
        }
        Ok(next)
    }

    fn preflight(&mut self, role: &Role) -> Res<Preflight> {
        let paths = role.scope_strings();
        let sync_op =
            (text(self.record.pointer("/sync/status")) == Some("conflicted")).then(|| {
                text(self.record.pointer("/sync/operationId"))
                    .unwrap_or_default()
                    .to_string()
            });
        self.with_git(true, |g| g.preflight(&paths, sync_op.as_deref()))?
            .map_err(|e| git_error(e.cause))
    }

    /// The preflight refusal of a writing seat: an open merge this run did not start, or a foreign index.
    fn preflight_refusal(role: &Role, preflight: &Preflight) -> Option<Value> {
        let Preflight::Foreign { staged, merge_head } = preflight else {
            return None;
        };
        if let Some(head) = merge_head {
            return Some(role.refused(json!({
                "reason": "merge-in-progress",
                "detail": format!("the worktree has a merge in progress (MERGE_HEAD {head}) that this run did not start; finish or abort it (git merge --abort), then run again"),
            })));
        }
        (!staged.is_empty()).then(|| {
            role.refused(json!({ "reason": "foreign-staged-index", "detail": foreign_index_detail(staged), "paths": staged }))
        })
    }

    fn recheck(&self, scope: &RunScope, changed: &[String]) -> Res<Option<Value>> {
        let (Some(held), Some(port)) = (&scope.admission, self.host.admission()) else {
            return Ok(None);
        };
        match port
            .recheck_effect(&held.reservation_id, &held.case_id, changed)
            .map_err(|e| RunUnitError::other("case-admission-port-failed", e.to_string()))?
        {
            Recheck::Ok => Ok(None),
            Recheck::Refused { code, condition } => {
                Ok(Some(json!({ "reason": code, "detail": condition })))
            }
        }
    }

    /// One seat up to its binding: seats started together bind in listed order, each seeing its earlier siblings.
    fn prepare_role(&mut self, call: &RoleCall) -> Res<Job> {
        assert_not_cancelled(self.host)?;
        // A seat id names a directory and a ref segment of this run; only Convention's ids reach a path.
        assert_seat_id(call.seat.get("seat"))?;
        let seat_id = text(call.seat.get("seat")).unwrap_or_default().to_string();
        let round = call.round.unwrap_or(1);
        let unit = if call.unit.is_null() {
            self.unit.clone()
        } else {
            call.unit.clone()
        };
        let options = self.options.get("session");
        let session_text = |k: &str| {
            options
                .and_then(|s| s.get(k))
                .filter(|v| !v.is_null())
                .cloned()
        };
        let mut session = Map::new();
        for key in ["provider", "tier"] {
            if let Some(v) = session_text(key) {
                session.insert(key.into(), v);
            }
        }
        session.insert(
            "hasNativeAgent".into(),
            session_text("hasNativeAgent").unwrap_or(json!(false)),
        );
        session.insert(
            "herdrPresent".into(),
            session_text("herdrPresent").unwrap_or_else(|| json!(self.host.herdr_present())),
        );
        session.insert(
            "headless".into(),
            session_text("headless").unwrap_or(json!(true)),
        );
        let role = Role {
            read_only: call.seat.pointer("/posture/readOnly") == Some(&json!(true)),
            key: format!("{seat_id}/{round}"),
            seat: call.seat.clone(),
            seat_id,
            round,
            inputs: call.inputs.clone().unwrap_or_default(),
            unit,
            session: Value::Object(session),
            independent_of: call.independent_of.clone().unwrap_or_default(),
            prefer_independent_of: call.prefer_independent_of.clone().unwrap_or_default(),
            batch: call.batch,
            write_scope: Vec::new(),
        };
        // A new round starts with no verify record: the record is the verify of the round the run ends in.
        if round > self.verify_round {
            self.verify_round = round;
            self.verify_facts = None;
        }
        let recorded = self.attempts(&role.key);
        let rebinding = match self.rebind_keys.iter().position(|k| k == &role.key) {
            Some(at) => {
                self.rebind_keys.remove(at);
                true
            }
            None => false,
        };
        let n = if rebinding {
            recorded.len()
        } else {
            recorded.len().saturating_sub(1)
        };
        let bound = self.bind_seat(&role, &recorded, rebinding, n)?;
        if let Some(refused) = bound.get("refused").filter(|r| truthy(r)) {
            return Ok(Job::Done(role.refused(refused.clone())));
        }
        Ok(Job::Role(Box::new(RoleRun {
            role,
            recorded,
            rebinding,
            n,
            bound,
        })))
    }

    /// A bound seat before its first launch: a resumed commit finished, the preflight of a writing seat.
    fn role_setup(&mut self, scope: &mut RunScope, run: &mut RoleRun) -> Res<Result<Setup, Value>> {
        let RoleRun { role, recorded, .. } = run;
        role.write_scope = effective_write_scope(&self.record);
        let mut native_baseline = recorded
            .first()
            .and_then(|a| a.get("nativeBaseline"))
            .filter(|b| truthy(b))
            .cloned();
        if !role.read_only && !recorded.is_empty() && native_baseline.is_none() {
            return Ok(Err(role.refused(json!({
                "reason": "native-baseline-missing",
                "detail": "this writing attempt has no native pre-producer baseline; start a new Unit run",
            }))));
        }
        if !role.read_only && self.commit_pending(recorded.last())? {
            return self
                .finish_pending_commit(scope, role, native_baseline)
                .map(Err);
        }
        // Before a mutating producer is spawned: a foreign staged index refuses it, and files already dirty in scope
        // are recorded so the runner never commits them (a resumed attempt keeps what its first launch saw).
        let mut pre_existing: Vec<Value> = Vec::new();
        if !role.read_only {
            let preflight = self.preflight(role)?;
            if let Some(refusal) = Self::preflight_refusal(role, &preflight) {
                return Ok(Err(refusal));
            }
            let Preflight::Clear {
                baseline,
                pre_existing_in_scope,
            } = preflight
            else {
                unreachable!("refused above")
            };
            pre_existing = recorded
                .first()
                .and_then(|a| a.get("preExistingInScope"))
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_else(|| pre_existing_in_scope.iter().map(|p| json!(p)).collect());
            native_baseline = native_baseline.or_else(|| serde_json::to_value(&baseline).ok());
        }
        Ok(Ok(Setup {
            pre_existing,
            native_baseline,
        }))
    }

    /// What the seat does after an attempt: its result, or the binding of its next attempt.
    fn after_attempt(
        &mut self,
        scope: &mut RunScope,
        role: &Role,
        n: usize,
        bound: &Value,
        mut result: Value,
    ) -> Res<Next> {
        let attempts = self.attempts(&role.key);
        let outcome = text(result.get("outcome")).unwrap_or_default().to_string();
        let brief_not_delivered = outcome != "provider-limit"
            && outcome != "pass"
            && attempts.get(n).and_then(|a| a.get("briefNotDelivered")) == Some(&json!(true));
        if outcome != "provider-limit" && !brief_not_delivered {
            return Ok(Next::Done(result));
        }
        let lease_conflict = is_lease_conflict(result.get("runResult"));
        let (changed, rotation) = if lease_conflict {
            (None, None)
        } else {
            let changed =
                self.writes_since_launch(attempts.get(n).and_then(|a| a.get("writeBaseline")));
            let rotation = match text(bound.get("pool")).filter(|p| !p.is_empty()) {
                Some(pool) if !brief_not_delivered => self
                    .host
                    .account_rotation(&self.with_accounts(&self.snapshot_runner())?, pool),
                _ => None,
            };
            (changed, rotation)
        };
        let answer = answer_provider_limit(&LimitAsk {
            result: &result,
            bound,
            attempts: &attempts,
            attempt_no: n,
            brief_not_delivered,
            rotation: rotation.as_ref(),
            changed: changed.as_ref(),
        });
        if let Some(stop) = answer.get("stop") {
            if let Some(refused) = stop.get("refused") {
                return Ok(Next::Done(role.refused(refused.clone())));
            }
            if let Some(retry) = stop.get("retryStopped") {
                self.attempt_mut(&role.key, n)["retryStopped"] = retry.clone();
                self.persist(scope)?;
            }
            if let (Some(object), Some(exhausted)) =
                (result.as_object_mut(), stop.get("fallbackExhausted"))
            {
                object.insert("fallbackExhausted".into(), exhausted.clone());
            }
            return Ok(Next::Done(result));
        }
        if let Some(rebind) = answer.get("rebind") {
            let rebound = self.bind_in_queue(role, n + 1, rebind)?;
            if let Some(refused) = rebound.get("refused").filter(|r| truthy(r)) {
                return Ok(Next::Done(role.refused(refused.clone())));
            }
            return Ok(Next::Again(rebound));
        }
        let walk = &answer["walk"];
        if let Some(rotation) = walk.get("rotation") {
            // The same candidate again: the lease picks the next account of its pool.
            let again = self.bind_with(role, n + 1, rotation)?;
            if again.get("refused").is_none_or(|r| !truthy(r)) {
                return Ok(Next::Again(again));
            }
        }
        if let Some(pool) = text(walk.get("faultPool")) {
            if !self.fault_pools.iter().any(|p| p == pool) {
                self.fault_pools.push(pool.to_string());
            }
        }
        let next = self.bind_in_queue(role, n + 1, &walk["step"])?;
        if let Some(refused) = next.get("refused").filter(|r| truthy(r)) {
            let mut exhausted = Map::new();
            exhausted.insert("from".into(), launched_from(bound));
            exhausted.insert(
                "reason".into(),
                refused.get("reason").cloned().unwrap_or(Value::Null),
            );
            if let Some(detail) = refused.get("detail") {
                exhausted.insert("detail".into(), detail.clone());
            }
            if let Some(r) = walk.get("accountRotations") {
                exhausted.insert("accountRotations".into(), r.clone());
            }
            if let Some(object) = result.as_object_mut() {
                object.insert("fallbackExhausted".into(), Value::Object(exhausted));
            }
            return Ok(Next::Done(result));
        }
        Ok(Next::Again(next))
    }

    /// A launch past the admission's seat-launch ceiling does not happen.
    fn launch_ceiling_spent(
        &self,
        scope: &mut RunScope,
        role: &Role,
        n: usize,
        rebinding: bool,
        last: Option<&Value>,
        bound: &Value,
    ) -> Option<Value> {
        let ceiling = self.seat_launch_ceiling?;
        let attempts = self.attempts(&role.key);
        if attempts
            .get(n)
            .is_some_and(|a| a.get("dispatchRetryId").is_some())
            || seat_launches_used(&self.record) < ceiling
        {
            return None;
        }
        scope.ceiling_hit = true;
        let detail = format!("the seat-launch ceiling of {ceiling} for this Unit is spent");
        if n == 0 || (rebinding && last.is_none()) {
            return Some(role.refused(json!({ "reason": SEAT_LAUNCH_CEILING, "detail": detail })));
        }
        let mut out = last
            .map(object)
            .unwrap_or_else(|| role.result("provider-limit"));
        out.insert("fallbackExhausted".into(), json!({ "from": launched_from(bound), "reason": SEAT_LAUNCH_CEILING, "detail": detail }));
        Some(Value::Object(out))
    }

    /// What a writing seat changed since its launch: `{ paths, headMoved }`, `{ error }`, or `None` with no baseline.
    fn writes_since_launch(&mut self, baseline: Option<&Value>) -> Option<Value> {
        let baseline = baseline?;
        if let Some(error) = baseline.get("error") {
            let why = text(Some(error)).map_or_else(|| error.to_string(), str::to_string);
            return Some(json!({ "error": format!("no baseline was taken at launch: {why}") }));
        }
        let before = WorktreeSnapshot {
            head: text(baseline.get("head")).map(str::to_string),
            files: baseline
                .get("files")
                .and_then(Value::as_object)
                .map(|f| {
                    f.iter()
                        .map(|(k, v)| (k.clone(), v.as_str().map(str::to_string)))
                        .collect()
                })
                .unwrap_or_default(),
        };
        Some(match self.with_git(false, |g| g.worktree_snapshot()) {
            Ok(Ok(now)) => {
                let since = writes_since(&before, &now);
                json!({ "paths": since.paths, "headMoved": since.head_moved })
            }
            Ok(Err(e)) => json!({ "error": e }),
            Err(e) => json!({ "error": e.message }),
        })
    }

    /// How one dispatch of the attempt enters the admission ledger: a dispatch admitted earlier whose outcome was
    /// never read keeps its retry id; any other, or an abandoned or cancelled one, gets a new id.
    fn admission_identity(&self, attempt: &Value, assignment_id: &str) -> Res<Value> {
        let current = self
            .host
            .current_attempt(&self.assignments_dir, assignment_id);
        let abandoned = || {
            let Some(current) = &current else {
                return false;
            };
            let read = |name: &str| -> Option<Value> {
                serde_json::from_slice(&std::fs::read(current.dir.join(name)).ok()?).ok()
            };
            if read("run.json")
                .is_some_and(|r| text(r.get("settlement")) == Some("abandoned-legacy"))
            {
                return true;
            }
            if !current.dir.join("envelope.json").exists()
                || self.host.adopt_state(&current.dir) != "closed"
            {
                return false;
            }
            read("receipt.json").is_some_and(|r| {
                let outcome = match r.get("outcome") {
                    Some(Value::String(s)) => s.clone(),
                    Some(other) => other.to_string(),
                    None => "undefined".into(),
                };
                outcome.starts_with("abandoned") || outcome == "cancelled"
            })
        };
        let generations = self.host.admission_generations(
            &self
                .assignments_dir
                .join(assignment_id)
                .join("admission")
                .join("generations"),
        );
        let retry = attempt.get("dispatchRetryId");
        let admitted = retry.is_some() && generations.iter().any(|g| g.get("retryId") == retry);
        let continuing = attempt.get("outcome").is_none() && admitted && !abandoned();
        let retry_id = if continuing {
            retry.cloned().unwrap_or(Value::Null)
        } else {
            json!(format!("{assignment_id}~{}", random_hex::<6>()?))
        };
        let digest: String =
            Sha256::digest(format!("{}|{assignment_id}", self.unit_run_id).as_bytes())
                .iter()
                .map(|b| format!("{b:02x}"))
                .collect();
        Ok(json!({
            "retryId": retry_id,
            "predecessorRunId": generations.last().and_then(|g| g.get("runId")).cloned().unwrap_or(Value::Null),
            "destination": self.record.get("worktree"),
            "payloadDigest": digest,
        }))
    }

    fn attempt_json(&self, assignment_id: &str, name: &str) -> Option<Value> {
        let current = self
            .host
            .current_attempt(&self.assignments_dir, assignment_id)?;
        serde_json::from_slice(&std::fs::read(current.dir.join(name)).ok()?).ok()
    }

    /// One launch of the seat on `bound` up to its dispatch: the attempt recorded in unit.json, the worktree as the
    /// seat launches, the admission identity; what the dispatch is handed.
    #[allow(clippy::too_many_arguments)]
    fn attempt_before(
        &mut self,
        scope: &mut RunScope,
        role: &Role,
        n: usize,
        bound: &Value,
        pre_existing: &[Value],
        native_baseline: Option<&Value>,
    ) -> Res<DispatchInput<'c>> {
        let assignment_id = self.assignment_id(role, n);
        let assignment_dir = self
            .unit_dir
            .join(&role.seat_id)
            .join(attempt_suffix(role.round, n));
        if self.attempts(&role.key).len() <= n {
            let mut attempt = Map::new();
            attempt.insert("seat".into(), json!(role.seat_id));
            if let Some(r) = role.seat.get("role") {
                attempt.insert("role".into(), r.clone());
            }
            attempt.insert("round".into(), json!(role.round));
            attempt.insert("assignmentId".into(), json!(assignment_id));
            attempt.insert("binding".into(), bound.clone());
            attempt.extend(object(&present(bound, &["transport", "invocation"])));
            attempt.insert(
                "fallbackFrom".into(),
                bound
                    .pointer("/provenance/fallbackFrom")
                    .filter(|v| !v.is_null())
                    .cloned()
                    .unwrap_or(Value::Null),
            );
            if !role.read_only {
                attempt.insert("preExistingInScope".into(), json!(pre_existing));
                if let Some(b) = native_baseline {
                    attempt.insert("nativeBaseline".into(), b.clone());
                }
            }
            attempt.insert(
                "boundAt".into(),
                json!(crate::transport::visibility_session::iso_now()),
            );
            attempt.insert(
                "configHash".into(),
                self.record
                    .pointer("/configSnapshot/hash")
                    .cloned()
                    .unwrap_or(Value::Null),
            );
            let list = self
                .bindings_mut()
                .entry(role.key.clone())
                .or_insert_with(|| json!([]));
            list.as_array_mut()
                .expect("attempts are an array")
                .push(Value::Object(attempt));
            self.persist(scope)?;
        }
        // The worktree as this writing seat launches, so a provider limit can tell whether the seat changed it.
        if !role.read_only {
            let snapshot = match self.with_git(false, |g| g.worktree_snapshot()) {
                Ok(Ok(s)) => json!({ "head": s.head, "files": s.files }),
                Ok(Err(e)) => json!({ "error": e }),
                Err(e) => json!({ "error": e.message }),
            };
            self.attempt_mut(&role.key, n)["writeBaseline"] = snapshot;
            self.persist(scope)?;
        }
        let objective = format!(
            "{}{}",
            text(role.unit.get("objective")).unwrap_or_default(),
            if role.read_only {
                String::new()
            } else {
                sync_brief(self.record.get("sync"))
            }
        );
        // Recorded before the dispatch: a controller that dies from here on is resumed from this id.
        let admission = self.admission_identity(&self.attempts(&role.key)[n], &assignment_id)?;
        {
            let attempt = self.attempt_mut(&role.key, n);
            attempt["dispatchRetryId"] = admission["retryId"].clone();
            attempt
                .as_object_mut()
                .expect("attempt is an object")
                .shift_remove("outcome");
        }
        self.persist(scope)?;
        assert_not_cancelled(self.host)?;
        // A pinned account leases from an inventory holding only that account.
        let runner = self
            .host
            .runner_config_for_binding(&self.with_accounts(&self.snapshot_runner())?, bound);
        std::fs::create_dir_all(&assignment_dir).map_err(|e| {
            RunUnitError::other(
                "assignment-dir-not-created",
                format!("{}: {e}", assignment_dir.display()),
            )
        })?;
        Ok(DispatchInput {
            record: self.record.clone(),
            unit: self.unit.clone(),
            main_root: self.main_root.clone(),
            assignment_id,
            assignment_dir,
            objective,
            admission,
            case: scope
                .admission
                .as_ref()
                .map(|h| (h.case_id.clone(), h.reservation_id.clone())),
            runner,
            committed: self.live_config()?,
            custody: if role.read_only { None } else { self.custody },
            carries_operation: self.declared_op.is_some()
                && role.seat.pointer("/posture/writer") == Some(&json!(true)),
            write_scope: effective_write_scope(&self.record),
        })
    }

    /// The settled Run Result of one launch, recorded on the attempt; a passing writing round is committed.
    #[allow(clippy::too_many_arguments)]
    fn attempt_after(
        &mut self,
        scope: &mut RunScope,
        role: &Role,
        n: usize,
        bound: &Value,
        pre_existing: &[Value],
        native_baseline: Option<&Value>,
        assignment_id: &str,
        run_result: Value,
        elapsed: Duration,
    ) -> Res<Value> {
        let assignment_id = assignment_id.to_string();
        let mut result = role.result(outcome_of_run_result(&run_result));
        result.insert("runResult".into(), run_result.clone());
        result.insert("binding".into(), bound.clone());
        self.attempt_mut(&role.key, n)["durationMs"] = json!(elapsed.as_millis() as u64);

        // A pass stands only when the provider record agrees the lease it names was granted.
        let receipt = self
            .attempt_json(&assignment_id, "provider-capacity-selection.json")
            .and_then(|s| s.get("leaseReceipt").filter(|r| !r.is_null()).cloned());
        let differs = if result["outcome"] == "pass" {
            self.host
                .audit_lease_receipt(receipt.as_ref(), &assignment_id)
        } else {
            None
        };
        if let Some(detail) = &differs {
            result.insert("outcome".into(), json!("policy-refusal"));
            result.insert(
                "refused".into(),
                json!({ "reason": "lease-receipt-mismatch", "detail": detail }),
            );
        }
        // A commit that cannot be made fails the round; paths changed outside the scope are reported, never committed.
        if !role.read_only && result["outcome"] == "pass" {
            assert_not_cancelled(self.host)?;
            let changed = strs(run_result.pointer("/evidence/changedFiles"));
            match self.recheck(scope, &changed)? {
                Some(gate) => {
                    result.insert("outcome".into(), json!("policy-refusal"));
                    result.insert("refused".into(), gate);
                }
                None => {
                    let exclude = self.attempts(&role.key)[n]
                        .get("preExistingInScope")
                        .and_then(Value::as_array)
                        .cloned()
                        .unwrap_or_else(|| pre_existing.to_vec());
                    let baseline = native_baseline.cloned();
                    let commit = self.commit_round(
                        scope,
                        role,
                        baseline.as_ref(),
                        Some(&run_result),
                        &exclude,
                    )?;
                    result.insert("commit".into(), commit.clone());
                    self.attempt_mut(&role.key, n)["commit"] = commit.clone();
                    if commit["status"] == "failed" {
                        result.insert("outcome".into(), json!("execution-failure"));
                    }
                }
            }
        }
        let outcome = text(result.get("outcome")).unwrap_or_default().to_string();
        let receipt_file = self.attempt_json(&assignment_id, "receipt.json");
        let never_reached =
            outcome != "pass" && receipt_file.as_ref().is_some_and(brief_never_reached);
        let credential = run_result
            .pointer("/classification/failure/cause")
            .and_then(Value::as_str)
            == Some("credential");
        let lease_conflict = is_lease_conflict(Some(&run_result));
        {
            let attempt = self.attempt_mut(&role.key, n);
            attempt["outcome"] = json!(outcome);
            attempt["runId"] = run_result
                .get("runId")
                .filter(|v| !v.is_null())
                .cloned()
                .unwrap_or(Value::Null);
            if never_reached {
                attempt["briefNotDelivered"] = json!(true);
            } else if let Some(o) = attempt.as_object_mut() {
                o.shift_remove("briefNotDelivered");
            }
            if let (Some(r), None) = (&receipt, &differs) {
                attempt["leaseReceipt"] = r.clone();
            }
            if outcome == "provider-limit" && credential {
                attempt["failureCause"] = json!("credential");
            }
            if outcome == "provider-limit" && lease_conflict {
                attempt["leaseConflict"] = json!(true);
            }
        }
        self.persist(scope)?;
        self.host.drop_assignment_record(&assignment_id);
        Ok(Value::Object(result))
    }

    /// The agent already did this round's work and only the runner commit failed: commit again, never spawn the
    /// agent a second time.
    fn finish_pending_commit(
        &mut self,
        scope: &mut RunScope,
        role: &Role,
        native_baseline: Option<Value>,
    ) -> Res<Value> {
        let attempts = self.attempts(&role.key);
        let last_at = attempts.len() - 1;
        let last = attempts[last_at].clone();
        if text(last.pointer("/commitOperation/state")) != Some("pending") {
            let preflight = self.preflight(role)?;
            if let Some(refusal) = Self::preflight_refusal(role, &preflight) {
                return Ok(refusal);
            }
        }
        assert_not_cancelled(self.host)?;
        let history = read_unit_run_history(&self.unit_dir)
            .map_err(|e| RunUnitError::other("unit-history-unreadable", e.to_string()))?;
        let prior = history
            .into_iter()
            .find(|h| text(h.get("seat")) == Some(&role.seat_id) && round_of(h) == role.round);
        let run_result = prior.as_ref().and_then(|p| p.get("runResult")).cloned();
        let changed = strs(
            run_result
                .as_ref()
                .and_then(|r| r.pointer("/evidence/changedFiles")),
        );
        if let Some(gate) = self.recheck(scope, &changed)? {
            return Ok(role.refused(gate));
        }
        let exclude = last
            .get("preExistingInScope")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        let mut commit = self.commit_round(
            scope,
            role,
            native_baseline.as_ref(),
            run_result.as_ref(),
            &exclude,
        )?;
        if commit["status"] == "no-changes" {
            // In-scope files the agent changed that are gone (not taken by this round's sync merge) are not a pass.
            let in_merge = strs(commit.pointer("/sync/files"));
            let excluded = strs(Some(&json!(exclude)));
            let candidates: Vec<String> = changed
                .into_iter()
                .filter(|p| !excluded.contains(p) && !in_merge.contains(p))
                .collect();
            let (missing, _) = partition_paths(&candidates, &role.scope_strings());
            if !missing.is_empty() {
                let mut failed = object(&commit);
                failed.insert("status".into(), json!("failed"));
                failed.insert("reason".into(), json!("work-missing"));
                failed.insert("missing".into(), json!(missing));
                failed.insert(
                    "error".into(),
                    json!(format!("the files this round changed in scope are no longer in the worktree: {}; run the unit again", missing.join(", "))),
                );
                commit = Value::Object(failed);
            }
        }
        let outcome = if commit["status"] == "failed" {
            "execution-failure"
        } else {
            "pass"
        };
        {
            let attempt = self.attempt_mut(&role.key, last_at);
            attempt["commit"] = commit.clone();
            attempt["outcome"] = json!(outcome);
        }
        self.persist(scope)?;
        let mut result = role.result(outcome);
        result.insert("runResult".into(), run_result.unwrap_or(Value::Null));
        result.insert(
            "binding".into(),
            last.get("binding").cloned().unwrap_or(Value::Null),
        );
        result.insert("commit".into(), commit);
        Ok(Value::Object(result))
    }

    /// The worker only writes files; this trusted code, outside the confinement, commits the ones inside the write
    /// scope (concluding first a merge left open for the worker).
    fn commit_round(
        &mut self,
        scope: &mut RunScope,
        role: &Role,
        baseline: Option<&Value>,
        run_result: Option<&Value>,
        exclude: &[Value],
    ) -> Res<Value> {
        let operation_id = uuid()?;
        let exclude_paths = strs(Some(&json!(exclude)));
        let mut merge: Option<Value> = None;
        if text(self.record.pointer("/sync/status")) == Some("conflicted") {
            let sync = self.record["sync"].clone();
            let m = self.with_git(true, |g| g.finish_sync_merge(&sync))?;
            if let Some(id) = m.get("operationId").filter(|v| !v.is_null()) {
                self.record["sync"]["operationId"] = id.clone();
                if let Some(s) = self.record["sync"].as_object_mut() {
                    s.shift_remove("nextOperationId");
                }
            }
            let warnings = |a: Option<&Value>, b: Option<&Value>| -> Value {
                json!([
                    a.and_then(Value::as_array).cloned().unwrap_or_default(),
                    b.and_then(Value::as_array).cloned().unwrap_or_default()
                ]
                .concat())
            };
            if m["status"] == "failed" {
                let mut m = m;
                m["warnings"] = warnings(self.record.pointer("/sync/warnings"), m.get("warnings"));
                let mut out = Map::new();
                for key in ["status", "reason", "error"] {
                    out.insert(key.into(), m.get(key).cloned().unwrap_or(Value::Null));
                }
                for (k, v) in object(&m) {
                    if !["status", "reason", "error"].contains(&k.as_str()) {
                        out.insert(k, v);
                    }
                }
                out.insert("outOfScope".into(), json!([]));
                out.insert("preExistingInScope".into(), json!(exclude_paths));
                out.insert("sync".into(), m);
                let commit = Value::Object(out);
                self.settle_commit_operation(role, &commit);
                self.persist(scope)?;
                return Ok(commit);
            }
            let merged_warnings =
                warnings(self.record.pointer("/sync/warnings"), m.get("warnings"));
            let s = &mut self.record["sync"];
            s["warnings"] = merged_warnings;
            s["status"] = json!("merged");
            s["nativeHead"] = m.get("sha").cloned().unwrap_or(Value::Null);
            s["commit"] = if m["status"] == "committed" {
                json!({ "sha": m.get("sha"), "subject": m.get("subject"), "files": m.get("files") })
            } else {
                json!({ "by": "outside" })
            };
            merge = Some(m);
        }
        // The round's in-scope files on the native baseline the seat launched on, moved onto the sync merge when the
        // round made one first; a native operation a dead controller left pending is resumed.
        let head = self
            .record
            .pointer("/sync/commit/sha")
            .filter(|v| !v.is_null())
            .or_else(|| {
                self.record
                    .pointer("/sync/nativeHead")
                    .filter(|v| !v.is_null())
            })
            .and_then(Value::as_str)
            .map(str::to_string);
        let baseline: Option<CommitBaseline> = baseline.and_then(|b| {
            let mut b = b.clone();
            if let Some(h) = &head {
                b["head"] = json!(h);
            }
            serde_json::from_value(b).ok()
        });
        let key = role.key.clone();
        let operation = self
            .attempts(&key)
            .last()
            .and_then(|a| a.get("commitOperation"))
            .cloned();
        let resume = operation
            .as_ref()
            .filter(|o| text(o.get("state")) == Some("pending"))
            .and_then(|o| {
                Some(ResumeCommit {
                    operation_id: text(o.pointer("/nativeRequest/operationId"))?.to_string(),
                    request: serde_json::from_value::<CommitRequest>(
                        o.pointer("/nativeRequest/request")?.clone(),
                    )
                    .ok()?,
                    expected_paths: strs(o.get("expectedPaths")),
                    base: o.get("base").cloned().unwrap_or_else(|| json!({})),
                })
            });
        let scope_paths = role.scope_strings();
        let changed = run_result
            .and_then(|r| r.pointer("/evidence/changedFiles"))
            .map(|c| strs(Some(c)));
        let summary = run_result
            .and_then(|r| text(r.pointer("/agentClaim/summary")))
            .map(str::to_string);
        let needs = run_result
            .and_then(|r| r.pointer("/agentClaim/needsWrites"))
            .cloned();
        let unit_id = text(role.unit.get("id")).unwrap_or_default().to_string();
        let objective = text(role.unit.get("objective")).map(str::to_string);
        let mut prepared_record: Option<Value> = None;
        let baseline_json = baseline.as_ref().and_then(|b| serde_json::to_value(b).ok());
        let commit = self.with_git(true, |g| {
            g.commit_unit_work(
                &CommitArgs {
                    unit_id: &unit_id,
                    summary: summary.as_deref(),
                    objective: objective.as_deref(),
                    scope: &scope_paths,
                    baseline: baseline.as_ref(),
                    changed_files: changed.as_deref(),
                    exclude_paths: &exclude_paths,
                    needs_writes: needs.as_ref(),
                    operation_id: &operation_id,
                    resume: resume.as_ref(),
                },
                &mut |prepared| {
                    prepared_record = Some(json!({
                        "nativeRequest": {
                            "baseline": baseline_json,
                            "request": { "writes": prepared.request.writes, "message": prepared.request.message },
                            "operationId": prepared.operation_id,
                        },
                        "expectedPaths": prepared.expected_paths,
                        "base": prepared.base,
                        "state": "pending",
                    }));
                },
            )
        })?;
        if let Some(op) = prepared_record {
            // Node records the operation on the attempt (and persists) before the commit runs; the record is written
            // here, before the commit result is, so a controller that died in between resumes the same operation.
            let last = self.attempts(&key).len() - 1;
            self.attempt_mut(&key, last)["commitOperation"] = op;
        }
        let commit = match merge {
            None => commit,
            Some(m) => {
                let mut out = object(&commit);
                let warnings: Vec<Value> = [
                    commit
                        .get("warnings")
                        .and_then(Value::as_array)
                        .cloned()
                        .unwrap_or_default(),
                    self.record
                        .pointer("/sync/warnings")
                        .and_then(Value::as_array)
                        .cloned()
                        .unwrap_or_default(),
                ]
                .concat();
                if !warnings.is_empty() {
                    out.insert("warnings".into(), json!(warnings));
                }
                out.insert("sync".into(), m);
                Value::Object(out)
            }
        };
        self.settle_commit_operation(role, &commit);
        self.persist(scope)?;
        Ok(commit)
    }

    /// A pending native commit operation is settled once its commit landed, or was refused for good.
    fn settle_commit_operation(&mut self, role: &Role, commit: &Value) {
        let Some(last) = self.attempts(&role.key).len().checked_sub(1) else {
            return;
        };
        let attempt = self.attempt_mut(&role.key, last);
        if attempt.get("commitOperation").is_none_or(|o| !truthy(o)) {
            return;
        }
        let settled = commit["status"] != "failed"
            || matches!(
                text(commit.get("nativeCause")),
                Some("commit-rejected" | "hook-refused")
            )
            || text(commit.get("reason")) == Some("committed-set-mismatch");
        if settled {
            attempt["commitOperation"]["state"] = json!("settled");
        }
    }
}

/// One command of a batch, once its seat is bound.
enum Job {
    /// The seat's answer is already known (refused at its binding).
    Done(Value),
    Role(Box<RoleRun>),
    Verify,
}

/// A bound seat and where its attempts stand.
struct RoleRun {
    role: Role,
    recorded: Vec<Value>,
    rebinding: bool,
    n: usize,
    bound: Value,
}

/// What a writing seat's first launch stands on.
struct Setup {
    pre_existing: Vec<Value>,
    native_baseline: Option<Value>,
}

/// After an attempt: the seat's result, or the binding of its next attempt.
enum Next {
    Done(Value),
    Again(Value),
}

/// What one dispatch is handed, copied out of the run's record so the dispatch runs while sibling seats record.
struct DispatchInput<'c> {
    record: Value,
    unit: Value,
    main_root: PathBuf,
    assignment_id: String,
    assignment_dir: PathBuf,
    objective: String,
    admission: Value,
    case: Option<(String, String)>,
    runner: Value,
    committed: Value,
    custody: Option<&'c Handle>,
    carries_operation: bool,
    write_scope: Vec<Value>,
}

fn seat_resolution(error: impl std::fmt::Display) -> RunUnitError {
    RunUnitError::other("error", error.to_string()).with("name", json!("SeatResolutionError"))
}

/// `assertSeatId` (`convention/seat-id.mjs`): a seat id names a directory and a ref segment of a unit run, so only
/// an id of Convention's `seat-id` rule passes; anything else is Node's `TypeError`.
fn assert_seat_id(value: Option<&Value>) -> Res<()> {
    let rule = fgos_convention::packaged_rules()
        .identifier("seat-id")
        .expect("the packaged convention rules carry the seat-id rule");
    let problem = match value.and_then(Value::as_str) {
        Some(id) => rule.check(id).err(),
        None => Some("invalid-identifier"),
    };
    let shown = || match value {
        None => "undefined".to_string(),
        Some(v) => serde_json::to_string(v).unwrap_or_default(),
    };
    let message = match problem {
        None => return Ok(()),
        Some("reserved-identifier") => format!(
            "seat id \"{}\" is reserved ({})",
            value.and_then(Value::as_str).unwrap_or_default(),
            rule.reserved.join(", ")
        ),
        Some(_) => format!(
            "seat id {} must be 1-{} characters: a lowercase letter, then lowercase letters, digits or \"-\"",
            shown(),
            rule.max_length
        ),
    };
    Err(RunUnitError::other("error", message).with("name", json!("TypeError")))
}

/// The pattern run over the pure loop: each dispatch's commands run, their answers handed back in command order.
fn run_collaboration<H: UnitRunHost + Sync>(shared: &Shared<'_, '_, H>, host: &H) -> Res<Value> {
    let (effective, mut run) = {
        let mut guard = lock(shared);
        let State { ctx, scope } = &mut *guard;
        match ctx.loop_start(scope)? {
            Ok(started) => started,
            Err(early) => return Ok(early),
        }
    };
    let mut answers = None;
    let pattern = loop {
        // The room is read again before every step, from the launches the run made so far, so a round that would
        // start under a spent ceiling does not (Node's `hasLaunchRoom`, asked when the round starts).
        run.set_launch_room(lock(shared).ctx.launch_room());
        match run.step(answers.take()).map_err(seat_resolution)? {
            Step::Done(result) => break result,
            Step::Dispatch(commands) => answers = Some(run_batch(shared, host, commands)?),
        }
    };
    let mut guard = lock(shared);
    let State { ctx, scope } = &mut *guard;
    if run.ceiling_hit() {
        scope.ceiling_hit = true;
    }
    ctx.loop_end(scope, &effective, pattern)
}

/// The commands of one dispatch, as Node runs them together: every seat binds first, in listed order (each sees
/// its earlier siblings, and a group launches only once all its seats are bound), then the seats and the verify
/// run at once, each recording under the run's lock, which no dispatch and no verify holds. The answers come
/// back in command order; a throw of one is the batch's throw once every one has settled.
fn run_batch<H: UnitRunHost + Sync>(
    shared: &Shared<'_, '_, H>,
    host: &H,
    commands: Vec<Command>,
) -> Res<Vec<Value>> {
    let jobs: Vec<Res<Job>> = commands
        .iter()
        .map(|command| match command {
            Command::Role(call) => {
                let mut guard = lock(shared);
                guard.ctx.prepare_role(call)
            }
            Command::Verify { .. } => Ok(Job::Verify),
        })
        .collect();
    let answer = |job: Res<Job>| -> Res<Value> {
        match job? {
            Job::Done(value) => Ok(value),
            Job::Role(role) => continue_role(shared, host, *role),
            Job::Verify => verify_unit(shared, host),
        }
    };
    let results: Vec<Res<Value>> = if jobs.len() <= 1 {
        jobs.into_iter().map(answer).collect()
    } else {
        let answer = &answer;
        std::thread::scope(|scope| {
            let handles: Vec<_> = jobs
                .into_iter()
                .map(|job| {
                    std::thread::Builder::new()
                        .spawn_scoped(scope, move || answer(job))
                        .expect("a thread for a seat of the batch")
                })
                .collect();
            handles
                .into_iter()
                .map(|h| {
                    h.join()
                        .unwrap_or_else(|panic| std::panic::resume_unwind(panic))
                })
                .collect()
        })
    };
    results.into_iter().collect()
}

/// A bound seat to its result: each attempt on a fresh pane or process, a provider limit or a dead credential
/// answered by `answer_provider_limit`, the failed attempt left as it was.
fn continue_role<H: UnitRunHost + Sync>(
    shared: &Shared<'_, '_, H>,
    host: &H,
    mut run: RoleRun,
) -> Res<Value> {
    let setup = {
        let mut guard = lock(shared);
        let State { ctx, scope } = &mut *guard;
        match ctx.role_setup(scope, &mut run)? {
            Ok(setup) => setup,
            Err(done) => return Ok(done),
        }
    };
    let RoleRun {
        role,
        rebinding,
        mut n,
        mut bound,
        ..
    } = run;
    let mut last_result: Option<Value> = None;
    loop {
        {
            let mut guard = lock(shared);
            let State { ctx, scope } = &mut *guard;
            ctx.bindings_mut()
                .entry(role.key.clone())
                .or_insert_with(|| json!([]));
            if let Some(spent) =
                ctx.launch_ceiling_spent(scope, &role, n, rebinding, last_result.as_ref(), &bound)
            {
                return Ok(spent);
            }
        }
        let result = run_attempt(shared, host, &role, n, &bound, &setup)?;
        last_result = Some(result.clone());
        let next = {
            let mut guard = lock(shared);
            let State { ctx, scope } = &mut *guard;
            ctx.after_attempt(scope, &role, n, &bound, result)?
        };
        match next {
            Next::Done(value) => return Ok(value),
            Next::Again(next) => {
                bound = next;
                n += 1;
            }
        }
    }
}

/// One launch of the seat on `bound`: recorded before and after under the run's lock, dispatched outside it.
fn run_attempt<H: UnitRunHost + Sync>(
    shared: &Shared<'_, '_, H>,
    host: &H,
    role: &Role,
    n: usize,
    bound: &Value,
    setup: &Setup,
) -> Res<Value> {
    let input = {
        let mut guard = lock(shared);
        let State { ctx, scope } = &mut *guard;
        ctx.attempt_before(
            scope,
            role,
            n,
            bound,
            &setup.pre_existing,
            setup.native_baseline.as_ref(),
        )?
    };
    // The attempt's wall time: Execution's own span from handing the seat to Dispatch to its settled result.
    let started = Instant::now();
    let run_result = host.dispatch_seat(&SeatDispatch {
        unit_record: &input.record,
        unit: &input.unit,
        main_root: &input.main_root,
        seat: &role.seat,
        seat_unit: &role.unit,
        round: role.round,
        read_only: role.read_only,
        bound,
        assignment_id: &input.assignment_id,
        assignment_dir: &input.assignment_dir,
        objective: &input.objective,
        inputs: &role.inputs,
        admission: &input.admission,
        case_context: input.case.as_ref().map(|(c, r)| (c.as_str(), r.as_str())),
        runner_config: &input.runner,
        committed_runner_config: &input.committed,
        session: &role.session,
        custody: input.custody,
        carries_operation: input.carries_operation,
        write_scope: &input.write_scope,
        batch_size: role.batch.filter(|b| *b > 1),
    })?;
    let elapsed = started.elapsed();
    let mut guard = lock(shared);
    let State { ctx, scope } = &mut *guard;
    ctx.attempt_after(
        scope,
        role,
        n,
        bound,
        &setup.pre_existing,
        setup.native_baseline.as_ref(),
        &input.assignment_id,
        run_result,
        elapsed,
    )
}

/// The deterministic check a round ends with, bounded by `runner.timeoutMs`, under the Unit's custody; it runs
/// outside the run's lock, beside the checkers of its round.
fn verify_unit<H: UnitRunHost + Sync>(shared: &Shared<'_, '_, H>, host: &H) -> Res<Value> {
    let (command, worktree, timeout, custody) = {
        let guard = lock(shared);
        assert_not_cancelled(host)?;
        let runner = guard.ctx.snapshot_runner();
        let Some(command) = verify_command_of(&guard.ctx.unit, &runner) else {
            return Ok(json!({ "pass": true }));
        };
        (
            command,
            guard.ctx.worktree(),
            runner.get("timeoutMs").and_then(Value::as_u64),
            guard.ctx.custody,
        )
    };
    let verified = host.verify(&command, &worktree, timeout, custody);
    let outcome = match &verified.verdict {
        Verdict::Pass => "pass",
        Verdict::Findings => "findings",
        Verdict::Infrastructure(why) => why,
    };
    // The verify of the current round decides the outcome, so it is the one the record keeps.
    lock(shared).ctx.verify_facts = Some(json!({
        "command": command,
        "outcome": outcome,
        "exit": verified.status,
        "passed": verified.verdict == Verdict::Pass,
        "durationMs": verified.duration_ms,
        "how": verified.how,
        "outputDigest": verified.output_digest,
    }));
    Ok(answer_of_verify(
        &verified,
        "Verification command",
        &command,
    ))
}

fn round_of(result: &Value) -> u64 {
    result.get("round").and_then(Value::as_u64).unwrap_or(1)
}

fn uuid() -> Res<String> {
    fgos_identity::text::uuid_v4()
        .map_err(|e| RunUnitError::other("random-unavailable", e.to_string()))
}

/// Why a unit that ended on infrastructure did: the first reason that applies, from the run's own facts.
pub fn infrastructure_reason_of(started: bool, scope_error: bool, attempts: &[Value]) -> String {
    if !started {
        return "not-started".into();
    }
    if scope_error {
        return "scope-check-failed".into();
    }
    let Some(failed) = attempts
        .iter()
        .find(|a| is_infrastructure(text(a.get("outcome")).unwrap_or("")))
    else {
        return "execution-failure".into();
    };
    if text(failed.get("seat")) == Some(VERIFY_SEAT) {
        if let Some(reason) = failed.get("infrastructureReason").filter(|r| truthy(r)) {
            return format!(
                "verify-{}",
                text(Some(reason)).map_or_else(|| reason.to_string(), str::to_string)
            );
        }
    }
    if text(failed.pointer("/commit/status")) == Some("failed") {
        return format!(
            "commit-failed:{}",
            text(failed.pointer("/commit/reason")).unwrap_or("unknown")
        );
    }
    text(failed.pointer("/runResult/classification/outcome/reason"))
        .unwrap_or("execution-failure")
        .to_string()
}

/// The seats a policy decision refused, from the results that carry `refused`.
pub fn refused_seats_of(attempts: &[Value]) -> Vec<Value> {
    attempts
        .iter()
        .filter(|a| a.get("refused").is_some_and(truthy))
        .map(|a| {
            let mut out = Map::new();
            out.insert("seat".into(), a.get("seat").cloned().unwrap_or(Value::Null));
            if let Some(round) = a.get("round") {
                out.insert("round".into(), round.clone());
            }
            out.insert(
                "reason".into(),
                a.pointer("/refused/reason").cloned().unwrap_or(Value::Null),
            );
            out.insert(
                "detail".into(),
                a.pointer("/refused/detail")
                    .filter(|d| !d.is_null())
                    .cloned()
                    .unwrap_or(json!("")),
            );
            Value::Object(out)
        })
        .collect()
}

/// What the scope rule decided.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScopeRuled {
    pub outcome: String,
    pub error: Option<String>,
    pub out_of_scope: Vec<String>,
    pub out_of_scope_on_branch: Vec<String>,
}

/// The rule "writing outside the scope is not a pass": what the commits reported (this run's or an earlier one a
/// resume stands on), what the branch carries since its base (`on_branch`, an error when it could not be read),
/// and what the base Unit's branch already carried.
pub fn scope_rule(
    record: &Value,
    outcome: &str,
    results: &[Value],
    on_branch: Result<Vec<String>, String>,
) -> ScopeRuled {
    let inherited = strs(record.pointer("/branchBase/outOfScopeOnBranch"));
    let mut reported: Vec<String> = results
        .iter()
        .flat_map(|r| strs(r.pointer("/commit/outOfScope")))
        .collect();
    if let Some(bindings) = record.get("bindings").and_then(Value::as_object) {
        for attempts in bindings.values() {
            for attempt in attempts.as_array().into_iter().flatten() {
                reported.extend(strs(attempt.pointer("/commit/outOfScope")));
            }
        }
    }
    let (on_branch, error) = match on_branch {
        Ok(paths) => (paths, None),
        Err(why) => (
            Vec::new(),
            Some(format!("could not check the writes of the unit: {why}")),
        ),
    };
    let sorted = |mut paths: Vec<String>| {
        paths.sort();
        paths.dedup();
        paths
    };
    let out_of_scope = sorted([reported, on_branch.clone(), inherited.clone()].concat());
    let ruled = outcome_after_scope_rule(outcome, &out_of_scope).to_string();
    let ruled = if error.is_some() && ruled == "pass" {
        "execution-failure".to_string()
    } else {
        ruled
    };
    ScopeRuled {
        outcome: ruled,
        error,
        out_of_scope,
        out_of_scope_on_branch: sorted([on_branch, inherited].concat()),
    }
}
