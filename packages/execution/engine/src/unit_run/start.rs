//! How a unit run comes to exist: a fresh admission, or a resume taken up again from its `unit.json`. Whatever the
//! caller or the record got wrong is refused here, by name, before any seat binds. Ported from
//! `runner/execution/unit-run-start.mjs`; the loop ([`super::run`]) runs the pattern on what this returns.
//!
//! The checks of the caller's options and of a stored record are pure and live here; what needs a door (the unit
//! contract, the collaboration resolution, the persona, the inputs, the custody lease, the unit control) is asked
//! of [`UnitRunHost`] or called on the door that owns it.

use std::path::{Path, PathBuf};

use fgos_execution::admission::{Admission, CaseAdmission, Refusal, PORT_MISSING};
use fgos_execution::loops::{loop_runs_verify, param_table_of};
use fgos_execution::unit::normalize_workflow_link;
use fgos_execution::unit_record::last_attempts;
use fgos_holder_lock::{Handle, LockScope};
use fgos_run_supervisor::controller::cwd_lock::{
    admit_successor, dispatch_cwd_holder, dispatch_in_flight_error,
};
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

use super::git_port::UnitGit;
use super::host::{UnitControl, UnitRunHost};
use super::record::{publish_unit_record, read_unit_record};
use super::run_unit_contract::RunUnitError;

/// The newest `seatSchema` this release resumes (it writes 2); a later one came from a newer release.
pub const KNOWN_SEAT_SCHEMA: u64 = 2;

fn config(message: impl Into<String>) -> RunUnitError {
    RunUnitError::config(message, None, None)
}

fn coded(message: impl Into<String>, code: &str) -> RunUnitError {
    RunUnitError::config(message, Some(code), None)
}

fn pre_admission(message: impl Into<String>, code: Option<&str>) -> RunUnitError {
    RunUnitError::config(message, code, Some("pre-admission"))
}

fn named(value: Option<&Value>) -> bool {
    value
        .and_then(Value::as_str)
        .is_some_and(|s| !s.trim().is_empty())
}

fn writes_of(unit: &Value) -> &[Value] {
    unit.get("writes")
        .and_then(Value::as_array)
        .map_or(&[], Vec::as_slice)
}

/// Whether a unit changes its worktree: it declares writes, or it merges a sync base.
pub fn writes_worktree(unit: &Value, sync: Option<&Value>) -> bool {
    !writes_of(unit).is_empty() || sync.is_some_and(truthy)
}

/// The sha256 hex digests of report revisions the caller stands behind, each once.
pub fn checked_accepted_reports(accepted: Option<&Value>) -> Result<Vec<Value>, RunUnitError> {
    let Some(accepted) = accepted else {
        return Ok(Vec::new());
    };
    let digest = |d: &Value| {
        d.as_str().is_some_and(|s| {
            s.len() == 64 && s.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
        })
    };
    match accepted.as_array() {
        Some(list) if list.iter().all(digest) => Ok(dedup(list)),
        _ => Err(config(
            "runUnit: acceptedReports must be sha256 hex digests",
        )),
    }
}

/// Absolute paths whose bytes a result is bound to, each once.
pub fn checked_pin_inputs(pin_inputs: Option<&Value>) -> Result<Vec<Value>, RunUnitError> {
    let Some(pins) = pin_inputs else {
        return Ok(Vec::new());
    };
    let absolute = |p: &Value| p.as_str().is_some_and(|s| Path::new(s).is_absolute());
    match pins.as_array() {
        Some(list) if list.iter().all(absolute) => Ok(dedup(list)),
        _ => Err(config("runUnit: pinInputs must be absolute paths")),
    }
}

fn dedup(list: &[Value]) -> Vec<Value> {
    let mut out: Vec<Value> = Vec::new();
    for v in list {
        if !out.contains(v) {
            out.push(v.clone());
        }
    }
    out
}

/// The branch a writing Unit builds on: `{ branch, baseSha, outOfScopeOnBranch }` with branch and baseSha both
/// names or both null, the paths each once and sorted; `None` when the caller gave none.
pub fn checked_branch_base(value: Option<&Value>) -> Result<Option<Value>, RunUnitError> {
    let Some(value) = value else { return Ok(None) };
    let refuse = || {
        pre_admission(
            "runUnit: branchBase must be { branch, baseSha, outOfScopeOnBranch } with branch and baseSha both names or both null",
            None,
        )
    };
    let Some(object) = value.as_object() else {
        return Err(refuse());
    };
    let (branch, base) = (object.get("branch"), object.get("baseSha"));
    let paired = (named(branch) && named(base))
        || (branch == Some(&Value::Null) && base == Some(&Value::Null));
    let paths = object.get("outOfScopeOnBranch").and_then(Value::as_array);
    let Some(paths) = paths.filter(|p| paired && p.iter().all(|v| named(Some(v)))) else {
        return Err(refuse());
    };
    let mut sorted: Vec<String> = paths
        .iter()
        .filter_map(|p| p.as_str().map(str::to_string))
        .collect();
    sorted.sort();
    sorted.dedup();
    Ok(Some(
        json!({ "branch": branch, "baseSha": base, "outOfScopeOnBranch": sorted }),
    ))
}

