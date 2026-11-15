//! `fgos gateway start|stop|status`: the one door for the gateway's lifecycle as a detached background
//! process (`apps/fgos-gateway`), so nobody hand-rolls `nohup`, `tmux` or a unit file.
//!
//! The registry is `.fgos/gateway.json`, one object per project: the pid, the identity tuple the process
//! was observed with, the port, the start time, the log and the binary. Every decision about it is made
//! under the `gateway` lock of the holder-lock registry, which a `start` holds through a cold `cargo build`;
//! the kernel releases it when its holder dies, so there is no lease to outlast. A process is only ever
//! signalled while it is still the process the registry recorded.
//!
//! `start` builds the release binary, spawns it detached into its own log, waits for the log to say
//! `listening on` and only then writes the registry. `stop` signals by identity (TERM, then KILL, each with
//! its own window) and then seals what the Event Store still holds open, outside the lock and also when the
//! stop failed. `status` reads the registry, judges the process and asks `/v1/contract` over plain HTTP.
//!
//! Off Unix `start` is refused: the detached spawn exists only there. `stop` and `status` run everywhere.

use crate::invocation_doors::{EventStoreLifecycle, Lifecycle};
#[cfg(unix)]
use crate::legacy_exec::RECURSION_GUARD_VAR;
use fgos_config::detect::NoDetectors;
use fgos_config::machine;
use fgos_config::session::session_class;
use fgos_config::snapshot::SnapshotError;
use fgos_event_store::lifecycle::Policy;
use fgos_holder_lock::{Acquire, HoldersList, LockScope, Resource, ScopeError, Wait};
use fgos_host_runtime::{
    cli_args, CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl,
    JsonOutcome, OperationId, OperationProvider, OperationRequest, ProviderDescriptor,
    ProviderError, ProviderLifecycle, ProviderOutcome,
};
use fgos_process::control::{signal_by_identity, Signal, SignalOutcome};
use fgos_process::facts::{self, Observed, ProcTuple, Record, UnreadableCause, Verdict};
use fgos_process::ProcId;
use serde_json::{json, Map, Value};
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::ffi::OsString;
use std::future::Future;
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

/// The sub-verbs of `fgos gateway`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["start", "stop", "status"];

pub const START_OPERATION_ID: &str = "gateway.start";
pub const STOP_OPERATION_ID: &str = "gateway.stop";
pub const STATUS_OPERATION_ID: &str = "gateway.status";

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("gateway"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const START_DESCRIPTOR: ProviderDescriptor = descriptor(
    START_OPERATION_ID,
    "gateway.start.request",
    "gateway.start.outcome",
);
pub const STOP_DESCRIPTOR: ProviderDescriptor = descriptor(
    STOP_OPERATION_ID,
    "gateway.stop.request",
    "gateway.stop.outcome",
);
pub const STATUS_DESCRIPTOR: ProviderDescriptor = descriptor(
    STATUS_OPERATION_ID,
    "gateway.status.request",
    "gateway.status.outcome",
);

/// The registry file below the project's `.fgos`.
const REGISTRY_FILE: &str = "gateway.json";
/// The lock file below the project's `.fgos`, as the lock registry names it (`gateway`, rank 10).
const LOCK_NAME: &str = "gateway";
const LOCK_FILE: &str = "locks/gateway.lock";
/// The port the gateway binds without a configured one (the gateway's own default).
const DEFAULT_PORT: u64 = 4170;
/// How long a `start` or `stop` waits for the lock: a competing `start` may hold it through a cold build.
const LOCK_TIMEOUT_MS: u64 = 120_000;
/// How long a started gateway has to print `listening on`, and how often the log is read meanwhile.
const STARTUP_TIMEOUT: Duration = Duration::from_millis(30_000);
const STARTUP_POLL: Duration = Duration::from_millis(250);
/// The window each signal (TERM, then KILL) gets to take effect, and how often the process is judged meanwhile.
const STOP_TIMEOUT: Duration = Duration::from_millis(5_000);
const STOP_POLL: Duration = Duration::from_millis(100);
/// How long the reachability probe of `status` may take in all.
const PROBE_TIMEOUT: Duration = Duration::from_millis(3_000);
/// The line the gateway prints once it serves.
const LISTENING_MARKER: &str = "listening on";
/// The variables the gateway must not inherit: it is a long-lived process that itself calls `fgos` verbs
/// through the host, and a host started under a legacy payload carries the recursion guard, which would
/// refuse every one of those calls.
#[cfg(unix)]
const GATEWAY_ENV_REMOVE: [&str; 1] = [RECURSION_GUARD_VAR];
const START_UNSUPPORTED: &str = "gateway start is not available on this platform: the gateway starts as a detached background process, which only Linux and macOS support (gateway stop and gateway status work here)";

/// A refused gateway lifecycle call: the text the Node CLI printed, answered under the `validation` category.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GatewayControlError(String);

impl GatewayControlError {
    fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl std::fmt::Display for GatewayControlError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for GatewayControlError {}

type Answer = Result<Value, GatewayControlError>;

// ---------------------------------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------------------------------

fn registry_path(fgos_dir: &Path) -> PathBuf {
    fgos_dir.join(REGISTRY_FILE)
}

/// JavaScript's rendering of an optional JSON value inside a message: an absent field is `undefined`.
fn js_text(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_owned(),
        Some(Value::String(text)) => text.clone(),
        Some(other) => other.to_string(),
    }
}

/// Whether a parsed registry names an entry at all: `null` and the other falsy JSON values are "not running".
fn is_entry(value: &Value) -> bool {
    match value {
        Value::Null | Value::Bool(false) => false,
        Value::Number(number) => number.as_f64() != Some(0.0),
        Value::String(text) => !text.is_empty(),
        _ => true,
    }
}

/// A missing file is "not running" (a fresh project, or already stopped). A file that is there and does not
/// parse fails closed: it is never overwritten over unknown state.
fn read_registry(fgos_dir: &Path) -> Result<Option<Value>, GatewayControlError> {
    let path = registry_path(fgos_dir);
    let bytes = match std::fs::read(&path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => {
            return Err(GatewayControlError::new(format!(
                "reading gateway.json at \"{}\" failed: {error}",
                path.display()
            )))
        }
    };
    let parsed =
        serde_json::from_str::<Value>(&String::from_utf8_lossy(&bytes)).map_err(|error| {
            GatewayControlError::new(format!(
                "gateway.json at \"{}\" is corrupt (not valid JSON): {error}",
                path.display()
            ))
        })?;
    Ok(is_entry(&parsed).then_some(parsed))
}

/// Replaces the registry atomically (`Some`), or removes it (`None`).
fn write_registry(fgos_dir: &Path, entry: Option<&Value>) -> Result<(), GatewayControlError> {
    let Some(entry) = entry else {
        return match std::fs::remove_file(registry_path(fgos_dir)) {
            Err(error) if error.kind() != std::io::ErrorKind::NotFound => {
                Err(GatewayControlError::new(error.to_string()))
            }
            _ => Ok(()),
        };
    };
    let text = serde_json::to_string_pretty(entry)
        .map_err(|error| GatewayControlError::new(error.to_string()))?;
    fgos_durable_file::replace_durably_with_mode(
        fgos_dir,
        REGISTRY_FILE,
        format!("{text}\n").as_bytes(),
        0o644,
    )
    .map(drop)
    .map_err(|error| GatewayControlError::new(error.to_string()))
}

/// The identity tuple of an entry: its `record`, or, for an old entry written before identities were
/// recorded, the entry itself (a bare pid, which judges `unknown` while the process lives).
fn record_of(entry: &Value) -> Record {
    Record::from_json(
        entry
            .get("record")
            .filter(|r| !r.is_null())
            .unwrap_or(entry),
    )
}

fn judge_entry(entry: &Value) -> Verdict {
    facts::judge_here(&record_of(entry))
}

// ---------------------------------------------------------------------------------------------------
// The lock
// ---------------------------------------------------------------------------------------------------

/// The held `gateway` lock; dropping it releases the lock.
#[derive(Debug)]
pub struct GatewayLock {
    _scope: LockScope<'static>,
}

fn lock_path(fgos_dir: &Path) -> PathBuf {
    fgos_dir.join(LOCK_FILE)
}

/// Waits for the `gateway` lock for at most `timeout_ms`. A holder that dies releases it at once.
pub fn acquire_gateway_lock(
    fgos_dir: &Path,
    timeout_ms: u64,
) -> Result<GatewayLock, GatewayControlError> {
    let fgos_dir = std::path::absolute(fgos_dir).map_err(|error| {
        GatewayControlError::new(format!(
            "resolving \"{}\" failed: {error}",
            fgos_dir.display()
        ))
    })?;
    let mut scope = LockScope::seeded(Vec::new())
        .map_err(|error| GatewayControlError::new(error.to_string()))?;
    let params = BTreeMap::from([(
        "fgosDir".to_owned(),
        fgos_dir.to_string_lossy().into_owned(),
    )]);
    let acquired = scope
        .acquire(LOCK_NAME, &params, Wait::Ms(timeout_ms))
        .map(drop);
    match acquired {
        Ok(()) => Ok(GatewayLock { _scope: scope }),
        Err(ScopeError::Acquire(answer)) => Err(not_acquired(&fgos_dir, timeout_ms, *answer)),
        Err(other) => Err(GatewayControlError::new(other.to_string())),
    }
}

fn not_acquired(fgos_dir: &Path, timeout_ms: u64, answer: Acquire) -> GatewayControlError {
    let path = lock_path(fgos_dir);
    match answer {
        Acquire::Timeout { .. } => {
            let holder = match fgos_holder_lock::holders(&Resource::new(LOCK_NAME, &path)) {
                Ok(HoldersList::List(holders)) => holders.first().map(|h| h.pid),
                _ => None,
            };
            GatewayControlError::new(format!(
                "timed out acquiring gateway.lock at \"{}\" after {timeout_ms}ms{}",
                path.display(),
                holder.map_or(String::new(), |pid| format!(" (held by pid {pid})"))
            ))
        }
        Acquire::Held { reason, .. } => GatewayControlError::new(format!(
            "lock-predecessor-domain-not-empty: gateway: the previous holder's domain is still not empty ({})",
            reason.as_str()
        )),
        Acquire::Unavailable { reason, detail } => GatewayControlError::new(format!(
            "lock-driver-unavailable: {}: {detail}",
            reason.as_str()
        )),
        Acquire::Acquired(_) => GatewayControlError::new("the gateway lock was acquired twice"),
    }
}

// ---------------------------------------------------------------------------------------------------
// Process identity
// ---------------------------------------------------------------------------------------------------

/// The identity of a live process as the registry records it.
fn live_record(pid: u32, start_time: String) -> Value {
    ProcTuple {
        host: facts::host(),
        boot_id: facts::boot_id(),
        pid_ns: facts::pid_ns().id,
        pid: ProcId(pid),
        start_time,
    }
    .to_record()
    .to_json()
}

/// The tuple a record names, by the judge's own rules for the fields it lacks.
fn tuple_of(record: &Record) -> Option<ProcTuple> {
    let observer = facts::observer();
    let pid_ns = match &record.pid_ns {
        Some(namespace) => namespace.clone(),
        None if observer.in_init_pid_ns => observer.pid_ns.clone(),
        None => return None,
    };
    Some(ProcTuple {
        host: record.host.clone().unwrap_or(observer.host),
        boot_id: record.boot_id.clone(),
        pid_ns,
        pid: record.pid?,
        start_time: record.start_time.clone()?,
    })
}

/// What a signal to the recorded gateway came to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Sent {
    Delivered,
    /// Nothing was sent: the process is no longer the recorded one.
    Gone,
    /// This platform cannot send that signal.
    Unsupported,
}

