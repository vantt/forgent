//! `execute_assignment`: one Assignment into one supervised attempt: load its immutable input, admit a Run
//! attempt, lease its account, launch it under the run supervisor and return the settled Run Result.
//!
//! Rules:
//! - Run belongs to Assignment, not Work; Work lifecycle state is never mutated as a side effect.
//! - `assignment.json` is written before execution, `run.json` before the launch.
//! - Control-plane files are never evidence for themselves; worker-produced files or git diffs prove work, and
//!   files already dirty before the launch never count.
//!
//! What the machine around the loop decides (the runner config of a project, the dispatch plan, the pane, the
//! prompt, the accounts, git) is reached through [`ExecutePorts`]; the order of the loop and every refusal in it
//! are this module's.

use std::fs;
use std::path::{Path, PathBuf};

use fgos_execution::bind::BindSession;
use fgos_execution::decide::CheckoutFacts;
use fgos_execution::dispatch_policy::launch_pin_of;
use fgos_execution::handoff::sha256_hex;
use fgos_execution::ports::Machine;
use fgos_run_supervisor::controller::error::DispatchError;
use fgos_run_supervisor::controller::launch::{
    acquire_attempt_locks, AttemptHost, AttemptLockRequest, LaunchSettings,
};
use fgos_run_supervisor::controller::lease::{
    acquire_run_control, build_run_control_holder, publish_marker_once, AcquireOptions,
    AcquireOutcome,
};
use serde_json::{json, Map, Value};

use super::attempt::{
    close_attempt, open_attempt, publish_attempt_intent, Control, GiveBack, OpenAttempt,
};
use super::inputs::{
    digest_pinned_inputs, publish_evaluator_baseline, snapshot_dirty_before_files, Baseline,
    CheckoutRoots,
};
use super::launch::{await_binding, AwaitInput};
use super::lease::{lease_account_for_attempt, renew_leased_login, LeaseRequest};
use super::legality::{
    fallback_mutation_for_assignment, unit_run_id_of, validate_assignment_legality, LegalityFacts,
    LegalityOptions,
};
use super::outcome::{resumed_run_outcome, AdoptDoor};
use super::seat::{prepare_attempt_seat, SeatHooks, SeatInput, SeatPorts};
use super::RunnerConfigError;
use crate::accounts::{Accounts, Host};
use crate::assignment::builder::PromptOptions;
use crate::confinement::request::BuildClock;
use crate::contract::effective::{build_effective_execution_contract, compute_sha256_digest};
use crate::planning::admission::{
    admit_run_attempt, AdmissionError, AdmitRequest, EFFECTIVE_EXECUTION_CONTRACT_FILE,
};
use crate::run_result::reader::InterpretedRunResult;
use crate::settlement::{settle_refused_lease, LeaseRefusal, RefusedLease, SettlementGit};
use crate::transport::adapters::{current_dispatch_depth, MAX_DISPATCH_DEPTH};
use crate::transport::visibility_session::iso_now;

/// Why an assignment did not produce a settled result.
#[derive(Debug, Clone, PartialEq)]
pub enum ExecuteError {
    /// A refusal of the runner (`RunnerConfigError`).
    Config(Box<RunnerConfigError>),
    /// A refusal of dispatch (`DispatchError`): `dispatch-depth-exceeded`, `supervised-adapter-required`,
    /// `custody-required`, a lock held, a launch that did not write.
    Dispatch(Box<DispatchError>),
    /// A refusal of admission.
    Admission(Box<AdmissionError>),
}

impl std::fmt::Display for ExecuteError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Config(e) => e.fmt(f),
            Self::Dispatch(e) => e.fmt(f),
            Self::Admission(e) => e.fmt(f),
        }
    }
}

impl std::error::Error for ExecuteError {}

impl From<RunnerConfigError> for ExecuteError {
    fn from(e: RunnerConfigError) -> Self {
        Self::Config(Box::new(e))
    }
}
impl From<DispatchError> for ExecuteError {
    fn from(e: DispatchError) -> Self {
        Self::Dispatch(Box::new(e))
    }
}
impl From<AdmissionError> for ExecuteError {
    fn from(e: AdmissionError) -> Self {
        Self::Admission(Box::new(e))
    }
}

/// What the caller states beside the assignment.
#[derive(Default)]
pub struct ExecuteOptions<'a> {
    pub cwd: Option<PathBuf>,
    pub repo_root: Option<PathBuf>,
    pub runner_config: Option<Value>,
    pub binding: Option<Value>,
    pub cli_override: Option<Value>,
    pub options: Option<Value>,
    pub has_live_task_access: bool,
    pub timeout_ms: Option<u64>,
    /// `Some(false)` asserts a mutating assignment; `Some(true)` requires a read-only one; `None` reads as read-only.
    pub is_read_only_mode: Option<bool>,
    pub operations: Option<Vec<Value>>,
    pub force_shared_cwd: bool,
    pub pin_inputs: Vec<String>,
    pub dispatch_batch_key: Option<String>,
    /// Seats launched together as one group (more than one): their panes share the tab in equal parts.
    pub dispatch_batch_size: Option<u32>,
    pub retry_id: Option<String>,
    pub predecessor_run_id: Option<String>,
    pub destination: Option<String>,
    pub payload_digest: Option<String>,
    pub expected_run_id: Option<String>,
    pub force_new_attempt: bool,
    pub refuse_if_settled: bool,
    pub launch_command_id: Option<String>,
    /// The held lease of the cwd the caller keeps across attempts and commit (a unit run's custody): the attempt
    /// runs under it and takes no lease of its own.
    pub custody: Option<&'a fgos_holder_lock::Handle>,
    pub provider_capacity_runtime_dir: Option<PathBuf>,
    pub control_ttl_ms: Option<u64>,
    pub committed_runner_config: Option<Value>,
    pub session: BindSession,
    pub case_context: Option<(String, String)>,
    pub blind: bool,
    pub context_refs: Option<Value>,
}