/// A record written by a newer release than this one is never resumed.
pub fn assert_record_not_from_newer_release(
    unit_run_id: &str,
    record: &Value,
) -> Result<(), RunUnitError> {
    match record.get("seatSchema") {
        None | Some(Value::Null) => Ok(()),
        Some(Value::Number(n)) if n.as_f64().is_some_and(|f| f <= KNOWN_SEAT_SCHEMA as f64) => Ok(()),
        Some(schema) => Err(coded(
            format!("cannot resume unit run \"{unit_run_id}\": unit.json field seatSchema is {schema}, written by a newer release than this one; resume it with that release"),
            "record-from-newer-release",
        )),
    }
}

/// The collaboration pin a resume runs under, refused by name when it cannot be read or names nothing registered.
pub fn assert_collaboration_pin_usable(
    unit_run_id: &str,
    collaboration: Option<&Value>,
    registered: &[Option<&Value>],
) -> Result<(), RunUnitError> {
    let refuse = |why: String| {
        coded(
            format!("cannot resume unit run \"{unit_run_id}\": collaboration pin {why}"),
            "collaboration-pin-unusable",
        )
    };
    let Some(collaboration) = collaboration.filter(|c| c.is_object()) else {
        return Err(refuse("is unreadable".into()));
    };
    let Some(pattern) = collaboration
        .pointer("/pattern/name")
        .and_then(Value::as_str)
        .filter(|p| !p.is_empty())
    else {
        return Err(refuse("has invalid pattern name".into()));
    };
    let Some(effective) = collaboration.get("effective").filter(|e| e.is_object()) else {
        return Err(refuse("has invalid effective block".into()));
    };
    let loop_name = effective.get("loop");
    if !loop_name
        .and_then(Value::as_str)
        .is_some_and(|l| param_table_of(l).is_some())
    {
        let shown = match loop_name {
            None => "undefined".into(),
            Some(Value::String(s)) => s.clone(),
            Some(other) => other.to_string(),
        };
        return Err(refuse(format!("names unregistered loop \"{shown}\"")));
    }
    if !effective.get("params").is_some_and(Value::is_object) {
        return Err(refuse("has invalid effective params".into()));
    }
    if !registered.iter().any(|patterns| {
        patterns
            .and_then(Value::as_object)
            .is_some_and(|p| p.contains_key(pattern))
    }) {
        return Err(refuse(format!("names unregistered pattern \"{pattern}\"")));
    }
    Ok(())
}

/// A standalone writing run needs the affirmative `unbound`; every other answer, a missing view included, refuses.
pub fn require_free_worktree<A: CaseAdmission>(
    port: &A,
    worktree: &Path,
) -> Result<(), RunUnitError> {
    let binding = port
        .resolve_binding(&json!({ "worktree": worktree.display().to_string() }))
        .map_err(|e| RunUnitError::other("case-admission-port-failed", e.to_string()))?;
    let answer = binding.get("answer").and_then(Value::as_str);
    if answer == Some("unbound") {
        return Ok(());
    }
    let answer = answer.unwrap_or("binding-view-unavailable");
    let owner = binding
        .pointer("/record/caseId")
        .and_then(Value::as_str)
        .filter(|c| !c.is_empty())
        .map(|c| format!(" (case {c})"))
        .unwrap_or_default();
    let condition = binding
        .get("condition")
        .and_then(Value::as_str)
        .map(str::to_string)
        .unwrap_or_else(|| {
            format!(
                "worktree {} is not free for a run that names no case: {answer}{owner}",
                worktree.display()
            )
        });
    Err(RunUnitError::admission_refused(&Refusal {
        code: answer.to_string(),
        condition,
        violations: None,
        answer: None,
    }))
}

fn port_missing() -> RunUnitError {
    coded(
        "runUnit: a Unit that writes (or names a case) needs the case admission port in options.caseAdmission; none was given",
        PORT_MISSING,
    )
}

fn shared_cwd_refusal(cwd: &Value, unit: &Value) -> RunUnitError {
    coded(
        "--force-shared-cwd cannot be used with writes",
        "custody-required",
    )
    .with("cwd", cwd.clone())
    .with("executorId", Value::Null)
    .with(
        "capability",
        unit.get("capability").cloned().unwrap_or(Value::Null),
    )
}

/// The operation fields every producer assignment carries, checked before dispatch.
fn declared_operation_of<H: UnitRunHost>(
    host: &H,
    declared: &Value,
    unit: &Value,
    loop_name: &str,
    task_spec_root: Option<&Path>,
) -> Result<Value, RunUnitError> {
    if !declared.is_object() {
        return Err(config("runUnit: declared must be an object"));
    }
    for key in ["workId", "domain", "stage", "operation"] {
        if !named(declared.get(key)) {
            return Err(config(format!(
                "runUnit: declared.{key} must be a non-empty string"
            )));
        }
    }
    if !declared.get("operations").is_some_and(Value::is_array) {
        return Err(config(
            "runUnit: declared.operations must be the step's operations",
        ));
    }
    let operation = declared["operation"].as_str().unwrap_or_default();
    let fields = host.declared_operation_fields(declared, task_spec_root)?;
    if fields.get("dispatch").and_then(Value::as_str) == Some("human-only") {
        return Err(config(format!(
            "runUnit: operation \"{operation}\" is human-only and is never dispatched"
        )));
    }
    let unit_read_only = writes_of(unit).is_empty();
    let mutation = fields
        .get("mutation")
        .and_then(Value::as_str)
        .unwrap_or_default();
    if (mutation == "read-only") != unit_read_only {
        let what = if unit_read_only {
            "writes nothing"
        } else {
            "declares writes"
        };
        return Err(config(format!(
            "runUnit: operation \"{operation}\" is {mutation} but the unit {what}"
        )));
    }
    if loop_name != "solo" {
        return Err(config(format!(
            "runUnit: a unit carrying operation \"{operation}\" runs solo, not \"{loop_name}\""
        )));
    }
    Ok(fields)
}

