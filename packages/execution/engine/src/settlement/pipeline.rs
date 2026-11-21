//! The one settlement pipeline: the settle-attempt step of a supervised attempt and every inline path end in
//! [`settle_run_outcome`]. It reads the worker's artifacts and the checkout, derives the Run Result through the
//! one writer, and commits it under the run control ledger.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_run_supervisor::controller::lease::{
    acquire_run_control, build_run_control_holder, control_dirs, current_generation,
    is_run_control_current, settle_run_control, AcquireOptions, AcquireOutcome, SettleOutcome,
};
use fgos_run_supervisor::controller::proof::{publish_immutable_proof, publish_mutable_projection};
use serde_json::{json, Map, Value};

use crate::accounts::fault::{classify_fault, FaultInput};
use crate::accounts::host::Host;
use crate::accounts::{SystemHost, LEASE_CONFLICT_REASON};
use crate::confinement::request::seat_session_dir;
use crate::run_result::vocabulary::LEASE_CONFLICT_FAILURE_CODE;
use crate::run_result::{normalize_run_result_v3, read_settled_result};
use crate::transport::visibility_session::{iso_now, mark_run_settled};

use crate::confinement::driver::js::relative;

use super::evidence::{
    classify_evidence_to_outcome_facts, compute_changed_files, declare_report, declared_scope_of,
    find_mutated_dirty_before_files, read_worker_artifacts, with_launch_facts, EvidenceInput,
};
use super::ports::{FaultRecordInput, ProviderFaultSink, SettlementGit};

/// A settlement that cannot finish; `code` is the answer a caller branches on.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct SettlementError {
    pub code: &'static str,
    pub phase: Option<&'static str>,
    pub message: String,
}

impl SettlementError {
    fn new(code: &'static str, phase: Option<&'static str>, message: String) -> Self {
        Self {
            code,
            phase,
            message,
        }
    }

    fn io(what: &str, err: std::io::Error) -> Self {
        Self::new("io", None, format!("{what}: {err}"))
    }
}

pub type Result<T> = std::result::Result<T, SettlementError>;

fn superseded(message: String) -> SettlementError {
    SettlementError::new("run-control-superseded", Some("post-admission"), message)
}

fn pretty(value: &Value) -> String {
    let mut text = serde_json::to_string_pretty(value).unwrap_or_default();
    text.push('\n');
    text
}

fn write_file(path: &Path, content: &str) -> Result<()> {
    std::fs::write(path, content)
        .map_err(|e| SettlementError::io(&format!("cannot write {}", path.display()), e))
}

/// Atomically commit a Run Result settlement via compare-and-swap on the control ledger and an immutable link.
///
/// `settle_run_control` publishes the `settled` generation before `result.json` is linked: a crash in that window
/// leaves control settled with no result. The settled generation is the next epoch, so a bare retry with the
/// original token would read as not current and be refused forever. A retry whose token and epoch match the
/// settled generation (`already_settled_by_us`) finishes the commit instead. A caller of another token is refused.
pub fn commit_run_settlement(
    run_dir: &Path,
    run_id: &str,
    control_epoch: u64,
    control_token: &str,
    run_result: &Value,
) -> Result<Value> {
    let result_json = run_dir.join("result.json");
    let superseded_json = run_dir.join("result.superseded.json");
    let ledger = control_dirs(run_dir);
    let current = current_generation(&ledger.generations_dir)
        .map_err(|e| SettlementError::io("run control ledger unreadable", e))?;
    let already_settled_by_us = current.as_ref().is_some_and(|g| {
        g.record.get("purpose").and_then(Value::as_str) == Some("settled")
            && g.record.get("controlToken").and_then(Value::as_str) == Some(control_token)
            && g.record.get("settledEpoch").and_then(Value::as_u64) == Some(control_epoch)
    });
    let keep_superseded = |record: &Value| {
        let _ = publish_mutable_projection(&superseded_json, record);
    };

    if !already_settled_by_us
        && !is_run_control_current(run_dir, control_epoch, control_token).unwrap_or(false)
    {
        keep_superseded(run_result);
        return Err(superseded(format!(
            "executeAssignment: control token for Run \"{run_id}\" (epoch {control_epoch}) is no longer current -- a newer controller has taken over; refusing to append a settlement from a superseded controller"
        )));
    }

    if !already_settled_by_us {
        let outcome = settle_run_control(run_dir, control_epoch, control_token, None)
            .map_err(|e| SettlementError::io("run control settlement failed", e))?;
        if !matches!(outcome, SettleOutcome::Settled { .. }) {
            keep_superseded(run_result);
            let status = match outcome {
                SettleOutcome::Superseded { .. } => "superseded",
                _ => "already-settled",
            };
            return Err(superseded(format!(
                "executeAssignment: control token for Run \"{run_id}\" (epoch {control_epoch}) is no longer current (settlement status: \"{status}\") -- a newer controller has taken over; refusing to append a settlement from a superseded controller"
            )));
        }
    }

    let published = publish_immutable_proof(&result_json, run_result)
        .map_err(|e| SettlementError::io("result.json cannot be published", e))?;
    if !published {
        if already_settled_by_us {
            // Our own earlier attempt already reached the authoritative publish: read it rather than refuse.
            if let Some(existing) = read_settled_result(run_dir, run_id) {
                return Ok(existing.record);
            }
        }
        keep_superseded(run_result);
        return Err(superseded(format!(
            "executeAssignment: authoritative result.json for Run \"{run_id}\" already exists -- refusing to overwrite authoritative result"
        )));
    }
    let _ = mark_run_settled(run_dir, "settled", &iso_now);
    Ok(run_result.clone())
}