/// Sends `signal` to the recorded gateway only while it is still that process.
fn signal_gateway(entry: &Value, signal: Signal) -> Result<Sent, GatewayControlError> {
    let outcome = match tuple_of(&record_of(entry)) {
        Some(tuple) => signal_by_identity(&tuple, signal),
        None => SignalOutcome::IdentityUnknown,
    };
    let refused = match outcome {
        SignalOutcome::Sent => return Ok(Sent::Delivered),
        SignalOutcome::Unsupported => return Ok(Sent::Unsupported),
        SignalOutcome::IdentityMismatch | SignalOutcome::NotFound => return Ok(Sent::Gone),
        SignalOutcome::IdentityUnknown => "identity-unknown",
        SignalOutcome::Denied => "denied",
        SignalOutcome::Failed(_) => "failed",
    };
    let name = match signal {
        Signal::Term => "term",
        Signal::Kill => "kill",
        Signal::Int => "int",
    };
    Err(GatewayControlError::new(format!(
        "sending {name} to gateway pid {} failed: {refused}",
        js_text(entry.get("pid"))
    )))
}

/// Judges `entry` until it is no longer alive or `deadline` passes; the verdict it ended on.
fn wait_until_dead_or_deadline(entry: &Value, deadline: Instant) -> Verdict {
    loop {
        let verdict = judge_entry(entry);
        if verdict != Verdict::Alive || Instant::now() >= deadline {
            return verdict;
        }
        std::thread::sleep(STOP_POLL);
    }
}

// ---------------------------------------------------------------------------------------------------
// start
// ---------------------------------------------------------------------------------------------------

/// What `start` needs from its caller: the release build of the crate at the directory it names (the binary
/// lands at `release_binary_path`), and the port the gateway binds.
pub struct StartParts<'a> {
    pub build: &'a dyn Fn(&Path) -> Result<(), GatewayControlError>,
    pub port: &'a dyn Fn() -> Result<u64, GatewayControlError>,
}

fn gateway_crate_dir(repo_root: &Path) -> PathBuf {
    repo_root.join("apps").join("fgos-gateway")
}

/// The arguments of the release build. `--locked`: a start never rewrites the tracked lock of the crate.
const BUILD_ARGS: [&str; 5] = ["build", "--release", "--locked", "--bin", "fgos-gateway"];

/// Where the release build of the crate at `gateway_dir` puts the gateway binary.
fn release_binary_path(gateway_dir: &Path) -> PathBuf {
    gateway_dir
        .join("target")
        .join("release")
        .join("fgos-gateway")
}

/// The release build of the crate at `gateway_dir`. Cargo's own incremental cache makes a build with nothing
/// to do fast.
fn cargo_build_command(gateway_dir: &Path) -> std::process::Command {
    let mut command = std::process::Command::new("cargo");
    command
        .args(BUILD_ARGS)
        .current_dir(gateway_dir)
        .stdin(std::process::Stdio::null());
    command
}

/// Runs a build command to its end: a refusal carries cargo's own stderr.
fn run_build(command: &mut std::process::Command) -> Result<(), GatewayControlError> {
    let output = command.output().map_err(|error| {
        GatewayControlError::new(format!(
            "building the release binary failed: could not run {}: {error}",
            command.get_program().to_string_lossy()
        ))
    })?;
    if output.status.success() {
        return Ok(());
    }
    Err(GatewayControlError::new(format!(
        "building the release binary failed: {}",
        String::from_utf8_lossy(&output.stderr)
    )))
}