/// The admission a run holds: the case, the reservation, and whether the run started and was settled.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HeldCase {
    pub case_id: String,
    pub reservation_id: String,
    pub unit_run_id: String,
    pub started: bool,
    pub settled: bool,
}

/// What a run holds until it ends, released by the loop whichever way it ends.
#[derive(Default)]
pub struct RunScope {
    pub control: Option<Box<dyn UnitControl>>,
    pub custody: Option<Handle>,
    pub admission: Option<HeldCase>,
    pub unit_record: Option<Value>,
    pub warnings: Vec<Value>,
    pub settled_unit: bool,
    pub settled_case: Option<bool>,
    pub settle_error: Option<String>,
    pub ceiling_hit: bool,
}

/// What the run is asked, read once: the options and the roots they resolved to.
pub struct StartBase<'a> {
    pub options: &'a Value,
    pub main_root: PathBuf,
    pub worktree: PathBuf,
    pub assignments_dir: PathBuf,
    pub fgos_dir: PathBuf,
    pub case_ref: Option<Value>,
    /// The config this run reads live, read at first use (`liveConfig` in Node): the caller's `runnerConfig`, else
    /// the project's, so a refusal checked before the first use is reported before a config that cannot be read.
    pub live: std::cell::OnceCell<Value>,
    pub not_a_repository: bool,
    pub cwd: PathBuf,
}

impl StartBase<'_> {
    /// A unit that writes or syncs needs a repository; a read-only one runs where roots say there is none.
    pub fn assert_repository(&self, writes: bool) -> Result<(), RunUnitError> {
        if self.not_a_repository && writes {
            return Err(config(format!(
                "fgos run must run inside a git repository (cwd: {}): not a working repository",
                self.cwd.display()
            )));
        }
        Ok(())
    }

    /// The config this run reads live, read once at its first use.
    pub fn live_config<H: UnitRunHost>(&self, host: &H) -> Result<&Value, RunUnitError> {
        if let Some(cfg) = self.live.get() {
            return Ok(cfg);
        }
        let cfg = match self.options.get("runnerConfig").filter(|c| !c.is_null()) {
            Some(c) => c.clone(),
            None => host.load_runner_config(&self.main_root)?,
        };
        Ok(self.live.get_or_init(|| cfg))
    }

    /// The runner config with the account inventory read live (never from unit.json): the caller's config, else
    /// the project's config read again at every call (`readAccountInventory`).
    pub fn with_accounts<H: UnitRunHost>(
        &self,
        host: &H,
        runner: &Value,
    ) -> Result<Value, RunUnitError> {
        with_accounts(host, self.options, &self.main_root, runner)
    }
}

/// `{ ...runner, ...readAccountInventory(mainRoot, options.runnerConfig) }`.
pub(crate) fn with_accounts<H: UnitRunHost>(
    host: &H,
    options: &Value,
    main_root: &Path,
    runner: &Value,
) -> Result<Value, RunUnitError> {
    let mut out = runner.as_object().cloned().unwrap_or_default();
    let source = match options.get("runnerConfig").filter(|c| !c.is_null()) {
        Some(c) => c.clone(),
        None => host.load_runner_config(main_root)?,
    };
    for (key, value) in account_inventory_of(&source) {
        out.insert(key, value);
    }
    Ok(Value::Object(out))
}

/// `accountInventoryConfigOf`: the account inventory (where logins are kept) of a runner config.
pub fn account_inventory_of(cfg: &Value) -> Map<String, Value> {
    let mut out = Map::new();
    for key in ["llmAccounts", "providers"] {
        if let Some(v) = cfg.get(key) {
            out.insert(key.into(), v.clone());
        }
    }
    out
}

/// The runner config a unit run records, and the hash of what seat choice and the run read from it
/// (`snapshotRunnerConfig`). The account inventory is read live at every bind and launch, never recorded.
pub fn snapshot_runner_config(cfg: &Value) -> Value {
    let or = |key: &str, empty: Value| cfg.get(key).filter(|v| truthy(v)).cloned().unwrap_or(empty);
    let filtered = json!({
        "defaults": or("defaults", json!({})),
        "maxTier": cfg.get("maxTier").filter(|v| !v.is_null()).cloned().unwrap_or(Value::Null),
        "tierFallback": or("tierFallback", json!({})),
        "capabilities": or("capabilities", json!({})),
        "roles": or("roles", json!({})),
        "personas": or("personas", json!({})),
        "loops": or("loops", json!({})),
        "patterns": or("patterns", json!({})),
        "modelPolicies": or("modelPolicies", json!({})),
        "executors": or("executors", json!({})),
        "governance": or("governance", Value::Null),
    });
    let hash: String = Sha256::digest(js_json(&filtered).as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    let mut runner = cfg.as_object().cloned().unwrap_or_default();
    runner.shift_remove("llmAccounts");
    runner.shift_remove("providers");
    json!({ "hash": hash, "runner": runner })
}

pub(crate) fn truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Value::String(s) => !s.is_empty(),
        _ => true,
    }
}