/// What a refused provider lease says: the machine-readable reason and an optional detail.
pub struct LeaseRefusal<'a> {
    pub reason: &'a str,
    pub detail: Option<&'a str>,
}

/// What [`settle_refused_lease`] reads.
pub struct RefusedLease<'a> {
    pub refusal: LeaseRefusal<'a>,
    pub provider: &'a str,
    pub run_dir: &'a Path,
    pub run_id: &'a str,
    pub repo_root: &'a Path,
    pub assignment: &'a Value,
    pub executor_id: &'a str,
    pub policy: &'a Value,
}

fn is_read_only(assignment: &Value) -> bool {
    assignment.get("mutation").and_then(Value::as_str) == Some("read-only")
}

/// Settle a Run whose provider account lease was refused after admission: its run.json already says `running`, so
/// leaving it would make an orphan indistinguishable from a Run in flight. It is settled as a provider failure
/// under a run control of its own, since none was taken yet. A caller that wants another attempt supersedes this
/// one through admission.
pub fn settle_refused_lease(input: &RefusedLease<'_>) -> Result<Value> {
    let settled_at = iso_now();
    let provider = input.provider;
    let detail = input
        .refusal
        .detail
        .filter(|d| !d.is_empty())
        .map(|d| format!(" ({d})"))
        .unwrap_or_default();
    let stderr_text = format!(
        "provider capacity refused for \"{provider}\": {}{detail}",
        input.refusal.reason
    );
    write_file(&input.run_dir.join("stdout.log"), "")?;
    write_file(&input.run_dir.join("stderr.log"), &stderr_text)?;
    let read_only = is_read_only(input.assignment);
    let evidence = json!({
        "operationMutability": if read_only { "read-only" } else { "mutates-repo" },
        "gitBefore": null, "gitAfter": null, "gitBeforeSource": "pre-launch",
        "dirtyBefore": [], "dirtyAfter": [], "mutatedDirtyBeforeFiles": [],
        "changedFiles": [], "changedFileReasons": {}, "attribution": [], "artifacts": [], "tests": [],
    });
    write_file(&input.run_dir.join("evidence.json"), &pretty(&evidence))?;
    let code = if input.refusal.reason == LEASE_CONFLICT_REASON {
        LEASE_CONFLICT_FAILURE_CODE
    } else {
        "provider-capacity-refused"
    };
    let assignment = input.assignment;
    let refused = normalize_run_result_v3(
        &json!({
            "runId": input.run_id,
            "assignmentId": assignment.get("assignmentId"),
            "workId": assignment.get("workId"),
            "executorId": input.executor_id,
            "policy": input.policy,
            "settledAt": settled_at,
            "role": assignment.get("role"),
            "operation": assignment.get("operation"),
            "isReadOnlyOperation": read_only,
            "runtime": {
                "exitCode": null,
                "executionError": {"code": code, "message": stderr_text},
                "stdoutLog": relative(input.repo_root, &input.run_dir.join("stdout.log")),
                "stderrLog": relative(input.repo_root, &input.run_dir.join("stderr.log")),
            },
            "evidence": evidence,
        }),
        &settled_at,
    );
    let control = acquire_run_control(
        input.run_dir,
        &AcquireOptions {
            holder: build_run_control_holder(&format!(
                "{}:{}:provider-capacity-refusal",
                input.run_id,
                std::process::id()
            )),
            purpose: Some("provider-capacity-refusal".into()),
            ..AcquireOptions::default()
        },
    )
    .map_err(|e| SettlementError::io("run control cannot be acquired", e))?;
    let AcquireOutcome::Acquired {
        control_epoch,
        control_token,
    } = control
    else {
        // Already settled by another path: its result is the answer.
        if let Some(done) = read_settled_result(input.run_dir, input.run_id) {
            return Ok(done.record);
        }
        let status = match control {
            AcquireOutcome::Held { .. } => "held",
            AcquireOutcome::Stale { .. } => "stale",
            _ => "settled",
        };
        return Err(SettlementError::new(
            "run-control-held",
            Some("provider-capacity-refusal"),
            format!("executeAssignment: provider-capacity refusal could not acquire control for Run \"{}\" (status: \"{status}\")", input.run_id),
        ));
    };
    commit_run_settlement(
        input.run_dir,
        input.run_id,
        control_epoch,
        &control_token,
        &refused,
    )
}