/// The machine around the loop.
pub trait ExecutePorts: SeatPorts {
    fn checkout(&self) -> &dyn CheckoutFacts;
    fn machine(&self) -> &dyn Machine;
    fn git(&self) -> &dyn SettlementGit;
    fn roots(&self) -> &dyn CheckoutRoots;
    fn adopt(&self) -> &dyn AdoptDoor;
    fn give_back(&self) -> &dyn GiveBack;
    /// The accounts under a runtime directory (the machine's own when `None`).
    fn accounts_at(&self, runtime_dir: Option<&Path>) -> Result<Accounts<'_>, RunnerConfigError>;
    /// The runner config committed under a project root, the default executor applied.
    fn load_runner_config(&self, root: &Path) -> Result<Value, RunnerConfigError>;
    /// The dispatch plan the decision door compiled for this assignment; carries the policy and enforces that the
    /// decided executor agrees with it.
    fn decided_dispatch_plan(
        &self,
        cfg: &Value,
        assignment: &Value,
        opts: &ExecuteOptions,
    ) -> Result<Value, RunnerConfigError>;
    /// The posture of a binding resolved to the requirement the Confinement Authority is handed.
    fn posture_requirement(&self, binding: &Value, cfg: &Value) -> Value;
    /// `{ renderedBody, templateProvenance }` of the operation prompt template the assignment names.
    fn resolve_template(&self, assignment: &Value, cwd: &Path) -> Result<Value, RunnerConfigError>;
    /// The rendered prompt of the assignment.
    fn render_prompt(
        &self,
        assignment: &Value,
        options: &PromptOptions,
    ) -> Result<String, RunnerConfigError>;
    fn attempt_host(&self) -> Result<AttemptHost, RunnerConfigError>;
    fn step_env(&self) -> Map<String, Value>;
    fn launch_settings(&self, root: &Path) -> Result<LaunchSettings, RunnerConfigError>;
    /// `retainFailedPaneMsOf(root)`: how long a terminal attempt's failed pane is kept, `null` until a person closes it.
    fn retain_failed_pane_ms(&self, root: &Path) -> Value;
    fn fgos_dir_of_root(&self, root: &Path) -> PathBuf;
    fn clock(&self) -> BuildClock<'_>;
    /// How deep in nested dispatches this controller runs (the machine's own answer unless a port knows better).
    fn dispatch_depth(&self) -> f64 {
        current_dispatch_depth()
    }
    /// The caller's opt-in to renewing a login close to expiry before a private home is copied from it.
    fn renewal(&self) -> Option<&dyn super::lease::CredentialRenewal> {
        None
    }
    /// The caller's opt-in to one real call with an account's credential, to find out whether a quarantined account
    /// came back.
    fn credential_probe(&self) -> Option<super::lease::CredentialProbe<'_>> {
        None
    }
    /// The account-state clock, in milliseconds.
    fn now_ms(&self) -> i64 {
        crate::accounts::SystemHost::new().now_ms()
    }
    /// The pane screen a person watching this controller sees, followed until the returned stop is called.
    fn follow_screen<'a>(
        &'a self,
        attempt_id: &str,
        run_dir: &Path,
    ) -> Option<Box<dyn FnOnce() + 'a>> {
        let _ = (attempt_id, run_dir);
        None
    }
}

fn text(value: &Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

fn absolute(path: &Path) -> PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}

/// Why a mutating attempt cannot launch from this route on this platform. On Windows a lock does not pass to a
/// child with its handle: the controller keeps the cwd lease and serves its request channel to the supervisor
/// (`cwdLeaseOwner`, [`super::launch::serving_lease_owner`]), but a writing unit run is not yet proven end to end on
/// native Windows (the Git door takes no borrowed custody there), so Windows mutating launches stay on the Node
/// route until it is.
pub fn mutating_launch_refusal(windows: bool) -> Option<DispatchError> {
    windows.then(|| {
        DispatchError::new(
            "windows-cwd-lease-holder-missing",
            "a mutating attempt cannot launch from the native route on Windows: the controller has no cwd lease holder endpoint to name to the supervisor (cwdLeaseOwner); Windows runs it through the Node launch route",
        )
    })
}

fn json_text(value: &Value) -> String {
    serde_json::to_string(value).unwrap_or_default()
}

fn legality_options<'a>(
    opts: &'a ExecuteOptions<'a>,
    cwd: &'a str,
    pinned: Option<&'a str>,
) -> LegalityOptions<'a> {
    LegalityOptions {
        operations: opts.operations.as_deref(),
        is_read_only_mode: opts.is_read_only_mode,
        cwd: Some(cwd),
        repo_root: opts.repo_root.as_deref(),
        committed_runner_config: opts.committed_runner_config.as_ref(),
        session: opts.session,
        pinned_executor: pinned,
    }
}