/// Builds the release binary of the crate at `gateway_dir` (the answer of the `build` part of a `start`).
pub fn build_release(gateway_dir: &Path) -> Result<(), GatewayControlError> {
    run_build(&mut cargo_build_command(gateway_dir))
}

/// The port the gateway would bind, read from the machine config the gateway itself reads (`gateway.port` of
/// the effective machine view). A machine config the door refuses names the documented default, never a guess.
pub fn configured_port() -> Result<u64, GatewayControlError> {
    let lookup = |key: &str| std::env::var(key).ok();
    let global = machine::global_dir(lookup)
        .ok_or_else(|| GatewayControlError::new(machine::home_unset_message()))?;
    let context = machine::context(&NoDetectors)
        .map_err(|error| GatewayControlError::new(error.to_string()))?;
    match machine::snapshot(&context, &global, session_class(lookup)) {
        Ok(snapshot) => Ok(snapshot.value["gateway"]["port"]
            .as_u64()
            .filter(|port| *port > 0)
            .unwrap_or(DEFAULT_PORT)),
        Err(SnapshotError::Refused(_)) => Ok(DEFAULT_PORT),
        Err(SnapshotError::Io(error)) => Err(GatewayControlError::new(format!(
            "reading the machine config failed: {error}"
        ))),
    }
}

#[cfg(unix)]
fn spawn_gateway(binary: &Path, cwd: &Path, log: &Path) -> std::io::Result<u32> {
    fgos_process::mapped::spawn_detached(
        &[binary.as_os_str().to_owned()],
        cwd,
        &[],
        &GATEWAY_ENV_REMOVE,
        Some(log),
    )
}

#[cfg(not(unix))]
fn spawn_gateway(_binary: &Path, _cwd: &Path, _log: &Path) -> std::io::Result<u32> {
    Err(std::io::Error::other(START_UNSUPPORTED))
}

fn now_iso() -> String {
    fgos_host_runtime::civil_time::format_system_time_utc(SystemTime::now())
}

fn log_tail(log: &Path) -> String {
    let content = std::fs::read(log)
        .map(|bytes| String::from_utf8_lossy(&bytes).into_owned())
        .unwrap_or_default();
    let lines: Vec<&str> = content.split('\n').collect();
    lines[lines.len().saturating_sub(20)..].join("\n")
}

/// Starts the gateway as a detached background process, under the gateway lock for the whole
/// check-build-spawn-confirm sequence. Refuses, spawning nothing, while the registry names a live process.
/// Returns the registry entry it wrote once the log shows the gateway serving.
pub fn start_gateway(repo_root: &Path, fgos_dir: &Path, parts: &StartParts) -> Answer {
    if !cfg!(unix) {
        return Err(GatewayControlError::new(START_UNSUPPORTED));
    }
    let _lock = acquire_gateway_lock(fgos_dir, LOCK_TIMEOUT_MS)?;
    if let Some(existing) = read_registry(fgos_dir)? {
        let pid = js_text(existing.get("pid"));
        match judge_entry(&existing) {
            Verdict::Unknown => {
                return Err(GatewayControlError::new(format!(
                    "gateway-start-identity-unknown: the registry names pid {pid} without a verifiable identity; confirm it is not a gateway, then delete {}",
                    registry_path(fgos_dir).display()
                )))
            }
            Verdict::Alive => {
                return Err(GatewayControlError::new(format!(
                    "gateway is already running (pid {pid}, port {}) — stop it first with \"fgos gateway stop\" if you meant to restart it",
                    js_text(existing.get("port"))
                )))
            }
            Verdict::Dead => {}
        }
    }
    let gateway_dir = gateway_crate_dir(repo_root);
    if !gateway_dir.exists() {
        return Err(GatewayControlError::new(format!(
            "no apps/fgos-gateway/ directory found at \"{}\" — this repo has no gateway to start",
            gateway_dir.display()
        )));
    }
    (parts.build)(&gateway_dir)?;
    let binary = release_binary_path(&gateway_dir);
    if !binary.exists() {
        return Err(GatewayControlError::new(format!(
            "cargo build reported success but no binary was found at \"{}\"",
            binary.display()
        )));
    }
    let port = (parts.port)()?;

    let logs_dir = fgos_dir.join("logs");
    std::fs::create_dir_all(&logs_dir).map_err(|error| {
        GatewayControlError::new(format!(
            "creating \"{}\" failed: {error}",
            logs_dir.display()
        ))
    })?;
    // One log per start: an old attempt's lines are never mistaken for this one's.
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_millis());
    let log_path = logs_dir.join(format!("gateway-{millis}-{}.log", std::process::id()));
    let pid = spawn_gateway(&binary, &gateway_dir, &log_path).map_err(|error| {
        GatewayControlError::new(format!(
            "starting \"{}\" failed: {error}; see \"{}\"",
            binary.display(),
            log_path.display()
        ))
    })?;

    // A child that is absent or already a zombie here is the immediate exit named in the loop below.
    let record = match facts::observe(ProcId(pid)) {
        Observed::Live { start_time } => Some(live_record(pid, start_time)),
        Observed::Absent | Observed::Zombie => None,
        Observed::Unreadable(cause) => {
            let cause = match cause {
                UnreadableCause::DriverMissing => "driver-missing",
                UnreadableCause::Permission => "permission",
                UnreadableCause::Timeout => "timeout",
            };
            return Err(GatewayControlError::new(format!(
                "gateway-start-identity-unreadable: pid {pid} cannot be observed ({cause}); see \"{}\"",
                log_path.display()
            )));
        }
    };
    let mut entry = Map::new();
    entry.insert("pid".into(), pid.into());
    entry.insert("record".into(), record.clone().unwrap_or(Value::Null));
    entry.insert("port".into(), port.into());
    entry.insert("startedAt".into(), now_iso().into());
    entry.insert(
        "logPath".into(),
        log_path.to_string_lossy().into_owned().into(),
    );
    entry.insert(
        "binaryPath".into(),
        binary.to_string_lossy().into_owned().into(),
    );

    // A pid exists the instant the spawn returns even when the process panics a moment later (a missing
    // token, a port in use), so the process printing its own `listening on` line is what confirms startup.
    let deadline = Instant::now() + STARTUP_TIMEOUT;
    loop {
        let alive = record
            .as_ref()
            .is_some_and(|record| facts::judge_here(&Record::from_json(record)) == Verdict::Alive);
        if !alive {
            return Err(GatewayControlError::new(format!(
                "gateway process exited immediately after starting — see \"{}\" for the real error:\n{}",
                log_path.display(),
                log_tail(&log_path)
            )));
        }
        let content = std::fs::read(&log_path).unwrap_or_default();
        if String::from_utf8_lossy(&content).contains(LISTENING_MARKER) {
            break;
        }
        if Instant::now() >= deadline {
            return Err(GatewayControlError::new(format!(
                "gateway did not report \"{LISTENING_MARKER}\" within {}ms — see \"{}\"",
                STARTUP_TIMEOUT.as_millis(),
                log_path.display()
            )));
        }
        std::thread::sleep(STARTUP_POLL);
    }
    let entry = Value::Object(entry);
    write_registry(fgos_dir, Some(&entry))?;
    Ok(entry)
}

// ---------------------------------------------------------------------------------------------------
// stop
// ---------------------------------------------------------------------------------------------------

