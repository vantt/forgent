//! The controller half of a supervised attempt, `direct` or `terminal`: take the attempt lock (and the cwd
//! lease when the agent writes), write the immutable envelope and the secret side file, start
//! `fgos internal supervise` detached with the locks handed over as descriptors, wait for its binding, then
//! only read: progress from the capture files, the answer from the `result.json` the settle step writes.
//! The controller never settles, never signals the agent and never owns a process of the attempt.
//!
//! Port of `src/run-supervisor/direct-launch.mjs`. The lane facts are read from `crate::lanes` (the pool is
//! Rust's already); the host binary and payload root come in as an [`AttemptHost`] (the payload root is
//! resolved by its own module, not here).

use super::config::{read_dispatch_config, ConfigReadError};
use super::cwd_lock::admit_successor;
use super::error::DispatchError;
use super::proof::{publish_immutable_proof, publish_mutable_projection};
use super::runtime_dir::{current_uid, ensure_runtime_socket_dir, process_env, RuntimeDirError};
use crate::{envelope, lanes};
use fgos_holder_lock::{
    acquire, Acquire, BorrowedHandle, Handle, LockScope, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS,
};
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs;
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

/// The route protocol of the supervisor, gate, adopt and attempt-step routes.
pub const PROTOCOL: u64 = 1;
/// How long one attempt step may run, and the most steps an envelope carries.
pub const ATTEMPT_STEP_TIMEOUT_MS: u64 = 10 * 60 * 1000;
pub const MAX_ATTEMPT_STEPS: usize = 3;

/// The supervisor's start budgets for a terminal seat, summed, plus 15 000 slack for the herdr calls.
pub const BINDING_WAIT_MS: u64 = 45_000;
const POLL: Duration = Duration::from_millis(25);
const CLOSE_WAIT_MS: u64 = 60_000;
const TAIL_CHUNK_BYTES: u64 = 1024 * 1024;
const ADOPT_POLL: Duration = Duration::from_millis(250);
const ADOPT_WAIT_MS: u64 = 60_000;
/// Slack past the soft deadline for SIGTERM, the kill grace and the supervisor's own domain sweep.
const HARD_CEILING_SLACK_MS: u64 = 15_000;
/// What the controller waits for the settle step past the round and the gate's kill grace.
const SETTLEMENT_SLACK_MS: u64 = 120_000;
const ENV_ALLOW: [&str; 10] = [
    "PATH",
    "HOME",
    "USERPROFILE",
    "TMPDIR",
    "TEMP",
    "TMP",
    "LANG",
    "LC_ALL",
    "SYSTEMROOT",
    "XDG_RUNTIME_DIR",
];
const ENV_NEVER_PASSED: [&str; 3] = [
    "FGOS_LOCK_FD",
    "FGOS_LOCK_JOB",
    "FGOS_RUST_HOST_RECURSION_GUARD",
];

/// The host binary of the running release and the payload the steps run from, resolved once per launch.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AttemptHost {
    pub host_bin: String,
    pub payload_root: String,
}

/// Where one attempt keeps the files its gate and its agent write.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AttemptPaths {
    pub run_dir: PathBuf,
    pub side_file: PathBuf,
    pub capture_dir: PathBuf,
    pub stdout: PathBuf,
    pub stderr: PathBuf,
    pub gate_exit: PathBuf,
    pub outbox_dir: PathBuf,
}

pub fn attempt_paths(run_dir: &Path, attempt_id: &str) -> AttemptPaths {
    let dir = absolute(run_dir);
    let capture_dir = dir.join("protected").join("capture").join(attempt_id);
    AttemptPaths {
        side_file: dir.join("protected").join("attempt-secrets.json"),
        stdout: capture_dir.join("stdout.log"),
        stderr: capture_dir.join("stderr.log"),
        gate_exit: dir.join("gate-exit.json"),
        outbox_dir: dir.join("worker-output").join("outbox"),
        capture_dir,
        run_dir: dir,
    }
}

fn absolute(path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map(|cwd| cwd.join(path))
            .unwrap_or_else(|_| path.to_path_buf())
    }
}

fn text(path: &Path) -> String {
    path.display().to_string()
}

#[cfg(unix)]
fn create_dir_mode(path: &Path, mode: u32) -> io::Result<()> {
    use std::os::unix::fs::DirBuilderExt;
    fs::DirBuilder::new()
        .recursive(true)
        .mode(mode)
        .create(path)
}
#[cfg(not(unix))]
fn create_dir_mode(path: &Path, _mode: u32) -> io::Result<()> {
    fs::create_dir_all(path)
}

/// Create, empty, the files a sandboxed gate must write (exit record, two capture files) and the outbox. The
/// sandbox binds exactly these writable; the attempt directory around them stays read-only. Returns the list
/// the sandbox is asked to bind.
pub fn prepare_attempt_files(run_dir: &Path, attempt_id: &str) -> io::Result<Vec<PathBuf>> {
    let paths = attempt_paths(run_dir, attempt_id);
    create_dir_mode(&paths.run_dir.join("protected"), 0o700)?;
    fs::create_dir_all(&paths.capture_dir)?;
    fs::create_dir_all(&paths.outbox_dir)?;
    let binds = vec![
        paths.stdout.clone(),
        paths.stderr.clone(),
        paths.gate_exit.clone(),
    ];
    for file in &binds {
        create_empty_append(file)?;
    }
    Ok(binds)
}