/// `JSON.stringify` of a value: serde writes integers, strings and key order as JavaScript does; a float with no
/// fraction is written as JavaScript writes it (`1`, not `1.0`).
pub(crate) fn js_json(value: &Value) -> String {
    fn normalize(v: &Value) -> Value {
        match v {
            Value::Number(n) if n.is_f64() => {
                let f = n.as_f64().unwrap_or_default();
                if f.fract() == 0.0 && f.abs() < 1e21 {
                    json!(f as i64)
                } else {
                    v.clone()
                }
            }
            Value::Array(a) => Value::Array(a.iter().map(normalize).collect()),
            Value::Object(o) => {
                Value::Object(o.iter().map(|(k, v)| (k.clone(), normalize(v))).collect())
            }
            other => other.clone(),
        }
    }
    serde_json::to_string(&normalize(value)).unwrap_or_default()
}

/// What admission or a resume hands the loop.
pub struct Started {
    pub unit: Value,
    pub unit_run_id: String,
    pub unit_record: Value,
    pub declared_op: Option<Value>,
    pub runner_config_for_loop: Option<Value>,
}

fn custody_of(base: &StartBase<'_>, worktree: &Path) -> Result<Handle, RunUnitError> {
    let scope = LockScope::seeded(Vec::new())
        .map_err(|e| RunUnitError::other("lock-registry-invalid", e.to_string()))?;
    admit_successor(&scope, &base.fgos_dir, worktree).map_err(|e| RunUnitError::dispatch(&e))
}

fn realpath(path: &Path) -> String {
    std::fs::canonicalize(path)
        .unwrap_or_else(|_| path.to_path_buf())
        .display()
        .to_string()
}

fn opt<'a>(options: &'a Value, key: &str) -> Option<&'a Value> {
    options.get(key).filter(|v| !v.is_null())
}