/// Stops the running gateway under the gateway lock, then seals what the Event Store still holds open
/// (a clean shutdown of a writer), outside the lock and also when the stop failed. Sends TERM and waits for
/// the process to be gone, escalating to KILL once with a window of its own, before it clears the registry:
/// a `status` right after sees the settled state. Nothing running, or a recorded process that is already
/// gone, is `alreadyStopped`, not an error.
pub fn stop_gateway(fgos_dir: &Path, lifecycle: &dyn Lifecycle) -> Answer {
    let lock = acquire_gateway_lock(fgos_dir, LOCK_TIMEOUT_MS)?;
    let answer = stop_locked(fgos_dir);
    drop(lock);
    if let (true, Some(root)) = (lifecycle.platform_supported(), fgos_dir.parent()) {
        // A trigger never fails the stop: the events are durable and the next trigger retries.
        let _ = lifecycle.trigger(
            root,
            Policy {
                shutdown: true,
                ..Policy::default()
            },
        );
    }
    answer
}

fn stop_locked(fgos_dir: &Path) -> Answer {
    let Some(entry) = read_registry(fgos_dir)? else {
        return Ok(json!({ "alreadyStopped": true }));
    };
    let pid = entry.get("pid");
    let first = judge_entry(&entry);
    if first == Verdict::Dead {
        write_registry(fgos_dir, None)?;
        return Ok(with_pid(json!({ "alreadyStopped": true }), pid));
    }
    if first == Verdict::Unknown {
        return Err(GatewayControlError::new(format!(
            "gateway-stop-identity-unknown: the registry names pid {} without a verifiable identity; nothing was signalled. Confirm it is not a gateway, then delete {}",
            js_text(pid),
            registry_path(fgos_dir).display()
        )));
    }
    let log_path = js_text(entry.get("logPath"));

    // Each signal gets its own full window: a signal never takes effect instantly, and judging only once
    // right after KILL would treat a brief kernel delay as "alive forever". Only a dead verdict clears the
    // registry.
    let settle = |signal: Signal| -> Result<Verdict, GatewayControlError> {
        Ok(match signal_gateway(&entry, signal)? {
            Sent::Unsupported => Verdict::Alive,
            Sent::Gone => judge_entry(&entry),
            Sent::Delivered => wait_until_dead_or_deadline(&entry, Instant::now() + STOP_TIMEOUT),
        })
    };
    let mut verdict = settle(Signal::Term)?;
    if verdict == Verdict::Alive {
        verdict = settle(Signal::Kill)?;
    }
    match verdict {
        Verdict::Unknown => Err(GatewayControlError::new(format!(
            "gateway-stop-unresolved: pid {} can no longer be judged after the signal; see {log_path}, then delete {} once it is gone",
            js_text(pid),
            registry_path(fgos_dir).display()
        ))),
        Verdict::Alive => Err(GatewayControlError::new(format!(
            "gateway-stop-failed: pid {} survived SIGKILL; see {log_path}",
            js_text(pid)
        ))),
        Verdict::Dead => {
            write_registry(fgos_dir, None)?;
            let mut stopped = Map::new();
            stopped.insert("alreadyStopped".into(), false.into());
            for key in ["pid", "port"] {
                if let Some(value) = entry.get(key) {
                    stopped.insert(key.into(), value.clone());
                }
            }
            Ok(Value::Object(stopped))
        }
    }
}

/// `answer` with `pid` appended when the registry carried one.
fn with_pid(mut answer: Value, pid: Option<&Value>) -> Value {
    if let (Some(pid), Some(object)) = (pid, answer.as_object_mut()) {
        object.insert("pid".into(), pid.clone());
    }
    answer
}

// ---------------------------------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------------------------------

/// Whether `GET /v1/contract` (the one endpoint that needs no credential) of the gateway on `port` answers
/// with a success status within `PROBE_TIMEOUT`. A gateway that is alive but hung is not reachable.
fn reachable(port: u16) -> bool {
    let deadline = Instant::now() + PROBE_TIMEOUT;
    let remaining = || {
        deadline
            .saturating_duration_since(Instant::now())
            .max(Duration::from_millis(1))
    };
    let address = SocketAddr::from(([127, 0, 0, 1], port));
    let Ok(mut stream) = TcpStream::connect_timeout(&address, PROBE_TIMEOUT) else {
        return false;
    };
    let request = format!(
        "GET /v1/contract HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\nAccept: */*\r\n\r\n"
    );
    if stream.set_write_timeout(Some(remaining())).is_err()
        || stream.write_all(request.as_bytes()).is_err()
    {
        return false;
    }
    // The status line is the answer; the body is never read.
    let mut head = Vec::new();
    let mut chunk = [0u8; 256];
    while !head.contains(&b'\n') && head.len() < 1024 {
        if Instant::now() >= deadline || stream.set_read_timeout(Some(remaining())).is_err() {
            return false;
        }
        match stream.read(&mut chunk) {
            Ok(0) | Err(_) => break,
            Ok(read) => head.extend_from_slice(&chunk[..read]),
        }
    }
    let line = String::from_utf8_lossy(&head);
    let line = line.lines().next().unwrap_or_default();
    let mut words = line.split_whitespace();
    matches!(
        (words.next(), words.next().and_then(|s| s.parse::<u16>().ok())),
        (Some(version), Some(200..=299)) if version.starts_with("HTTP/")
    )
}

/// Read-only status: the registry, the real liveness of its process, and the real reachability of the
/// gateway, never a report from the registry alone, which goes stale the moment the process crashes.
pub fn gateway_status(fgos_dir: &Path) -> Answer {
    let Some(entry) = read_registry(fgos_dir)? else {
        return Ok(not_running());
    };
    let mut answer = Map::new();
    let copy = |answer: &mut Map<String, Value>, keys: &[&str]| {
        for key in keys {
            if let Some(value) = entry.get(*key) {
                answer.insert((*key).into(), value.clone());
            }
        }
    };
    match judge_entry(&entry) {
        Verdict::Dead => {
            answer.insert("running".into(), false.into());
            answer.insert("reachable".into(), false.into());
            copy(&mut answer, &["pid", "port"]);
            answer.insert("staleRegistry".into(), true.into());
        }
        Verdict::Unknown => {
            answer.insert("running".into(), Value::Null);
            answer.insert("reachable".into(), false.into());
            copy(&mut answer, &["pid", "port"]);
            answer.insert("staleRegistry".into(), false.into());
            answer.insert("identity".into(), "unknown".into());
        }
        Verdict::Alive => {
            let up = entry
                .get("port")
                .and_then(Value::as_u64)
                .and_then(|port| u16::try_from(port).ok())
                .is_some_and(reachable);
            answer.insert("running".into(), true.into());
            answer.insert("reachable".into(), up.into());
            copy(&mut answer, &["pid", "port", "startedAt", "logPath"]);
        }
    }
    Ok(Value::Object(answer))
}

fn not_running() -> Value {
    json!({ "running": false, "reachable": false })
}

// ---------------------------------------------------------------------------------------------------
// The host seam: request, projection, provider
// ---------------------------------------------------------------------------------------------------

/// Which lifecycle call was asked for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Sub {
    Start,
    Stop,
    Status,
}

impl Sub {
    fn named(word: &str) -> Option<Self> {
        match word {
            "start" => Some(Self::Start),
            "stop" => Some(Self::Stop),
            "status" => Some(Self::Status),
            _ => None,
        }
    }

    /// The operation this sub-verb runs.
    pub fn operation_id(self) -> &'static str {
        match self {
            Self::Start => START_OPERATION_ID,
            Self::Stop => STOP_OPERATION_ID,
            Self::Status => STATUS_OPERATION_ID,
        }
    }
}

/// One `fgos gateway` invocation: the sub-verb and the project the doors resolved, or why there is none.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GatewayRequest {
    pub sub: Sub,
    pub project: Result<PathBuf, String>,
}

