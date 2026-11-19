//! settle-attempt: turn the physical receipt of an attempt into its work result through the one door the Execution
//! Core has ([`settle_run_outcome`]: exit.json, evidence.json, result.json, run control settled). Safe to run
//! again: a finished settlement is left alone, a crash between "run control settled" and "result.json published"
//! is completed with the same token.

use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

use fgos_run_supervisor::controller::lease::{
    acquire_run_control, build_run_control_holder, AcquireOptions, AcquireOutcome,
};
use serde_json::{json, Value};

use crate::run_result::claim::CLAIM_FRICTION_FIELD_MAX;
use crate::run_result::read_settled_result;
use crate::settlement::evidence::snapshots_of;
use crate::settlement::ports::{FrictionSink, ProviderFaultSink, SettlementGit};
use crate::settlement::{settle_run_outcome, SettleInput, SettlementPorts};
use crate::transport::provider_adapter::{collect_model_warnings, ModelCheck};

use super::finalize_home::AttemptHomeFinalizer;
use super::stray_writes::{stray_write_warning, watch_writes_outside_workspace};
use super::{read_json, read_side_file, StepError, StepOutcome, StepResult};

const CAPTURE_TAIL_BYTES: u64 = 64 * 1024 * 1024;

/// What a terminal attempt's pane showed when the attempt ended. The slot is released by a later step, so the pane
/// is still there to read; a screen that cannot be read is no evidence, never a failure of the settlement.
pub trait PaneScreen {
    fn visible_screen(&self, run_dir: &Path, envelope: &Value) -> String;
}

/// Everything the steps read or record through, supplied by the host that runs them.
pub struct StepPorts<'a> {
    pub git: &'a dyn SettlementGit,
    pub faults: &'a dyn ProviderFaultSink,
    pub friction: &'a dyn FrictionSink,
    pub pane: &'a dyn PaneScreen,
    pub finalizer: &'a dyn AttemptHomeFinalizer,
}

/// The tail of a capture file the agent can write: never through a link, never past the cap.
fn read_tail(file: &Path) -> String {
    let Ok((mut open, opened)) = crate::confinement::cleanup::open_agent_file(file) else {
        return String::new();
    };
    let size = opened.len();
    let length = size.min(CAPTURE_TAIL_BYTES);
    if open.seek(SeekFrom::Start(size - length)).is_err() {
        return String::new();
    }
    let mut buffer = Vec::new();
    if open.take(length).read_to_end(&mut buffer).is_err() {
        return String::new();
    }
    String::from_utf8_lossy(&buffer).into_owned()
}

fn evaluator_baseline(run_dir: &Path, outcome: Option<&str>) -> Result<Option<Value>, StepError> {
    let file = run_dir.join("controller").join("evaluator-baseline.json");
    let Some(baseline) = read_json(&file) else {
        // An attempt that never started has no pre-launch picture to compare with.
        if outcome == Some("abandoned-not-started") {
            return Ok(None);
        }
        return Err(StepError::new(
            "io",
            format!(
                "evaluator baseline missing or unreadable at {}",
                file.display()
            ),
        ));
    };
    // The digest of the baseline without its `digest` key, the way the controller sealed it.
    let sealed = baseline.get("digest").filter(|d| match d {
        Value::Null | Value::Bool(false) => false,
        Value::String(s) => !s.is_empty(),
        Value::Number(n) => n.as_f64() != Some(0.0),
        _ => true,
    });
    if let Some(digest) = sealed {
        let computed = fgos_run_supervisor::envelope::digest(&baseline)
            .map_err(|e| StepError::new("internal", format!("{e:?}")))?;
        if digest.as_str() != Some(computed.as_str()) {
            return Err(StepError::new(
                "internal",
                "evaluator baseline digest mismatch",
            ));
        }
    }
    Ok(Some(baseline))
}

struct Control {
    epoch: u64,
    token: String,
}