fn prepared_invocation_of(run_dir: &Path, launch_command_id: Option<&str>) -> Option<Value> {
    let id = launch_command_id.filter(|s| !s.is_empty())?;
    let text = std::fs::read_to_string(
        run_dir
            .join("protected")
            .join("prepared-invocation")
            .join(format!("{id}.json")),
    )
    .ok()?;
    serde_json::from_str(&text).ok()
}

/// The sandbox backend the worker really ran under, or `None` when it ran without one: what the Confinement
/// Authority prepared for this launch, else an attestation the dispatch returned as enforced. The mode a caller
/// requested is never evidence.
pub fn ran_confinement_backend(
    run_dir: &Path,
    launch_command_id: Option<&str>,
    attestation: Option<&Value>,
) -> Option<String> {
    let prepared = prepared_invocation_of(run_dir, launch_command_id);
    if let Some(kind) = prepared
        .as_ref()
        .and_then(|p| p.get("backend"))
        .and_then(|b| b.get("type"))
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
    {
        return (kind != "none").then(|| kind.to_string());
    }
    let attestation = attestation?;
    if attestation.get("outcome").and_then(Value::as_str) == Some("enforced") {
        let kind = attestation
            .get("backend")
            .and_then(|b| b.get("type"))
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty() && *s != "none");
        return kind.map(str::to_string);
    }
    None
}

/// What the usage parser reads one run's usage from: the command the launch really ran, whether it ran in a pane,
/// its output, and where a claude seat's transcript may be.
pub fn usage_request_of(
    run_dir: &Path,
    launch_command_id: Option<&str>,
    adapter: &str,
    stdout: Option<&str>,
    stderr: Option<&str>,
    settled_at: &str,
    duration_ms: Option<i64>,
) -> Value {
    let prepared = prepared_invocation_of(run_dir, launch_command_id);
    let worker = prepared.as_ref().and_then(|p| p.get("workerInvocation"));
    let env = worker.and_then(|w| w.get("env"));
    let env_str = |key: &str| env.and_then(|e| e.get(key)).and_then(Value::as_str);
    let config_dir = env_str("CLAUDE_CONFIG_DIR")
        .map(PathBuf::from)
        .or_else(|| env_str("HOME").map(|h| Path::new(h).join(".claude")));
    let projects_dir = seat_session_dir(run_dir, launch_command_id)
        .or_else(|| config_dir.map(|c| c.join("projects")));
    let args: Vec<&str> = worker
        .and_then(|w| w.get("args"))
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_str).collect())
        .unwrap_or_default();
    let id_at = args
        .iter()
        .position(|a| *a == "--session-id" || *a == "--resume");
    let ended = crate::accounts::time::ms_from_iso(settled_at);
    let (started_at, ended_at) = match (ended, duration_ms) {
        (Some(end), Some(d)) => (
            Value::String(crate::accounts::time::iso_from_ms(end - d)),
            Value::String(crate::accounts::time::iso_from_ms(end)),
        ),
        _ => (Value::Null, Value::Null),
    };
    let cwd = worker.and_then(|w| w.get("cwd")).and_then(Value::as_str);
    let claude_session = match (projects_dir, cwd) {
        (Some(dir), Some(cwd)) => json!({
            "projectsDir": dir.to_string_lossy(),
            "cwd": cwd,
            "sessionId": id_at.and_then(|i| args.get(i + 1)).map(|s| json!(s)).unwrap_or(Value::Null),
            "startedAt": started_at,
            "endedAt": ended_at,
        }),
        _ => Value::Null,
    };
    json!({
        "command": worker.and_then(|w| w.get("command")).and_then(Value::as_str),
        "pane": adapter == "herdr-spawn",
        "stdout": stdout.unwrap_or(""),
        "stderr": stderr.unwrap_or(""),
        "claudeSession": claude_session,
    })
}