/// `fgos gateway <start|stop|status>` read through the shared parser only: the sub-verb is the first
/// positional. The doors have already refused a missing or unknown one and every unknown flag.
pub fn project_gateway_request(
    args: &[OsString],
    project: Result<PathBuf, String>,
) -> Result<GatewayRequest, CategorisedRefusal> {
    let parsed = cli_args::parse_args(args.get(1..).unwrap_or_default()).unwrap_or_default();
    let word = parsed
        .positional
        .first()
        .map(String::as_str)
        .unwrap_or_default();
    let sub = Sub::named(word).ok_or_else(|| {
        CategorisedRefusal::new(
            "validation",
            format!(
                "unknown gateway subcommand \"{word}\". Available: {}",
                AVAILABLE_SUBCOMMANDS.join(", ")
            ),
        )
    })?;
    Ok(GatewayRequest { sub, project })
}

/// Serves one request: the lifecycle call against the project's `.fgos`. Where no project was found there is
/// no registry, so `status` and `stop` answer "not running" without creating anything, and `start` refuses.
fn serve(request: &GatewayRequest, lifecycle: &dyn Lifecycle) -> Answer {
    let root = match &request.project {
        Ok(root) => root,
        Err(why) => {
            return match request.sub {
                Sub::Status => Ok(not_running()),
                Sub::Stop => Ok(json!({ "alreadyStopped": true })),
                Sub::Start => Err(GatewayControlError::new(why.clone())),
            }
        }
    };
    let fgos_dir = root.join(".fgos");
    match request.sub {
        Sub::Start => start_gateway(
            root,
            &fgos_dir,
            &StartParts {
                build: &build_release,
                port: &configured_port,
            },
        ),
        Sub::Stop => stop_gateway(&fgos_dir, lifecycle),
        Sub::Status => gateway_status(&fgos_dir),
    }
}

/// The provider behind the three gateway operations.
pub struct GatewayProvider {
    descriptor: ProviderDescriptor,
}