/// The run-control token of the attempt: the side file's, else a new epoch only when the writer is dead.
fn control_of(run_dir: &Path, envelope: &Value) -> Result<Option<Control>, StepError> {
    if let Some(side) = read_side_file(envelope)? {
        if let (Some(epoch), Some(token)) = (
            side.get("controlEpoch").and_then(Value::as_u64),
            side.get("controlToken").and_then(Value::as_str),
        ) {
            return Ok(Some(Control {
                epoch,
                token: token.to_string(),
            }));
        }
    }
    let attempt_id = envelope
        .get("attemptId")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let acquired = acquire_run_control(
        run_dir,
        &AcquireOptions {
            holder: build_run_control_holder(&format!("settle-attempt:{attempt_id}")),
            purpose: Some("settle-attempt".into()),
            ..AcquireOptions::default()
        },
    )
    .map_err(|e| StepError::new("io", format!("run control cannot be acquired: {e}")))?;
    match acquired {
        AcquireOutcome::Acquired {
            control_epoch,
            control_token,
        } => Ok(Some(Control {
            epoch: control_epoch,
            token: control_token,
        })),
        AcquireOutcome::Held { .. } => Ok(None),
        AcquireOutcome::Stale { .. } => Err(StepError::new(
            "internal",
            "side file is gone and run control is stale: the settlement cannot be completed",
        )),
        AcquireOutcome::Settled { .. } => Err(StepError::new(
            "internal",
            "side file is gone and run control is settled: the settlement cannot be completed",
        )),
    }
}

/// The provider stop a receipt names, as settlement takes it.
#[derive(Debug, Clone, PartialEq)]
pub struct ProviderStop {
    pub adapter_outcome: &'static str,
    pub cause: Option<&'static str>,
    pub signal: Option<Value>,
}

/// The provider stop a receipt reason names: the one table from the supervisor's name to an outcome.
/// `*:blocked:usage-limit`, `*:blocked:login` and `*:blocked:provider-error` are a provider limit, which moves the
/// caller to another account or candidate (a login is also a credential fault, so the walk does not land on the
/// provider whose login just failed; a provider error is the provider's own fault); every other blocked name,
/// `terminal:needs-human` and `terminal:needs-setup` is a person to wait for, never a success. A result in the
/// outbox is judged as reported whatever else the receipt says. A provider stop carries the receipt's
/// `providerSignal` as `signal`.
pub fn provider_stop_of(receipt: &Value, claimed: bool) -> Option<ProviderStop> {
    if claimed {
        return None;
    }
    let reason = receipt
        .get("reason")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let waiting = ProviderStop {
        adapter_outcome: "blocked",
        cause: None,
        signal: None,
    };
    let blocked = reason
        .strip_prefix("terminal:blocked:")
        .or_else(|| reason.strip_prefix("direct:blocked:"));
    if let Some(name) = blocked.filter(|n| !n.is_empty()) {
        let cause = match name {
            "usage-limit" => Some("quota"),
            "login" => Some("credential"),
            "provider-error" => Some("provider"),
            _ => None,
        };
        return Some(match cause {
            Some(cause) => ProviderStop {
                adapter_outcome: "provider-limit",
                cause: Some(cause),
                signal: Some(
                    receipt
                        .get("providerSignal")
                        .cloned()
                        .filter(|s| !s.is_null())
                        .unwrap_or(Value::Null),
                ),
            },
            None => waiting,
        });
    }
    matches!(reason, "terminal:needs-human" | "terminal:needs-setup").then_some(waiting)
}

const FALLS_BACK: &str = "the seat walk falls back to another account or candidate.";
const ANSWER_PROMPT: &str = "Next: answer the prompt in the pane, then run again.";

fn stop_remedy(reason: &str) -> Option<String> {
    Some(match reason {
        "terminal:blocked:trust-dialog" => "Next: grant trust for this project in the agent's own home, then run again.".into(),
        "terminal:blocked:login" => "Next: log the agent in again on this account (in the agent's own home), then run again.".into(),
        "terminal:blocked:usage-limit" => format!("The account's quota or credits are used up: wait for the reset or add credits; {FALLS_BACK}"),
        "terminal:blocked:provider-error" => format!("The provider refused the round with an API error (a fault on its side, such as a model it does not serve to this account); {FALLS_BACK}"),
        "terminal:needs-setup" => "Next: finish the CLI's first-run setup once by hand on the same profile (for omp, `omp --profile=<profile>`), then run again.".into(),
        "terminal:needs-human" => ANSWER_PROMPT.into(),
        _ => return None,
    })
}

