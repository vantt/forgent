//! Route `fgos internal supervise`: owns the attempt after the controller
//! handed it over. It starts the gate inside the attempt's process domain,
//! binds the attempt, sends `GO`, watches the deadlines and the cancel request,
//! publishes the receipt when the gate is gone and runs the post-receipt steps.
//! Contract: `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`.
//!
//! The supervisor never holds a pipe of the agent: the gate owns its IO, so a
//! supervisor that dies mid-run changes nothing for the agent.
//!
//! One flow for every OS. What differs lives in `supervise/unix.rs` (the lock
//! descriptions arrive inherited, the GO channel is a socketpair) and
//! `supervise/windows.rs` (a `LockFileEx` lock is never inherited, so the
//! supervisor takes it itself; the GO channel is a named pipe and the gate
//! stops by polling `stop-requested.json`).

use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_agent_protocol::direct::{adapter_for, DirectAdapter};
use fgos_process::containment::{ContainmentDomain, ContainmentDriver, GuaranteeLevel, Spawned};
use fgos_process::{facts, DomainState};

use serde_json::{json, Value};
use sha2::{Digest, Sha256};

use crate::envelope;
use crate::gate::boottime_ns;
use crate::go_channel::{read_frame, write_frame};
use crate::publish::{iso_utc_now, publish_once};
use crate::route::{emit, refuse, report, Flags, EXIT_ATTEMPT_BOUND, EXIT_ENVELOPE_INVALID, EXIT_INTERNAL, EXIT_VERSION_MISMATCH};

#[cfg(unix)]
mod terminal;
#[cfg(unix)]
mod unix;
#[cfg(windows)]
mod windows;
#[cfg(unix)]
use unix as os;
#[cfg(windows)]
use windows as os;

/// Parsed argv of `fgos internal supervise`.
#[derive(Debug, PartialEq, Eq)]
pub struct SuperviseArgs {
    pub envelope: PathBuf,
}

pub fn parse_args(args: &[String]) -> Result<SuperviseArgs, crate::route::ArgsError> {
    let flags = Flags::parse(args, &["envelope"], 0)?;
    Ok(SuperviseArgs { envelope: PathBuf::from(flags.require("envelope")?) })
}

/// The receipt outcome for what the gate left behind (`receipt.v1.json`).
/// `None`: no `gate-exit.json`, which means the gate died or never ran the
/// agent (exit 64, 65 or 70 publish nothing): the lock being free proves the
/// domain is empty, so the physical result is `gate-lost`.
pub fn outcome_for(gate_exit: Option<&Value>, outbox_present: bool) -> &'static str {
    if gate_exit.is_some_and(|g| g["stoppedBy"] == "orphan" && g["cause"] == "abandoned-before-brief") {
        return "abandoned-before-brief";
    }
    match gate_exit.and_then(|g| g["stoppedBy"].as_str()) {
        Some("agent") => "exited",
        Some("soft-deadline" | "idle" | "hard-ceiling") => "timeout",
        Some("output-limit") => "output-limit",
        Some("cancel") => "cancelled",
        Some("orphan") if outbox_present => "exited",
        _ => "gate-lost",
    }
}

/// `"sha256:<hex>"` of a capture file's bytes, `None` when it does not exist.
fn capture_digest(path: &Path) -> Option<String> {
    use std::io::Read;
    let mut file = std::fs::File::open(path).ok()?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = file.read(&mut buf).ok()?;
        if n == 0 {
            return Some(format!("sha256:{:x}", hasher.finalize()));
        }
        hasher.update(&buf[..n]);
    }
}

fn outbox_present(outbox: &Path) -> bool {
    let names: Vec<String> = std::fs::read_dir(outbox).into_iter().flatten().flatten().filter_map(|e| e.file_name().to_str().map(String::from)).collect();
    fgos_agent_protocol::direct::newest_result(outbox, names.iter().map(String::as_str)).is_some()
}