impl GatewayProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for GatewayProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{}.invoked", self.descriptor.operation_id));
            let request = request
                .input
                .downcast_ref::<GatewayRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not GatewayRequest".into())
                })?;
            let output: Box<dyn std::any::Any + Send> = match serve(request, &EventStoreLifecycle) {
                Ok(data) => Box::new(JsonOutcome(data)),
                Err(error) => Box::new(CategorisedRefusal::new("validation", error.0)),
            };
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                output,
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;
    use std::sync::atomic::{AtomicU32, AtomicUsize, Ordering};

    fn scratch() -> PathBuf {
        static NEXT: AtomicU32 = AtomicU32::new(0);
        let dir = std::env::temp_dir().join(format!(
            "fgos-gateway-control-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(dir.join(".fgos")).unwrap();
        dir
    }

    fn write_entry(root: &Path, entry: &Value) {
        std::fs::write(root.join(".fgos").join(REGISTRY_FILE), entry.to_string()).unwrap();
    }

    fn registry_exists(root: &Path) -> bool {
        root.join(".fgos").join(REGISTRY_FILE).exists()
    }

    /// A lifecycle that records what the stop asked of it, and whether the gateway lock was free then.
    struct Recorder {
        supported: bool,
        calls: RefCell<Vec<(PathBuf, Policy, bool)>>,
        lock_path: PathBuf,
    }

    impl Recorder {
        fn new(root: &Path) -> Self {
            Self {
                supported: true,
                calls: RefCell::new(Vec::new()),
                lock_path: root.join(".fgos").join(LOCK_FILE),
            }
        }
    }

    impl Lifecycle for Recorder {
        fn platform_supported(&self) -> bool {
            self.supported
        }
        fn trigger(&self, root: &Path, policy: Policy) -> Option<String> {
            let free = matches!(
                fgos_holder_lock::probe(&Resource::new(LOCK_NAME, &self.lock_path)),
                Ok(fgos_holder_lock::Probe::Free)
            );
            self.calls
                .borrow_mut()
                .push((root.to_path_buf(), policy, free));
            None
        }
    }

    fn seal_only() -> Policy {
        Policy {
            shutdown: true,
            ..Policy::default()
        }
    }

    // ---- registry and status ------------------------------------------------------------------

    #[test]
    fn status_with_no_registry_is_not_running() {
        let root = scratch();
        assert_eq!(
            gateway_status(&root.join(".fgos")).unwrap(),
            json!({"running": false, "reachable": false})
        );
    }

    #[test]
    fn a_registry_that_does_not_parse_fails_closed_and_is_kept() {
        let root = scratch();
        let path = root.join(".fgos").join(REGISTRY_FILE);
        std::fs::write(&path, "{not json").unwrap();
        let message = gateway_status(&root.join(".fgos")).unwrap_err().to_string();
        assert!(
            message.starts_with(&format!(
                "gateway.json at \"{}\" is corrupt (not valid JSON): ",
                path.display()
            )),
            "{message}"
        );
        assert!(stop_gateway(&root.join(".fgos"), &Recorder::new(&root)).is_err());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "{not json");
    }

    #[test]
    fn a_registry_that_holds_a_falsy_value_means_nothing_is_running() {
        let root = scratch();
        for text in ["null", "false", "0", "\"\""] {
            std::fs::write(root.join(".fgos").join(REGISTRY_FILE), text).unwrap();
            assert_eq!(
                gateway_status(&root.join(".fgos")).unwrap(),
                not_running(),
                "{text}"
            );
        }
    }

    #[test]
    fn a_recorded_process_that_is_gone_is_a_stale_registry() {
        let root = scratch();
        let dead = dead_record();
        write_entry(
            &root,
            &json!({"pid": dead["pid"], "record": dead, "port": 4170, "startedAt": "2026-01-01T00:00:00.000Z", "logPath": "/dev/null"}),
        );
        assert_eq!(
            gateway_status(&root.join(".fgos")).unwrap(),
            json!({"running": false, "reachable": false, "pid": dead["pid"], "port": 4170, "staleRegistry": true})
        );
    }

    /// A pid-only entry has no start time, so it cannot say which process it names.
    #[cfg(unix)]
    #[test]
    fn an_entry_with_no_verifiable_identity_is_never_signalled_and_every_call_refuses_by_name() {
        let root = scratch();
        let child = throwaway(None);
        write_entry(
            &root,
            &json!({"pid": child.pid, "port": 4170, "startedAt": "1999-01-01T00:00:00.000Z", "logPath": "/dev/null"}),
        );
        let fgos = root.join(".fgos");
        assert_eq!(
            gateway_status(&fgos).unwrap(),
            json!({"running": null, "reachable": false, "pid": child.pid, "port": 4170, "staleRegistry": false, "identity": "unknown"})
        );
        let stop = stop_gateway(&fgos, &Recorder::new(&root)).unwrap_err();
        assert!(stop
            .to_string()
            .starts_with("gateway-stop-identity-unknown:"));
        let start = start_gateway(&root, &fgos, &never_built()).unwrap_err();
        assert!(start
            .to_string()
            .starts_with("gateway-start-identity-unknown:"));
        assert!(
            child.alive(),
            "the unrelated process must not receive any signal"
        );
        assert!(registry_exists(&root), "an unjudgeable entry is kept");
    }

    #[cfg(unix)]
    #[test]
    fn a_live_process_whose_port_serves_the_contract_is_running_and_reachable() {
        let root = scratch();
        let child = throwaway(None);
        let port = serve_contract("200 OK");
        write_entry(&root, &live_entry(&child, port));
        let status = gateway_status(&root.join(".fgos")).unwrap();
        assert_eq!(status["running"], true);
        assert_eq!(status["reachable"], true);
        assert_eq!(status["pid"], child.pid);
        assert_eq!(status["port"], port);
        assert_eq!(status["startedAt"], "2026-01-01T00:00:00.000Z");
        assert_eq!(status["logPath"], "/dev/null");
    }

    #[cfg(unix)]
    #[test]
    fn a_live_process_with_nothing_listening_or_a_failing_answer_is_running_but_not_reachable() {
        let root = scratch();
        let child = throwaway(None);
        let closed = {
            let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
            u64::from(listener.local_addr().unwrap().port())
        };
        write_entry(&root, &live_entry(&child, closed));
        let status = gateway_status(&root.join(".fgos")).unwrap();
        assert_eq!(
            (status["running"].clone(), status["reachable"].clone()),
            (json!(true), json!(false))
        );
        write_entry(
            &root,
            &live_entry(&child, serve_contract("500 Internal Server Error")),
        );
        assert_eq!(
            gateway_status(&root.join(".fgos")).unwrap()["reachable"],
            false
        );
    }

    /// A gateway that is alive but hung must still make `status` return, bounded by the probe timeout.
    #[cfg(unix)]
    #[test]
    fn a_hung_gateway_makes_status_return_within_the_probe_timeout() {
        let root = scratch();
        let child = throwaway(None);
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        write_entry(&root, &live_entry(&child, u64::from(port)));
        let started = Instant::now();
        let status = gateway_status(&root.join(".fgos")).unwrap();
        assert_eq!(status["reachable"], false);
        assert!(started.elapsed() < PROBE_TIMEOUT + Duration::from_secs(2));
        drop(listener);
    }

    // ---- stop ---------------------------------------------------------------------------------

    #[test]
    fn stop_with_no_registry_is_already_stopped_and_seals_what_is_open() {
        let root = scratch();
        let recorder = Recorder::new(&root);
        assert_eq!(
            stop_gateway(&root.join(".fgos"), &recorder).unwrap(),
            json!({"alreadyStopped": true})
        );
        assert_eq!(
            *recorder.calls.borrow(),
            vec![(root.clone(), seal_only(), true)],
            "one shutdown trigger for the project, nothing else, after the lock was released"
        );
    }

    #[test]
    fn the_shutdown_seal_also_runs_when_the_stop_failed_and_never_where_the_store_does_not_run() {
        let root = scratch();
        let fgos = root.join(".fgos");
        std::fs::write(fgos.join(REGISTRY_FILE), "{not json").unwrap();
        let recorder = Recorder::new(&root);
        assert!(stop_gateway(&fgos, &recorder).is_err());
        assert_eq!(
            *recorder.calls.borrow(),
            vec![(root.clone(), seal_only(), true)]
        );
        let mut elsewhere = Recorder::new(&root);
        elsewhere.supported = false;
        assert!(stop_gateway(&fgos, &elsewhere).is_err());
        assert!(elsewhere.calls.borrow().is_empty());
    }

    #[test]
    fn a_dead_process_is_cleared_and_reported_already_stopped_with_its_pid() {
        let root = scratch();
        let dead = dead_record();
        write_entry(
            &root,
            &json!({"pid": dead["pid"], "record": dead, "port": 4170}),
        );
        let answer = stop_gateway(&root.join(".fgos"), &Recorder::new(&root)).unwrap();
        assert_eq!(answer, json!({"alreadyStopped": true, "pid": dead["pid"]}));
        assert!(!registry_exists(&root));
    }

    #[cfg(unix)]
    #[test]
    fn a_live_process_is_sent_term_and_the_registry_is_cleared() {
        let root = scratch();
        let child = throwaway(None);
        write_entry(&root, &live_entry(&child, 4170));
        let answer = stop_gateway(&root.join(".fgos"), &Recorder::new(&root)).unwrap();
        assert_eq!(
            answer,
            json!({"alreadyStopped": false, "pid": child.pid, "port": 4170})
        );
        assert!(!child.alive(), "the stop waited for the real death");
        assert!(!registry_exists(&root));
    }

    #[cfg(unix)]
    #[test]
    fn a_process_that_ignores_term_is_killed_after_its_window_and_the_registry_is_cleared() {
        let root = scratch();
        let ready = root.join("ready");
        let child = throwaway(Some(&ready));
        write_entry(&root, &live_entry(&child, 4170));
        let started = Instant::now();
        let answer = stop_gateway(&root.join(".fgos"), &Recorder::new(&root)).unwrap();
        assert_eq!(answer["alreadyStopped"], false);
        assert!(
            started.elapsed() >= STOP_TIMEOUT,
            "term got its full window first"
        );
        assert!(!child.alive());
        assert!(!registry_exists(&root));
    }

    /// A reused pid: the recorded start time is not the live process's.
    #[cfg(unix)]
    #[test]
    fn a_recorded_identity_whose_start_time_is_not_the_live_pids_is_cleared_and_nothing_is_signalled(
    ) {
        let root = scratch();
        let child = throwaway(None);
        let mut record = child.record();
        let start: u64 = record["startTime"].as_str().unwrap().parse().unwrap();
        record["startTime"] = (start - 1_000_000).to_string().into();
        write_entry(
            &root,
            &json!({"pid": child.pid, "record": record, "port": 4170}),
        );
        let answer = stop_gateway(&root.join(".fgos"), &Recorder::new(&root)).unwrap();
        assert_eq!(answer["alreadyStopped"], true);
        assert!(
            child.alive(),
            "the unrelated process must not receive any signal"
        );
        assert!(!registry_exists(&root));
    }

    // ---- start --------------------------------------------------------------------------------

    fn never_built() -> StartParts<'static> {
        StartParts {
            build: &|_| panic!("the build must not run"),
            port: &|| Ok(4170),
        }
    }

    /// A fixture crate directory whose release binary is the shell script `body`.
    #[cfg(unix)]
    fn stub_gateway(root: &Path, body: &str) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let release = gateway_crate_dir(root).join("target").join("release");
        std::fs::create_dir_all(&release).unwrap();
        let binary = release.join("fgos-gateway");
        std::fs::write(&binary, format!("#!/bin/sh\n{body}\n")).unwrap();
        std::fs::set_permissions(&binary, std::fs::Permissions::from_mode(0o755)).unwrap();
        binary
    }

    /// A build that has nothing to do: the binary is already where a build leaves it.
    fn built(_: &Path) -> Result<(), GatewayControlError> {
        Ok(())
    }

    #[cfg(unix)]
    #[test]
    fn a_start_records_the_gateway_once_it_says_it_is_listening() {
        let root = scratch();
        let binary = stub_gateway(&root, "echo 'listening on 127.0.0.1:4170'\nexec sleep 600");
        let entry = start_gateway(
            &root,
            &root.join(".fgos"),
            &StartParts {
                build: &built,
                port: &|| Ok(4321),
            },
        )
        .unwrap();
        let pid = entry["pid"].as_u64().unwrap();
        let _cleanup = Reaper(pid as u32);
        assert_eq!(entry["port"], 4321);
        assert_eq!(entry["binaryPath"], binary.to_string_lossy().as_ref());
        assert_eq!(entry["record"]["pid"], pid);
        assert!(entry["startedAt"].as_str().unwrap().ends_with('Z'));
        let log = entry["logPath"].as_str().unwrap();
        assert!(Path::new(log).starts_with(root.join(".fgos").join("logs")));
        assert!(std::fs::read_to_string(log)
            .unwrap()
            .contains("listening on"));
        // The registry is the answer, pretty-printed with a trailing newline, readable by everyone.
        let written = std::fs::read_to_string(root.join(".fgos").join(REGISTRY_FILE)).unwrap();
        assert_eq!(
            written,
            format!("{}\n", serde_json::to_string_pretty(&entry).unwrap())
        );
        use std::os::unix::fs::PermissionsExt;
        let mode = std::fs::metadata(root.join(".fgos").join(REGISTRY_FILE))
            .unwrap()
            .permissions()
            .mode();
        assert_eq!(mode & 0o777 & !0o022, 0o644 & !0o022);
        // A second start refuses and names the running process.
        let again = start_gateway(&root, &root.join(".fgos"), &never_built()).unwrap_err();
        assert!(again.to_string().starts_with(&format!(
            "gateway is already running (pid {pid}, port 4321)"
        )));
        // And it can be stopped through the registry it wrote.
        let stopped = stop_gateway(&root.join(".fgos"), &Recorder::new(&root)).unwrap();
        assert_eq!(
            stopped,
            json!({"alreadyStopped": false, "pid": pid, "port": 4321})
        );
    }

    /// The gateway calls `fgos` verbs through the host, so it must not inherit the recursion guard; every
    /// other variable of the caller reaches it.
    #[cfg(unix)]
    #[test]
    fn the_gateway_is_spawned_without_the_recursion_guard_but_with_the_rest_of_the_environment() {
        assert_eq!(GATEWAY_ENV_REMOVE, [RECURSION_GUARD_VAR]);
        let root = scratch();
        stub_gateway(
            &root,
            &format!("echo \"guard=${{{RECURSION_GUARD_VAR}-unset}} kept=${{FGOS_GATEWAY_TEST_KEPT-unset}}\"\necho 'listening on 127.0.0.1:4170'\nexec sleep 600"),
        );
        std::env::set_var(RECURSION_GUARD_VAR, "1");
        std::env::set_var("FGOS_GATEWAY_TEST_KEPT", "yes");
        let entry = start_gateway(
            &root,
            &root.join(".fgos"),
            &StartParts {
                build: &built,
                port: &|| Ok(4170),
            },
        );
        std::env::remove_var(RECURSION_GUARD_VAR);
        std::env::remove_var("FGOS_GATEWAY_TEST_KEPT");
        let entry = entry.unwrap();
        let _cleanup = Reaper(entry["pid"].as_u64().unwrap() as u32);
        let log = std::fs::read_to_string(entry["logPath"].as_str().unwrap()).unwrap();
        assert!(log.contains("guard=unset kept=yes"), "{log}");
    }

    /// The gateway binary exits at once. The child is a zombie of this very process, which is dead as the
    /// judge sees it, so the exit is reported within one poll and not after the startup timeout.
    #[cfg(unix)]
    #[test]
    fn a_gateway_that_exits_at_once_is_reported_within_one_poll_with_its_log() {
        let root = scratch();
        stub_gateway(&root, "echo boom >&2\nexit 1");
        let started = Instant::now();
        let error = start_gateway(
            &root,
            &root.join(".fgos"),
            &StartParts {
                build: &built,
                port: &|| Ok(4170),
            },
        )
        .unwrap_err();
        assert!(
            started.elapsed() < Duration::from_secs(3),
            "{:?}",
            started.elapsed()
        );
        let message = error.to_string();
        assert!(
            message.starts_with("gateway process exited immediately after starting — see \""),
            "{message}"
        );
        assert!(
            message.contains("boom"),
            "the log tail is in the message: {message}"
        );
        assert!(
            !registry_exists(&root),
            "a gateway that never served is not recorded"
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_start_with_a_live_registry_refuses_before_touching_the_crate() {
        let root = scratch();
        let child = throwaway(None);
        write_entry(&root, &live_entry(&child, 4170));
        let error = start_gateway(&root, &root.join(".fgos"), &never_built()).unwrap_err();
        assert!(error.to_string().starts_with(&format!(
            "gateway is already running (pid {}, port 4170)",
            child.pid
        )));
        assert!(
            !gateway_crate_dir(&root).exists(),
            "the check comes before any crate or cargo work"
        );
    }

    #[test]
    fn a_project_with_no_gateway_crate_is_refused_by_name() {
        if !cfg!(unix) {
            return;
        }
        let root = scratch();
        let error = start_gateway(&root, &root.join(".fgos"), &never_built()).unwrap_err();
        assert_eq!(
            error.to_string(),
            format!(
                "no apps/fgos-gateway/ directory found at \"{}\" — this repo has no gateway to start",
                gateway_crate_dir(&root).display()
            )
        );
    }

    #[test]
    fn a_build_that_reports_success_without_a_binary_is_refused() {
        if !cfg!(unix) {
            return;
        }
        let root = scratch();
        std::fs::create_dir_all(gateway_crate_dir(&root)).unwrap();
        let error = start_gateway(
            &root,
            &root.join(".fgos"),
            &StartParts {
                build: &built,
                port: &|| Ok(4170),
            },
        )
        .unwrap_err();
        assert_eq!(
            error.to_string(),
            format!(
                "cargo build reported success but no binary was found at \"{}\"",
                release_binary_path(&gateway_crate_dir(&root)).display()
            )
        );
    }

    /// Two starts at once: the lock lets one build and spawn, the other waits and then finds it running.
    #[cfg(unix)]
    #[test]
    fn two_concurrent_starts_build_and_spawn_exactly_once() {
        let root = scratch();
        stub_gateway(&root, "echo 'listening on 127.0.0.1:4170'\nexec sleep 600");
        let builds = AtomicUsize::new(0);
        let build = |_: &Path| -> Result<(), GatewayControlError> {
            builds.fetch_add(1, Ordering::SeqCst);
            Ok(())
        };
        let outcomes: Vec<Answer> = std::thread::scope(|scope| {
            let runs: Vec<_> = (0..2)
                .map(|_| {
                    scope.spawn(|| {
                        start_gateway(
                            &root,
                            &root.join(".fgos"),
                            &StartParts {
                                build: &build,
                                port: &|| Ok(4170),
                            },
                        )
                    })
                })
                .collect();
            runs.into_iter().map(|run| run.join().unwrap()).collect()
        });
        let started: Vec<&Value> = outcomes.iter().filter_map(|o| o.as_ref().ok()).collect();
        assert_eq!(started.len(), 1, "{outcomes:?}");
        let _cleanup = Reaper(started[0]["pid"].as_u64().unwrap() as u32);
        let refused: Vec<String> = outcomes
            .iter()
            .filter_map(|o| o.as_ref().err())
            .map(ToString::to_string)
            .collect();
        assert_eq!(refused.len(), 1);
        assert!(
            refused[0].starts_with("gateway is already running"),
            "{}",
            refused[0]
        );
        assert_eq!(builds.load(Ordering::SeqCst), 1);
        let logs = std::fs::read_dir(root.join(".fgos").join("logs"))
            .unwrap()
            .count();
        assert_eq!(logs, 1, "one process, one log");
    }

    #[test]
    fn the_release_build_runs_cargo_in_the_crate_with_a_locked_release_build_of_the_gateway() {
        let crate_dir = Path::new("/project/apps/fgos-gateway");
        let command = cargo_build_command(crate_dir);
        assert_eq!(command.get_program(), "cargo");
        assert_eq!(
            command.get_args().collect::<Vec<_>>(),
            ["build", "--release", "--locked", "--bin", "fgos-gateway"]
        );
        assert_eq!(command.get_current_dir(), Some(crate_dir));
        assert_eq!(
            release_binary_path(crate_dir),
            crate_dir.join("target/release/fgos-gateway")
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_build_that_succeeds_a_build_that_fails_and_a_missing_cargo_are_told_apart() {
        let root = scratch();
        let program = root.join("fake-cargo");
        write_script(&program, "echo built");
        assert_eq!(run_build(&mut std::process::Command::new(&program)), Ok(()));
        write_script(&program, "echo 'error: could not compile' >&2\nexit 101");
        let failed = run_build(&mut std::process::Command::new(&program))
            .unwrap_err()
            .to_string();
        assert_eq!(
            failed,
            "building the release binary failed: error: could not compile\n"
        );
        let missing = run_build(&mut std::process::Command::new(root.join("no-such-cargo")))
            .unwrap_err()
            .to_string();
        assert!(
            missing.starts_with("building the release binary failed: could not run "),
            "{missing}"
        );
    }

    // ---- the lock -----------------------------------------------------------------------------

    #[test]
    fn the_lock_path_is_the_one_the_lock_registry_names() {
        let root = scratch();
        let lock = acquire_gateway_lock(&root.join(".fgos"), 1_000).unwrap();
        let held = lock
            ._scope
            .handle(LOCK_NAME)
            .expect("the gateway lock is held");
        assert_eq!(
            held.path(),
            std::path::absolute(lock_path(&root.join(".fgos"))).unwrap()
        );
    }

    #[test]
    fn a_held_lock_blocks_a_contender_until_its_timeout_and_names_the_holder() {
        let root = scratch();
        let fgos = root.join(".fgos");
        let held = acquire_gateway_lock(&fgos, 1_000).unwrap();
        let started = Instant::now();
        let error = acquire_gateway_lock(&fgos, 300).unwrap_err().to_string();
        assert!(started.elapsed() >= Duration::from_millis(300));
        let path = std::path::absolute(lock_path(&fgos)).unwrap();
        let expected = format!(
            "timed out acquiring gateway.lock at \"{}\" after 300ms",
            path.display()
        );
        assert!(error.starts_with(&expected), "{error}");
        if cfg!(target_os = "linux") {
            assert!(
                error.ends_with(&format!(" (held by pid {})", std::process::id())),
                "{error}"
            );
        }
        drop(held);
        assert!(
            acquire_gateway_lock(&fgos, 1_000).is_ok(),
            "the lock is free once released"
        );
    }

    // ---- the host seam ------------------------------------------------------------------------

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    #[test]
    fn the_sub_verb_is_the_first_positional_of_the_shared_parser() {
        let project = Ok(PathBuf::from("/p"));
        for (args, sub) in [
            (vec!["gateway", "start"], Sub::Start),
            (vec!["gateway", "--dir", "/x", "stop"], Sub::Stop),
            (vec!["gateway", "status", "--json"], Sub::Status),
        ] {
            let request = project_gateway_request(&os(&args), project.clone()).unwrap();
            assert_eq!(request.sub, sub, "{args:?}");
            assert_eq!(request.project, project);
        }
        let refusal = project_gateway_request(&os(&["gateway", "restart"]), project).unwrap_err();
        assert_eq!(refusal.exit_code(), 4);
        assert_eq!(
            refusal.message,
            "unknown gateway subcommand \"restart\". Available: start, stop, status"
        );
        assert_eq!(
            [Sub::Start, Sub::Stop, Sub::Status].map(Sub::operation_id),
            [START_OPERATION_ID, STOP_OPERATION_ID, STATUS_OPERATION_ID]
        );
    }

    /// Where no project was found there is no registry: nothing is created, `start` says why it cannot.
    #[test]
    fn a_call_outside_any_project_creates_nothing() {
        let why = "not inside an fgOS project [not-in-project]".to_owned();
        let none = |sub| GatewayRequest {
            sub,
            project: Err(why.clone()),
        };
        let recorder = Recorder::new(Path::new("/nowhere"));
        assert_eq!(serve(&none(Sub::Status), &recorder).unwrap(), not_running());
        assert_eq!(
            serve(&none(Sub::Stop), &recorder).unwrap(),
            json!({"alreadyStopped": true})
        );
        assert_eq!(
            serve(&none(Sub::Start), &recorder).unwrap_err().to_string(),
            why
        );
        assert!(recorder.calls.borrow().is_empty());
    }

    // ---- fixtures -----------------------------------------------------------------------------

    /// The record of a process that has exited: a reaped child.
    fn dead_record() -> Value {
        let mut child = std::process::Command::new("true").spawn().unwrap();
        let pid = child.id();
        let start_time = match facts::observe(ProcId(pid)) {
            Observed::Live { start_time } => start_time,
            _ => "1".to_owned(),
        };
        child.wait().unwrap();
        let mut record = live_record(pid, start_time);
        record["pid"] = pid.into();
        record
    }

    fn live_entry(child: &Throwaway, port: u64) -> Value {
        json!({"pid": child.pid, "record": child.record(), "port": port, "startedAt": "2026-01-01T00:00:00.000Z", "logPath": "/dev/null"})
    }

    #[cfg(unix)]
    fn write_script(path: &Path, body: &str) {
        use std::os::unix::fs::PermissionsExt;
        std::fs::write(path, format!("#!/bin/sh\n{body}\n")).unwrap();
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o755)).unwrap();
    }

    /// A real, orphaned, long-lived process (never this test's own child, as a gateway never is the child of
    /// the `stop` that signals it); killed when dropped.
    struct Throwaway {
        pid: u32,
    }

    impl Throwaway {
        fn record(&self) -> Value {
            match facts::observe(ProcId(self.pid)) {
                Observed::Live { start_time } => live_record(self.pid, start_time),
                other => panic!("the throwaway process is not live: {other:?}"),
            }
        }

        fn alive(&self) -> bool {
            matches!(facts::observe(ProcId(self.pid)), Observed::Live { .. })
        }
    }

    impl Drop for Throwaway {
        fn drop(&mut self) {
            drop(Reaper(self.pid));
        }
    }

    /// Kills the process when dropped.
    struct Reaper(u32);

    impl Drop for Reaper {
        fn drop(&mut self) {
            #[cfg(unix)]
            let _ = std::process::Command::new("kill")
                .args(["-9", &self.0.to_string()])
                .output();
            #[cfg(not(unix))]
            let _ = self.0;
        }
    }

    /// Starts an orphan under `setsid`. With `ready`, the process ignores TERM and writes the file once it
    /// does, so a signal sent before then cannot end it.
    #[cfg(unix)]
    fn throwaway(ready: Option<&Path>) -> Throwaway {
        let body = match ready {
            Some(file) => format!("trap '' TERM; echo 1 > {file:?}; while :; do sleep 1; done"),
            None => "exec sleep 600".to_owned(),
        };
        let out = std::process::Command::new("sh")
            .args([
                "-c",
                "setsid \"$0\" -c \"$1\" </dev/null >/dev/null 2>&1 & echo $!",
                "sh",
                &body,
            ])
            .output()
            .unwrap();
        let pid = String::from_utf8_lossy(&out.stdout).trim().parse().unwrap();
        let deadline = Instant::now() + Duration::from_secs(5);
        while !matches!(facts::observe(ProcId(pid)), Observed::Live { .. })
            || ready.is_some_and(|file| !file.exists())
        {
            assert!(
                Instant::now() < deadline,
                "the throwaway process never came up"
            );
            std::thread::sleep(Duration::from_millis(10));
        }
        Throwaway { pid }
    }

    /// A local server answering every connection with `status`, and the port it listens on.
    #[cfg(unix)]
    fn serve_contract(status: &'static str) -> u64 {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        std::thread::spawn(move || {
            for stream in listener.incoming().flatten().take(4) {
                let mut stream = stream;
                let mut buffer = [0u8; 512];
                let _ = stream.read(&mut buffer);
                let _ = stream.write_all(
                    format!(
                        "HTTP/1.1 {status}\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{{}}"
                    )
                    .as_bytes(),
                );
            }
        });
        u64::from(port)
    }
}