/// A new unit run: checked, admitted and in custody before its directory and first `unit.json` exist.
pub fn admit_fresh_unit<H: UnitRunHost>(
    host: &H,
    base: &StartBase<'_>,
    scope: &mut RunScope,
) -> Result<Started, RunUnitError> {
    let options = base.options;
    if opt(options, "declared").is_none() && opt(options, "pinInputs").is_some() {
        return Err(config("runUnit: pinInputs needs declared"));
    }
    let raw = host.read_unit_source(options)?;
    let from_file = opt(options, "unitData").is_none();
    if from_file {
        host.check_unit_file(&raw)?;
    }
    let raw = match opt(options, "stanceOptions") {
        Some(stance) => {
            let mut with = raw.as_object().cloned().unwrap_or_default();
            with.insert("stanceOptions".into(), stance.clone());
            Value::Object(with)
        }
        None => raw,
    };
    let unit = host.validate_unit(&raw)?;
    if from_file {
        host.existing_plan_ref(unit.get("plan"), &base.main_root)?;
    }
    base.assert_repository(writes_worktree(&unit, unit.get("syncBase")))?;

    let pattern = options.get("pattern");
    let reason = base
        .case_ref
        .as_ref()
        .and_then(|c| opt(c, "reason"))
        .or_else(|| opt(options, "reason"))
        .or_else(|| options.pointer("/request/reason").filter(|v| !v.is_null()))
        .cloned()
        .unwrap_or(Value::Null);
    let collaboration = host.resolve_collaboration(&json!({
        "unit": unit,
        "selectors": {
            "callerObject": pattern.filter(|p| p.is_object()),
            "callerString": pattern.and_then(Value::as_str).filter(|p| !p.is_empty()),
            "activityUnit": options.get("activityUnit"),
        },
        "request": opt(options, "request"),
        "inCase": base.case_ref.is_some(),
        "reason": reason,
        "runnerConfig": base.live_config(host)?,
        "origins": opt(options, "runnerConfig").is_none(),
    }))?;
    let loop_name = collaboration
        .pointer("/pin/effective/loop")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let explicit_verify = [opt(options, "verify"), unit.get("verify")]
        .iter()
        .any(|v| {
            v.and_then(Value::as_str)
                .is_some_and(|s| !s.trim().is_empty())
        });
    if !loop_runs_verify(&loop_name) && explicit_verify {
        return Err(pre_admission(
            format!("runUnit: loop \"{loop_name}\" has no verify checkpoint; pass no --verify or set no unit.verify, or use a loop that verifies (solo, reviewed)"),
            Some("verify-command-unsupported"),
        ));
    }
    let declared = opt(options, "declared");
    let declared_op = match declared {
        Some(d) => Some(declared_operation_of(
            host,
            d,
            &unit,
            &loop_name,
            Some(&base.main_root),
        )?),
        None => None,
    };
    if !writes_of(&unit).is_empty() && host.is_main_checkout(&base.worktree) {
        return Err(config(format!(
            "runUnit refused -- cwd \"{}\" resolves to the main checkout (\"{}\"); a mutating dispatch must run in a linked git worktree, never the main checkout",
            base.worktree.display(),
            base.main_root.display()
        )));
    }
    let pin_inputs = if declared.is_some() {
        checked_pin_inputs(opt(options, "pinInputs"))?
    } else {
        Vec::new()
    };
    let accepted_reports = checked_accepted_reports(opt(options, "acceptedReports"))?;
    let branch_base = checked_branch_base(opt(options, "branchBase"))?;
    for ov in options
        .get("overrides")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        if let Some(timeout) = ov.get("timeoutMs") {
            host.assert_run_timeout(timeout)?;
        }
    }
    let config_snapshot = snapshot_runner_config(base.live_config(host)?);
    let config_snapshot_runner = config_snapshot["runner"].clone();
    host.door_choices(
        &unit,
        &base.with_accounts(host, &config_snapshot["runner"])?,
        options,
        &collaboration,
    )?;
    let sync = match unit.get("syncBase").and_then(Value::as_str) {
        None => None,
        Some(name) => {
            let (driver, repo) = host
                .git(&base.worktree, &base.main_root)
                .map_err(|e| RunUnitError::other("git-error", e))?;
            let writer = host.git_writer();
            let git = UnitGit {
                driver: &driver,
                repo: &repo,
                custody: None,
                writer: &writer,
            };
            let sha = git
                .resolve_sync_base(name)
                .map_err(|e| RunUnitError::other("git-error", e.cause))?;
            let Some(sha) = sha else {
                return Err(config(format!(
                    "unit.syncBase \"{name}\" names no commit in this repository"
                )));
            };
            Some(json!({ "ref": name, "sha": sha, "status": "pending" }))
        }
    };
    let writing = writes_worktree(&unit, sync.as_ref());
    if writing && options.get("forceSharedCwd") == Some(&json!(true)) {
        return Err(shared_cwd_refusal(
            &json!(base.worktree.display().to_string()),
            &unit,
        ));
    }
    let port = host.admission();
    if (writing || base.case_ref.is_some()) && port.is_none() {
        return Err(port_missing());
    }
    let unit_run_id = format!(
        "unit-run-{}-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or_default(),
        random_hex::<4>()?
    );
    if let (true, None, Some(port)) = (writing, &base.case_ref, port) {
        require_free_worktree(port, &base.worktree)?;
    }
    if writing {
        scope.custody = Some(custody_of(base, &base.worktree)?);
    }
    let mut admitted_ceiling: Option<Value> = None;
    if let (Some(case_ref), Some(port)) = (&base.case_ref, port) {
        let mut proposal_ref = case_ref.as_object().cloned().unwrap_or_default();
        if truthy(&reason) {
            proposal_ref.insert("reason".into(), reason.clone());
        }
        // The rigor the seats will bind at (the unit's own or its capability's, the stronger).
        let rigor = fgos_execution::bind::effective_rigor(&unit, &config_snapshot_runner)
            .map_err(|e| pre_admission(e.to_string(), None))?;
        let mut proposal = json!({
            "unitRunId": unit_run_id,
            "caseRef": proposal_ref,
            "activity": case_ref.get("activity"),
            "writes": writes_of(&unit),
            "worktree": realpath(&base.worktree),
            "readOnly": !writing,
            "pattern": collaboration.pointer("/pin/pattern/name"),
            "seatLaunches": collaboration.get("launchBound"),
            "blind": unit.get("blind") == Some(&json!(true)),
            "handoffRefs": unit.get("inputs"),
            "reason": reason,
        });
        if let (Some(rigor), Some(p)) = (rigor, proposal.as_object_mut()) {
            // Before `reason`, where Node's object literal names it; an unknown rigor is left out, as undefined is.
            let reason = p.shift_remove("reason").unwrap_or(Value::Null);
            p.insert("rigor".into(), json!(rigor));
            p.insert("reason".into(), reason);
        }
        match port
            .admit(&proposal)
            .map_err(|e| RunUnitError::other("case-admission-port-failed", e.to_string()))?
        {
            Admission::Refused(refusal) => return Err(RunUnitError::admission_refused(&refusal)),
            Admission::Admitted {
                reservation_id,
                case_id,
                seat_launch_ceiling,
            } => {
                admitted_ceiling = seat_launch_ceiling.map(|c| json!(c));
                host.on_case_admitted(&case_id, &reservation_id);
                scope.admission = Some(HeldCase {
                    case_id,
                    reservation_id,
                    unit_run_id: unit_run_id.clone(),
                    started: false,
                    settled: false,
                });
            }
        }
    }
    let unit_dir = base.assignments_dir.join(&unit_run_id);
    let persona_pin = match unit.get("persona").and_then(Value::as_str) {
        Some(persona) => {
            host.persona_pin(persona, &base.main_root, opt(options, "personaScope"))?
        }
        None => None,
    };
    let blind = unit.get("blind") == Some(&json!(true));
    let anonymize = unit.get("anonymizeInputs").is_some_and(truthy);
    let mut inputs_ask = json!({ "accept": accepted_reports });
    if blind {
        inputs_ask["blind"] = json!(true);
        inputs_ask["anonymize"] = json!(unit.get("anonymizeInputs") == Some(&json!(true)));
    } else if anonymize {
        inputs_ask["anonymizeInto"] = json!(unit_dir.join("inputs").display().to_string());
    }
    let resolved = match host.resolve_inputs(
        unit.get("inputs").unwrap_or(&Value::Null),
        &base.main_root,
        &inputs_ask,
    ) {
        Ok(r) => r,
        Err(e) => {
            let _ = std::fs::remove_dir_all(&unit_dir);
            return Err(e);
        }
    };
    let mut record = Map::new();
    record.insert("unit".into(), unit.clone());
    record.insert("seatSchema".into(), json!(KNOWN_SEAT_SCHEMA));
    record.insert(
        "seats".into(),
        collaboration.get("seats").cloned().unwrap_or(Value::Null),
    );
    if let Some(id) = options
        .get("workflowId")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
    {
        record.insert("workflowId".into(), json!(id));
    }
    let link = scope.admission.as_ref().and_then(|held| {
        normalize_workflow_link(Some(&json!({
            "caseId": held.case_id,
            "activity": base.case_ref.as_ref().and_then(|c| c.get("activity")),
            "reservationId": held.reservation_id,
        })))
        .ok()
        .flatten()
        .map(|l| l.to_json())
    });
    record.insert("workflow".into(), link.unwrap_or(Value::Null));
    if let Some(ceiling) = admitted_ceiling {
        record.insert("seatLaunchCeiling".into(), ceiling);
    }
    let mut pin = collaboration
        .get("pin")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    let entry_digest =
        fgos_canonical_json::canonical_json(collaboration.get("entry").unwrap_or(&Value::Null))
            .map_err(|e| RunUnitError::other("canonical-json", e.to_string()))?;
    let digest: String = Sha256::digest(entry_digest.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    let mut pattern_pin = pin
        .get("pattern")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    pattern_pin.insert("digest".into(), json!(digest));
    pin.insert("pattern".into(), Value::Object(pattern_pin));
    record.insert("collaboration".into(), Value::Object(pin));
    record.insert(
        "pattern".into(),
        collaboration
            .pointer("/pin/pattern/name")
            .cloned()
            .unwrap_or(Value::Null),
    );
    record.insert(
        "overrides".into(),
        opt(options, "overrides")
            .cloned()
            .unwrap_or_else(|| json!([])),
    );
    let generated = config_snapshot
        .pointer("/runner/generatedPaths")
        .filter(|v| !v.is_null())
        .cloned()
        .unwrap_or_else(|| json!([]));
    let write_scope = host.expand_generated(unit.get("writes").unwrap_or(&json!([])), &generated);
    record.insert("configSnapshot".into(), config_snapshot);
    record.insert("writeScope".into(), write_scope);
    if let Some(p) = persona_pin {
        record.insert("personaPin".into(), p);
    }
    if let Some(b) = branch_base {
        record.insert("branchBase".into(), b);
    }
    record.insert(
        "resolvedInputs".into(),
        resolved.get("refs").cloned().unwrap_or_else(|| json!([])),
    );
    if !accepted_reports.is_empty() {
        record.insert("acceptedReports".into(), json!(accepted_reports));
    }
    if anonymize || blind {
        record.insert(
            "inputMap".into(),
            resolved.get("inputMap").cloned().unwrap_or(Value::Null),
        );
    }
    record.insert("worktree".into(), json!(realpath(&base.worktree)));
    if let Some(s) = sync {
        record.insert("sync".into(), s);
    }
    if let Some(declared) = declared {
        let mut d = Map::new();
        d.insert("workId".into(), declared["workId"].clone());
        if declared.get("title").is_some_and(truthy) {
            d.insert("title".into(), declared["title"].clone());
        }
        d.insert("domain".into(), declared["domain"].clone());
        if declared.get("workflow").is_some_and(truthy) {
            d.insert("workflow".into(), declared["workflow"].clone());
        }
        d.insert("stage".into(), declared["stage"].clone());
        d.insert("operation".into(), declared["operation"].clone());
        d.insert("operations".into(), declared["operations"].clone());
        record.insert("declared".into(), Value::Object(d));
        record.insert("pinInputs".into(), json!(pin_inputs));
    }
    record.insert("createdBy".into(), json!(host.created_by()));
    record.insert(
        "createdAt".into(),
        json!(crate::transport::visibility_session::iso_now()),
    );
    record.insert("execution".into(), json!({ "status": "running" }));
    let record = Value::Object(record);
    publish_unit_record(&unit_dir, &record)
        .map_err(|e| RunUnitError::other("unit-record-not-written", e))?;
    if let Some(held) = scope.admission.as_mut() {
        held.started = true;
    }
    match host.acquire_unit_control(&unit_dir, &unit_run_id) {
        Ok(control) => scope.control = Some(control),
        Err(_) => {
            return Err(coded(
                format!("unit run \"{unit_run_id}\" is already driven by another controller"),
                "resume-in-progress",
            ))
        }
    }
    host.on_unit_run_created(&unit_run_id);
    Ok(Started {
        unit,
        unit_run_id,
        unit_record: record,
        declared_op,
        runner_config_for_loop: None,
    })
}