fn create_empty_append(file: &Path) -> io::Result<()> {
    let mut options = fs::OpenOptions::new();
    options.append(true).create(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options.open(file).map(|_| ())
}

/// The sandbox command: the gate of this attempt. `direct`: GO channel at descriptor 5; `terminal`: the gate
/// dials `go_socket`.
pub fn attempt_gate_command(
    host_bin: &str,
    run_dir: &Path,
    go_socket: Option<&str>,
) -> Vec<String> {
    let mut command = vec![
        host_bin.to_string(),
        "internal".into(),
        "gate".into(),
        "--protocol".into(),
        PROTOCOL.to_string(),
        "--envelope".into(),
        text(&absolute(run_dir).join("envelope.json")),
    ];
    match go_socket {
        Some(socket) => command.extend(["--go-socket".into(), socket.to_string()]),
        None => command.extend(["--go-fd".into(), "5".into()]),
    }
    command
}

/// Where the gate of a `terminal` attempt reaches its supervisor: a hashed name in the owner-only runtime
/// socket directory.
pub fn terminal_socket_path(attempt_id: &str) -> Result<PathBuf, RuntimeDirError> {
    let name = format!("{:x}", Sha256::digest(attempt_id.as_bytes()));
    Ok(ensure_runtime_socket_dir(&process_env, current_uid())?
        .join(format!("{}.sock", &name[..16])))
}

/// `{bootId, boottimeNs}` now, in the envelope's shape.
fn boottime_now() -> (String, u64) {
    let boot_id = fgos_process::facts::self_identity()
        .and_then(|t| t.boot_id)
        .unwrap_or_else(|| "unknown-boot".to_string());
    (boot_id, crate::gate::boottime_ns())
}

fn boottime_after(after_ms: u64) -> Value {
    let (boot_id, now) = boottime_now();
    json!({ "bootId": boot_id, "boottimeNs": now + after_ms * 1_000_000 })
}

/// The environment of every step and of the supervisor: nothing but what the Node payload reads.
pub fn attempt_step_env(env: &BTreeMap<String, String>) -> Map<String, Value> {
    let mut out = Map::new();
    for name in ENV_ALLOW {
        if let Some(value) = env.get(name) {
            out.insert(name.into(), value.clone().into());
        }
    }
    for (name, value) in env {
        if name.starts_with("FGOS_") && !ENV_NEVER_PASSED.contains(&name.as_str()) {
            out.insert(name.clone(), value.clone().into());
        }
    }
    let (state_root, _) =
        fgos_holder_lock::state_root::state_root_from(|name| env.get(name).cloned());
    out.insert("FGOS_STATE_ROOT".into(), text(&state_root).into());
    out
}

/// `env` with the attempt's writer id applied as fgos-identity decides (inherited session ids dropped, the
/// attempt's id and its controller set), so what the controller carried never reaches the agent.
pub fn with_identity_env(env: &Map<String, Value>, identity: Option<&Value>) -> Map<String, Value> {
    let Some(identity) = identity.filter(|i| !i.is_null()) else {
        return env.clone();
    };
    let writer = identity["writerId"].as_str().unwrap_or_default();
    let Ok(launcher) = fgos_identity::launcher_env(writer, identity["parentWriterId"].as_str())
    else {
        return env.clone();
    };
    let mut out = env.clone();
    for name in &launcher.unset {
        out.remove(*name);
    }
    for (name, value) in launcher.set {
        out.insert(name, value.into());
    }
    out
}

/// The steps an attempt runs after its receipt, in order: the one list the envelope and the intent both carry. A
/// session attempt holds no run control token, so it has nothing to settle.
fn attempt_steps(
    run_dir: &Path,
    host: &AttemptHost,
    step_env: &Map<String, Value>,
    extra_steps: &[String],
    session: bool,
) -> Vec<Value> {
    let mut ids: Vec<String> = Vec::new();
    if !session {
        ids.push("settle-attempt".into());
    }
    ids.push("finalize-home".into());
    ids.extend(extra_steps.iter().cloned());
    ids.into_iter()
        .map(|step_id| {
            json!({
                "stepId": step_id,
                "hostBin": host.host_bin,
                "payloadRoot": host.payload_root,
                "argv": ["internal", "attempt-step", step_id, "--protocol", PROTOCOL.to_string(), "--run-dir", text(run_dir)],
                "cwd": text(run_dir),
                "env": step_env,
                "stepTimeoutMs": ATTEMPT_STEP_TIMEOUT_MS,
            })
        })
        .collect()
}

pub struct IntentInput<'a> {
    pub run_dir: &'a Path,
    pub attempt_id: &'a str,
    pub unit_run_id: &'a str,
    pub terminal: bool,
    pub cwd: &'a str,
    pub host: &'a AttemptHost,
    pub step_env: &'a Map<String, Value>,
    /// `{slot: {key, groupKey}, endpointEnv}`, published again right before a terminal attempt's pane is allocated.
    pub pane: Option<&'a Value>,
    pub session: bool,
}