/// The `gate-exit.json` of this attempt, when one was published.
fn read_gate_exit(run_dir: &Path, attempt_id: &str) -> Option<Value> {
    let value: Value = serde_json::from_str(&std::fs::read_to_string(run_dir.join("gate-exit.json")).ok()?).ok()?;
    (value["attemptId"] == attempt_id).then_some(value)
}

/// What the supervisor itself saw end a `terminal` attempt, beyond what the gate published.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct TerminalEnd {
    /// The pane or its multiplexer was lost while the gate had published nothing.
    pub carrier_lost: bool,
    /// `terminal:<outcome>` when an adapter outcome ended the run early.
    pub reason: Option<String>,
}

/// Publish `receipt.json` once and return the outcome of whichever receipt is there, for either author. `not_started`: the attempt was never
/// bound, so the receipt names `abandoned-not-started` whatever else is on disk.
pub(crate) fn publish_receipt_as(envelope: &Value, run_dir: &Path, synthesized_by: &str, not_started: bool) -> std::io::Result<String> {
    publish_receipt_with(envelope, run_dir, synthesized_by, not_started, &TerminalEnd::default())
}

/// [`publish_receipt_as`] with what a `terminal` supervisor saw end the attempt.
pub(crate) fn publish_receipt_with(envelope: &Value, run_dir: &Path, synthesized_by: &str, not_started: bool, end: &TerminalEnd) -> std::io::Result<String> {
    let attempt_id = envelope["attemptId"].as_str().unwrap_or_default();
    let gate_exit = read_gate_exit(run_dir, attempt_id);
    let launch = &envelope["launch"];
    let present = launch["outboxDir"].as_str().is_some_and(|dir| outbox_present(Path::new(dir)));
    let digest_of = |key: &str| launch["capture"][key].as_str().and_then(|p| capture_digest(Path::new(p))).map_or(Value::Null, Value::from);
    let outcome = if not_started {
        "abandoned-not-started"
    } else if end.carrier_lost && gate_exit.is_none() {
        "carrier-lost"
    } else {
        outcome_for(gate_exit.as_ref(), present)
    };
    let mut receipt = json!({
        "v": 1,
        "attemptId": attempt_id,
        "outcome": outcome,
        "captureDigests": {"stdout": digest_of("stdout"), "stderr": digest_of("stderr")},
        "outboxPresent": present,
        "synthesizedBy": synthesized_by,
        "publishedAt": iso_utc_now(),
    });
    if let Some(exit) = gate_exit {
        receipt["gateExit"] = exit;
    }
    if not_started {
        if let Some(code) = read_start_refusal(run_dir, attempt_id) {
            receipt["reason"] = json!(format!("start-refused:{code}"));
        }
    } else if let Some(reason) = &end.reason {
        receipt["reason"] = json!(reason);
    }
    publish_once(run_dir, "receipt.json", &serde_json::to_vec(&receipt).map_err(std::io::Error::other)?)?;
    // A receipt that already existed is the one that counts.
    let published: Value = std::fs::read_to_string(run_dir.join("receipt.json")).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or(receipt);
    Ok(published["outcome"].as_str().unwrap_or(outcome).to_string())
}

/// A refusal before anything started: the exit code, the named code and the free text.
pub(crate) struct Refusal {
    pub exit: i32,
    pub code: &'static str,
    pub why: String,
}

impl Refusal {
    fn internal(why: impl Into<String>) -> Refusal {
        Refusal { exit: EXIT_INTERNAL, code: "internal", why: why.into() }
    }
}

const TICK: Duration = Duration::from_millis(50);
const HEARTBEAT_EVERY: Duration = Duration::from_secs(5);
/// How long the gate has to say HELLO after it started.
const HELLO_LIMIT: Duration = Duration::from_secs(15);
/// Slack beyond `gateKillGraceMs` before the supervisor ends the domain itself.
const GATE_STOP_SLACK: Duration = Duration::from_secs(5);

/// What the watch needs from the envelope.
struct Watch {
    attempt_id: String,
    digest: String,
    run_dir: PathBuf,
    soft_at: Option<(String, u64)>,
    idle: Option<Duration>,
    grace: Duration,
    captures: [PathBuf; 2],
    /// Where the agent writes `result-<N>.json`.
    outbox: PathBuf,
    /// The most the two capture files may hold together before the agent is stopped.
    max_output: Option<u64>,
    adapter: &'static dyn DirectAdapter,
    boot_id: Option<String>,
}

