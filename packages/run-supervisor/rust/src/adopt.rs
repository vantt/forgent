//! Route `fgos internal adopt`: one door for resume, recover, scan and home cleanup.
//! Contract: `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`.
//!
//! An attempt is adoptable when its lock is free and its process domain is
//! empty. The adopter takes the lock exclusively (the holder-lock predecessor
//! rule ends and waits out a domain a dead supervisor left), writes
//! `adopting.json`, completes the receipt the matrix calls for, runs the steps
//! that have no receipt and publishes `closed.json`.

use std::io::{BufRead, Write};
use std::path::{Path, PathBuf};

use fgos_holder_lock::{predecessor, Acquire, HeldReason, Mode, Probe, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use fgos_process::{domain_watch, facts, DomainState};
use serde_json::{json, Value};

use crate::envelope;
use crate::publish::{iso_utc_now, publish_once};
use crate::route::{refuse, report, ArgsError, Flags, EXIT_INTERNAL};
use crate::steps::{run_steps, StepsOutcome};
use crate::supervise::publish_receipt_as;

/// Parsed argv of `fgos internal adopt`.
#[derive(Debug, PartialEq, Eq)]
pub struct AdoptArgs {
    pub target: Target,
    pub probe_only: bool,
    pub kill_wait_ms: u64,
}

#[derive(Debug, PartialEq, Eq)]
pub enum Target {
    RunDir(PathBuf),
    /// Attempt directories, one per line on stdin.
    Scan,
}

pub fn parse_args(args: &[String]) -> Result<AdoptArgs, ArgsError> {
    let flags = Flags::parse_with_switches(args, &["run-dir", "kill-wait-ms"], &["scan", "probe-only"], 0)?;
    let target = match (flags.get("run-dir"), flags.get("scan")) {
        (Some(dir), None) => Target::RunDir(PathBuf::from(dir)),
        (None, Some(_)) => Target::Scan,
        _ => return Err(ArgsError::Usage("exactly one of --run-dir and --scan is required".into())),
    };
    let kill_wait_ms = match flags.get("kill-wait-ms") {
        Some(text) => text.parse().map_err(|_| ArgsError::Usage("--kill-wait-ms needs a number".into()))?,
        None => DEFAULT_KILL_WAIT_MS,
    };
    Ok(AdoptArgs { target, probe_only: flags.get("probe-only").is_some(), kill_wait_ms })
}

/// What one attempt directory came to.
#[derive(Debug, PartialEq, Eq)]
pub struct Verdict {
    pub state: &'static str,
    pub outcome: Option<String>,
    pub pending_step: Option<String>,
    pub reason: Option<String>,
}

impl Verdict {
    fn state(state: &'static str) -> Self {
        Verdict { state, outcome: None, pending_step: None, reason: None }
    }

    fn because(state: &'static str, reason: impl Into<String>) -> Self {
        Verdict { reason: Some(reason.into()), ..Verdict::state(state) }
    }

    fn line(&self, dir: &Path) -> Value {
        let mut line = json!({"v": 1, "protocol": 1, "attemptDir": dir, "state": self.state});
        for (key, value) in [("outcome", &self.outcome), ("pendingStep", &self.pending_step), ("reason", &self.reason)] {
            if let Some(value) = value {
                line[key] = Value::String(value.clone());
            }
        }
        line
    }
}

pub fn run(args: &[String]) -> i32 {
    let args = match parse_args(args) {
        Ok(args) => args,
        Err(err) => return refuse("adopt", err),
    };
    let mut out = std::io::BufWriter::new(std::io::stdout().lock());
    let dirs: Vec<PathBuf> = match &args.target {
        Target::RunDir(dir) => vec![dir.clone()],
        Target::Scan => std::io::stdin().lock().lines().map_while(Result::ok).map(|l| l.trim().to_string()).filter(|l| !l.is_empty()).map(PathBuf::from).collect(),
    };
    for dir in &dirs {
        let verdict = adopt_one(dir, &args);
        // A closed stdout must not turn the work already done into a failure.
        if writeln!(out, "{}", verdict.line(dir)).and_then(|()| out.flush()).is_err() {
            report("adopt", "internal", "stdout closed");
            return EXIT_INTERNAL;
        }
    }
    0
}

/// Judge, and unless probing, adopt, one attempt directory.
pub fn adopt_one(dir: &Path, args: &AdoptArgs) -> Verdict {
    // A closed attempt costs one stat: no lock is opened.
    if dir.join("closed.json").exists() {
        return Verdict::state("closed");
    }
    let lock_path = dir.join("attempt.lock");
    if !lock_path.exists() || !is_v3_envelope(&dir.join("envelope.json")) {
        return Verdict::state("legacy-run");
    }
    let resource = Resource::new("attempt", &lock_path);
    match fgos_holder_lock::probe(&resource) {
        Ok(Probe::Held) => return held_state(dir),
        Ok(Probe::Free) => {}
        Err(err) => return Verdict::because("open", format!("lock probe failed: {err}")),
    }
    let binding = read_json(&dir.join("supervisor-binding.json"));
    // Lock free is not enough: the domain must be provably empty.
    let domain_state = binding.as_ref().map_or(DomainState::Empty, domain_of);
    if args.probe_only {
        return match domain_state {
            DomainState::Empty => Verdict::state("needs-adopt"),
            _ => Verdict::because("running", "domain-not-empty"),
        };
    }
    // A scan adopts only what is already empty; a named run dir may wait out a domain.
    if matches!(args.target, Target::Scan) && domain_state != DomainState::Empty {
        return Verdict::because("running", "domain-not-empty");
    }
    adopt_locked(dir, &resource, binding.is_some(), args)
}

/// The attempt lock is held: an adopter's `adopting.json` tells it from the supervisor.
fn held_state(dir: &Path) -> Verdict {
    Verdict::state(if dir.join("adopting.json").exists() { "being-adopted" } else { "running" })
}

fn adopt_locked(dir: &Path, resource: &Resource, bound: bool, args: &AdoptArgs) -> Verdict {
    let handle = match fgos_holder_lock::acquire(resource, Mode::Ex, Wait::Try, args.kill_wait_ms) {
        Acquire::Acquired(handle) => handle,
        Acquire::Held { reason: HeldReason::KernelLockHeld, .. } => return held_state(dir),
        Acquire::Held { reason, .. } => return Verdict::because("held", reason.as_str()),
        Acquire::Timeout { .. } => return Verdict::because("held", "lock-timeout"),
        Acquire::Unavailable { reason, detail } => return Verdict::because("open", format!("{}: {detail}", reason.as_str())),
    };
    let verdict = drive(dir, bound);
    // The marker only describes the current holder; it goes before the lock does.
    let _ = std::fs::remove_file(dir.join("adopting.json"));
    drop(handle);
    verdict
}

/// Holding the lock exclusively: marker, receipt by the matrix, steps, closed.
fn drive(dir: &Path, bound_hint: bool) -> Verdict {
    // Another adopter may have finished between the first look and the lock.
    if dir.join("closed.json").exists() {
        return Verdict::state("closed");
    }
    let envelope = match envelope::read_verified(&dir.join("envelope.json")) {
        Ok(envelope) => envelope,
        Err(why) => return Verdict::because("open", why),
    };
    let attempt_id = envelope["attemptId"].as_str().unwrap_or_default().to_string();
    if let Err(why) = write_marker(dir, &attempt_id) {
        return Verdict::because("open", format!("adopting.json not written: {why}"));
    }
    // Re-read under the lock: the binding is only ever published by the supervisor that is gone.
    let bound = bound_hint || dir.join("supervisor-binding.json").exists();
    let outcome = match ensure_receipt(&envelope, dir, bound) {
        Ok(outcome) => outcome,
        Err(why) => return Verdict::because("open", format!("receipt.json not published: {why}")),
    };
    match run_steps(&envelope, dir) {
        StepsOutcome::Done(ids) => {
            let closed = json!({"v": 1, "attemptId": attempt_id, "closedBy": "adopt", "steps": ids, "at": iso_utc_now()});
            let published = serde_json::to_vec(&closed).map_err(std::io::Error::other).and_then(|bytes| publish_once(dir, "closed.json", &bytes));
            match published {
                Ok(_) => Verdict { outcome: Some(outcome), ..Verdict::state("adopted") },
                Err(why) => Verdict { outcome: Some(outcome), ..Verdict::because("open", format!("closed.json not published: {why}")) },
            }
        }
        StepsOutcome::Retry { step_id, reason } | StepsOutcome::Failed { step_id, reason } => {
            Verdict { outcome: Some(outcome), pending_step: Some(step_id), ..Verdict::because("open", reason) }
        }
    }
}

/// The recovery matrix: a receipt that exists stands; otherwise no binding is
/// `abandoned-not-started`, and a binding is judged from `gate-exit.json` (its
/// absence is `gate-lost`) and the outbox.
fn ensure_receipt(envelope: &Value, dir: &Path, bound: bool) -> std::io::Result<String> {
    if let Some(receipt) = read_json(&dir.join("receipt.json")) {
        if let Some(outcome) = receipt["outcome"].as_str() {
            return Ok(outcome.to_string());
        }
    }
    publish_receipt_as(envelope, dir, "adopt", !bound)
}

/// `adopting.json`, rewritten by each adopter: temp file, then rename.
fn write_marker(dir: &Path, attempt_id: &str) -> std::io::Result<()> {
    let me = facts::self_identity().map(|t| t.to_record().to_json()).unwrap_or(Value::Null);
    let body = json!({"v": 1, "attemptId": attempt_id, "adopter": me, "at": iso_utc_now()});
    let temp = dir.join(format!(".adopting.json.tmp.{}", std::process::id()));
    std::fs::write(&temp, serde_json::to_vec(&body).map_err(std::io::Error::other)?)?;
    std::fs::rename(&temp, dir.join("adopting.json")).inspect_err(|_| {
        let _ = std::fs::remove_file(&temp);
    })
}

fn read_json(path: &Path) -> Option<Value> {
    serde_json::from_str(&std::fs::read_to_string(path).ok()?).ok()
}

/// Cheap check for a scan: the file is JSON with `v` 3. The digest is checked when the attempt is adopted.
fn is_v3_envelope(path: &Path) -> bool {
    read_json(path).is_some_and(|envelope| envelope["v"] == 3)
}

/// Whether the domain the binding names is empty; an unreadable one is not.
fn domain_of(binding: &Value) -> DomainState {
    let record = json!({"v": 1, "domainKind": binding["domain"]["kind"], "domainId": binding["domain"]["id"]});
    match predecessor::parse_record(&record) {
        Some(domain) => domain_watch(&domain).is_empty(),
        None => DomainState::Unknown,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn argv_names_one_target_and_needs_protocol_one() {
        let parsed = parse_args(&argv(&["--protocol", "1", "--run-dir", "/a", "--probe-only"])).unwrap();
        assert_eq!(parsed, AdoptArgs { target: Target::RunDir("/a".into()), probe_only: true, kill_wait_ms: DEFAULT_KILL_WAIT_MS });
        assert_eq!(parse_args(&argv(&["--protocol", "1", "--scan", "--kill-wait-ms", "50"])).unwrap().kill_wait_ms, 50);
        assert!(matches!(parse_args(&argv(&["--protocol", "1"])), Err(ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--scan", "--run-dir", "/a"])), Err(ArgsError::Usage(_))));
        assert_eq!(parse_args(&argv(&["--scan"])), Err(ArgsError::VersionMismatch));
    }
}