/// Publish `attempt-intent.json` right after the attempt lock is taken: what the adopt door needs to close this
/// attempt if the controller dies before it writes the envelope. Replaced atomically.
pub fn write_attempt_intent(input: &IntentInput) -> io::Result<()> {
    let paths = attempt_paths(input.run_dir, input.attempt_id);
    let extra: Vec<String> = if input.terminal {
        vec!["cleanup-trust".into()]
    } else {
        Vec::new()
    };
    let mut intent = json!({
        "v": 1,
        "attemptId": input.attempt_id,
        "unitRunId": input.unit_run_id,
        "runDir": text(&paths.run_dir),
        "host": if input.terminal { "terminal" } else { "direct" },
        "cwd": input.cwd,
        "launch": { "capture": { "stdout": text(&paths.stdout), "stderr": text(&paths.stderr) }, "outboxDir": text(&paths.outbox_dir) },
        "steps": attempt_steps(&paths.run_dir, input.host, input.step_env, &extra, input.session),
        "sideFile": text(&paths.side_file),
    });
    if let (true, Some(pane)) = (input.terminal, input.pane) {
        intent["terminal"] = json!({ "slot": pane["slot"], "endpointEnv": pane["endpointEnv"] });
    }
    publish_mutable_projection(&paths.run_dir.join("attempt-intent.json"), &intent)
}

/// Take the intent back once the run is settled without a launch: nothing is left for adopt to close.
pub fn remove_attempt_intent(run_dir: &Path) {
    let _ = fs::remove_file(run_dir.join("attempt-intent.json"));
}

/// The terminal placement of an envelope.
#[derive(Debug, Clone)]
pub struct TerminalInput {
    pub brief_path: String,
    pub outbox_dir: Option<String>,
    pub group_key: String,
    pub socket_path: String,
    pub exit_command: Option<Value>,
    pub orphan_settle_ms: u64,
    pub retain_failed_pane_ms: Option<Value>,
}

/// The confinement driver's launch of the agent (`prepareConfinementForLaunch(...).attempt`).
#[derive(Debug, Clone)]
pub struct AttemptLaunch {
    pub command: String,
    pub args: Vec<String>,
    pub env: Map<String, Value>,
    pub bwrap_prefix: Option<Vec<String>>,
    pub bwrap_executable: Option<String>,
}

pub struct EnvelopeInput<'a> {
    pub attempt_id: &'a str,
    pub unit_run_id: &'a str,
    pub run_dir: &'a Path,
    pub host: &'a AttemptHost,
    pub cwd: &'a str,
    pub mutating: bool,
    pub attempt: &'a AttemptLaunch,
    pub timeout_ms: u64,
    pub idle_timeout_ms: u64,
    pub max_output_bytes: Option<u64>,
    pub cli: &'a Value,
    pub step_env: &'a Map<String, Value>,
    pub gate_kill_grace_ms: u64,
    pub kill_wait_ms: u64,
    pub cwd_lease_file: Option<&'a str>,
    pub cwd_lease_owner: Option<&'a str>,
    pub identity: Option<&'a Value>,
    pub terminal: Option<&'a TerminalInput>,
    pub extra_steps: &'a [String],
    /// `{role, verbs, writes, requestSocketPath?}` (terminal only): makes it a session attempt.
    pub session: Option<&'a Value>,
    pub ceiling_ms: Option<u64>,
    /// `{ceiling, waitMs}` from [`lane_transport`]; absent for any other attempt.
    pub lanes: Option<&'a Value>,
}

fn preferred_containment(pid_namespace: bool) -> &'static str {
    if pid_namespace {
        "linux-gate"
    } else if cfg!(windows) {
        "windows-job"
    } else if cfg!(target_os = "macos") {
        "macos-tree"
    } else {
        "linux-pgroup"
    }
}