impl Watch {
    fn from(envelope: &Value, run_dir: &Path) -> Result<Watch, String> {
        let text = |v: &Value, what: &str| v.as_str().map(String::from).ok_or_else(|| format!("envelope field {what} missing"));
        let soft_at = match (envelope["deadlines"]["softAt"]["bootId"].as_str(), envelope["deadlines"]["softAt"]["boottimeNs"].as_u64()) {
            (Some(boot), Some(ns)) => Some((boot.to_string(), ns)),
            _ => None,
        };
        Ok(Watch {
            attempt_id: text(&envelope["attemptId"], "attemptId")?,
            digest: text(&envelope["digest"], "digest")?,
            run_dir: run_dir.to_path_buf(),
            soft_at,
            idle: envelope["deadlines"]["idleMs"].as_u64().map(Duration::from_millis),
            grace: Duration::from_millis(envelope["deadlines"]["gateKillGraceMs"].as_u64().ok_or("envelope field deadlines.gateKillGraceMs missing")?),
            captures: [text(&envelope["launch"]["capture"]["stdout"], "launch.capture.stdout")?.into(), text(&envelope["launch"]["capture"]["stderr"], "launch.capture.stderr")?.into()],
            outbox: text(&envelope["launch"]["outboxDir"], "launch.outboxDir")?.into(),
            max_output: envelope["launch"]["maxOutputBytes"].as_u64(),
            adapter: adapter_for(envelope["agentProtocol"]["cli"].as_str().unwrap_or_default()),
            boot_id: facts::boot_id(),
        })
    }

    fn soft_deadline_passed(&self) -> bool {
        let Some((boot_id, at)) = &self.soft_at else { return false };
        // Another boot than the recorded one: the instant is meaningless, treat it as past.
        self.boot_id.as_ref().is_some_and(|current| current != boot_id) || boottime_ns() >= *at
    }

    /// The capture files hold more than the attempt's output budget.
    fn output_over_limit(&self) -> bool {
        let Some(max) = self.max_output else { return false };
        let total: u64 = self.captures.iter().filter_map(|path| fs::metadata(path).ok()).map(|meta| meta.len()).sum();
        total > max
    }

    fn cancel_requested(&self) -> bool {
        fs::read_to_string(self.run_dir.join("cancel-requested.json"))
            .ok()
            .and_then(|t| serde_json::from_str::<Value>(&t).ok())
            .is_some_and(|v| v["attemptId"] == self.attempt_id.as_str())
    }
}

/// New capture bytes since the last look, judged by the adapter.
struct CaptureTail {
    offsets: [u64; 2],
}

impl CaptureTail {
    fn active(&mut self, watch: &Watch) -> bool {
        use std::io::{Read, Seek, SeekFrom};
        let mut active = false;
        for (offset, path) in self.offsets.iter_mut().zip(&watch.captures) {
            let Ok(mut file) = File::open(path) else { continue };
            if file.seek(SeekFrom::Start(*offset)).is_err() {
                continue;
            }
            let mut delta = Vec::new();
            if file.take(64 * 1024).read_to_end(&mut delta).is_ok() && !delta.is_empty() {
                *offset += delta.len() as u64;
                active |= watch.adapter.activity_from(&String::from_utf8_lossy(&delta)).is_active();
            }
        }
        active
    }
}

fn write_atomic(dir: &Path, name: &str, value: &Value) -> std::io::Result<()> {
    let temp = dir.join(format!(".{name}.tmp.{}", std::process::id()));
    let mut file = os::create_private(&temp)?;
    file.write_all(&serde_json::to_vec(value).map_err(std::io::Error::other)?)?;
    drop(file);
    fs::rename(&temp, dir.join(name))
}