/// Why a terminal attempt was stopped, in the words of its screen, and the remedy for that reason: a person reads
/// this, not a log.
pub fn terminal_stop_message(receipt: &Value, screen_text: &str) -> String {
    let reason = receipt
        .get("reason")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let lines: Vec<&str> = screen_text
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();
    let tail = lines[lines.len().saturating_sub(6)..].join(" / ");
    // A blocked name this table does not know is still a person to wait for.
    let remedy = stop_remedy(reason).or_else(|| {
        reason
            .starts_with("terminal:blocked:")
            .then(|| ANSWER_PROMPT.to_string())
    });
    format!(
        "the agent was stopped: {reason}.{}{}",
        if tail.is_empty() {
            String::new()
        } else {
            format!(" Its screen ended with: {tail}.")
        },
        remedy.map(|r| format!(" {r}")).unwrap_or_default(),
    )
}

/// The process facts settlement takes, from what the receipt says happened.
struct RawResult {
    exit_code: Option<i64>,
    signal: Option<String>,
    is_timeout: bool,
    settled_at: String,
    execution_error: Option<String>,
}

fn raw_result_of(receipt: &Value, outbox_claim_present: bool, screen_text: &str) -> RawResult {
    let gate = receipt.get("gateExit").filter(|g| !g.is_null());
    let gate_str = |key: &str| gate.and_then(|g| g.get(key)).and_then(Value::as_str);
    let gate_exit_code = gate.and_then(|g| g.get("exitCode")).and_then(Value::as_i64);
    let outcome = receipt
        .get("outcome")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let reason = receipt.get("reason").and_then(Value::as_str);
    let settled_at = gate_str("exitedAt")
        .or_else(|| receipt.get("publishedAt").and_then(Value::as_str))
        .map(str::to_string)
        .unwrap_or_else(crate::transport::visibility_session::iso_now);
    let stopped = outcome != "exited";
    // A result the agent wrote is judged whatever stopped it afterwards. A gate whose supervisor was gone ends
    // the agent itself once the result shows: the signal it died of says nothing about the work.
    let ended_after_result =
        gate_str("stoppedBy") == Some("orphan") && gate_str("cause") == Some("orphan-result");
    let make = |exit_code: Option<i64>,
                signal: Option<&str>,
                is_timeout: bool,
                error: Option<String>| RawResult {
        exit_code,
        signal: signal.map(str::to_string),
        is_timeout,
        settled_at: settled_at.clone(),
        execution_error: error,
    };
    if outbox_claim_present && (stopped || ended_after_result) {
        return make(Some(0), None, false, None);
    }
    // A terminal attempt the supervisor ended early names why in the receipt reason: that is a failed attempt
    // with a reason, not a cancellation.
    if outcome == "cancelled" && reason.is_some_and(|r| r.starts_with("terminal:")) {
        return make(
            Some(1),
            None,
            false,
            Some(terminal_stop_message(receipt, screen_text)),
        );
    }
    match outcome {
        "abandoned-before-brief" | "abandoned-not-started" => make(
            Some(1),
            None,
            false,
            // Nothing the agent could have done answers the work: the attempt never got its brief.
            Some(format!(
                "{outcome}: the agent never received its brief{}",
                reason
                    .filter(|r| !r.is_empty())
                    .map(|r| format!(" ({r})"))
                    .unwrap_or_default()
            )),
        ),
        "exited" => make(gate_exit_code, gate_str("signal"), false, None),
        "timeout" => make(
            Some(gate_exit_code.unwrap_or(124)),
            Some(gate_str("signal").unwrap_or("SIGTERM")),
            true,
            None,
        ),
        "cancelled" => make(
            gate_exit_code,
            Some(gate_str("signal").unwrap_or("SIGTERM")),
            false,
            None,
        ),
        other => make(Some(1), None, false, Some(other.to_string())),
    }
}