/// The usage of one run; a parser that cannot answer records why, because usage never decides a run's outcome.
fn parse_usage(request: Value) -> Value {
    match serde_json::from_value::<fgos_run_result::usage::UsageRequest>(request) {
        Ok(request) => serde_json::to_value(fgos_run_result::usage::parse(&request))
            .unwrap_or_else(|_| unavailable_usage()),
        Err(_) => unavailable_usage(),
    }
}

fn unavailable_usage() -> Value {
    json!({"inputTokens": null, "outputTokens": null, "totalTokens": null, "cacheReadTokens": null,
        "cacheCreationTokens": null, "reasoningTokens": null, "source": "unsupported", "reason": "parser-unavailable"})
}

/// Everything one settlement reads.
pub struct SettleInput<'a> {
    pub run_dir: &'a Path,
    pub run_meta: &'a Value,
    pub assignment: &'a Value,
    pub control_epoch: u64,
    pub control_token: &'a str,
    pub exit_code: Option<i64>,
    pub signal: Option<&'a str>,
    pub is_timeout: bool,
    pub duration_ms: Option<i64>,
    pub settled_at: &'a str,
    pub stdout_text: &'a str,
    pub stderr_text: &'a str,
    pub effective_cwd: &'a Path,
    pub git_before: Option<&'a str>,
    pub git_before_source: &'a str,
    pub git_after: Option<&'a str>,
    pub dirty_before: &'a [String],
    pub dirty_after: Option<&'a [String]>,
    pub dirty_before_snapshots: Option<&'a BTreeMap<String, (bool, Option<String>)>>,
    pub input_digests: Option<&'a Value>,
    pub resolved_executor_id: Option<&'a str>,
    pub effective_policy: Option<&'a Value>,
    pub executor_redirected: bool,
    pub reasoning_effort: Option<&'a Value>,
    pub model_warnings: &'a [Value],
    pub provider_capacity_selection: Option<&'a Value>,
    pub provider_capacity_evidence: Option<&'a Value>,
    /// `{message, code}` of the error that ended the attempt, if one did.
    pub execution_error: Option<(&'a str, Option<&'a str>)>,
    pub launch_command_id: Option<&'a str>,
    pub adapter_outcome: Option<&'a str>,
    pub provider_stop_cause: Option<&'a str>,
    pub provider_signal: Option<&'a Value>,
    /// `None`: settlement looks for the claim; `Some(None)`: the receipt names none.
    pub agent_result_path: Option<Option<&'a Path>>,
    pub attestation: Option<&'a Value>,
    pub dispatch_warnings: &'a [Value],
    /// The adapter the run declares (`cli-spawn` or `herdr-spawn`), required.
    pub adapter: &'a str,
    pub repo_root: Option<&'a Path>,
    pub cwd: Option<&'a Path>,
    pub provider_capacity_runtime_dir: Option<&'a Path>,
    /// The status written to `run.json` after the commit.
    pub update_run_json: Option<&'a str>,
}

/// The answer of [`settle_run_outcome`]: the committed Run Result.
pub struct Settled {
    pub run_result: Value,
}

/// The ancestor of `run_dir` the repository is found from; the preferred root when one is given.
fn resolve_safe_root(run_dir: &Path, preferred: Option<&Path>) -> PathBuf {
    if let Some(preferred) = preferred {
        return preferred.to_path_buf();
    }
    fgos_git::GitDriver::trusted_root_at(run_dir)
        .ok()
        .flatten()
        .unwrap_or_else(|| run_dir.to_path_buf())
}