/// Run the supervisor; the return value is the process exit code.
pub fn run(args: &[String]) -> i32 {
    let args = match parse_args(args) {
        Ok(args) => args,
        Err(err) => return refuse("supervise", err),
    };
    match supervise(&args) {
        Ok(code) => code,
        Err(refusal) => {
            if refusal.code != "attempt-already-bound" {
                record_start_refusal(&args.envelope, &refusal);
            }
            report("supervise", refusal.code, &refusal.why);
            refusal.exit
        }
    }
}

/// A supervisor that ends before it bound the attempt leaves its named reason
/// in `start-refused.json`, so adopt and doctor show a code, not a line of
/// `supervisor.log`. Best effort: the refusal itself is what the exit code reports.
fn record_start_refusal(envelope_path: &Path, refusal: &Refusal) {
    let Some(envelope) = std::fs::read_to_string(envelope_path).ok().and_then(|text| serde_json::from_str::<Value>(&text).ok()) else { return };
    let (Some(run_dir), Some(attempt_id)) = (envelope["runDir"].as_str(), envelope["attemptId"].as_str()) else { return };
    // The note goes beside the envelope it names, never to a directory only the (unverified) envelope points at.
    if envelope_path.parent().map(Path::to_path_buf) != Some(PathBuf::from(run_dir)) {
        return;
    }
    let note = json!({"v": 1, "attemptId": attempt_id, "code": refusal.code, "why": refusal.why, "at": iso_utc_now()});
    if let Ok(bytes) = serde_json::to_vec(&note) {
        let _ = publish_once(Path::new(run_dir), "start-refused.json", &bytes);
    }
}

/// The code a supervisor named when it refused to start this attempt, if it did.
pub(crate) fn read_start_refusal(run_dir: &Path, attempt_id: &str) -> Option<String> {
    let note: Value = serde_json::from_str(&std::fs::read_to_string(run_dir.join("start-refused.json")).ok()?).ok()?;
    (note["attemptId"] == attempt_id).then(|| note["code"].as_str().unwrap_or("unknown").to_string())
}

fn supervise(args: &SuperviseArgs) -> Result<i32, Refusal> {
    // Before any other syscall: nothing this process spawns may inherit a lock.
    let mut locks = os::Locks::early()?;

    let envelope = envelope::read_verified(&args.envelope).map_err(|why| Refusal { exit: EXIT_ENVELOPE_INVALID, code: "envelope-invalid", why })?;
    if !envelope::host_bin_is_current(&envelope) {
        return Err(Refusal { exit: EXIT_VERSION_MISMATCH, code: "host-version-mismatch", why: "the envelope names another host binary than the one running".into() });
    }
    let invalid = |why: &str| Refusal { exit: EXIT_ENVELOPE_INVALID, code: "envelope-invalid", why: why.into() };
    let run_dir = envelope["runDir"].as_str().map(PathBuf::from).ok_or_else(|| invalid("runDir missing"))?;
    let terminal = match envelope["mode"].as_str() {
        Some("direct") => false,
        Some("terminal") => true,
        _ => return Err(invalid("mode must be direct or terminal")),
    };
    // A supervisor already ran this attempt (or its receipt exists): a second one would take the lock and,
    // by the predecessor rule, end the live domain the first one left running. Leave the attempt to adopt.
    if run_dir.join("supervisor-binding.json").exists() || run_dir.join("receipt.json").exists() {
        return Err(Refusal { exit: EXIT_ATTEMPT_BOUND, code: "attempt-already-bound", why: "the attempt directory already has a supervisor binding or a receipt".into() });
    }
    locks.complete(&envelope, &run_dir)?;
    let watch = Watch::from(&envelope, &run_dir).map_err(|why| Refusal { exit: EXIT_ENVELOPE_INVALID, code: "envelope-invalid", why })?;
    if terminal {
        return supervise_terminal(&envelope, &run_dir, locks, &watch);
    }

    let driver = open_driver(&envelope).map_err(Refusal::internal)?;
    let mut domain = driver.create(&watch.attempt_id).map_err(|why| Refusal::internal(why.to_string()))?;
    if let Some(ms) = envelope["deadlines"]["killWaitMs"].as_u64() {
        domain.set_empty_wait(Duration::from_millis(ms));
    }
    let mut link = os::GoLink::new(&domain).map_err(Refusal::internal)?;
    let spec = os::gate_spec(&envelope, &run_dir, &locks, &mut link, &domain).map_err(Refusal::internal)?;
    let mut spawned = driver.spawn_in(&mut domain, spec).map_err(|why| Refusal::internal(format!("gate did not start: {why}")))?;
    let gate_started = Instant::now();

    // The domain is on record before the gate may run anything.
    if let Err(why) = bind(&envelope, &run_dir, &locks, &*driver, &domain, &spawned) {
        let _ = driver.kill_all(&mut domain, 0);
        return Err(Refusal::internal(why));
    }

    let mut sent_go = false;
    if let Some(mut go) = link.open(&mut spawned.child, gate_started) {
        if wait_for_hello(&mut go, &mut spawned, gate_started) {
            let tuple = spawned.root.to_record().to_json();
            sent_go = write_frame(&mut go, &json!({"type": "GO", "attemptId": watch.attempt_id, "envelopeDigest": watch.digest, "gateHostTuple": tuple})).is_ok();
        }
        if sent_go {
            watch_gate(&watch, &mut go, &*driver, &mut domain, &mut spawned);
        }
    }
    if !sent_go {
        // Without GO the gate runs nothing and leaves by itself; make sure.
        let _ = driver.kill_all(&mut domain, 0);
    }
    let _ = spawned.child.wait();

    // The domain must be empty before the lease goes: the gate normally
    // ended it; a best-effort driver may need one more sweep.
    if driver.is_empty(&mut domain) != DomainState::Empty {
        let _ = driver.kill_all(&mut domain, 0);
    }
    // The gate is gone: the cwd lease is released now, not after the steps.
    locks.release_cwd();

    finish(&envelope, &run_dir, &watch, locks, false, &TerminalEnd::default())
}