/// Build the envelope v3 body (without digest) of one attempt. A session attempt has no soft deadline, no idle
/// limit and no `settle-attempt` step, and `ceiling_ms` (required) bounds it instead of the round timeout.
pub fn build_envelope(input: &EnvelopeInput) -> Result<Value, DispatchError> {
    let run_dir_detail = |error: DispatchError| error.with("runDir", json!(text(input.run_dir)));
    let session = input.session.filter(|s| !s.is_null());
    if session.is_some() && input.terminal.is_none() {
        return Err(run_dir_detail(DispatchError::new(
            "session-needs-terminal",
            "a session attempt runs in a pane",
        )));
    }
    if session.is_some() && !input.ceiling_ms.is_some_and(|c| c > 0) {
        return Err(run_dir_detail(DispatchError::new(
            "session-needs-ceiling",
            "a session attempt names its hard ceiling in milliseconds",
        )));
    }
    if (if session.is_some() { 1 } else { 2 }) + input.extra_steps.len() > MAX_ATTEMPT_STEPS {
        return Err(run_dir_detail(DispatchError::new(
            "too-many-steps",
            format!("an attempt runs at most {MAX_ATTEMPT_STEPS} steps"),
        )));
    }
    let paths = attempt_paths(input.run_dir, input.attempt_id);
    let confined = input.attempt.bwrap_prefix.is_some();
    // A sandbox without its own pid namespace (a head granted its peer sessions) has no pid 1 to hold the domain:
    // only a pane may run one; a direct attempt in such a sandbox would have no domain the supervisor can end.
    let pid_namespace = input
        .attempt
        .bwrap_prefix
        .as_ref()
        .is_some_and(|p| p.iter().any(|a| a == "--unshare-pid"));
    if confined && !pid_namespace && input.terminal.is_none() {
        return Err(run_dir_detail(DispatchError::new(
            "pid-namespace-required",
            "a direct attempt runs in a pid namespace of its own",
        )));
    }
    // The supervisor binds only after it holds a lane, so a seat that waited for one still gets its whole budget.
    let lane_wait_ms = lane_wait_budget_ms_of(if session.is_some() { None } else { input.lanes });
    let terminal = input.terminal;
    let mut launch = Map::new();
    launch.insert("command".into(), input.attempt.command.clone().into());
    launch.insert("args".into(), json!(input.attempt.args));
    launch.insert(
        "env".into(),
        Value::Object(with_identity_env(&input.attempt.env, input.identity)),
    );
    launch.insert("stdinPolicy".into(), "null".into());
    launch.insert(
        "briefPath".into(),
        terminal.map_or(Value::Null, |t| t.brief_path.clone().into()),
    );
    launch.insert(
        "outboxDir".into(),
        terminal
            .and_then(|t| t.outbox_dir.clone())
            .unwrap_or_else(|| text(&paths.outbox_dir))
            .into(),
    );
    if let Some(max) = input.max_output_bytes.filter(|m| *m > 0) {
        launch.insert("maxOutputBytes".into(), max.into());
    }
    launch.insert(
        "capture".into(),
        json!({ "stdout": text(&paths.stdout), "stderr": text(&paths.stderr) }),
    );
    let mut containment = json!({ "preferred": preferred_containment(pid_namespace) });
    if let Some(prefix) = &input.attempt.bwrap_prefix {
        let mut full = vec![input.attempt.bwrap_executable.clone().unwrap_or_default()];
        full.extend(prefix.iter().cloned());
        containment["bwrapPrefix"] = json!(full);
    }
    let round_ms = if input.timeout_ms > 0 {
        input.timeout_ms
    } else {
        ATTEMPT_STEP_TIMEOUT_MS
    };
    let hard_ms = if session.is_some() {
        input.ceiling_ms.unwrap_or(0)
    } else {
        round_ms
    };
    let (boot_id, boottime_ns) = boottime_now();
    let steps = {
        let mut steps = attempt_steps(
            &paths.run_dir,
            input.host,
            input.step_env,
            input.extra_steps,
            session.is_some(),
        );
        if terminal.is_some() {
            steps.push(json!({ "stepId": "release-slot", "builtin": true, "disposition": { "onSuccess": "close", "onFailure": "retain" } }));
        }
        steps
    };
    let mut body = json!({
        "v": 3,
        "attemptId": input.attempt_id,
        "unitRunId": input.unit_run_id,
        "runDir": text(input.run_dir),
        "host": if terminal.is_some() { "terminal" } else { "direct" },
        "protocolId": PROTOCOL,
        "hostBin": input.host.host_bin,
        "payloadRoot": input.host.payload_root,
        "cwd": input.cwd,
        "mutation": if input.mutating { "mutating" } else { "read-only" },
        "launch": Value::Object(launch),
        "containment": containment,
        "deadlines": {
            "softAt": if session.is_none() && input.timeout_ms > 0 { boottime_after(input.timeout_ms + lane_wait_ms) } else { Value::Null },
            "idleMs": if session.is_some() || input.idle_timeout_ms == 0 { Value::Null } else { input.idle_timeout_ms.into() },
            "hardCeiling": boottime_after(hard_ms + lane_wait_ms + input.gate_kill_grace_ms + HARD_CEILING_SLACK_MS),
            "gateKillGraceMs": input.gate_kill_grace_ms,
            "killWaitMs": input.kill_wait_ms,
        },
        "agentProtocol": { "cli": input.cli },
        "identity": input.identity.cloned().unwrap_or(Value::Null),
        "steps": steps,
        "sideFile": text(&paths.side_file),
        "createdAt": { "bootId": boot_id, "boottimeNs": boottime_ns },
    });
    if let Some(t) = terminal {
        body["slot"] = json!({ "key": input.attempt_id, "groupKey": t.group_key });
        let mut term = json!({ "socketPath": t.socket_path, "exitCommand": t.exit_command.clone().unwrap_or(Value::Null), "orphanSettleMs": t.orphan_settle_ms });
        if let Some(retain) = &t.retain_failed_pane_ms {
            term["retainFailedPaneMs"] = retain.clone();
        }
        body["terminal"] = term;
    }
    if let Some(session) = session {
        body["session"] = session.clone();
    }
    // A head session is never a seat of the lane pool; the supervisor reads the pool size from here, not from config.
    if let (Some(lanes), None) = (input.lanes, session) {
        body["lanes"] = lanes.clone();
    }
    if let Some(file) = input.cwd_lease_file {
        body["cwdLeaseFile"] = file.into();
        if let Some(owner) = input.cwd_lease_owner {
            body["cwdLeaseOwner"] = owner.into();
        }
    }
    Ok(body)
}