/// The claim file this attempt's settlement judges, or `None`. The receipt names the newest result in the
/// attempt's outbox by the agent protocol's rule, and every worker is told to write its claim there, so a receipt
/// that names nothing means the attempt left no claim.
fn claim_of(envelope: &Value, receipt: &Value) -> Result<Option<PathBuf>, StepError> {
    let Some(name) = receipt
        .get("outboxResult")
        .and_then(Value::as_str)
        .filter(|n| !n.is_empty())
    else {
        return Ok(None);
    };
    if Path::new(name).file_name().and_then(|n| n.to_str()) != Some(name) {
        return Err(StepError::new(
            "io",
            "receipt.json names an outbox result outside the outbox",
        ));
    }
    let dir = envelope
        .get("launch")
        .and_then(|l| l.get("outboxDir"))
        .and_then(Value::as_str)
        .ok_or_else(|| StepError::envelope_invalid("envelope names no outbox directory"))?;
    Ok(Some(Path::new(dir).join(name)))
}

/// One budget for recording every friction of a claim: checked before each record, so a slow host delays the step
/// by at most this plus one host call.
const CLAIM_FRICTIONS_DEADLINE_MS: u128 = 10_000;

/// A worker value that becomes a host flag value: one line, never read as a flag.
fn friction_text(value: Option<&Value>, class: bool) -> Option<String> {
    let text = value?.as_str()?.trim();
    let within = text.chars().count() <= CLAIM_FRICTION_FIELD_MAX;
    let shape = if class {
        !text.is_empty()
            && text.split('-').all(|p| {
                !p.is_empty()
                    && p.chars()
                        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
            })
    } else {
        text.chars()
            .next()
            .is_some_and(|c| !c.is_whitespace() && c != '-')
            && !text.contains('\n')
    };
    (within && shape).then(|| text.to_string())
}

/// The plan and phase the Unit run serves, read from its stored record beside the attempt's own assignment
/// (`<fgos>/assignments/<assignmentId>/runs/<NN>`); `None` when there is none.
fn unit_plan_of(
    run_dir: &Path,
    assignment_id: Option<&str>,
    unit_run_id: Option<&str>,
) -> Option<(String, Option<String>)> {
    let (assignment_id, unit_run_id) = (
        assignment_id.filter(|s| !s.is_empty())?,
        unit_run_id.filter(|s| !s.is_empty())?,
    );
    let mut base = run_dir.to_path_buf();
    for _ in 0..2 + assignment_id.split('/').count() {
        base = base.parent()?.to_path_buf();
    }
    if base.file_name()?.to_str()? != "assignments" {
        return None;
    }
    if Path::new(unit_run_id).is_absolute()
        || unit_run_id
            .split('/')
            .any(|p| p.is_empty() || p == "." || p == "..")
    {
        return None;
    }
    let unit = read_json(&base.join(unit_run_id).join("unit.json"))?;
    let plan = unit.get("unit")?.get("plan")?;
    let dir = plan
        .get("dir")?
        .as_str()
        .filter(|d| !d.is_empty())?
        .to_string();
    let phase = plan
        .get("phase")
        .and_then(Value::as_str)
        .filter(|p| !p.is_empty())
        .map(str::to_string);
    Some((dir, phase))
}

struct FrictionContext<'a> {
    agent_claim: Option<&'a Value>,
    root: &'a Path,
    run_dir: &'a Path,
    assignment_id: Option<&'a str>,
    run_id: &'a str,
    unit_run_id: Option<&'a str>,
    work_id: Option<&'a str>,
}