/// The gate is gone and its domain is empty: publish the receipt, run the
/// steps, close the attempt when every step has its receipt, report on stdout.
fn finish(envelope: &Value, run_dir: &Path, watch: &Watch, locks: os::Locks, not_started: bool, end: &TerminalEnd) -> Result<i32, Refusal> {
    let outcome = publish_receipt_with(envelope, run_dir, "supervisor", not_started, end).map_err(|why| Refusal::internal(format!("receipt.json not published: {why}")))?;
    let steps = crate::steps::run_steps(envelope, run_dir);
    let (result, pending) = match &steps {
        crate::steps::StepsOutcome::Done(ids) => {
            let closed = json!({"v": 1, "attemptId": watch.attempt_id, "closedBy": "supervisor", "steps": ids, "at": iso_utc_now()});
            serde_json::to_vec(&closed).map_err(std::io::Error::other).and_then(|b| publish_once(run_dir, "closed.json", &b)).map_err(|why| Refusal::internal(format!("closed.json not published: {why}")))?;
            ("closed", None)
        }
        other => {
            if let crate::steps::StepsOutcome::Retry { reason, .. } | crate::steps::StepsOutcome::Failed { reason, .. } = other {
                eprintln!("fgos internal supervise: step {} left open: {reason}", other.pending().unwrap_or("?"));
            }
            ("open", other.pending().map(String::from))
        }
    };
    let mut line = json!({"result": result, "outcome": outcome});
    if let Some(step) = pending {
        line["pendingStep"] = Value::String(step);
    }
    emit(line);
    drop(locks);
    Ok(0)
}

#[cfg(unix)]
fn supervise_terminal(envelope: &Value, run_dir: &Path, locks: os::Locks, watch: &Watch) -> Result<i32, Refusal> {
    terminal::run(envelope, run_dir, locks, watch)
}

#[cfg(not(unix))]
fn supervise_terminal(_envelope: &Value, _run_dir: &Path, _locks: os::Locks, _watch: &Watch) -> Result<i32, Refusal> {
    Err(Refusal { exit: EXIT_INTERNAL, code: "terminal-mode-unsupported", why: "the terminal launch mode has no driver on this platform".into() })
}