/// Write envelope.json (digest included) and the 0600 side file; both exactly once.
pub fn write_attempt_files(
    run_dir: &Path,
    body: &Value,
    secret_env: &Value,
    control_epoch: u64,
    control_token: &str,
) -> Result<Value, DispatchError> {
    let failed = |error: io::Error| {
        DispatchError::new("launch-write-failed", error.to_string())
            .with("runDir", json!(text(run_dir)))
    };
    let digest = envelope::digest(body)
        .map_err(|e| DispatchError::new("envelope-not-canonical", format!("{e:?}")))?;
    let mut with_digest = body.clone();
    with_digest["digest"] = digest.into();
    create_dir_mode(&run_dir.join("protected"), 0o700).map_err(failed)?;
    let side = json!({ "v": 1, "attemptId": body["attemptId"], "env": secret_env, "controlEpoch": control_epoch, "controlToken": control_token });
    let side_file = PathBuf::from(body["sideFile"].as_str().unwrap_or_default());
    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options
        .open(&side_file)
        .and_then(|mut file| file.write_all(side.to_string().as_bytes()))
        .map_err(failed)?;
    if !publish_immutable_proof(&run_dir.join("envelope.json"), &with_digest).map_err(failed)? {
        return Err(DispatchError::new(
            "launch-collision",
            format!(
                "attempt {} already has an envelope",
                body["attemptId"].as_str().unwrap_or_default()
            ),
        )
        .with("runDir", json!(text(run_dir))));
    }
    Ok(with_digest)
}

/// What the settle step needs from this controller that no file of the attempt carries.
pub fn write_settle_context(run_dir: &Path, context: &Value) -> io::Result<()> {
    let mut record = json!({ "v": 1 });
    if let (Some(into), Some(from)) = (record.as_object_mut(), context.as_object()) {
        into.extend(from.clone());
    }
    publish_mutable_projection(
        &run_dir.join("controller").join("settle-context.json"),
        &record,
    )
}

/// `workerSlots` of the effective config: the lane pool settings.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LaneSettings {
    pub ceiling: Option<u64>,
    pub lane_wait_sec: u64,
}

/// The kill grace and the predecessor kill wait the envelope carries, and the lane pool settings.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LaunchSettings {
    pub gate_kill_grace_ms: u64,
    pub kill_wait_ms: u64,
    pub lanes: LaneSettings,
}

pub fn read_launch_settings(project_root: &Path) -> Result<LaunchSettings, ConfigReadError> {
    let snapshot = read_dispatch_config(Some(project_root), None)?;
    let missing =
        |key: &str| ConfigReadError(format!("the config door returned no value for {key}"));
    let slots = snapshot
        .value
        .get("workerSlots")
        .ok_or_else(|| missing("workerSlots"))?;
    Ok(LaunchSettings {
        gate_kill_grace_ms: super::config::resolve_gate_kill_grace(&snapshot)?.value,
        kill_wait_ms: DEFAULT_KILL_WAIT_MS,
        lanes: LaneSettings {
            ceiling: slots.get("ceiling").and_then(Value::as_u64),
            lane_wait_sec: slots
                .get("laneWaitSec")
                .and_then(Value::as_u64)
                .ok_or_else(|| missing("workerSlots.laneWaitSec"))?,
        },
    })
}

/// The envelope's `lanes` field for a launch at dispatch depth `depth`: only a top-level seat (depth 0) takes a
/// lane, so a seat that dispatches a child never waits on its own pool. `None` means the envelope carries none.
pub fn lane_transport(lanes: Option<&LaneSettings>, depth: u64) -> Option<Value> {
    let lanes = lanes.filter(|_| depth == 0)?;
    Some(json!({ "ceiling": lanes.ceiling, "waitMs": lanes.lane_wait_sec * 1000 }))
}

fn lane_wait_budget_ms_of(lanes: Option<&Value>) -> u64 {
    let Some(lanes) = lanes else { return 0 };
    // Read through the lane pool's own reader, never a second copy of the field rules.
    let probe = json!({ "lanes": lanes });
    match lanes::config_of(&probe) {
        Some(config) if config.ceiling.is_some() => config.wait_ms,
        _ => 0,
    }
}