/// The ports a settlement reads and records through.
pub struct SettlementPorts<'a> {
    pub git: &'a dyn SettlementGit,
    pub faults: &'a dyn ProviderFaultSink,
}

/// Classify a provider stop on the selected account, record it in the account's history (quarantining the account
/// when the verdict says so) and record the reason on the run's capacity selection file. The fault the evidence
/// carries, or `None`.
fn record_provider_capacity_fault(
    ports: &SettlementPorts<'_>,
    input: &SettleInput<'_>,
    selection: &Value,
    agent_claim: Option<&Value>,
) -> Option<Value> {
    let provider = selection
        .get("provider")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let host = SystemHost::new();
    let now = host.now_ms();
    let adapter_outcome = input
        .adapter_outcome
        .unwrap_or(if input.exit_code == Some(0) {
            "success"
        } else {
            "failed"
        });
    let fault = classify_fault(&FaultInput {
        provider,
        adapter_outcome: Some(adapter_outcome),
        structured_stop_reason: agent_claim
            .and_then(|c| c.get("stopReason"))
            .and_then(Value::as_str),
        stop_cause: input.provider_stop_cause,
        provider_signal: input.provider_signal.cloned().unwrap_or(Value::Null),
        now_ms: now,
        utc_offset_min: host.utc_offset_min(now),
    });
    let action = fault.get("action").and_then(Value::as_str);
    if action.is_none() || action == Some("none") {
        return None;
    }
    let account_id = selection
        .get("accountId")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let run_id = input.run_meta.get("runId").and_then(Value::as_str);
    let assignment_id = input.assignment.get("assignmentId").and_then(Value::as_str);
    let quarantine = ports.faults.record(
        &FaultRecordInput {
            provider,
            account_id,
            fault: &fault,
            provider_signal: input.provider_signal,
            run_id,
            assignment_id,
        },
        input.provider_capacity_runtime_dir,
    );
    let mut recorded = Map::new();
    recorded.insert("provider".into(), json!(provider));
    recorded.insert("accountId".into(), json!(account_id));
    recorded.insert("action".into(), fault["action"].clone());
    recorded.insert("reasonCode".into(), fault["reasonCode"].clone());
    recorded.insert(
        "quarantineKind".into(),
        fault.get("quarantineKind").cloned().unwrap_or(Value::Null),
    );
    if let Some(q) = &quarantine {
        recorded.insert("quarantine".into(), q.clone());
    }
    if let Some(evidence) = input.provider_capacity_evidence.filter(|e| !e.is_null()) {
        let mut updated = evidence.as_object().cloned().unwrap_or_default();
        let mut codes: Vec<Value> = updated
            .get("reasonCodes")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        let reason = fault["reasonCode"].clone();
        if !reason.is_null() && !codes.contains(&reason) {
            codes.push(reason);
        }
        updated.insert("reasonCodes".into(), Value::Array(codes));
        if let Some(q) = &quarantine {
            updated.insert("quarantine".into(), q.clone());
        }
        let _ = std::fs::write(
            input.run_dir.join("provider-capacity-selection.json"),
            pretty(&Value::Object(updated)),
        );
    }
    Some(Value::Object(recorded))
}

/// The lost-work warning of a producer whose dirty paths vanished while HEAD stayed: its text, for stderr.
fn lost_paths_warning(paths: &[String]) -> String {
    format!(
        "fgos: warning: uncommitted path(s) lost across Assignment: {}\n",
        paths.join(", ")
    )
}