fn open_driver(envelope: &Value) -> Result<Box<dyn ContainmentDriver>, String> {
    let preferred = envelope["containment"]["preferred"].as_str().ok_or("containment.preferred missing")?;
    let bwrap = envelope["containment"]["bwrapPrefix"].as_array().and_then(|p| p.first()).and_then(Value::as_str).map(PathBuf::from);
    os::driver_for(preferred, bwrap)
}

/// `declare_domain` on the attempt lock, then `supervisor-binding.json`.
fn bind(envelope: &Value, run_dir: &Path, locks: &os::Locks, driver: &dyn ContainmentDriver, domain: &ContainmentDomain, spawned: &Spawned) -> Result<(), String> {
    let record = os::record_to_declare(domain.domain().ok_or("the driver returned no domain id")?);
    let kernel = driver.guarantee().level == GuaranteeLevel::Kernel;
    bind_record(envelope, run_dir, locks, &record, &spawned.root, kernel)
}

/// [`bind`] for a domain the caller already knows: record it on the lock, then publish the binding.
fn bind_record(envelope: &Value, run_dir: &Path, locks: &os::Locks, record: &fgos_process::Domain, gate: &facts::ProcTuple, kernel: bool) -> Result<(), String> {
    // The supervisor holds the attempt lock exclusively.
    let predecessor = fgos_holder_lock::predecessor::record_path(&run_dir.join("attempt.lock"));
    fgos_holder_lock::predecessor::declare(&predecessor, record).map_err(|e| format!("declare_domain: {e}"))?;
    locks.declare_on_lease(record).map_err(|e| format!("declare_domain on the cwd lease: {e}"))?;
    let declared = fgos_holder_lock::predecessor::domain_json(record);
    let me = facts::self_identity().ok_or("the supervisor's own identity is unreadable")?;
    let binding = json!({
        "v": 1,
        "attemptId": envelope["attemptId"],
        "envelopeDigest": envelope["digest"],
        "supervisor": me.to_record().to_json(),
        "gate": gate.to_record().to_json(),
        "domain": {"kind": declared["domainKind"], "id": declared["domainId"]},
        "guarantee": {
            "containment": if kernel { "kernel" } else { "best-effort" },
            "lock": "kernel",
        },
        "boundAt": iso_utc_now(),
    });
    publish_once(run_dir, "supervisor-binding.json", &serde_json::to_vec(&binding).map_err(|e| e.to_string())?).map_err(|e| format!("supervisor-binding.json: {e}"))?;
    Ok(())
}

/// `true` when the gate said HELLO; `false` when it left first or took too long.
fn wait_for_hello(go: &mut os::Go, spawned: &mut Spawned, since: Instant) -> bool {
    loop {
        if go.readable(TICK) {
            return read_frame(go).is_ok_and(|f| f["type"] == "HELLO");
        }
        if spawned.child.try_wait().ok().flatten().is_some() || since.elapsed() > HELLO_LIMIT {
            return false;
        }
    }
}