/// The assignment this Run executes: `assignment.json` under `assignment_dir` is its immutable input. A first call
/// publishes it atomically (template provenance resolved first, so the file on disk carries it); a later call, or
/// one that lost the publish race, reads it back and fails hard when it cannot be read or parsed rather than run
/// a different assignment from memory. `mutation` is backfilled on a record written without it, from the
/// normalizer's own rule, and the result is checked again before its template is rendered.
pub fn load_immutable_assignment(
    assignment: &Value,
    assignment_dir: &Path,
    cwd: &Path,
    opts: &ExecuteOptions,
    ports: &dyn ExecutePorts,
    facts: &LegalityFacts<'_>,
    pinned_executor: Option<&str>,
) -> Result<(Value, String, Option<Value>), RunnerConfigError> {
    let id = text(assignment, "assignmentId").unwrap_or_default();
    let path = assignment_dir.join("assignment.json");
    let mut loaded = assignment.clone();
    let mut published = false;
    if !path.exists() {
        if assignment
            .get("contractTemplate")
            .is_some_and(|t| crate::planning::truthy(Some(t)))
            && assignment
                .pointer("/provenance/template/templateSnapshot")
                .is_none_or(Value::is_null)
        {
            let resolution = ports.resolve_template(assignment, cwd)?;
            loaded["provenance"]["template"] = resolution
                .get("templateProvenance")
                .cloned()
                .unwrap_or(Value::Null);
        }
        // Atomic publish (fsynced temp + exclusive hard link): a crash mid-write never leaves a partial file that
        // would brick this Assignment id. `false` means a concurrent writer won: read its file back below.
        published = fgos_run_supervisor::controller::proof::publish_immutable_proof(&path, &loaded)
            .map_err(|e| {
                RunnerConfigError::new(format!(
                    "assignment.json for \"{id}\" could not be published: {e}"
                ))
            })?;
    }
    if !published {
        let raw = fs::read_to_string(&path).map_err(|e| {
            RunnerConfigError::new(format!(
                "assignment.json for \"{id}\" exists but could not be read: {e}"
            ))
        })?;
        let parsed: Value = serde_json::from_str(&raw).map_err(|e| {
            RunnerConfigError::new(format!(
                "assignment.json for \"{id}\" is corrupt (invalid JSON): {e}"
            ))
        })?;
        loaded = match parsed.get("policy") {
            Some(policy) => {
                let normalized = crate::contract::validate::normalize_saved_policy_tier(
                    policy, true,
                )
                .map_err(|e| {
                    RunnerConfigError::new(format!(
                        "assignment.json for \"{id}\" is corrupt or invalid: {e}"
                    ))
                })?;
                let mut next = parsed.clone();
                next["policy"] = normalized;
                next
            }
            None => parsed,
        };
    }
    let mutation = match loaded.get("mutation").and_then(Value::as_str) {
        Some(m @ ("read-only" | "mutating")) => Some(m.to_string()),
        _ => fallback_mutation_for_assignment(&loaded),
    };
    let mut effective = loaded;
    if let Some(m) = &mutation {
        effective["mutation"] = json!(m);
    }
    validate_assignment_legality(
        &effective,
        &legality_options(opts, &cwd.to_string_lossy(), pinned_executor),
        facts,
    )?;
    let mut resolution = None;
    if effective
        .get("contractTemplate")
        .is_some_and(|t| crate::planning::truthy(Some(t)))
    {
        let resolved = ports.resolve_template(&effective, cwd)?;
        effective["provenance"]["template"] = resolved
            .get("templateProvenance")
            .cloned()
            .unwrap_or(Value::Null);
        resolution = Some(resolved);
    }
    Ok((effective, mutation.unwrap_or_default(), resolution))
}

/// Publish the dispatched-run marker: cross-pass consumption refuses a run directory no runner dispatched (a
/// planted `runs/NN` is never evidence of a real run). One marker per attempt, so a torn write costs only this
/// marker; bookkeeping never aborts a dispatch that already started.
fn publish_dispatched_marker(assignment_dir: &Path, attempt_str: &str) {
    let _ = publish_marker_once(
        &assignment_dir.join("dispatched").join(attempt_str),
        &json!({ "attemptStr": attempt_str, "dispatchedAt": iso_now() }),
    );
}

/// The terminal attempts of a run share a tab: its attempts and rounds are one group.
fn dispatch_batch_key_of(
    opts: &ExecuteOptions,
    assignment: &Value,
    declared_unit_run_id: Option<&str>,
) -> Option<String> {
    opts.dispatch_batch_key
        .clone()
        .or_else(|| declared_unit_run_id.map(str::to_string))
        .or_else(|| {
            (assignment
                .pointer("/provenance/kind")
                .and_then(Value::as_str)
                == Some("unit-run"))
            .then(|| {
                text(assignment, "assignmentId")
                    .and_then(|id| id.split('/').next().map(str::to_string))
            })
            .flatten()
        })
}

fn config_error(message: impl Into<String>) -> ExecuteError {
    ExecuteError::Config(Box::new(RunnerConfigError::new(message)))
}