pub(crate) fn random_hex<const N: usize>() -> Result<String, RunUnitError> {
    fgos_identity::text::random_bytes::<N>()
        .map(|b| b.iter().map(|x| format!("{x:02x}")).collect())
        .map_err(|e| RunUnitError::other("random-unavailable", e.to_string()))
}

/// An attempt handed to a supervisor whose controller went away before recording its outcome.
pub fn left_by_dead_controller<H: UnitRunHost>(
    host: &H,
    attempt: Option<&Value>,
    assignments_dir: &Path,
) -> Result<bool, RunUnitError> {
    let Some(attempt) = attempt else {
        return Ok(false);
    };
    let Some(id) = attempt.get("assignmentId").and_then(Value::as_str) else {
        return Ok(false);
    };
    if attempt.get("outcome").is_some() {
        return Ok(false);
    }
    Ok(host
        .current_attempt(assignments_dir, id)?
        .is_some_and(|prior| prior.dir.join("envelope.json").exists()))
}

/// A unit run taken up again from its `unit.json`, under one controller; whatever makes it unsafe is refused by name.
pub fn load_resumed_unit<H: UnitRunHost>(
    host: &H,
    base: &StartBase<'_>,
    scope: &mut RunScope,
) -> Result<Started, RunUnitError> {
    let options = base.options;
    let unit_run_id = options
        .get("resumeUnitRunId")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let unit_dir = base.assignments_dir.join(&unit_run_id);
    let unit_json = unit_dir.join("unit.json");
    if !unit_json.exists() {
        return Err(config(format!(
            "cannot resume unit run \"{unit_run_id}\": unit.json not found at \"{}\"",
            unit_json.display()
        )));
    }
    if !host.is_seat_record(&read_unit_record(&unit_run_id, &unit_json)?) {
        return Err(coded(
            format!("cannot resume unit run \"{unit_run_id}\": record-predates-seat-binding (its seats were keyed by role name; start the work again as a new unit run)"),
            "record-predates-seat-binding",
        ));
    }
    match host.acquire_unit_control(&unit_dir, &unit_run_id) {
        Ok(control) => scope.control = Some(control),
        Err(held) => {
            let pid = held
                .holder_pid
                .map(|p| format!(" (PID {p})"))
                .unwrap_or_default();
            return Err(coded(
                format!(
                    "cannot resume unit run \"{unit_run_id}\": another controller drives it{pid}"
                ),
                "resume-in-progress",
            ));
        }
    }
    let mut record = read_unit_record(&unit_run_id, &unit_json)?;
    assert_record_not_from_newer_release(&unit_run_id, &record)?;
    if let Some(branch_base) = checked_branch_base(opt(options, "branchBase"))? {
        record["branchBase"] = branch_base;
    }
    let mut runner_for_loop: Value;
    if record.get("collaboration").is_some_and(truthy) {
        let shipped = host.shipped_catalog();
        let live = base.live_config(host)?;
        let live_patterns = live
            .get("patterns")
            .filter(|p| !p.is_null())
            .or_else(|| live.pointer("/runner/patterns"));
        assert_collaboration_pin_usable(
            &unit_run_id,
            record.get("collaboration"),
            &[
                shipped.get("patterns"),
                record.pointer("/configSnapshot/runner/patterns"),
                live_patterns,
            ],
        )?;
        runner_for_loop = record
            .pointer("/configSnapshot/runner")
            .filter(|v| !v.is_null())
            .cloned()
            .unwrap_or_else(|| json!({}));
    } else {
        let (collaboration, runner) = host.collaboration_of_record(&record)?;
        record["collaboration"] = collaboration;
        runner_for_loop = runner.clone();
        if record.get("configSnapshot").is_some_and(truthy) {
            record["configSnapshot"]["runner"] = runner;
        }
    }
    let unit = host.validate_unit(record.get("unit").unwrap_or(&Value::Null))?;
    let writing = writes_worktree(&unit, record.get("sync"));
    base.assert_repository(writing)?;
    let link = normalize_workflow_link(record.get("workflow"))
        .ok()
        .flatten();
    let port = host.admission();
    if writing {
        let Some(port) = port else {
            return Err(port_missing());
        };
        if link.is_none() {
            require_free_worktree(port, &base.worktree)?;
        }
    }
    if let (Some(_), Some(link)) = (port, &link) {
        if let Some(reservation) = &link.reservation_id {
            scope.admission = Some(HeldCase {
                case_id: link.case_id.clone(),
                reservation_id: reservation.clone(),
                unit_run_id: unit_run_id.clone(),
                started: true,
                settled: false,
            });
        }
    }
    if !record.get("resolvedInputs").is_some_and(Value::is_array) {
        return Err(config(format!(
            "cannot resume unit run \"{unit_run_id}\": unit.json has no resolvedInputs"
        )));
    }
    for attempt in last_attempts(&record) {
        if !left_by_dead_controller(host, Some(attempt), &base.assignments_dir)? {
            continue;
        }
        let id = attempt["assignmentId"].as_str().unwrap_or_default();
        let Some(prior) = host.current_attempt(&base.assignments_dir, id)? else {
            continue;
        };
        let state = host.adopt_state(&prior.dir);
        if state == "closed" {
            continue;
        }
        let look = "fgos dispatch inspect";
        if state == "legacy-run" {
            return Err(coded(
                format!("cannot resume unit run \"{unit_run_id}\": attempt \"{}\" ran before the run supervisor and cannot be judged ({}); look with `{look}`", prior.run_id, prior.dir.display()),
                "attempt-legacy-run",
            ));
        }
        return Err(coded(
            format!("cannot resume unit run \"{unit_run_id}\": attempt \"{}\" is still {state} ({}); look with `{look}` and resume once it has closed", prior.run_id, prior.dir.display()),
            "attempt-still-running",
        )
        .with("attemptState", json!(state)));
    }
    let current = snapshot_runner_config(base.live_config(host)?);
    let recorded_hash = record.pointer("/configSnapshot/hash").cloned();
    if Some(&current["hash"]) != recorded_hash.as_ref() {
        if let Some(bindings) = record.get_mut("bindings").and_then(Value::as_object_mut) {
            for attempts in bindings.values_mut() {
                for attempt in attempts.as_array_mut().into_iter().flatten() {
                    if attempt.get("configHash").is_none_or(Value::is_null) {
                        attempt["configHash"] = recorded_hash.clone().unwrap_or(Value::Null);
                    }
                }
            }
        }
        let frozen_loops = runner_for_loop
            .get("loops")
            .filter(|v| !v.is_null())
            .cloned()
            .or_else(|| {
                record
                    .pointer("/configSnapshot/runner/loops")
                    .filter(|v| !v.is_null())
                    .cloned()
            });
        let frozen_patterns = runner_for_loop
            .get("patterns")
            .filter(|v| !v.is_null())
            .cloned()
            .or_else(|| {
                record
                    .pointer("/configSnapshot/runner/patterns")
                    .filter(|v| !v.is_null())
                    .cloned()
            });
        let mut runner = current["runner"].as_object().cloned().unwrap_or_default();
        if let Some(l) = frozen_loops.filter(truthy) {
            runner.insert("loops".into(), l);
        }
        if let Some(p) = frozen_patterns.filter(truthy) {
            runner.insert("patterns".into(), p);
        }
        record["configSnapshot"] = json!({ "hash": current["hash"], "runner": runner });
        runner_for_loop = record["configSnapshot"]["runner"].clone();
    }
    if let Some(holder) = dispatch_cwd_holder(&base.fgos_dir, &base.worktree) {
        let e = dispatch_in_flight_error(&base.worktree, holder.pid, &holder.lock_path);
        return Err(RunUnitError::dispatch(&e));
    }
    assert_no_stray_commit(host, &unit_run_id, &record, base)?;
    let unpassed: Vec<Value> = last_attempts(&record)
        .into_iter()
        .filter(|a| a.get("outcome").and_then(Value::as_str) != Some("pass"))
        .map(|a| a.get("binding").cloned().unwrap_or_else(|| json!({})))
        .collect();
    host.pinned_accounts_usable(
        &unpassed,
        &base.with_accounts(
            host,
            record
                .pointer("/configSnapshot/runner")
                .unwrap_or(&json!({})),
        )?,
        &format!("cannot resume unit run \"{unit_run_id}\""),
    )?;
    let declared_op = match record.get("declared").filter(|d| truthy(d)) {
        Some(declared) => {
            let loop_name = record
                .pointer("/collaboration/effective/loop")
                .and_then(Value::as_str)
                .or_else(|| record.get("pattern").and_then(Value::as_str))
                .unwrap_or_default()
                .to_string();
            Some(declared_operation_of(
                host, declared, &unit, &loop_name, None,
            )?)
        }
        None => None,
    };
    if writing {
        if options.get("forceSharedCwd") == Some(&json!(true)) {
            return Err(shared_cwd_refusal(
                record.get("worktree").unwrap_or(&Value::Null),
                &unit,
            ));
        }
        let worktree = PathBuf::from(
            record
                .get("worktree")
                .and_then(Value::as_str)
                .unwrap_or_default(),
        );
        scope.custody = Some(custody_of(base, &worktree)?);
    }
    Ok(Started {
        unit,
        unit_run_id,
        unit_record: record,
        declared_op,
        runner_config_for_loop: Some(runner_for_loop),
    })
}