/// How long an envelope's supervisor may wait for a lane before it binds: the pool's wait, or none when it
/// names no ceiling.
pub fn lane_wait_budget_ms(envelope: &Value) -> u64 {
    match lanes::config_of(envelope) {
        Some(config) if config.ceiling.is_some() => config.wait_ms,
        _ => 0,
    }
}

/// The binding wait of one launch: the normal start budget plus the lane wait the envelope allows.
pub fn binding_wait_ms(envelope: &Value) -> u64 {
    BINDING_WAIT_MS + lane_wait_budget_ms(envelope)
}

/// How long the controller waits for the settled result after the binding: the round, the gate's kill grace and
/// a settle margin, plus the lane wait the envelope's deadlines include.
pub fn settlement_ceiling_ms(envelope: &Value, timeout_ms: u64, gate_kill_grace_ms: u64) -> u64 {
    timeout_ms + lane_wait_budget_ms(envelope) + gate_kill_grace_ms + SETTLEMENT_SLACK_MS
}

/// The locks one attempt holds while the supervisor is handed over: `attempt` (rank 15) and, for an agent that
/// writes, `dispatch-cwd` (rank 30). Dropping a handle closes this process's copy.
#[derive(Debug)]
pub struct AttemptLocks {
    pub attempt: Option<Handle>,
    pub cwd_lease: Option<Handle>,
    /// The cwd lease came from the caller (custody), which keeps it.
    pub cwd_lease_is_custody: bool,
}

impl AttemptLocks {
    /// Close the attempt copy only (the supervisor keeps its own).
    pub fn release_attempt(&mut self) {
        self.attempt = None;
    }

    /// Close this process's copies; the supervisor keeps its own. Safe to call twice.
    pub fn release(&mut self) {
        if !self.cwd_lease_is_custody {
            self.cwd_lease = None;
        }
        self.attempt = None;
    }
}

/// What one attempt asks of [`acquire_attempt_locks`].
#[derive(Debug)]
pub struct AttemptLockRequest<'a> {
    pub fgos_dir: &'a Path,
    pub assignment_dir: &'a Path,
    pub attempt_str: &'a str,
    pub cwd: &'a Path,
    pub mutating: bool,
    /// A held lease of this cwd the caller already owns (checked by path); the caller keeps it.
    pub custody: Option<Handle>,
    pub executor_id: Option<&'a str>,
    pub capability: Option<&'a str>,
}

/// Take `attempt` and, for an agent that writes, `dispatch-cwd`, in one scope so the order is checked. Throws
/// `attempt-in-flight` / `dispatch-in-flight`; nothing stays held.
pub fn acquire_attempt_locks(request: AttemptLockRequest) -> Result<AttemptLocks, DispatchError> {
    let AttemptLockRequest {
        fgos_dir,
        assignment_dir,
        attempt_str,
        cwd,
        mutating,
        custody,
        executor_id,
        capability,
    } = request;
    if let Some(custody) = &custody {
        let expected = super::cwd_lock::lock_path(fgos_dir, cwd)?;
        if custody.name() != "dispatch-cwd" || custody.path() != expected {
            return Err(DispatchError::new(
                "custody-required",
                "attempt custody must be the held lease of this cwd",
            )
            .with("cwd", json!(text(cwd)))
            .with("executorId", json!(executor_id))
            .with("capability", json!(capability)));
        }
    }
    let attempt_path = assignment_dir
        .join("runs")
        .join(attempt_str)
        .join("attempt.lock");
    if let Some(parent) = attempt_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| DispatchError::new("lock-driver-unavailable", format!("attempt: {e}")))?;
    }
    let attempt = match acquire(
        &Resource::new("attempt", &attempt_path),
        Mode::Ex,
        Wait::Try,
        DEFAULT_KILL_WAIT_MS,
    ) {
        Acquire::Acquired(handle) => handle,
        Acquire::Held { .. } | Acquire::Timeout { .. } => {
            return Err(DispatchError::new(
                "attempt-in-flight",
                format!(
                    "attempt {attempt_str} of {} is already held by another process",
                    assignment_dir.display()
                ),
            )
            .with("assignmentDir", json!(text(assignment_dir)))
            .with("attemptStr", json!(attempt_str)));
        }
        Acquire::Unavailable { reason, detail } => {
            return Err(DispatchError::new(
                "lock-driver-unavailable",
                format!("attempt: {detail}"),
            )
            .with("reason", json!(reason.as_str())));
        }
    };
    let custody_given = custody.is_some();
    let mut cwd_lease = custody;
    if mutating && !custody_given {
        let admitted = {
            // The order check (attempt before dispatch-cwd) runs against a scope that holds the attempt lock.
            let scope = LockScope::seeded(vec![BorrowedHandle::new(&attempt)
                .map_err(|e| DispatchError::new("lock-handle-invalid", e.to_string()))?])
            .map_err(|e| DispatchError::new("lock-registry-invalid", e.to_string()))?;
            admit_successor(&scope, fgos_dir, cwd)
        };
        cwd_lease = Some(admitted?);
    }
    Ok(AttemptLocks {
        attempt: Some(attempt),
        cwd_lease,
        cwd_lease_is_custody: custody_given,
    })
}