/// Unified settlement pipeline for successful or evaluated Run outcomes.
pub fn settle_run_outcome(ports: &SettlementPorts<'_>, input: &SettleInput<'_>) -> Result<Settled> {
    if input.adapter.is_empty() {
        return Err(SettlementError::new(
            "adapter-required",
            None,
            "settleRunOutcome requires opts.adapter: the adapter the run declares (cli-spawn or herdr-spawn).".into(),
        ));
    }
    let run_dir = input.run_dir;
    let root = resolve_safe_root(run_dir, input.repo_root);
    let stderr_text = if input.stderr_text.is_empty() {
        input.execution_error.map(|e| e.0).unwrap_or("")
    } else {
        input.stderr_text
    };
    write_file(&run_dir.join("stdout.log"), input.stdout_text)?;
    write_file(&run_dir.join("stderr.log"), stderr_text)?;

    let exit_info = json!({
        "exitCode": input.exit_code, "signal": input.signal, "timedOut": input.is_timeout,
        "settledAt": input.settled_at, "durationMs": input.duration_ms,
    });
    write_file(&run_dir.join("exit.json"), &pretty(&exit_info))?;

    let artifacts =
        read_worker_artifacts(run_dir, &root, input.agent_result_path, input.assignment);
    let read_only = is_read_only(input.assignment);

    let settlement_cwd = input.cwd.unwrap_or(input.effective_cwd);
    let git_after = input
        .git_after
        .map(str::to_string)
        .or_else(|| ports.git.head(settlement_cwd));
    let dirty_after: Vec<String> = match input.dirty_after {
        Some(list) => list.to_vec(),
        None => ports.git.status_files(settlement_cwd),
    };
    let changed = compute_changed_files(
        ports.git,
        settlement_cwd,
        input.git_before,
        git_after.as_deref(),
        input.dirty_before,
        &dirty_after,
    );

    // A disappeared dirty path with unchanged HEAD is lost work, not a producer commit.
    let lost_paths: Vec<String> = if !read_only && input.git_before == git_after.as_deref() {
        input
            .dirty_before
            .iter()
            .filter(|f| !dirty_after.contains(f))
            .cloned()
            .collect()
    } else {
        Vec::new()
    };
    if !lost_paths.is_empty() {
        eprint!("{}", lost_paths_warning(&lost_paths));
    }

    let mutated_dirty_before: Vec<String> = match (read_only, input.dirty_before_snapshots) {
        (true, Some(snaps)) => find_mutated_dirty_before_files(settlement_cwd, snaps),
        _ => Vec::new(),
    };

    let selected = input
        .provider_capacity_selection
        .filter(|s| s.get("status").and_then(Value::as_str) == Some("selected"));
    let provider_capacity_fault = selected.and_then(|selection| {
        record_provider_capacity_fault(ports, input, selection, artifacts.agent_claim.as_ref())
    });

    let scope = declared_scope_of(
        input.assignment,
        read_only,
        settlement_cwd,
        input.dirty_before_snapshots,
    );
    let declared_coverage = scope.declared_writes.as_deref();
    let attribution = attribution_of(input.dirty_before, &dirty_after, declared_coverage)?;
    let mut evidence_data = Map::new();
    evidence_data.insert(
        "operationMutability".into(),
        json!(if read_only {
            "read-only"
        } else {
            "mutates-repo"
        }),
    );
    evidence_data.insert("gitBefore".into(), json!(input.git_before));
    evidence_data.insert("gitAfter".into(), json!(git_after));
    evidence_data.insert("gitBeforeSource".into(), json!(input.git_before_source));
    evidence_data.insert("dirtyBefore".into(), json!(input.dirty_before));
    evidence_data.insert("dirtyAfter".into(), json!(dirty_after));
    evidence_data.insert(
        "mutatedDirtyBeforeFiles".into(),
        json!(mutated_dirty_before),
    );
    evidence_data.insert("changedFiles".into(), json!(changed.changed_files));
    evidence_data.insert(
        "changedFileReasons".into(),
        Value::Object(changed.reasons.clone()),
    );
    if !scope.edited_sync_conflicts.is_empty() {
        evidence_data.insert(
            "editedSyncConflicts".into(),
            json!(scope.edited_sync_conflicts),
        );
    }
    evidence_data.insert("attribution".into(), attribution.clone());
    evidence_data.insert(
        "artifacts".into(),
        Value::Array(artifacts.worker_artifacts.clone()),
    );
    evidence_data.insert("tests".into(), json!([]));
    if let Some(fault) = &provider_capacity_fault {
        evidence_data.insert("providerCapacity".into(), fault.clone());
    }
    write_file(
        &run_dir.join("evidence.json"),
        &pretty(&Value::Object(evidence_data)),
    )?;

    let read_log = |name: &str| std::fs::read_to_string(run_dir.join(name)).ok();
    let usage = parse_usage(usage_request_of(
        run_dir,
        input.launch_command_id,
        input.adapter,
        read_log("stdout.log").as_deref(),
        read_log("stderr.log").as_deref(),
        input.settled_at,
        input.duration_ms,
    ));

    // A before/after snapshot of the run's checkout cannot tell the run's writes from another session's, so every
    // change it shows is correlated: nothing is attested, nothing is proven.
    let changed_attribution = attribution_of(&[], &changed.changed_files, declared_coverage)?;
    let policy = attribution_policy_of(
        &changed_attribution,
        read_only,
        scope.declared_writes.as_deref(),
        &mutated_dirty_before,
    )?;
    let refusal_code = (policy["disposition"] == json!("refuse"))
        .then(|| policy["code"].as_str().map(str::to_string))
        .flatten();
    let facts = classify_evidence_to_outcome_facts(&EvidenceInput {
        exit_code: input.exit_code,
        signal: input.signal,
        is_timeout: input.is_timeout,
        agent_claim: artifacts.agent_claim.as_ref(),
        claim_invalid: artifacts.claim_invalid,
        worker_artifacts: &artifacts.worker_artifact_paths,
        changed_files: &changed.changed_files,
        edited_sync_conflicts: &scope.edited_sync_conflicts,
        is_read_only: read_only,
        attribution_refusal_code: refusal_code.as_deref(),
        role: input.assignment.get("role").and_then(Value::as_str),
        assignment: input.assignment,
    });

    let run_meta = input.run_meta;
    let mut warnings: Vec<Value> = Vec::new();
    if !lost_paths.is_empty() {
        warnings.push(json!({"code": "uncommitted-paths-lost", "paths": lost_paths}));
    }
    if let Some(list) = policy.get("warnings").and_then(Value::as_array) {
        warnings.extend(list.iter().cloned());
    }
    warnings.extend(input.dispatch_warnings.iter().cloned());

    let mut result_input = Map::new();
    let mut put = |key: &str, value: Value| {
        result_input.insert(key.to_string(), value);
    };
    put("usage", usage);
    put(
        "runId",
        run_meta.get("runId").cloned().unwrap_or(Value::Null),
    );
    put(
        "assignmentId",
        run_meta.get("assignmentId").cloned().unwrap_or(Value::Null),
    );
    // `runMeta.workId || assignment.workId`: a run of no Work item has no `workId` at all, not a null one.
    if let Some(work_id) = run_meta
        .get("workId")
        .filter(|v| !v.is_null() && *v != &json!(""))
        .or_else(|| input.assignment.get("workId"))
    {
        put("workId", work_id.clone());
    }
    put("controlEpoch", json!(input.control_epoch));
    put("controlToken", json!(input.control_token));
    let executor = input
        .resolved_executor_id
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .or_else(|| {
            run_meta
                .get("executorId")
                .and_then(Value::as_str)
                .filter(|s| !s.is_empty())
                .map(str::to_string)
        });
    put("executorId", json!(executor));
    put("adapter", json!(input.adapter));
    put(
        "confinement",
        json!(ran_confinement_backend(
            run_dir,
            input.launch_command_id,
            input.attestation
        )),
    );
    put("warnings", Value::Array(warnings));
    put(
        "role",
        input.assignment.get("role").cloned().unwrap_or(Value::Null),
    );
    if let Some(policy) = input.effective_policy.filter(|p| !p.is_null()) {
        put(
            "policy",
            with_launch_facts(policy, input.reasoning_effort, input.model_warnings),
        );
        put("executorRedirected", json!(input.executor_redirected));
    }
    put("settledAt", json!(input.settled_at));
    // `inputDigests ?? runMeta.inputDigests`, kept only when it is a non-empty list.
    let digests = input
        .input_digests
        .filter(|d| !d.is_null())
        .or_else(|| run_meta.get("inputDigests").filter(|d| !d.is_null()))
        .filter(|d| d.as_array().is_some_and(|a| !a.is_empty()));
    if let Some(digests) = digests {
        put("inputDigests", digests.clone());
    }
    if let Some(sha) = &artifacts.claim_sha256 {
        put("claimSha256", json!(sha));
    }
    put(
        "settleReports",
        Value::Array(artifacts.settle_reports.clone()),
    );
    put(
        "reportDeclaration",
        declare_report(
            &artifacts.settle_reports,
            artifacts.agent_claim.as_ref(),
            input.is_timeout,
            input.signal,
        ),
    );
    put(
        "operation",
        input
            .assignment
            .get("operation")
            .cloned()
            .unwrap_or(Value::Null),
    );
    put("isReadOnlyOperation", json!(read_only));
    put("execStatusOverride", json!(facts.exec_status));
    put("assessmentOverride", json!({"verdict": facts.verdict}));
    put("confidenceLevel", json!(facts.confidence_level));
    // A worker that stopped on a provider limit failed for that reason, not for the generic exit the adapter
    // reported; the code lets a caller move to the next candidate instead of retrying the same provider.
    if matches!(
        input.adapter_outcome,
        Some("provider-limit" | "paused-limit" | "blocked")
    ) {
        let mut failure = Map::new();
        failure.insert("family".into(), json!("provider"));
        failure.insert("code".into(), json!(input.adapter_outcome));
        if let Some(cause) = input.provider_stop_cause.filter(|c| !c.is_empty()) {
            failure.insert("cause".into(), json!(cause));
        }
        if let Some(signal) = input.provider_signal.filter(|s| !s.is_null()) {
            failure.insert("providerSignal".into(), signal.clone());
        }
        put("failureOverride", Value::Object(failure));
    } else if let Some(failure) = &facts.failure {
        put("failureOverride", failure.clone());
    }
    if let Some(policy) = &facts.policy {
        put("policyOverride", policy.clone());
    }
    let mut runtime = Map::new();
    runtime.insert("exitCode".into(), json!(input.exit_code));
    runtime.insert("isTimeout".into(), json!(input.is_timeout));
    if let Some((message, code)) = input.execution_error {
        runtime.insert(
            "executionError".into(),
            json!({"message": message, "code": code}),
        );
    }
    runtime.insert(
        "stdoutLog".into(),
        json!(relative(&root, &run_dir.join("stdout.log"))),
    );
    runtime.insert(
        "stderrLog".into(),
        json!(relative(&root, &run_dir.join("stderr.log"))),
    );
    put("runtime", Value::Object(runtime));
    put(
        "agentClaim",
        artifacts.agent_claim.clone().unwrap_or(Value::Null),
    );
    put("claimInvalid", json!(artifacts.claim_invalid));
    put(
        "evidence",
        json!({
            "gitBefore": input.git_before, "gitAfter": git_after, "gitBeforeSource": input.git_before_source,
            "changedFiles": changed.changed_files, "mutatedDirtyBeforeFiles": mutated_dirty_before,
            "attribution": attribution, "artifacts": artifacts.worker_artifact_paths, "tests": [],
        }),
    );
    let run_result = normalize_run_result_v3(&Value::Object(result_input), input.settled_at);

    let run_id = run_meta
        .get("runId")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let settled = commit_run_settlement(
        run_dir,
        run_id,
        input.control_epoch,
        input.control_token,
        &run_result,
    )?;

    if let Some(status) = input.update_run_json {
        let file = run_dir.join("run.json");
        let mut meta = run_meta.clone();
        if let Some(on_disk) = std::fs::read_to_string(&file)
            .ok()
            .and_then(|t| serde_json::from_str::<Value>(&t).ok())
        {
            meta = on_disk;
        }
        let mut out = meta.as_object().cloned().unwrap_or_default();
        out.insert("status".into(), json!(status));
        out.insert("settledAt".into(), json!(input.settled_at));
        publish_mutable_projection(&file, &Value::Object(out))
            .map_err(|e| SettlementError::io("run.json cannot be updated", e))?;
    }
    Ok(Settled {
        run_result: settled,
    })
}

fn scope_error(e: impl std::fmt::Display) -> SettlementError {
    SettlementError::new("scope-invalid", None, e.to_string())
}

fn attribution_of(pre: &[String], post: &[String], coverage: Option<&[String]>) -> Result<Value> {
    let list =
        crate::run_result::attribute_workspace_changes(&crate::run_result::WorkspaceObservation {
            pre_launch_dirt: pre,
            post_run_dirt: post,
            declared_coverage: coverage,
            ..Default::default()
        })
        .map_err(scope_error)?;
    serde_json::to_value(list).map_err(scope_error)
}

fn attribution_policy_of(
    attribution: &Value,
    is_read_only: bool,
    write_scope: Option<&[String]>,
    mutated: &[String],
) -> Result<Value> {
    let list: Vec<crate::run_result::Attribution> =
        serde_json::from_value(attribution.clone()).map_err(scope_error)?;
    let verdict = crate::run_result::evaluate_attribution_policy(&crate::run_result::PolicyInput {
        attributions: &list,
        is_read_only,
        write_scope,
        mutated_dirty_before_files: mutated,
        contradictory_claim: false,
    })
    .map_err(scope_error)?;
    serde_json::to_value(verdict).map_err(scope_error)
}