/// A resume cannot go past a commit that landed holding paths outside the unit's write scope.
fn assert_no_stray_commit<H: UnitRunHost>(
    host: &H,
    unit_run_id: &str,
    record: &Value,
    base: &StartBase<'_>,
) -> Result<(), RunUnitError> {
    for attempt in last_attempts(record) {
        let Some(commit) = attempt.get("commit") else {
            continue;
        };
        let sha = commit
            .get("sha")
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty());
        if commit.get("status").and_then(Value::as_str) != Some("failed")
            || commit.get("reason").and_then(Value::as_str) != Some("committed-set-mismatch")
        {
            continue;
        }
        let Some(sha) = sha else { continue };
        let worktree = PathBuf::from(
            record
                .get("worktree")
                .and_then(Value::as_str)
                .unwrap_or_default(),
        );
        let (driver, repo) = host
            .git(&worktree, &base.main_root)
            .map_err(|e| RunUnitError::other("git-error", e))?;
        let writer = host.git_writer();
        let git = UnitGit {
            driver: &driver,
            repo: &repo,
            custody: None,
            writer: &writer,
        };
        if !git
            .commit_on_branch(sha)
            .map_err(|e| RunUnitError::other("git-error", e.cause))?
        {
            continue;
        }
        let list = |key: &str, sign: &str| -> Vec<String> {
            commit
                .get(key)
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .filter_map(Value::as_str)
                .map(|p| format!("{sign}{p}"))
                .collect()
        };
        let diff = [list("unexpected", "+"), list("missing", "-")]
            .concat()
            .join(", ");
        return Err(config(format!(
            "cannot resume unit run \"{unit_run_id}\": commit {sha} is already on the branch but does not hold exactly the files of its write scope ({diff}; + is outside the scope, - is missing); inspect it and take it off the branch by hand (git reset HEAD~1 keeps its files in the worktree), then resume"
        )));
    }
    Ok(())
}