/// The supervisor started for an envelope.
#[derive(Debug)]
pub struct StartedSupervisor {
    pub child: Child,
    pub hands_over_locks: bool,
}

/// Start the supervisor for `envelope`. Unix: the lock descriptions in `handover` go over as descriptors 3 (and
/// 4); the controller keeps cwd custody through commit, closing only the attempt copy at binding. Windows: the
/// controller releases the attempt copy after spawn; its existing helper keeps the cwd lease and the
/// supervisor declares its job on that same lease without reacquiring. When nothing was started, the secrets
/// and the control token have no reader, so the side file does not stay on disk.
pub fn start_supervisor(
    envelope: &Value,
    handover: &[&fs::File],
    step_env: &Map<String, Value>,
    extra_env: &Map<String, Value>,
) -> io::Result<StartedSupervisor> {
    let run_dir = PathBuf::from(envelope["runDir"].as_str().unwrap_or_default());
    let side_file = envelope["sideFile"].as_str().map(PathBuf::from);
    let result = spawn_supervisor(envelope, &run_dir, handover, step_env, extra_env);
    if result.is_err() {
        if let Some(side) = side_file {
            let _ = fs::remove_file(side);
        }
    }
    result
}

fn spawn_supervisor(
    envelope: &Value,
    run_dir: &Path,
    handover: &[&fs::File],
    step_env: &Map<String, Value>,
    extra_env: &Map<String, Value>,
) -> io::Result<StartedSupervisor> {
    let mut log_options = fs::OpenOptions::new();
    log_options.create(true).append(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        log_options.mode(0o600);
    }
    let log = log_options.open(run_dir.join("supervisor.log"))?;
    let mut command = Command::new(envelope["hostBin"].as_str().unwrap_or_default());
    command
        .args(["internal", "supervise", "--envelope"])
        .arg(run_dir.join("envelope.json"))
        .args(["--protocol", &PROTOCOL.to_string()])
        .current_dir(run_dir)
        .env_clear()
        .stdin(Stdio::null())
        .stdout(Stdio::from(log.try_clone()?))
        .stderr(Stdio::from(log));
    for (name, value) in step_env.iter().chain(extra_env.iter()) {
        if let Some(value) = value.as_str() {
            command.env(name, value);
        }
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // SAFETY: setsid is async-signal-safe; the supervisor leads its own session, detached from this one.
        unsafe {
            command.pre_exec(|| {
                if libc::setsid() < 0 {
                    Err(io::Error::last_os_error())
                } else {
                    Ok(())
                }
            });
        }
        let map: Vec<(fgos_process::FdSlot, &fs::File)> = handover
            .iter()
            .enumerate()
            .map(|(i, file)| (fgos_process::FdSlot(3 + i as u32), *file))
            .collect();
        let child = fgos_process::control::spawn_with_fds(command, &map)?;
        Ok(StartedSupervisor {
            child,
            hands_over_locks: true,
        })
    }
    #[cfg(windows)]
    {
        let _ = handover;
        use std::os::windows::process::CommandExt;
        // CREATE_NEW_PROCESS_GROUP | DETACHED_PROCESS | CREATE_NO_WINDOW
        command.creation_flags(0x0000_0200 | 0x0000_0008 | 0x0800_0000);
        Ok(StartedSupervisor {
            child: command.spawn()?,
            hands_over_locks: false,
        })
    }
}

/// Follows the capture files by offset. The agent writes these files, so each look reads at most
/// `TAIL_CHUNK_BYTES` and never follows a link; a multibyte character that straddles two looks is held back
/// until its rest arrives.
pub struct CaptureTail {
    paths: [PathBuf; 2],
    offsets: [u64; 2],
    pending: [Vec<u8>; 2],
}

pub fn capture_tail(paths: &AttemptPaths) -> CaptureTail {
    CaptureTail {
        paths: [paths.stdout.clone(), paths.stderr.clone()],
        offsets: [0; 2],
        pending: [Vec::new(), Vec::new()],
    }
}

fn open_agent_file(path: &Path) -> io::Result<fs::File> {
    let mut options = fs::OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    let file = options.open(path)?;
    if !file.metadata()?.is_file() {
        return Err(io::Error::other(format!(
            "not a regular file: {}",
            path.display()
        )));
    }
    Ok(file)
}

/// The longest prefix of `bytes` that is whole UTF-8 (the rest is an incomplete sequence at the end).
fn complete_utf8_len(bytes: &[u8]) -> usize {
    match std::str::from_utf8(bytes) {
        Ok(_) => bytes.len(),
        Err(error) if error.error_len().is_none() => error.valid_up_to(),
        Err(_) => bytes.len(),
    }
}