/// Execute an assignment by dispatching a worker and recording the Run and its Run Result.
pub fn execute_assignment(
    assignment: &Value,
    opts: &ExecuteOptions,
    ports: &dyn ExecutePorts,
    on_chunk: &mut dyn FnMut(&str, &str),
) -> Result<InterpretedRunResult, ExecuteError> {
    // A Work item is never an input here: `ExecuteOptions` has no field that can carry one.
    let cwd = opts
        .cwd
        .clone()
        .or_else(|| std::env::current_dir().ok())
        .unwrap_or_default();
    let cwd_text = cwd.to_string_lossy().into_owned();
    let pin = launch_pin_of(opts.binding.as_ref(), opts.cli_override.as_ref());
    let facts = LegalityFacts {
        checkout: ports.checkout(),
        machine: ports.machine(),
        load_runner_config: &|root| ports.load_runner_config(root).map_err(|e| e.message),
        fgos_dir_of_root: &|root| ports.fgos_dir_of_root(root),
    };
    let pinned_executor = pin
        .get("executor")
        .and_then(Value::as_str)
        .map(str::to_string);
    validate_assignment_legality(
        assignment,
        &legality_options(opts, &cwd_text, pinned_executor.as_deref()),
        &facts,
    )?;

    let root = match opts.repo_root.clone() {
        Some(root) => root,
        None => PathBuf::from(
            ports
                .checkout()
                .main_checkout_root(&cwd_text)
                .map(Ok)
                .unwrap_or_else(|| ports.checkout().repo_root(&cwd_text))
                .map_err(config_error)?,
        ),
    };
    let cfg = match &opts.runner_config {
        Some(cfg) => cfg.clone(),
        None => ports.load_runner_config(&root)?,
    };

    // Storage setup under .fgos/assignments/<assignmentId>/
    let fgos_dir = ports.fgos_dir_of_root(&root);
    let assignments_dir = fgos_dir.join("assignments");
    let assignment_id = text(assignment, "assignmentId").unwrap_or_default();
    let assignment_dir = assignments_dir.join(&assignment_id);
    let runs_dir = assignment_dir.join("runs");
    fs::create_dir_all(&runs_dir).map_err(|e| config_error(e.to_string()))?;

    let (effective_assignment, effective_mutation, template_resolution) =
        load_immutable_assignment(
            assignment,
            &assignment_dir,
            &cwd,
            opts,
            ports,
            &facts,
            pinned_executor.as_deref(),
        )?;

    // Decide first: the compiled plan carries the dispatch policy and enforces that the decided executor agrees with
    // it. Dispatch is never handed a Work item.
    let compiled_plan = ports.decided_dispatch_plan(&cfg, &effective_assignment, opts)?;
    let mechanism = compiled_plan.get("mechanism").and_then(Value::as_str);
    if mechanism.is_none() || mechanism == Some("unavailable") {
        let reason = text(&compiled_plan, "blockedReason")
            .or_else(|| {
                compiled_plan
                    .get("reasonCodes")
                    .and_then(Value::as_array)
                    .map(|codes| {
                        codes
                            .iter()
                            .filter_map(Value::as_str)
                            .collect::<Vec<_>>()
                            .join(", ")
                    })
            })
            .filter(|r| !r.is_empty())
            .unwrap_or_else(|| "governance-blocked or unavailable mechanism".into());
        return Err(config_error(format!(
            "dispatch decide blocked operation \"{}\": {reason}",
            text(&effective_assignment, "operation").unwrap_or_default()
        )));
    }
    let effective_policy = compiled_plan.get("policy").cloned().unwrap_or(Value::Null);

    // One confinement path: an Assignment bound by bind() carries its posture, and that posture alone picks the
    // requirement handed to the Confinement Authority. Without a binding (direct callers) the plan's own
    // confinement applies as before.
    let posture_binding = effective_assignment
        .get("binding")
        .filter(|b| !b.is_null())
        .or_else(|| {
            effective_assignment
                .pointer("/provenance/binding")
                .filter(|b| !b.is_null())
        })
        .cloned();
    let unconfined = json!({ "mode": "unconfined", "policyId": null, "policy": null });
    let confinement_requirement = match &posture_binding {
        Some(binding)
            if binding
                .get("posture")
                .is_some_and(|p| crate::planning::truthy(Some(p))) =>
        {
            ports.posture_requirement(binding, &cfg)
        }
        _ => match effective_policy
            .get("confinement")
            .filter(|c| crate::planning::truthy(Some(c)))
        {
            Some(confinement)
                if confinement.get("mode").and_then(Value::as_str) == Some("unconfined") =>
            {
                unconfined
            }
            Some(confinement) => confinement.clone(),
            None => unconfined,
        },
    };

    let resolved_executor_id =
        text(&effective_policy, "executorId").unwrap_or_else(|| "claude".into());
    let pinned_invocation_id = pin
        .get("invocation")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    let executor_entry = |cfg: &Value| {
        cfg.pointer(&format!("/executors/{resolved_executor_id}"))
            .filter(|e| !e.is_null())
            .cloned()
    };
    let mut resolved_adapter = compiled_plan
        .pointer("/invocation/adapter")
        .and_then(Value::as_str)
        .filter(|a| !a.is_empty())
        .map(str::to_string)
        .or_else(|| executor_entry(&cfg).and_then(|e| text(&e, "adapter")))
        .or_else(|| {
            cfg.pointer("/executor/adapter")
                .and_then(Value::as_str)
                .map(str::to_string)
        })
        .unwrap_or_else(|| "cli-spawn".into());
    // The compiled plan describes the pinned invocation already; this only covers a pin the plan could not see (a
    // compiled plan that predates the pin on resume).
    if let Some(pinned) = &pinned_invocation_id {
        let adapter = executor_entry(&cfg)
            .and_then(|e| e.get("invocations").and_then(Value::as_array).cloned())
            .and_then(|all| {
                all.into_iter().find(|inv| {
                    inv.get("id").and_then(Value::as_str) == Some(pinned)
                        && inv.get("via").and_then(Value::as_str) == Some("cli")
                })
            })
            .and_then(|inv| text(&inv, "adapter"));
        if let Some(adapter) = adapter {
            resolved_adapter = adapter;
        }
    }
    let capability = compiled_plan
        .get("capability")
        .cloned()
        .unwrap_or(Value::Null);
    // Every dispatch runs as an attempt of the run supervisor, `direct` (cli-spawn) or `terminal` (herdr-spawn); an
    // adapter that is neither has no way to run here and is refused before anything is admitted.
    if resolved_adapter != "cli-spawn" && resolved_adapter != "herdr-spawn" {
        return Err(DispatchError::new(
            "supervised-adapter-required",
            format!("executor \"{resolved_executor_id}\" names adapter \"{resolved_adapter}\", which cannot run as an attempt of the run supervisor (cli-spawn and herdr-spawn can)"),
        )
        .with("adapter", json!(resolved_adapter))
        .with("cwd", json!(cwd_text))
        .with("executorId", json!(resolved_executor_id))
        .with("capability", capability.clone())
        .into());
    }
    if effective_mutation == "mutating" && opts.force_shared_cwd {
        return Err(DispatchError::new(
            "custody-required",
            "--force-shared-cwd cannot be used with writes",
        )
        .with("cwd", json!(cwd_text))
        .with("executorId", json!(resolved_executor_id))
        .with("capability", capability.clone())
        .into());
    }
    if effective_mutation == "mutating" {
        if let Some(refusal) = mutating_launch_refusal(cfg!(windows)) {
            return Err(refusal
                .with("cwd", json!(cwd_text))
                .with("executorId", json!(resolved_executor_id))
                .with("capability", capability.clone())
                .into());
        }
    }
    let timeout_ms = opts
        .timeout_ms
        .or_else(|| cfg.get("timeoutMs").and_then(Value::as_u64))
        .unwrap_or(crate::confinement::policy::DEFAULT_SEAT_TIMEOUT_MS);
    let started_at = iso_now();

    // Input identity, recorded runner-side before the worker runs: the sha256 of every file the Work layer pinned.
    // Cross-pass consumption recomputes it, so a verdict computed against older bytes is never consumed.
    let input_digests = digest_pinned_inputs(&opts.pin_inputs, &root, ports.roots());
    let dispatch_plan_digest = format!(
        "sha256:{}",
        sha256_hex(json_text(&compiled_plan).as_bytes())
    );
    let declared_unit_run_id = text(&effective_assignment, "unitRunId").or_else(|| {
        effective_assignment
            .pointer("/provenance/unitRunId")
            .and_then(Value::as_str)
            .map(str::to_string)
    });
    let dispatch_batch_key =
        dispatch_batch_key_of(opts, &effective_assignment, declared_unit_run_id.as_deref());

    // Atomic admission. `retry_id` is opt-in: a caller that omits it gets the next available attempt; one that
    // supplies it opts into the idempotent-tuple and predecessor fencing.
    let default_payload_digest = sha256_hex(
        json_text(&json!({ "assignment": effective_assignment, "compiledPlan": compiled_plan }))
            .as_bytes(),
    );
    let destination = opts.destination.clone().unwrap_or_else(|| cwd_text.clone());
    let payload_digest = opts
        .payload_digest
        .clone()
        .unwrap_or(default_payload_digest);
    let template_provenance = template_resolution
        .as_ref()
        .and_then(|r| r.get("templateProvenance").cloned())
        .or_else(|| {
            effective_assignment
                .pointer("/provenance/template")
                .cloned()
                .filter(|t| !t.is_null())
        });
    let relative = |path: PathBuf| {
        path.strip_prefix(&root)
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_else(|_| path.to_string_lossy().into_owned())
    };
    let build_run_meta = |record: &Value| -> Value {
        let attempt_str = record
            .get("attemptStr")
            .and_then(Value::as_str)
            .map(str::to_string)
            .unwrap_or_else(|| {
                format!(
                    "{:02}",
                    record.get("attempt").and_then(Value::as_u64).unwrap_or(0)
                )
            });
        let admitted_digest = record
            .get("admissionPayloadDigest")
            .and_then(Value::as_str)
            .filter(|d| !d.is_empty())
            .map(|d| {
                if d.starts_with("sha256:") {
                    d.to_string()
                } else {
                    format!("sha256:{d}")
                }
            });
        let mut meta = json!({
            "contract": "assignment-run.v2",
            "runId": record.get("runId"),
            "assignmentId": assignment_id,
            "attempt": record.get("attempt"),
            "supersedesRunId": record.get("predecessorRunId").cloned().unwrap_or(Value::Null),
            "retryId": record.get("retryId").cloned().unwrap_or(Value::Null),
            "payloadDigest": admitted_digest,
            "dispatchPlanDigest": dispatch_plan_digest,
            "phase": "admitted",
            "delivery": "not-sent",
            "executorId": resolved_executor_id,
        });
        if let Some(template) = &template_provenance {
            meta["template"] = template.clone();
        }
        meta["dispatchPlanPath"] = json!(relative(
            runs_dir.join(&attempt_str).join("dispatch-plan.json")
        ));
        meta["effectiveContractPath"] = json!(relative(
            runs_dir
                .join(&attempt_str)
                .join(EFFECTIVE_EXECUTION_CONTRACT_FILE)
        ));
        if !input_digests.is_empty() {
            meta["inputDigests"] = json!(input_digests);
        }
        meta["cwd"] = json!(cwd_text);
        meta["startedAt"] = json!(started_at);
        meta["timeoutMs"] = json!(timeout_ms);
        meta["status"] = json!("running");
        meta
    };
    let plan_for_admission = compiled_plan.clone();
    let build_plan = move |_: &Value| Some(plan_for_admission.clone());
    let admitted = admit_run_attempt(
        &assignment_dir,
        &runs_dir,
        &assignment_id,
        &AdmitRequest {
            retry_id: opts.retry_id.as_deref(),
            predecessor_run_id: opts.predecessor_run_id.as_deref(),
            destination: &destination,
            payload_digest: &payload_digest,
            expected_run_id: opts.expected_run_id.as_deref(),
            force_new_attempt: opts.force_new_attempt,
            refuse_if_settled: opts.refuse_if_settled,
            build_run_meta: &build_run_meta,
            build_dispatch_plan: Some(&build_plan),
            build_effective_contract: None,
        },
    )?;
    let run_dir = admitted.run_dir.clone();
    let run_id = admitted.run_id.clone();
    let effective_contract_path = run_dir.join(EFFECTIVE_EXECUTION_CONTRACT_FILE);
    // An earlier controller's attempt (an envelope or a pre-supervisor launch record) is judged by the adopt door and
    // never launched again, so this controller holds no lock over it.
    let resumed_over = admitted.resumed
        && (run_dir.join("envelope.json").exists()
            || run_dir.join("controller").join("commands").exists());
    let now_ms = crate::accounts::SystemHost::new().now_ms().max(0) as u128;
    let attempt_id = match &opts.launch_command_id {
        Some(id) => id.clone(),
        None => crate::transport_round::session_attempt::mint_attempt_id(now_ms)
            .map_err(|e| config_error(format!("no random bytes for the attempt id: {e}")))?,
    };
    let host = if resumed_over {
        None
    } else {
        Some(ports.attempt_host()?)
    };
    let mut attempt = open_attempt(OpenAttempt {
        run_dir: run_dir.clone(),
        run_id: run_id.clone(),
        attempt_id,
        unit_run_id: declared_unit_run_id
            .clone()
            .unwrap_or_else(|| assignment_id.clone()),
        // Both shapes run under the run supervisor: `direct` keeps the agent in a process tree the supervisor owns,
        // `terminal` runs it in a pane of the terminal-control port. The controller prepares and hands over; it never
        // settles, signals the agent or closes a pane.
        terminal: resolved_adapter == "herdr-spawn",
        cwd: cwd_text.clone(),
        host,
        step_env: ports.step_env(),
        custody: opts.custody.is_some(),
        lease_runtime_dir: opts.provider_capacity_runtime_dir.clone(),
        session: false,
    });

    let result = run_admitted(
        &mut attempt,
        &effective_assignment,
        &effective_mutation,
        &compiled_plan,
        &effective_policy,
        &confinement_requirement,
        posture_binding.as_ref(),
        &cfg,
        opts,
        ports,
        &root,
        &fgos_dir,
        &assignments_dir,
        &assignment_dir,
        &admitted.attempt_str,
        admitted.attempt_num,
        &resolved_executor_id,
        pinned_invocation_id.as_deref(),
        &resolved_adapter,
        &pin,
        &input_digests,
        &dispatch_plan_digest,
        dispatch_batch_key.as_deref(),
        timeout_ms,
        &effective_contract_path,
        resumed_over,
        admitted.resumed,
        &template_provenance,
        on_chunk,
    );
    close_attempt(&mut attempt, ports.give_back());
    result
}