/// Record the frictions a settled worker claim lists through the friction door, with refs to the run and to the
/// Unit's plan and phase. It runs after the outcome is settled and never changes it: a refused or malformed entry
/// is warned and skipped, entries past the deadline are dropped with a warning; settlement has already cut the
/// list to the claim limit.
fn record_claim_frictions(sink: &dyn FrictionSink, ctx: &FrictionContext<'_>) {
    use fgos_observe::contract::Subject;
    use fgos_observe::friction::FrictionInput;
    use fgos_observe::record::types::SubjectRef;

    let entries = ctx
        .agent_claim
        .and_then(|c| c.get("frictions"))
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    if entries.is_empty() {
        return;
    }
    let warn = |message: String| eprintln!("fgos: warning: worker friction {message}");
    // Settlement already kept the claim's first entries and counted the rest.
    let dropped = ctx
        .agent_claim
        .and_then(|c| c.get("frictionsDropped"))
        .and_then(Value::as_u64)
        .unwrap_or(0);
    if dropped > 0 {
        warn(format!(
            "list was cut at settlement: {dropped} entries dropped"
        ));
    }
    let subject_text = match ctx.work_id.filter(|w| !w.is_empty()) {
        Some(work) => format!("work:{work}"),
        None => format!(
            "run:{}",
            ctx.unit_run_id
                .filter(|u| !u.is_empty())
                .unwrap_or(ctx.run_id)
        ),
    };
    let Some(subject) = Subject::parse(&subject_text) else {
        warn(format!("subject {subject_text} refused"));
        return;
    };
    let mut refs = vec![SubjectRef {
        kind: "run".into(),
        id: ctx.run_id.to_string(),
    }];
    if let Some((dir, phase)) = unit_plan_of(ctx.run_dir, ctx.assignment_id, ctx.unit_run_id) {
        refs.push(SubjectRef {
            kind: "plan".into(),
            id: dir,
        });
        if let Some(phase) = phase {
            refs.push(SubjectRef {
                kind: "phase".into(),
                id: phase,
            });
        }
    }
    let started = std::time::Instant::now();
    for (index, entry) in entries.iter().enumerate() {
        if started.elapsed().as_millis() > CLAIM_FRICTIONS_DEADLINE_MS {
            warn(format!("recording passed its {CLAIM_FRICTIONS_DEADLINE_MS} ms deadline; {} entries not recorded", entries.len() - index));
            return;
        }
        let valid = entry.is_object();
        let kind = if valid {
            friction_text(entry.get("kind"), false)
        } else {
            None
        };
        let layer = if valid {
            friction_text(entry.get("layer"), false)
        } else {
            None
        };
        let error_class = if valid {
            friction_text(entry.get("errorClass"), true)
        } else {
            None
        };
        let kind_given = valid && entry.get("kind").is_some_and(|k| !k.is_null());
        if layer.is_none() || error_class.is_none() || (kind_given && kind.is_none()) {
            warn(format!("entry {} skipped: layer and errorClass must be single lines of at most {CLAIM_FRICTION_FIELD_MAX} characters, errorClass a lowercase-hyphenated signature", index + 1));
            continue;
        }
        let input = FrictionInput {
            subject: subject.clone(),
            kind,
            refs: refs.clone(),
            layer: layer.unwrap_or_default(),
            error_class: error_class.unwrap_or_default(),
            disposition: "advisory".into(),
            detail: entry
                .get("detail")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            producer: "worker-claim".into(),
            attempts: None,
            doc_type: None,
        };
        // The host refused this entry's values; the rest still record.
        if let Err(message) = sink.record(ctx.root, input) {
            warn(format!("entry {} refused: {message}", index + 1));
        }
    }
}

fn model_check_of(context: &Value) -> Option<ModelCheck> {
    let check = context.get("modelCheck").filter(|c| c.is_object())?;
    Some(ModelCheck {
        requested: check
            .get("requested")
            .and_then(Value::as_str)
            .map(str::to_string),
        launched: check
            .get("launched")
            .and_then(Value::as_str)
            .map(str::to_string),
        warnings: check
            .get("warnings")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default(),
    })
}