impl CaptureTail {
    /// One look at both files: new text goes to `on_chunk(stream, text)` (`stdout` then `stderr`).
    pub fn follow(&mut self, on_chunk: &mut dyn FnMut(&str, &str)) {
        for (index, stream) in ["stdout", "stderr"].into_iter().enumerate() {
            let Ok(mut file) = open_agent_file(&self.paths[index]) else {
                continue;
            };
            let Ok(size) = file.metadata().map(|m| m.len()) else {
                continue;
            };
            if size <= self.offsets[index] {
                continue;
            }
            let length = (size - self.offsets[index]).min(TAIL_CHUNK_BYTES);
            let mut buffer = vec![0u8; length as usize];
            if file.seek(SeekFrom::Start(self.offsets[index])).is_err() {
                continue;
            }
            let Ok(read) = file.read(&mut buffer) else {
                continue;
            };
            self.offsets[index] += read as u64;
            self.pending[index].extend_from_slice(&buffer[..read]);
            let whole = complete_utf8_len(&self.pending[index]);
            let chunk: Vec<u8> = self.pending[index].drain(..whole).collect();
            let chunk = String::from_utf8_lossy(&chunk);
            if !chunk.is_empty() {
                on_chunk(stream, &chunk);
            }
        }
    }
}

/// The state of a supervisor binding wait.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Binding {
    Bound,
    /// Ended without a binding.
    Exited {
        exit: Option<i32>,
        signal: Option<i32>,
    },
    /// Alive, none in time.
    Unknown,
}

/// Wait for the supervisor's binding.
pub fn wait_for_binding(run_dir: &Path, child: &mut Child, timeout_ms: u64) -> Binding {
    let binding = run_dir.join("supervisor-binding.json");
    let deadline = Instant::now() + Duration::from_millis(timeout_ms);
    while Instant::now() < deadline {
        if binding.exists() {
            return Binding::Bound;
        }
        if let Ok(Some(status)) = child.try_wait() {
            // The binding may have been published just before it exited.
            return if binding.exists() {
                Binding::Bound
            } else {
                Binding::Exited {
                    exit: status.code(),
                    signal: signal_of(&status),
                }
            };
        }
        std::thread::sleep(POLL);
    }
    if binding.exists() {
        Binding::Bound
    } else {
        Binding::Unknown
    }
}

#[cfg(unix)]
fn signal_of(status: &std::process::ExitStatus) -> Option<i32> {
    use std::os::unix::process::ExitStatusExt;
    status.signal()
}
#[cfg(not(unix))]
fn signal_of(_status: &std::process::ExitStatus) -> Option<i32> {
    None
}

/// The result is written by the first step; the supervisor still runs the steps after it and holds the attempt
/// lock until it wrote `closed.json`. The next dispatch over the same cwd or attempt must not meet that tail, so
/// the controller waits for it (bounded: a stuck step never holds the caller).
fn wait_for_closed(run_dir: &Path, child: &mut Child, timeout_ms: u64) -> bool {
    let closed = run_dir.join("closed.json");
    let deadline = Instant::now() + Duration::from_millis(timeout_ms);
    while Instant::now() < deadline {
        if matches!(child.try_wait(), Ok(Some(_))) {
            return closed.exists();
        }
        std::thread::sleep(POLL);
    }
    closed.exists()
}

/// After the binding: read progress, wait for the settled result. If the supervisor ends before the result
/// exists, the adopt door (`adopt_run`, answering its state word) finishes whatever it left, then the result is
/// read again. Returns the settled result, or `None` when nothing settled it.
pub fn await_settled_result(
    run_dir: &Path,
    attempt_id: &str,
    child: &mut Child,
    ceiling_ms: u64,
    on_chunk: &mut dyn FnMut(&str, &str),
    read_settled_result: &dyn Fn(&Path) -> Option<Value>,
    adopt_run: &dyn Fn(&Path) -> Result<String, String>,
) -> Option<Value> {
    let mut follow = capture_tail(&attempt_paths(run_dir, attempt_id));
    let give_up_at = Instant::now() + Duration::from_millis(ceiling_ms);
    // The gate ends the agent by its hard ceiling, so an attempt that is still alive past ours is stuck.
    let hard_give_up_at = give_up_at + Duration::from_millis(ADOPT_WAIT_MS);
    loop {
        follow.follow(on_chunk);
        if let Some(result) = read_settled_result(run_dir) {
            follow.follow(on_chunk);
            wait_for_closed(run_dir, child, CLOSE_WAIT_MS);
            return Some(result);
        }
        let supervisor_gone = matches!(child.try_wait(), Ok(Some(_)));
        if supervisor_gone || Instant::now() >= give_up_at {
            // No supervisor left to write the answer: the adopt door judges the attempt and finishes its steps; an
            // agent that still lives (the gate holds the attempt lock) is waited for here.
            let Ok(state) = adopt_run(run_dir) else {
                return read_settled_result(run_dir);
            };
            let waiting = matches!(
                state.as_str(),
                "running" | "being-adopted" | "held" | "needs-adopt"
            );
            if !waiting || Instant::now() >= hard_give_up_at {
                return read_settled_result(run_dir);
            }
            std::thread::sleep(ADOPT_POLL);
            continue;
        }
        std::thread::sleep(POLL);
    }
}