#[allow(clippy::too_many_arguments)]
fn run_admitted(
    attempt: &mut super::attempt::Attempt,
    assignment: &Value,
    effective_mutation: &str,
    compiled_plan: &Value,
    effective_policy: &Value,
    confinement_requirement: &Value,
    posture_binding: Option<&Value>,
    cfg: &Value,
    opts: &ExecuteOptions,
    ports: &dyn ExecutePorts,
    root: &Path,
    fgos_dir: &Path,
    assignments_dir: &Path,
    assignment_dir: &Path,
    attempt_str: &str,
    attempt_num: u64,
    executor_id: &str,
    pinned_invocation_id: Option<&str>,
    adapter: &str,
    pin: &Value,
    input_digests: &[Value],
    dispatch_plan_digest: &str,
    dispatch_batch_key: Option<&str>,
    timeout_ms: u64,
    effective_contract_path: &Path,
    resumed_over: bool,
    resumed: bool,
    template_provenance: &Option<Value>,
    on_chunk: &mut dyn FnMut(&str, &str),
) -> Result<InterpretedRunResult, ExecuteError> {
    let run_dir = attempt.run_dir.clone();
    let run_id = attempt.run_id.clone();
    let cwd = attempt.cwd.clone();
    let assignment_id = text(assignment, "assignmentId").unwrap_or_default();
    // The attempt lock comes right after admission, before the first await: every moment from here an attempt can be
    // killed in leaves a lock and an intent the adopt door closes.
    if !resumed_over {
        let locks = acquire_attempt_locks(AttemptLockRequest {
            fgos_dir,
            assignment_dir,
            attempt_str,
            cwd: Path::new(&cwd),
            mutating: effective_mutation == "mutating",
            custody: opts.custody,
            executor_id: Some(executor_id),
            capability: compiled_plan.get("capability").and_then(Value::as_str),
        })?;
        attempt.locks = Some(locks);
        publish_attempt_intent(attempt, None).map_err(|e| config_error(e.to_string()))?;
    }

    let accounts = ports.accounts_at(opts.provider_capacity_runtime_dir.as_deref())?;
    let leased = lease_account_for_attempt(
        &accounts,
        ports.machine(),
        &LeaseRequest {
            cfg,
            mechanism: compiled_plan.get("mechanism").and_then(Value::as_str),
            effective_policy,
            executor_id,
            pinned_invocation_id,
            pin,
            assignments_dir,
            assignment_id: &assignment_id,
            run_id: &run_id,
            run_dir: &run_dir,
            repo_root: root,
            run_is_dead: None,
            is_run_worker_alive: None,
            run_key: &unit_run_id_of(assignment).unwrap_or_else(|| assignment_id.clone()),
            now_ms: ports.now_ms(),
        },
        ports.credential_probe(),
    )
    .map_err(|e| config_error(e.to_string()))?;
    if let Some(selection) = leased
        .selection
        .as_ref()
        .filter(|s| s.get("status").and_then(Value::as_str) == Some("refused"))
    {
        let record = settle_refused_lease(&RefusedLease {
            refusal: LeaseRefusal {
                reason: selection
                    .get("reason")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
                detail: selection
                    .get("detail")
                    .or_else(|| selection.get("cause"))
                    .and_then(Value::as_str),
            },
            provider: &leased.provider,
            run_dir: &run_dir,
            run_id: &run_id,
            repo_root: root,
            assignment,
            executor_id,
            policy: effective_policy,
        })
        .map_err(|e| config_error(e.to_string()))?;
        return Ok(InterpretedRunResult {
            status: record
                .pointer("/classification/outcome/category")
                .and_then(Value::as_str)
                .unwrap_or("failed")
                .to_string(),
            confidence: record
                .pointer("/classification/confidence")
                .cloned()
                .unwrap_or(Value::Null),
            record,
            corrupt: false,
        });
    }
    attempt.lease = leased.selection.clone();
    let contract_input = json!({
        "assignment": assignment,
        "dispatchPlan": compiled_plan,
        "runId": run_id,
        "runDir": run_dir,
        "cwd": cwd,
        "repoRoot": root,
        "runnerConfig": cfg,
        "timeoutMs": timeout_ms,
        "executorId": executor_id,
        "adapter": adapter,
        "templateProvenance": template_provenance,
    });
    let process_cwd = std::env::current_dir().unwrap_or_default();
    let with = |extra: Value| -> Result<Value, ExecuteError> {
        let mut input = contract_input.clone();
        if let (Some(into), Some(from)) = (input.as_object_mut(), extra.as_object()) {
            into.extend(from.clone());
        }
        build_effective_execution_contract(&input, ports.checkout(), &process_cwd)
            .map_err(|e| config_error(e.to_string()))
    };
    let effective_contract = if effective_contract_path.exists() {
        fs::read_to_string(effective_contract_path)
            .ok()
            .and_then(|raw| serde_json::from_str::<Value>(&raw).ok())
            .unwrap_or(Value::Null)
    } else {
        // The prompt is built before Authority preparation: its posture comes from the requirement handed to the
        // Authority, never from an executor profile's merely requested confinement fragment.
        let confinement = if confinement_requirement.get("mode").and_then(Value::as_str)
            == Some("unconfined")
        {
            json!({ "requirement": { "mode": "unconfined" }, "backend": { "id": "none", "type": "none" } })
        } else {
            json!({ "requirement": confinement_requirement })
        };
        with(json!({ "providerCapacity": leased.evidence, "confinement": confinement }))?
    };

    if resumed {
        if let Some(settled) = resumed_run_outcome(&run_dir, &run_id, ports.adopt())? {
            return Ok(settled);
        }
    }
    publish_dispatched_marker(assignment_dir, attempt_str);

    // The worker is told the absolute run directory its result files go to, and the persona the dispatch policy
    // resolved (with the text pinned by whoever bound it, which the renderer reads instead of a file).
    let persona = text(effective_policy, "persona").map(|value| {
        let mut persona = json!({
            "value": value,
            "source": effective_policy.pointer("/provenance/persona/source").cloned().unwrap_or(Value::Null),
        });
        if assignment.pointer("/policy/personaPin/name").and_then(Value::as_str) == Some(value.as_str()) {
            persona["pinnedText"] = assignment.pointer("/policy/personaPin/text").cloned().unwrap_or(Value::Null);
        }
        persona
    });
    let prompt = ports.render_prompt(
        assignment,
        &PromptOptions {
            cwd: Some(PathBuf::from(&cwd)),
            repo_root: None,
            run_dir: Some(absolute(&run_dir).to_string_lossy().into_owned()),
            persona,
            effective_contract: Some(effective_contract.clone()),
        },
    )?;

    // Dirty files and HEAD before the launch: pre-existing dirty files never count as run evidence, and a worker that
    // commits then crashes is still seen to have moved HEAD.
    let dirty_before = ports.git().status_files(Path::new(&cwd));
    let dirty_before_snapshots = snapshot_dirty_before_files(Path::new(&cwd), &dirty_before);
    let git_before = ports.git().head(Path::new(&cwd));

    // Per-Run control fencing: a monotonic controlEpoch plus a unique controlToken, re-checked before a settlement is
    // appended. A live holder is never reclaimed on heartbeat or TTL alone.
    let holder = build_run_control_holder(&format!(
        "{run_id}:{}:{}",
        std::process::id(),
        fgos_identity::text::random_hex128()
            .map_err(|e| config_error(format!("no random bytes for the run control: {e}")))?
    ));
    let control = acquire_run_control(
        &run_dir,
        &AcquireOptions {
            holder,
            purpose: Some("worker-spawn".into()),
            ttl_ms: opts.control_ttl_ms,
            ..Default::default()
        },
    )
    .map_err(|e| config_error(e.to_string()))?;
    let AcquireOutcome::Acquired {
        control_epoch,
        control_token,
    } = control
    else {
        let status = match control {
            AcquireOutcome::Held { .. } => "held",
            AcquireOutcome::Stale { .. } => "stale",
            _ => "settled",
        };
        if let Some(selection) = attempt
            .lease
            .as_ref()
            .filter(|l| l.get("status").and_then(Value::as_str) == Some("selected"))
        {
            ports.give_back().release_provider_lease(
                selection,
                &run_id,
                opts.provider_capacity_runtime_dir.as_deref(),
            );
        }
        return Err(RunnerConfigError::post_admission(
            format!("executeAssignment: could not acquire control for Run \"{run_id}\" (status: \"{status}\") -- another controller currently holds it"),
            "run-control-held",
        )
        .into());
    };
    attempt.control = Some(Control {
        epoch: control_epoch,
        token: control_token.clone(),
    });

    // ---- build the launch
    let settings = ports.launch_settings(root)?;
    let depth = ports.dispatch_depth();
    if depth >= f64::from(MAX_DISPATCH_DEPTH) {
        return Err(DispatchError::new(
            "dispatch-depth-exceeded",
            format!("executor dispatch refused: current dispatch depth ({depth}) has reached MAX_DISPATCH_DEPTH ({MAX_DISPATCH_DEPTH}) -- prevent runaway nested dispatch."),
        )
        .with("depth", json!(depth))
        .with("maxDepth", json!(MAX_DISPATCH_DEPTH))
        .with("workId", assignment.get("workId").cloned().unwrap_or(Value::Null))
        .into());
    }
    let baseline_digest = publish_evaluator_baseline(&Baseline {
        run_dir: &run_dir,
        run_id: &run_id,
        assignment_id: &assignment_id,
        cwd: &cwd,
        git_before: git_before.as_deref(),
        dirty_before: &dirty_before,
        dirty_before_snapshots: &dirty_before_snapshots,
        captured_at: None,
    })
    .map_err(|e| config_error(e.to_string()))?;
    let launch_context = json!({
        "contract": "assignment-cli-spawn-launch-context.v1",
        "run": {
            "runId": run_id,
            "assignmentId": assignment_id,
            "attempt": attempt_num,
            "dispatchPlanDigest": dispatch_plan_digest,
            "evaluatorBaselineDigest": baseline_digest,
        },
        "command": {
            "launchCommandId": attempt.attempt_id,
            "controlEpoch": control_epoch,
            "controlTokenDigest": compute_sha256_digest(&json!(control_token)),
        },
    });
    let provider_capacity = attempt.lease.as_ref().map(|selection| {
        renew_leased_login(
            selection,
            ports.renewal(),
            cfg,
            executor_id,
            pinned_invocation_id,
            confinement_requirement.get("mode").and_then(Value::as_str),
            opts.provider_capacity_runtime_dir.as_deref(),
            Some(timeout_ms),
        )
    });
    let workspace_write = posture_binding
        .and_then(|b| b.get("posture"))
        .and_then(Value::as_str)
        == Some("workspace-write");
    let seat_repo_root = if workspace_write {
        PathBuf::from(&cwd)
    } else {
        root.to_path_buf()
    };
    let mutating = effective_mutation == "mutating";
    let requested_model = pin.get("model").and_then(Value::as_str);
    let case = opts
        .case_context
        .as_ref()
        .map(|(a, b)| (a.as_str(), b.as_str()));
    let work_label = crate::transport::terminal_slot::work_label_of(assignment);
    let seat = SeatInput {
        cfg,
        root,
        fgos_dir,
        executor_id,
        effective_policy,
        pinned_invocation_id,
        requested_model,
        prompt: &prompt,
        timeout_ms,
        settings: &settings,
        capability: compiled_plan
            .get("capability")
            .and_then(Value::as_str)
            .unwrap_or("code:implement"),
        assignment_launch_context: &launch_context,
        provider_capacity: provider_capacity.as_ref(),
        provider_capacity_evidence: leased.evidence.as_ref(),
        confinement_requirement,
        repo_root: &seat_repo_root,
        context_refs: if opts.blind {
            opts.context_refs.as_ref().or(assignment.get("contextRefs"))
        } else {
            None
        },
        dispatch_batch_key,
        dispatch_batch_size: opts.dispatch_batch_size,
        work_label: Some(&work_label),
        launch_env: None,
        blind: opts.blind,
        mutating: mutating && !opts.force_shared_cwd,
        case_context: case,
        session: None,
        opening: None,
        display: None,
        beside: None,
        ceiling_ms: None,
        request_socket: None,
        retain_failed_pane_ms: attempt.terminal.then(|| ports.retain_failed_pane_ms(root)),
        depth: depth as u64,
    };
    let contract_for_hook = contract_input.clone();
    let process_cwd_hook = process_cwd.clone();
    let role = json!({ "role": assignment.get("role"), "posture": assignment.get("posture"), "operation": assignment.get("operation") });
    let run_dir_hook = run_dir.clone();
    let after = move |launch: &crate::confinement::request::Launch,
                      evidence: Option<&Value>|
          -> Option<Value> {
        let mut input = contract_for_hook.clone();
        input["providerCapacity"] = evidence.cloned().unwrap_or(Value::Null);
        input["confinement"] = json!({
            "requirement": launch.prepared_invocation.get("requirement"),
            "backend": launch.prepared_invocation.get("backend"),
        });
        // The contract is persisted after Authority resolution, before the supervisor is spawned: a requested policy
        // alone is not enforcement evidence.
        let contract =
            build_effective_execution_contract(&input, ports.checkout(), &process_cwd_hook).ok()?;
        fgos_run_supervisor::controller::proof::publish_mutable_projection(
            &run_dir_hook.join(EFFECTIVE_EXECUTION_CONTRACT_FILE),
            &contract,
        )
        .ok()?;
        // The persisted contract does not name the role; the brief a pane worker reads has to.
        let mut with_role = contract;
        with_role["assignment"] = role.clone();
        Some(with_role)
    };
    let hooks = SeatHooks {
        after_confinement: Some(&after),
        before_envelope: None,
    };
    let clock = ports.clock();
    let seated = prepare_attempt_seat(attempt, &seat, &hooks, ports, &clock)?;
    write_settle_context_for(
        attempt,
        root,
        assignment,
        executor_id,
        effective_policy,
        &seated,
        input_digests,
        opts,
        &dirty_before,
    )?;

    let stop_screen = ports.follow_screen(&attempt.attempt_id, &run_dir);
    let settled = await_binding(
        attempt,
        AwaitInput {
            envelope: &seated.envelope,
            timeout_ms,
            gate_kill_grace_ms: settings.gate_kill_grace_ms,
            on_chunk,
            stop_screen,
            custody: opts.custody,
            // The supervisor of a terminal attempt dials the herdr endpoint its pane was opened through.
            extra_env: &seated.endpoint_env,
        },
    )?;
    Ok(settled)
}