pub fn settle_attempt(run_dir: &Path, envelope: &Value, ports: &StepPorts<'_>) -> StepResult {
    let run_meta = read_json(&run_dir.join("run.json")).unwrap_or(Value::Null);
    let Some(run_id) = run_meta
        .get("runId")
        .and_then(Value::as_str)
        .filter(|r| !r.is_empty())
    else {
        return Err(StepError::new("io", "run.json is missing or has no runId"));
    };
    if read_settled_result(run_dir, run_id).is_some() {
        return Ok(StepOutcome::Done(json!({"settled": "already"})));
    }
    let receipt = read_json(&run_dir.join("receipt.json"));
    let receipt = match receipt {
        Some(r) if r.get("attemptId") == envelope.get("attemptId") => r,
        _ => {
            return Err(StepError::new(
                "io",
                "receipt.json is missing or belongs to another attempt",
            ))
        }
    };
    let Some(control) = control_of(run_dir, envelope)? else {
        return Ok(StepOutcome::Retry("run-control-held".into()));
    };

    // The controller's effective assignment (stored fields plus what it backfilled), else the stored one.
    let assignment = read_json(&run_dir.join("assignment.json"))
        .or_else(|| {
            run_dir
                .parent()
                .and_then(Path::parent)
                .and_then(|d| read_json(&d.join("assignment.json")))
        })
        .unwrap_or(Value::Null);
    let baseline = evaluator_baseline(run_dir, receipt.get("outcome").and_then(Value::as_str))?;
    let launch = envelope.get("launch").cloned().unwrap_or(Value::Null);
    let capture = |key: &str| {
        launch
            .get("capture")
            .and_then(|c| c.get(key))
            .and_then(Value::as_str)
            .map(PathBuf::from)
    };
    // What the launching controller knew and no file of the attempt carries (policy, provider account, fallback).
    // Absent for an attempt whose controller died before it wrote it: the settlement then simply has less
    // provenance, never a different outcome.
    let context = read_json(&run_dir.join("controller").join("settle-context.json"))
        .unwrap_or_else(|| json!({}));
    let cwd = PathBuf::from(
        envelope
            .get("cwd")
            .and_then(Value::as_str)
            .unwrap_or_default(),
    );
    let stray_warnings: Vec<Value> = match context.get("strayWatch").filter(|w| w.is_object()) {
        Some(watch) => {
            let repo_root = PathBuf::from(
                watch
                    .get("repoRoot")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
            );
            let watch_cwd =
                PathBuf::from(watch.get("cwd").and_then(Value::as_str).unwrap_or_default());
            let before: Option<Vec<String>> =
                watch.get("before").and_then(Value::as_array).map(|a| {
                    a.iter()
                        .filter_map(|v| v.as_str().map(str::to_string))
                        .collect()
                });
            let watched = watch_writes_outside_workspace(
                ports.git,
                &repo_root,
                &watch_cwd,
                before.as_deref(),
            );
            stray_write_warning(&repo_root, &watched.stray_paths())
                .into_iter()
                .collect()
        }
        None => Vec::new(),
    };
    let screen_text = ports
        .pane
        .visible_screen(run_dir, envelope)
        .trim_end()
        .to_string();
    let claim_path = claim_of(envelope, &receipt)?;
    let raw = raw_result_of(&receipt, claim_path.is_some(), &screen_text);
    // The screen is evidence for a person, never a judge: why a provider stopped the agent is the receipt's reason.
    let stdout_tail = capture("stdout").map(|p| read_tail(&p)).unwrap_or_default();
    let stdout_text = if stdout_tail.is_empty() {
        screen_text.clone()
    } else {
        stdout_tail
    };
    let stderr_text = capture("stderr").map(|p| read_tail(&p)).unwrap_or_default();
    let provider_stop = provider_stop_of(&receipt, claim_path.is_some());

    let host = envelope
        .get("host")
        .or_else(|| envelope.get("mode"))
        .and_then(Value::as_str);
    let adapter = if host == Some("terminal") {
        "herdr-spawn"
    } else {
        "cli-spawn"
    };
    let model_warnings = model_check_of(&context)
        .map(|check| collect_model_warnings(Some(&check), &stdout_text, &stderr_text))
        .unwrap_or_default();
    let snapshots = baseline
        .as_ref()
        .and_then(|b| b.get("dirtyBeforeSnapshots"))
        .filter(|s| s.is_object())
        .map(snapshots_of);
    let dirty_before: Vec<String> = baseline
        .as_ref()
        .and_then(|b| b.get("dirtyBefore"))
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default();
    let repo_root = context
        .get("repoRoot")
        .and_then(Value::as_str)
        .map(PathBuf::from)
        .unwrap_or_else(|| cwd.clone());
    let runtime_dir = context
        .get("providerCapacityRuntimeDir")
        .and_then(Value::as_str)
        .map(PathBuf::from);
    let attempt_id = envelope.get("attemptId").and_then(Value::as_str);
    let executor_id = context.get("resolvedExecutorId").and_then(Value::as_str);
    let execution_error = raw
        .execution_error
        .as_deref()
        .map(|message| (message, None));
    let provider_signal = provider_stop.as_ref().and_then(|p| p.signal.as_ref());
    let git_before_source = baseline
        .as_ref()
        .and_then(|b| b.get("gitBeforeSource"))
        .and_then(Value::as_str)
        .unwrap_or("pre-launch")
        .to_string();
    let git_before = baseline
        .as_ref()
        .and_then(|b| b.get("gitBefore"))
        .and_then(Value::as_str);

    let input = SettleInput {
        run_dir,
        run_meta: &run_meta,
        assignment: &assignment,
        control_epoch: control.epoch,
        control_token: &control.token,
        exit_code: raw.exit_code,
        signal: raw.signal.as_deref(),
        is_timeout: raw.is_timeout,
        duration_ms: None,
        settled_at: &raw.settled_at,
        stdout_text: &stdout_text,
        stderr_text: &stderr_text,
        effective_cwd: &cwd,
        git_before,
        git_before_source: &git_before_source,
        git_after: None,
        dirty_before: &dirty_before,
        dirty_after: None,
        dirty_before_snapshots: snapshots.as_ref(),
        input_digests: context.get("inputDigests"),
        resolved_executor_id: executor_id,
        effective_policy: context.get("effectivePolicy"),
        executor_redirected: context
            .get("executorRedirected")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        reasoning_effort: context.get("reasoningEffort").and_then(Value::as_str),
        model_warnings: &model_warnings,
        provider_capacity_selection: context.get("providerCapacitySelection"),
        provider_capacity_evidence: context.get("providerCapacityEvidence"),
        execution_error,
        launch_command_id: attempt_id,
        adapter_outcome: provider_stop.as_ref().map(|p| p.adapter_outcome),
        provider_stop_cause: provider_stop.as_ref().and_then(|p| p.cause),
        provider_signal,
        agent_result_path: Some(claim_path.as_deref()),
        attestation: None,
        dispatch_warnings: &stray_warnings,
        adapter,
        repo_root: Some(&repo_root),
        cwd: Some(&cwd),
        provider_capacity_runtime_dir: runtime_dir.as_deref(),
        update_run_json: Some("settled"),
    };
    let settle_ports = SettlementPorts {
        git: ports.git,
        faults: ports.faults,
    };
    let settled = match settle_run_outcome(&settle_ports, &input) {
        Ok(settled) => settled,
        Err(err) if err.code == "run-control-superseded" => {
            // Another writer settled this run first; its result.json is the answer.
            if read_settled_result(run_dir, run_id).is_some() {
                return Ok(StepOutcome::Done(json!({"settled": "by-other"})));
            }
            return Err(StepError::new("internal", err.message));
        }
        Err(err) => {
            return Err(StepError::new(
                if err.code == "io" { "io" } else { "internal" },
                err.message,
            ))
        }
    };
    // After the outcome is committed, so recording can only add a friction, never move the result.
    record_claim_frictions(
        ports.friction,
        &FrictionContext {
            agent_claim: settled.run_result.get("agentClaim"),
            root: &repo_root,
            run_dir,
            assignment_id: run_meta
                .get("assignmentId")
                .and_then(Value::as_str)
                .or_else(|| assignment.get("assignmentId").and_then(Value::as_str)),
            run_id,
            unit_run_id: envelope
                .get("unitRunId")
                .and_then(Value::as_str)
                .or_else(|| assignment.get("unitRunId").and_then(Value::as_str)),
            work_id: run_meta
                .get("workId")
                .and_then(Value::as_str)
                .or_else(|| assignment.get("workId").and_then(Value::as_str)),
        },
    );
    Ok(StepOutcome::Done(
        json!({"settled": "now", "runId": run_id, "status": "settled"}),
    ))
}