fn watch_gate(watch: &Watch, go: &mut os::Go, driver: &dyn ContainmentDriver, domain: &mut ContainmentDomain, spawned: &mut Spawned) {
    let started = Instant::now();
    let mut last_active = started;
    let mut tail = CaptureTail { offsets: [0, 0] };
    let mut last_beat: Option<Instant> = None;
    let mut stopped: Option<Instant> = None;
    let mut ended_domain = false;
    let gate = spawned.root.clone();
    let mut channel_open = true;
    let mut agent_bound = false;
    loop {
        let gate_gone = spawned.child.try_wait().ok().flatten().is_some();
        // A gate that leaves within a tick of its AGENT frame must not lose it.
        while channel_open && go.readable(Duration::ZERO) {
            match read_frame(go) {
                Ok(frame) if frame["type"] == "AGENT" && !agent_bound => {
                    agent_bound = true;
                    let body = json!({"v": 1, "attemptId": watch.attempt_id, "envelopeDigest": watch.digest, "agent": frame["tuple"], "at": iso_utc_now()});
                    if let Ok(bytes) = serde_json::to_vec(&body) {
                        let _ = publish_once(&watch.run_dir, "agent-binding.json", &bytes);
                    }
                }
                Ok(_) => {}
                // The gate closed or broke the channel: it still reports through gate-exit.json.
                Err(_) => channel_open = false,
            }
            if !gate_gone {
                break;
            }
        }
        if gate_gone {
            return;
        }
        if tail.active(watch) {
            last_active = Instant::now();
        }
        if last_beat.is_none_or(|at| at.elapsed() >= HEARTBEAT_EVERY) {
            last_beat = Some(Instant::now());
            let _ = write_atomic(&watch.run_dir, "supervisor-heartbeat.json", &json!({"v": 1, "attemptId": watch.attempt_id, "at": iso_utc_now(), "agentBound": agent_bound}));
        }
        if stopped.is_none() {
            let cause = if watch.cancel_requested() {
                Some("cancel")
            } else if watch.output_over_limit() {
                Some("output-limit")
            } else if watch.soft_deadline_passed() {
                Some("soft-deadline")
            } else if watch.idle.is_some_and(|idle| last_active.elapsed() >= idle) {
                Some("idle")
            } else {
                None
            };
            if let Some(cause) = cause {
                stopped = Some(Instant::now());
                request_stop(watch, go, &gate, cause);
            }
        } else if !ended_domain && stopped.is_some_and(|at| at.elapsed() >= watch.grace + GATE_STOP_SLACK) {
            // The gate outlived its own grace: end the whole domain.
            ended_domain = true;
            let _ = driver.kill_all(domain, 0);
        }
        std::thread::sleep(TICK);
    }
}

/// `stop-requested.json` first, so the gate can name the cause, then STOP on
/// the channel and the platform's own nudge to the gate (SIGTERM by identity on
/// Unix; Windows has none, the gate polls the file).
fn request_stop(watch: &Watch, go: &mut os::Go, gate: &facts::ProcTuple, cause: &str) {
    let body = json!({"v": 1, "attemptId": watch.attempt_id, "cause": cause, "at": iso_utc_now()});
    if let Ok(bytes) = serde_json::to_vec(&body) {
        let _ = publish_once(&watch.run_dir, "stop-requested.json", &bytes);
    }
    let _ = write_frame(go, &json!({"type": "STOP", "cause": cause}));
    os::nudge_gate(gate);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn outcome_follows_the_receipt_contract() {
        let exit = |by: &str| json!({"stoppedBy": by});
        assert_eq!(outcome_for(Some(&exit("agent")), false), "exited");
        for by in ["soft-deadline", "idle", "hard-ceiling"] {
            assert_eq!(outcome_for(Some(&exit(by)), false), "timeout");
        }
        assert_eq!(outcome_for(Some(&exit("cancel")), false), "cancelled");
        assert_eq!(outcome_for(Some(&exit("orphan")), true), "exited");
        assert_eq!(outcome_for(Some(&exit("orphan")), false), "gate-lost");
        assert_eq!(outcome_for(None, true), "gate-lost");
        let orphan = |cause: &str| json!({"stoppedBy": "orphan", "cause": cause});
        assert_eq!(outcome_for(Some(&orphan("abandoned-before-brief")), true), "abandoned-before-brief");
        assert_eq!(outcome_for(Some(&orphan("orphan-result")), true), "exited");
    }

    #[test]
    fn argv_needs_protocol_one_and_an_envelope() {
        let argv = |items: &[&str]| items.iter().map(|s| s.to_string()).collect::<Vec<_>>();
        assert_eq!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e.json"])).unwrap().envelope, PathBuf::from("/e.json"));
        assert_eq!(parse_args(&argv(&["--envelope", "/e"])), Err(crate::route::ArgsError::VersionMismatch));
        assert!(matches!(parse_args(&argv(&["--protocol", "1"])), Err(crate::route::ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e", "--x", "1"])), Err(crate::route::ArgsError::Usage(_))));
    }
}