/// The context the settle step needs, before the supervisor exists: the assignment, what the checkout looked like
/// outside the workspace and the facts of the launch.
#[allow(clippy::too_many_arguments)]
fn write_settle_context_for(
    attempt: &super::attempt::Attempt,
    root: &Path,
    assignment: &Value,
    executor_id: &str,
    effective_policy: &Value,
    seated: &super::seat::Seated,
    input_digests: &[Value],
    opts: &ExecuteOptions,
    stray_before: &[String],
) -> Result<(), ExecuteError> {
    let run_dir = absolute(&attempt.run_dir);
    fgos_run_supervisor::controller::proof::publish_mutable_projection(
        &run_dir.join("assignment.json"),
        assignment,
    )
    .map_err(|e| config_error(e.to_string()))?;
    let context = json!({
        "launchCommandId": attempt.attempt_id,
        "repoRoot": root,
        "strayWatch": { "repoRoot": root, "cwd": attempt.cwd, "before": stray_before },
        "resolvedExecutorId": executor_id,
        "effectivePolicy": effective_policy,
        "reasoningEffort": seated.resolved_cmd.get("reasoningEffort"),
        "modelCheck": seated.resolved_cmd.get("modelCheck").cloned().unwrap_or(Value::Null),
        "providerCapacitySelection": attempt.lease,
        "providerCapacityEvidence": seated.provider_capacity_evidence,
        "inputDigests": input_digests,
        "providerCapacityRuntimeDir": opts.provider_capacity_runtime_dir,
    });
    fgos_run_supervisor::controller::launch::write_settle_context(&run_dir, &context)
        .map_err(|e| config_error(e.to_string()))
}

/// The unit run an assignment belongs to.
pub fn unit_run_of(assignment: &Value) -> Option<String> {
    unit_run_id_of(assignment)
}
