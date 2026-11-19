//! The run supervisor, trust and runtime-directory doctor rows. The host is the run supervisor's own binary, so
//! the route row asks the running executable (the same `internal <route> --probe` question the supervisor answers
//! for any caller); every other judgement reads through the run supervisor's controller door
//! (`fgos_run_supervisor::controller`): the runtime socket directory, the attempt scan, the dispatch config keys
//! and the agent CLIs' trust stores. A row only reads. The one fix, `runtime-socket-dir`, creates or tightens the
//! socket directory.
//!
//! Levels follow the doctor convention: `passed: false` fails, a message that starts with `warning:` warns,
//! `info:` is informational, a `skip` status skips, anything else passes.

use super::{judged, project_root_refusal, Rows};
use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::process_env;
use crate::wiring::seat_binding::HostMachine;
use fgos_distribution::doctor::{timed, FixResult, RowOutcome, RowResult, Status};
use fgos_execution::checks::{agy_sub_homes_configured, cleaned, SubHomes};
use fgos_execution::decide::{check_loaded_runner, Workspace};
use fgos_execution::ports::Machine;
use fgos_run_supervisor::controller::adopt_scan::adopt_scan;
use fgos_run_supervisor::controller::config::{
    read_dispatch_config, resolve_cancel_wait, resolve_gate_kill_grace, CANCEL_WAIT_KEY,
    GATE_KILL_GRACE_KEY,
};
use fgos_run_supervisor::controller::runtime_dir::{
    ensure_runtime_socket_dir, resolve_runtime_socket_dir, RuntimeDirError, SOCKET_NAME_BYTES,
    SOCKET_PATH_MAX_BYTES,
};
use fgos_run_supervisor::controller::trust_store::{
    default_agy_settings_path, operator_claude_store_path, read_agy_store, read_agy_trust,
    read_codex_trust,
};
use serde_json::Value;
use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::time::Duration;

pub const ROWS: &[&str] = &[
    "run-supervisor-route",
    "runtime-socket-dir",
    "run-attempts-stuck",
    "run-supervisor-config",
    "trust-store-readable",
    "non-claude-trust-stores-readable",
    "agent-cli-project-trusted",
];

pub const FIXES: &[&str] = &["runtime-socket-dir"];

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

/// The routes the host serves for the run supervisor, and the protocol it answers them at.
const ROUTES: [&str; 4] = ["supervise", "gate", "adopt", "attempt-step"];
const PROTOCOL: u32 = 1;
const PROBE_TIMEOUT: Duration = Duration::from_secs(15);
const MAX_LISTED: usize = 5;

/// One row's answer before the engine reads its level: the message may carry `warning:` or `info:`.
struct Check {
    passed: bool,
    skip: bool,
    message: String,
}

fn pass(message: impl Into<String>) -> Check {
    Check {
        passed: true,
        skip: false,
        message: message.into(),
    }
}

fn fail(message: impl Into<String>) -> Check {
    Check {
        passed: false,
        skip: false,
        message: message.into(),
    }
}

fn skipped(message: impl Into<String>) -> Check {
    Check {
        passed: true,
        skip: true,
        message: message.into(),
    }
}

fn warn(text: &str) -> String {
    format!("warning: {text}")
}

fn info(text: &str) -> String {
    format!("info: {text}")
}

fn row(check: Check) -> RowOutcome {
    if check.skip {
        return RowOutcome::Judged(RowResult {
            elapsed_ms: None,
            passed: true,
            status: Some(Status::Skip),
            message: Some(check.message),
            fix_command: None,
            detail: None,
        });
    }
    judged(check.passed, check.message)
}

fn listed(items: &[String]) -> String {
    let head = items
        .iter()
        .take(MAX_LISTED)
        .cloned()
        .collect::<Vec<_>>()
        .join("; ");
    if items.len() > MAX_LISTED {
        format!("{head}; and {} more", items.len() - MAX_LISTED)
    } else {
        head
    }
}

fn env_value(env: &[(String, String)], key: &str) -> Option<String> {
    env.iter().find(|(k, _)| k == key).map(|(_, v)| v.clone())
}

fn home_of(env: &[(String, String)]) -> PathBuf {
    fgos_config::machine::home_dir(|key| env_value(env, key)).unwrap_or_default()
}

fn platform() -> &'static str {
    match std::env::consts::OS {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    }
}

// ---- run-supervisor-route --------------------------------------------------------------------------------

/// `fgos internal <route> --protocol 1 --probe`: the parsed answer line, or why there is none.
fn probe_route(bin: &Path, route: &str, env: &[(String, String)]) -> Result<Value, String> {
    let env: Vec<(String, String)> = env
        .iter()
        .filter(|(k, _)| k != "FGOS_INVOCATION_RECORD_PATH")
        .cloned()
        .collect();
    let args = [
        "internal".to_owned(),
        route.to_owned(),
        "--protocol".to_owned(),
        PROTOCOL.to_string(),
        "--probe".to_owned(),
    ];
    let outcome = fgos_process::spawn::run_bounded(bin, args, &env, None, None, PROBE_TIMEOUT);
    let output = match outcome {
        Err(error) => return Err(format!("no answer ({error})")),
        Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => {
            return Err("no answer (ETIMEDOUT)".to_owned())
        }
        Ok(fgos_process::spawn::Outcome::Exited(output)) => output,
    };
    let stdout = String::from_utf8_lossy(&output.stdout);
    let line: Option<Value> = stdout
        .lines()
        .find(|text| !text.trim().is_empty())
        .and_then(|text| serde_json::from_str(text).ok());
    if let Some(line) = &line {
        if line["result"] == "ok" && line["route"] == route && line["protocol"] == PROTOCOL {
            return Ok(line.clone());
        }
    }
    if line
        .as_ref()
        .is_some_and(|l| l["code"] == "host-version-mismatch")
        || output.status.code() == Some(3)
    {
        return Err(format!(
            "refused protocol {PROTOCOL} (host-version-mismatch)"
        ));
    }
    let how = match output.status.code() {
        Some(code) => format!("exit {code}"),
        None => "signal".to_owned(),
    };
    Err(format!("no answer ({how})"))
}

/// The containment driver the host runs agents in on this machine, its level and the routes around it, from the
/// answer of the `supervise` probe. `kernel` passes. `best-effort` warns on Linux (no bwrap user namespace: the
/// process-group driver runs instead) and is informational elsewhere. Anything else fails.
fn containment_of(answer: &Value, platform: &str) -> Check {
    let containment = &answer["containment"];
    let text = |key: &str| containment[key].as_str().map(str::to_owned);
    let driver = text("driver").unwrap_or_else(|| "null".to_owned());
    let escapes: Vec<String> = containment["escapes"]
        .as_array()
        .map(|list| {
            list.iter()
                .filter_map(|e| e.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default();
    let escape_text = if escapes.is_empty() {
        String::new()
    } else {
        format!("; escapes: {}", listed(&escapes))
    };
    match containment["level"].as_str() {
        Some("kernel") => pass(format!("{driver}, level kernel{escape_text}")),
        Some("best-effort") if platform == "linux" => {
            let because = text("selectedBecause");
            if let Some(line) = because
                .as_deref()
                .and_then(|b| b.strip_prefix("containment-mount-refused:"))
            {
                return pass(warn(&format!("{driver}, level best-effort: a host mount cannot be remounted ({}); unmount or fix it, then restart long-running fgOS processes (gateway, supervisors), which keep the answer they probed at start, to get kernel containment{escape_text}", line.trim())));
            }
            let reason = because
                .map(|b| format!("({b})"))
                .unwrap_or_else(|| "(no bwrap, or user namespaces are disabled)".to_owned());
            pass(warn(&format!("{driver}, level best-effort: bwrap with a user namespace is unavailable here {reason}, so agents run in a process group{escape_text}. Install bwrap and enable unprivileged user namespaces for kernel containment")))
        }
        Some("best-effort") => pass(info(&format!("{driver}, level best-effort{escape_text}"))),
        _ => fail(format!(
            "no containment driver on this machine ({}); fgos run cannot start an agent. Rebuild the host from this checkout (`npm run fgos:dev`) or restage the active release, then run `fgos doctor`",
            text("error").unwrap_or_else(|| "unsupported".to_owned())
        )),
    }
}

/// The host binary answers `--probe` on every route of the run supervisor at protocol 1, and the `supervise`
/// answer names a usable containment driver: one probe of that route serves both.
fn run_supervisor_route(bin: &Path, platform: &str, env: &[(String, String)]) -> Check {
    let mut missing = Vec::new();
    let mut supervise = None;
    for route in ROUTES {
        match probe_route(bin, route, env) {
            Err(error) => missing.push(format!("{route}: {error}")),
            Ok(answer) if route == "supervise" => supervise = Some(answer),
            Ok(_) => {}
        }
    }
    let bin_text = bin.display();
    let Some(supervise) = supervise.filter(|_| missing.is_empty()) else {
        return fail(format!("{bin_text} does not serve the run supervisor at protocol {PROTOCOL} ({}); restage and activate a release built from this tree", listed(&missing)));
    };
    let containment = containment_of(&supervise, platform);
    if !containment.passed {
        return containment;
    }
    // The containment text keeps its own level prefix; the row carries it in front.
    let level = ["warning: ", "info: "]
        .into_iter()
        .find(|prefix| containment.message.starts_with(prefix))
        .unwrap_or("");
    pass(format!(
        "{level}{bin_text} serves {} at protocol {PROTOCOL}; containment: {}",
        ROUTES.join(", "),
        &containment.message[level.len()..]
    ))
}

// ---- runtime-socket-dir ----------------------------------------------------------------------------------

enum SocketDir {
    Fine(PathBuf),
    Missing(PathBuf),
    Loose(PathBuf, String),
    Wrong(String),
    TooLong(String),
}

#[cfg(unix)]
fn socket_dir_state(env: &[(String, String)], uid: u32) -> SocketDir {
    use std::os::unix::fs::MetadataExt;
    let dir = resolve_runtime_socket_dir(&|key| env_value(env, key), uid);
    if dir.as_os_str().len() + 1 + SOCKET_NAME_BYTES > SOCKET_PATH_MAX_BYTES {
        return SocketDir::TooLong(format!(
            "{} leaves no room for a socket name within {SOCKET_PATH_MAX_BYTES} bytes (shorten XDG_RUNTIME_DIR)",
            dir.display()
        ));
    }
    let meta = match std::fs::symlink_metadata(&dir) {
        Ok(meta) => meta,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return SocketDir::Missing(dir)
        }
        Err(error) => {
            let code = error.raw_os_error().map(|c| c.to_string());
            return SocketDir::Wrong(format!(
                "{} unreadable ({})",
                dir.display(),
                code.unwrap_or_else(|| error.to_string())
            ));
        }
    };
    if !meta.is_dir() {
        return SocketDir::Wrong(format!("{} is not a directory", dir.display()));
    }
    if meta.uid() != uid {
        return SocketDir::Wrong(format!(
            "{} is owned by uid {}, not {uid}",
            dir.display(),
            meta.uid()
        ));
    }
    if meta.mode() & 0o077 != 0 {
        let text = format!(
            "{} mode {:o} allows group or other access (should be 700)",
            dir.display(),
            meta.mode() & 0o777
        );
        return SocketDir::Loose(dir, text);
    }
    SocketDir::Fine(dir)
}

/// The runtime socket directory exists, is a real directory of this user and is 0700.
#[cfg(unix)]
fn runtime_socket_dir(env: &[(String, String)], uid: u32) -> Check {
    match socket_dir_state(env, uid) {
        SocketDir::Wrong(problem) | SocketDir::TooLong(problem) => fail(format!(
            "{problem} -- fix it by hand, doctor --fix does not touch it"
        )),
        SocketDir::Loose(_, problem) => fail(format!("{problem} -- run \"fgos doctor --fix\"")),
        SocketDir::Missing(dir) => pass(warn(&format!(
            "{} does not exist yet (fgos doctor --fix creates it)",
            dir.display()
        ))),
        SocketDir::Fine(dir) => pass(format!("{} is 0700 and owned by uid {uid}", dir.display())),
    }
}

#[cfg(not(unix))]
fn runtime_socket_dir(_env: &[(String, String)], _uid: u32) -> Check {
    pass(info("no runtime socket directory on this platform"))
}

#[cfg(unix)]
fn fix_runtime_socket_dir(env: &[(String, String)], uid: u32) -> (bool, String) {
    use std::os::unix::fs::PermissionsExt;
    let before = socket_dir_state(env, uid);
    if let SocketDir::Loose(dir, _) = &before {
        return match std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o700)) {
            Ok(()) => (true, format!("set {} to 0700", dir.display())),
            Err(error) => (false, format!("{}: {error}", dir.display())),
        };
    }
    match ensure_runtime_socket_dir(&|key| env_value(env, key), uid) {
        Ok(dir) => match before {
            SocketDir::Missing(_) => (true, format!("created {} (0700)", dir.display())),
            _ => (false, format!("{} already in order", dir.display())),
        },
        Err(RuntimeDirError { message, .. }) => (false, message),
    }
}

#[cfg(not(unix))]
fn fix_runtime_socket_dir(_env: &[(String, String)], _uid: u32) -> (bool, String) {
    (
        false,
        "no runtime socket directory on this platform".to_owned(),
    )
}

fn current_uid() -> u32 {
    fgos_run_supervisor::controller::runtime_dir::current_uid()
}

// ---- run-attempts-stuck ----------------------------------------------------------------------------------

/// A read-only pointer: supervised attempts with no `closed.json` whose lock nobody holds. The supervisor's own
/// scan judges each attempt (probe only, no lock taken, nothing adopted); a warning, never a failure.
fn run_attempts_stuck(root: &Path) -> Check {
    let assignments = PathBuf::from(fgos_execution::runner_config::fgos_dir_from_root(
        &root.to_string_lossy(),
    ))
    .join("assignments");
    let verdicts = adopt_scan(&assignments, true, None);
    let supervised: Vec<_> = verdicts
        .iter()
        .filter(|(_, verdict)| verdict.state != "legacy-run")
        .collect();
    let stuck: Vec<_> = supervised
        .iter()
        .filter(|(_, verdict)| verdict.state == "needs-adopt")
        .collect();
    if stuck.is_empty() {
        return pass(if supervised.is_empty() {
            "no attempt waits to be closed".to_owned()
        } else {
            format!("{} open attempt(s), all running", supervised.len())
        });
    }
    let gone: Vec<String> = stuck
        .iter()
        .filter(|(_, verdict)| verdict.adoptable == Some(false))
        .map(|(dir, verdict)| {
            let missing = verdict
                .gone
                .iter()
                .map(|p| format!("{p} is gone"))
                .collect::<Vec<_>>()
                .join(", ");
            format!("{} (the release that wrote it was removed ({missing}) and the envelope binds its steps to that host and payload, so adopt cannot run them: restore them at those paths, then run \"fgos run\" again)", dir.display())
        })
        .collect();
    let gone_text = if gone.is_empty() {
        String::new()
    } else {
        format!(
            "; {} cannot be closed by adopt: {}",
            gone.len(),
            listed(&gone)
        )
    };
    pass(warn(&format!("{} attempt(s) have no holder and no closed.json; the next `fgos run` adopts them, or run `fgos dispatch recover`{gone_text}", stuck.len())))
}

// ---- run-supervisor-config -------------------------------------------------------------------------------

/// `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs` after the config merge, value and source of each; the
/// one rule judged here is across the two keys: a cancel wait shorter than the grace makes the controller leave
/// before the gate can finish stopping the agent.
fn run_supervisor_config(root: &Path, global_config_path: Option<&Path>) -> Check {
    let project = std::fs::canonicalize(root).unwrap_or_else(|_| root.to_path_buf());
    let read = read_dispatch_config(Some(&project), global_config_path).and_then(|snapshot| {
        Ok((
            resolve_gate_kill_grace(&snapshot)?,
            resolve_cancel_wait(&snapshot)?,
        ))
    });
    let (grace, wait) = match read {
        Ok(pair) => pair,
        Err(error) => {
            return fail(format!(
                "{GATE_KILL_GRACE_KEY} and {CANCEL_WAIT_KEY} unreadable: {error}"
            ))
        }
    };
    if wait.value < grace.value {
        return fail(format!("{CANCEL_WAIT_KEY} = {} ({}) is shorter than {GATE_KILL_GRACE_KEY} = {} ({}): a stopped controller would leave before the gate can finish stopping the agent", wait.value, wait.source, grace.value, grace.source));
    }
    pass(format!(
        "{GATE_KILL_GRACE_KEY} = {} ({}); {CANCEL_WAIT_KEY} = {} ({})",
        grace.value, grace.source, wait.value, wait.source
    ))
}

// ---- the runner config -----------------------------------------------------------------------------------

/// The runner config as the runner loads it (after its semantic check), or why it does not load.
fn load_runner_config(root: &Path) -> Result<Value, String> {
    if let Some(refusal) = project_root_refusal(root) {
        return Err(refusal.to_owned());
    }
    let loaded = HostWorkspace {
        process_cwd: root.to_path_buf(),
    }
    .load_runner(&root.to_string_lossy())
    .map_err(|failure| failure.message().to_owned())?;
    check_loaded_runner(loaded, &root.to_string_lossy())
        .map(|(runner, _)| runner)
        .map_err(|failure| failure.message().to_owned())
}

fn entries(value: Option<&Value>) -> impl Iterator<Item = (&String, &Value)> {
    value.and_then(Value::as_object).into_iter().flatten()
}

fn invocations(executor: &Value) -> impl Iterator<Item = &Value> {
    executor
        .get("invocations")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
}

fn trimmed(value: Option<&Value>) -> Option<&str> {
    value
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty())
}

// ---- trust-store-readable --------------------------------------------------------------------------------

/// The folder-trust store must be readable and well-formed, or every dispatch into a fresh worktree stops at a
/// trust dialog with nobody there to answer it.
fn trust_store_readable(store: &Path) -> Check {
    let raw = match std::fs::read_to_string(store) {
        Ok(raw) => raw,
        // claude installed but never run has no store yet: normal for a new user, so a warning with the next step.
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return pass(format!("warning: no trust store at {} yet, claude creates it on first run; run `claude` once, then `fgos doctor`", store.display()))
        }
        Err(error) => {
            return fail(format!(
                "trust store at {} is unreadable: {error}",
                store.display()
            ))
        }
    };
    match serde_json::from_str::<Value>(&raw) {
        Ok(parsed) => match parsed.get("projects").and_then(Value::as_object) {
            Some(projects) => pass(format!(
                "trust store at {} is readable ({} entries)",
                store.display(),
                projects.len()
            )),
            None => fail(format!(
                "trust store at {} has no usable \"projects\" object -- its shape has changed",
                store.display()
            )),
        },
        Err(error) => fail(format!(
            "trust store at {} is not valid JSON: {error}",
            store.display()
        )),
    }
}

// ---- non-claude-trust-stores-readable --------------------------------------------------------------------

/// Every executor or invocation declaring a `codex-toml` or `agy`/`agy-json` trust store reads from a store that
/// is actually readable: the same read a live dispatch will do.
fn trust_stores_readable(cwd: &Path, runner: &Value, home: &Path) -> Check {
    let project = absolute(cwd);
    let mut problems = Vec::new();
    let mut notes = Vec::new();
    let mut seen: Vec<String> = Vec::new();
    for (id, executor) in entries(runner.get("executors")) {
        for inv in invocations(executor) {
            let Some(store) = inv.pointer("/interactiveMode/trustStore") else {
                continue;
            };
            let kind = store.get("kind").and_then(Value::as_str).unwrap_or("");
            if !matches!(kind, "codex-toml" | "agy" | "agy-json") {
                continue;
            }
            let env = inv.get("env");
            let env_str = |key: &str| env.and_then(|e| e.get(key)).and_then(Value::as_str);
            let declared = store.get("path").and_then(Value::as_str);
            let store_path = match (kind, declared) {
                (_, Some(path)) => PathBuf::from(path),
                ("codex-toml", None) => env_str("CODEX_HOME")
                    .map(PathBuf::from)
                    .unwrap_or_else(|| home.join(".codex"))
                    .join("config.toml"),
                (_, None) => default_agy_settings_path(
                    &env_str("HOME")
                        .map(PathBuf::from)
                        .unwrap_or(home.to_path_buf()),
                ),
            };
            let key = format!("{kind}:{}", store_path.display());
            if seen.contains(&key) {
                continue;
            }
            seen.push(key);
            let label = format!(
                "executor \"{id}\" invocation \"{}\"",
                inv.get("id").and_then(Value::as_str).unwrap_or("?")
            );
            let read = if kind == "codex-toml" {
                read_codex_trust(&store_path, &project.to_string_lossy()).map(|_| ())
            } else {
                read_agy_store(&store_path).map(|_| ())
            };
            match read {
                Ok(()) => notes.push(format!(
                    "{label}: {kind} trust store at {} is readable",
                    store_path.display()
                )),
                Err(error) => problems.push(format!(
                    "{label}: {kind} trust store at {} is unreadable ({})",
                    store_path.display(),
                    error.message
                )),
            }
        }
    }
    if !problems.is_empty() {
        return fail(problems.join("; "));
    }
    pass(if notes.is_empty() {
        "no codex-toml or agy trust store declared".to_owned()
    } else {
        notes.join("; ")
    })
}

// ---- agent-cli-project-trusted ---------------------------------------------------------------------------

fn absolute(path: &Path) -> PathBuf {
    cleaned(&if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    })
}

/// `~`, `${HOME}` and `$HOME` at the start of a sub-HOME path stand for the person's home.
fn expand_home(raw: &str, home: &str) -> String {
    for prefix in ["${HOME}", "$HOME", "~"] {
        if let Some(rest) = raw.strip_prefix(prefix) {
            if rest.is_empty() || rest.starts_with('/') {
                return format!("{home}{rest}");
            }
        }
    }
    raw.to_owned()
}

/// What the agy sub-HOME finder reads of the machine, remembering each resolved sub-HOME it is asked about.
struct RecordingHomes {
    home: String,
    asked: RefCell<Vec<String>>,
}

impl SubHomes for RecordingHomes {
    fn home(&self) -> String {
        self.home.clone()
    }

    fn resolve(&self, path: &str) -> String {
        absolute(Path::new(path)).to_string_lossy().into_owned()
    }

    fn is_dir(&self, path: &str) -> bool {
        self.asked.borrow_mut().push(path.to_owned());
        true
    }
}

/// The agy sub-HOMEs the executor config and the gemini accounts name, through the one finder the sub-HOME row
/// judges with.
fn agy_sub_homes(runner: &Value, home: &str) -> Vec<String> {
    let homes = RecordingHomes {
        home: home.to_owned(),
        asked: RefCell::new(Vec::new()),
    };
    let _ = agy_sub_homes_configured(runner, &homes);
    homes.asked.into_inner()
}

fn project_variants(cwd: &Path) -> Vec<String> {
    let mut variants = vec![absolute(cwd).to_string_lossy().into_owned()];
    if let Ok(real) = std::fs::canonicalize(cwd) {
        let real = real.to_string_lossy().into_owned();
        if !variants.contains(&real) {
            variants.push(real);
        }
    }
    variants
}

/// `true` when any spelling of the project path is trusted, `false` when an entry exists but does not trust it,
/// `None` when there is no entry.
fn any_trust<E>(
    read: impl Fn(&str) -> Result<Option<bool>, E>,
    variants: &[String],
) -> Result<Option<bool>, E> {
    let mut saw_entry = false;
    for variant in variants {
        match read(variant)? {
            Some(true) => return Ok(Some(true)),
            Some(false) => saw_entry = true,
            None => {}
        }
    }
    Ok(saw_entry.then_some(false))
}

fn summarize_labels(labels: &[String]) -> String {
    if labels.len() > 3 {
        format!("{} and {} more", labels[..3].join(", "), labels.len() - 3)
    } else {
        labels.join(", ")
    }
}

/// The CLI is the agent the trust store belongs to, found by that name or, when the config declares a path to it,
/// by that path. The program an invocation starts may be a confinement wrapper such as bwrap.
fn cli_installed(machine: &dyn Machine, name: &str, declared: Option<&str>) -> bool {
    machine.on_path(name)
        || declared.is_some_and(|command| {
            Path::new(command)
                .file_name()
                .is_some_and(|base| base == name)
                && machine.on_path(command)
        })
}

/// The config.toml of every codex home a configured executor runs under, deduplicated, each with the executors
/// that use it, in declaration order.
fn codex_configs(
    runner: &Value,
    home: &Path,
    machine: &dyn Machine,
    not_installed: &mut Vec<&'static str>,
) -> Vec<(String, Vec<String>)> {
    let mut found: Vec<(String, Vec<String>)> = Vec::new();
    let home_text = home.to_string_lossy();
    for (id, executor) in entries(runner.get("executors")) {
        for inv in invocations(executor) {
            let env_home = trimmed(inv.pointer("/env/CODEX_HOME")).map(|raw| {
                absolute(Path::new(&expand_home(raw, &home_text)))
                    .join("config.toml")
                    .to_string_lossy()
                    .into_owned()
            });
            let store = inv.pointer("/interactiveMode/trustStore");
            let config_path = if store.and_then(|s| s.get("kind")).and_then(Value::as_str)
                == Some("codex-toml")
            {
                Some(
                    store
                        .and_then(|s| s.get("path"))
                        .and_then(Value::as_str)
                        .map(str::to_owned)
                        .or(env_home)
                        .unwrap_or_else(|| {
                            home.join(".codex")
                                .join("config.toml")
                                .to_string_lossy()
                                .into_owned()
                        }),
                )
            } else {
                env_home
            };
            let Some(config_path) = config_path else {
                continue;
            };
            let command = inv.get("command").and_then(Value::as_str);
            // A CLI this machine does not have shows no trust prompt, so its home is nobody's to judge.
            if !cli_installed(machine, "codex", command) {
                if !not_installed.contains(&"codex") {
                    not_installed.push("codex");
                }
                continue;
            }
            let label = format!(
                "{id}/{}",
                inv.get("id").and_then(Value::as_str).unwrap_or("?")
            );
            match found.iter_mut().find(|(path, _)| *path == config_path) {
                Some((_, labels)) => {
                    if !labels.contains(&label) {
                        labels.push(label);
                    }
                }
                None => found.push((config_path, vec![label])),
            }
        }
    }
    found
}

/// Has each agent CLI the project's executors run under been told to trust THIS project folder? Read-only and
/// credential-safe: the stores are read only through the trust store door's readers, which answer a yes/no for
/// one path and surface nothing else. Nothing is ever written; the fix is a line the person adds.
fn agent_cli_project_trusted(
    cwd: &Path,
    runner: Result<Value, String>,
    home: &Path,
    machine: &dyn Machine,
) -> Check {
    if !cwd.join(".git").exists() {
        return pass("not applicable: the project root is not a git repository, so agent CLIs do not ask to trust it");
    }
    let runner = match runner {
        Ok(runner) => runner,
        Err(error) => {
            return pass(format!("not applicable: runner config not loadable here, agent CLI trust not evaluated ({error})"))
        }
    };
    let variants = project_variants(cwd);
    let root = variants[0].clone();
    let mut not_installed: Vec<&'static str> = Vec::new();
    let codex = codex_configs(&runner, home, machine, &mut not_installed);
    let agy: Vec<String> = agy_sub_homes(&runner, &home.to_string_lossy())
        .into_iter()
        .filter(|_| {
            if cli_installed(machine, "agy", None) {
                return true;
            }
            if !not_installed.contains(&"agy") {
                not_installed.push("agy");
            }
            false
        })
        .collect();
    if codex.is_empty() && agy.is_empty() {
        if !not_installed.is_empty() {
            not_installed.sort_unstable();
            return skipped(format!(
                "skipped: {} not installed on this machine, so no trust prompt can stop a dispatch",
                not_installed.join(", ")
            ));
        }
        return pass("not applicable: no codex or agy executor is configured");
    }
    let mut problems = Vec::new();
    let mut trusted = Vec::new();
    for (config_path, labels) in &codex {
        let trust = any_trust(|p| read_codex_trust(Path::new(config_path), p), &variants);
        match trust {
            Err(error) => problems.push(format!(
                "codex config {config_path} ({}) could not be read: {}",
                summarize_labels(labels),
                error.message
            )),
            Ok(Some(true)) => trusted.push(format!("codex {config_path}")),
            Ok(other) => {
                let state = if other == Some(false) {
                    "has an entry that is not trusted"
                } else {
                    "has no entry"
                };
                problems.push(format!("codex config {config_path} ({}) {state} for {root}; codex will stop at \"Trust this folder?\" -- add to that file: [projects.\"{root}\"] trust_level = \"trusted\" (fgOS never edits it)", summarize_labels(labels)));
            }
        }
    }
    for resolved in &agy {
        let settings = default_agy_settings_path(Path::new(resolved));
        let trust =
            any_trust::<std::convert::Infallible>(|p| Ok(read_agy_trust(&settings, p)), &variants)
                .unwrap_or(None);
        if trust == Some(true) {
            trusted.push(format!("agy {}", settings.display()));
            continue;
        }
        problems.push(format!("agy settings {} ({resolved}) does not list {root} in trustedWorkspaces; agy will stop at its folder-trust prompt -- add \"{root}\" to the \"trustedWorkspaces\" array in that file (fgOS never edits it)", settings.display()));
    }
    if !problems.is_empty() {
        return fail(problems.join(" | "));
    }
    pass(format!(
        "{root} is trusted in every configured agent CLI home ({})",
        trusted.join(", ")
    ))
}

// ---- the group -------------------------------------------------------------------------------------------

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let env = process_env();
    ids.iter()
        .map(|id| {
            timed(|| match *id {
                "run-supervisor-route" => match std::env::current_exe() {
                    Ok(bin) => row(run_supervisor_route(&bin, platform(), &env)),
                    Err(error) => row(fail(format!(
                        "no host binary to ask for the run supervisor routes: {error}"
                    ))),
                },
                "runtime-socket-dir" => row(runtime_socket_dir(&env, current_uid())),
                "run-attempts-stuck" => row(run_attempts_stuck(root)),
                "run-supervisor-config" => row(run_supervisor_config(root, None)),
                "trust-store-readable" => {
                    let machine = HostMachine::new(None, None);
                    if machine.on_path("claude") {
                        let store = operator_claude_store_path(
                            None,
                            env_value(&env, "CLAUDE_CONFIG_DIR").as_deref(),
                            &home_of(&env),
                        );
                        row(trust_store_readable(&store))
                    } else {
                        row(skipped("skipped: claude is not installed on this machine, so no trust dialog can stop a dispatch"))
                    }
                }
                "non-claude-trust-stores-readable" => match load_runner_config(root) {
                    Ok(runner) => row(trust_stores_readable(root, &runner, &home_of(&env))),
                    Err(error) => row(pass(format!("runner config not loadable here, non-claude trust stores not evaluated: {error}"))),
                },
                "agent-cli-project-trusted" => row(agent_cli_project_trusted(
                    root,
                    load_runner_config(root),
                    &home_of(&env),
                    &HostMachine::new(None, None),
                )),
                other => unreachable!("run supervisor group asked for row {other}"),
            })
        })
        .collect()
}

fn fix(_root: &Path, ids: &[&str]) -> Vec<FixResult> {
    let env = process_env();
    ids.iter()
        .map(|id| match *id {
            "runtime-socket-dir" => {
                let (changed, message) = fix_runtime_socket_dir(&env, current_uid());
                FixResult::done(id, changed, message)
            }
            other => unreachable!("run supervisor group asked for fix {other}"),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::fs;
    use std::sync::atomic::{AtomicU32, Ordering};

    fn temp(name: &str) -> PathBuf {
        static COUNTER: AtomicU32 = AtomicU32::new(0);
        let dir = std::env::temp_dir().join(format!(
            "fgos-doctor-supervisor-{name}-{}-{}",
            std::process::id(),
            COUNTER.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    /// The level the engine would read from a check: failed, warned (`warning:`), informational or passed.
    fn level(check: &Check) -> &'static str {
        if check.skip {
            "skip"
        } else if !check.passed {
            "fail"
        } else if check.message.starts_with("warning:") {
            "warn"
        } else if check.message.starts_with("info:") {
            "info"
        } else {
            "ok"
        }
    }

    struct Path1 {
        present: Vec<&'static str>,
    }

    impl Machine for Path1 {
        fn on_path(&self, program: &str) -> bool {
            self.present.contains(&program)
        }
        fn posture_backend(&self, _id: &str) -> Option<fgos_execution::ports::Backend> {
            None
        }
        fn herdr_present(&self) -> bool {
            false
        }
        fn home_dir(&self) -> Option<String> {
            None
        }
    }

    // ---- containment ----

    #[test]
    fn containment_kernel_passes_best_effort_warns_on_linux_informs_elsewhere_and_no_driver_fails()
    {
        let kernel = json!({"containment": {"driver": "bwrap", "level": "kernel", "escapes": []}});
        let check = containment_of(&kernel, "linux");
        assert_eq!(
            (level(&check), check.message.as_str()),
            ("ok", "bwrap, level kernel")
        );

        let best = json!({"containment": {"driver": "process-group", "level": "best-effort", "escapes": ["setsid"]}});
        let linux = containment_of(&best, "linux");
        assert_eq!(level(&linux), "warn");
        assert!(linux
            .message
            .contains("unavailable here (no bwrap, or user namespaces are disabled)"));
        assert!(linux.message.contains("; escapes: setsid"));
        let darwin = containment_of(&best, "darwin");
        assert_eq!(level(&darwin), "info");

        let mount = json!({"containment": {"driver": "process-group", "level": "best-effort", "escapes": [], "selectedBecause": "containment-mount-refused: /proc busy"}});
        let refused = containment_of(&mount, "linux");
        assert_eq!(level(&refused), "warn");
        assert!(refused
            .message
            .contains("a host mount cannot be remounted (/proc busy)"));

        let none = json!({"containment": {"driver": null, "level": "unsupported", "escapes": [], "error": "no-driver"}});
        let failed = containment_of(&none, "linux");
        assert_eq!(level(&failed), "fail");
        assert!(failed.message.contains("(no-driver)"));
    }

    #[cfg(unix)]
    fn fake_host(dir: &Path, body: &str) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let path = dir.join("host");
        fs::write(&path, format!("#!/bin/sh\n{body}\n")).unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o755)).unwrap();
        path
    }

    #[cfg(unix)]
    #[test]
    fn a_host_that_serves_every_route_names_its_driver_and_one_that_does_not_fails_by_route() {
        let dir = temp("route");
        let serves = fake_host(
            &dir,
            r#"echo "{\"result\":\"ok\",\"route\":\"$2\",\"protocol\":1,\"containment\":{\"driver\":\"bwrap\",\"level\":\"kernel\",\"escapes\":[]}}""#,
        );
        let ok = run_supervisor_route(&serves, "linux", &[]);
        assert_eq!(level(&ok), "ok");
        assert!(ok.message.contains("serves supervise, gate, adopt, attempt-step at protocol 1; containment: bwrap, level kernel"));

        let refuses = fake_host(
            &dir,
            r#"if [ "$2" = adopt ]; then exit 3; fi; echo "{\"result\":\"ok\",\"route\":\"$2\",\"protocol\":1,\"containment\":{\"driver\":\"bwrap\",\"level\":\"kernel\",\"escapes\":[]}}""#,
        );
        let bad = run_supervisor_route(&refuses, "linux", &[]);
        assert_eq!(level(&bad), "fail");
        assert!(bad
            .message
            .contains("adopt: refused protocol 1 (host-version-mismatch)"));

        let missing = run_supervisor_route(&dir.join("absent"), "linux", &[]);
        assert_eq!(level(&missing), "fail");
        assert!(missing.message.contains("supervise: no answer"));
    }

    // ---- runtime-socket-dir ----

    #[cfg(unix)]
    fn xdg(dir: &Path) -> Vec<(String, String)> {
        vec![(
            "XDG_RUNTIME_DIR".to_owned(),
            dir.to_string_lossy().into_owned(),
        )]
    }

    #[cfg(unix)]
    #[test]
    fn a_missing_socket_dir_warns_the_fix_creates_it_0700_and_a_loose_mode_fails_until_the_fix_tightens_it(
    ) {
        use std::os::unix::fs::PermissionsExt;
        let base = temp("socket");
        let env = xdg(&base);
        let uid = current_uid();
        let dir = base.join("fgos");
        let missing = runtime_socket_dir(&env, uid);
        assert_eq!(level(&missing), "warn");

        let (changed, message) = fix_runtime_socket_dir(&env, uid);
        assert!(changed && message.starts_with("created "), "{message}");
        assert_eq!(
            fs::metadata(&dir).unwrap().permissions().mode() & 0o777,
            0o700
        );
        assert_eq!(level(&runtime_socket_dir(&env, uid)), "ok");

        fs::set_permissions(&dir, fs::Permissions::from_mode(0o755)).unwrap();
        let loose = runtime_socket_dir(&env, uid);
        assert_eq!(level(&loose), "fail");
        assert!(loose.message.contains(
            "mode 755 allows group or other access (should be 700) -- run \"fgos doctor --fix\""
        ));
        let (tightened, said) = fix_runtime_socket_dir(&env, uid);
        assert!(tightened && said.starts_with("set "), "{said}");
        assert_eq!(
            fs::metadata(&dir).unwrap().permissions().mode() & 0o777,
            0o700
        );
        let (again, said) = fix_runtime_socket_dir(&env, uid);
        assert!(!again && said.ends_with("already in order"), "{said}");
    }

    #[cfg(unix)]
    #[test]
    fn a_socket_dir_that_is_not_a_directory_fails_and_the_fix_leaves_it_alone() {
        let base = temp("socket-file");
        fs::write(base.join("fgos"), "x").unwrap();
        let env = xdg(&base);
        let check = runtime_socket_dir(&env, current_uid());
        assert_eq!(level(&check), "fail");
        assert!(check
            .message
            .contains("is not a directory -- fix it by hand, doctor --fix does not touch it"));
        let (changed, _) = fix_runtime_socket_dir(&env, current_uid());
        assert!(!changed);
        assert!(base.join("fgos").is_file());
    }

    #[cfg(unix)]
    #[test]
    fn a_socket_dir_too_long_for_a_socket_name_fails_and_is_not_called_fixable() {
        let base = temp("socket-long");
        let long = base.join("x".repeat(90));
        fs::create_dir_all(&long).unwrap();
        let check = runtime_socket_dir(&xdg(&long), current_uid());
        assert_eq!(level(&check), "fail");
        assert!(check.message.contains(
            "leaves no room for a socket name within 100 bytes (shorten XDG_RUNTIME_DIR)"
        ));
        assert!(check.message.ends_with("doctor --fix does not touch it"));
    }

    // ---- run-attempts-stuck ----

    #[test]
    fn nothing_open_passes_and_a_closed_attempt_is_not_listed() {
        let root = temp("attempts");
        assert_eq!(
            run_attempts_stuck(&root).message,
            "no attempt waits to be closed"
        );
        let attempt = root.join(".fgos/assignments/a/b/runs/01");
        fs::create_dir_all(&attempt).unwrap();
        fs::write(attempt.join("closed.json"), "{}").unwrap();
        assert_eq!(
            run_attempts_stuck(&root).message,
            "no attempt waits to be closed"
        );
    }

    #[test]
    fn an_open_attempt_from_before_the_supervisor_is_nothing_to_adopt_and_never_a_failure() {
        let root = temp("attempts-legacy");
        fs::create_dir_all(root.join(".fgos/assignments/a/b/runs/01")).unwrap();
        let check = run_attempts_stuck(&root);
        assert!(check.passed, "{}", check.message);
    }

    // ---- run-supervisor-config ----

    #[test]
    fn the_standard_dispatch_values_pass_and_name_their_source() {
        let root = temp("config");
        let global = temp("config-global");
        let check = run_supervisor_config(&root, Some(&global.join("config.yaml")));
        assert!(check.passed, "{}", check.message);
        assert!(
            check.message.contains("dispatch.gateKillGraceMs = ")
                && check.message.contains("(standard)"),
            "{}",
            check.message
        );
    }

    // ---- trust-store-readable ----

    #[test]
    fn a_readable_claude_trust_store_passes_and_a_broken_one_fails_by_name() {
        let dir = temp("claude");
        let good = dir.join("good.json");
        fs::write(&good, r#"{"projects":{"/a":{},"/b":{}}}"#).unwrap();
        assert_eq!(
            trust_store_readable(&good).message,
            format!("trust store at {} is readable (2 entries)", good.display())
        );
        let bad = dir.join("bad.json");
        fs::write(&bad, "{nope").unwrap();
        let check = trust_store_readable(&bad);
        assert_eq!(level(&check), "fail");
        assert!(check.message.contains("is not valid JSON"));
        let shape = dir.join("shape.json");
        fs::write(&shape, r#"{"projects":[]}"#).unwrap();
        assert!(trust_store_readable(&shape)
            .message
            .contains("has no usable \"projects\" object -- its shape has changed"));
        let absent = trust_store_readable(&dir.join("absent.json"));
        assert_eq!(level(&absent), "warn");
        assert!(absent.message.contains("claude creates it on first run"));
    }

    // ---- non-claude-trust-stores-readable ----

    #[test]
    fn an_unreadable_codex_or_agy_store_fails_and_a_declared_readable_one_passes() {
        let dir = temp("stores");
        let codex = dir.join("config.toml");
        fs::write(&codex, "[projects.\"/x\"]\ntrust_level = \"trusted\"\n").unwrap();
        let agy = dir.join("settings.json");
        fs::write(&agy, "{broken").unwrap();
        let runner = json!({"executors": {"e": {"invocations": [
            {"id": "c", "interactiveMode": {"trustStore": {"kind": "codex-toml", "path": codex.to_string_lossy()}}},
            {"id": "a", "interactiveMode": {"trustStore": {"kind": "agy", "path": agy.to_string_lossy()}}}
        ]}}});
        let check = trust_stores_readable(&dir, &runner, &dir);
        assert_eq!(level(&check), "fail");
        assert!(check
            .message
            .contains("executor \"e\" invocation \"a\": agy trust store at"));
        assert!(check.message.contains("is unreadable ("));
        assert!(!check.message.contains("invocation \"c\""));

        let only_codex = json!({"executors": {"e": {"invocations": [
            {"id": "c", "interactiveMode": {"trustStore": {"kind": "codex-toml", "path": codex.to_string_lossy()}}}
        ]}}});
        assert!(trust_stores_readable(&dir, &only_codex, &dir).passed);
        assert_eq!(
            trust_stores_readable(&dir, &json!({}), &dir).message,
            "no codex-toml or agy trust store declared"
        );
    }

    // ---- agent-cli-project-trusted ----

    fn git_project(name: &str) -> PathBuf {
        let root = temp(name);
        fs::create_dir_all(root.join(".git")).unwrap();
        root
    }

    fn codex_runner(config: &Path) -> Value {
        json!({"executors": {"codex": {"invocations": [
            {"id": "main", "command": "codex", "interactiveMode": {"trustStore": {"kind": "codex-toml", "path": config.to_string_lossy()}}}
        ]}}})
    }

    #[test]
    fn a_root_that_is_not_a_git_repository_or_a_config_that_does_not_load_is_not_applicable() {
        let machine = Path1 {
            present: vec!["codex"],
        };
        let plain = temp("trust-plain");
        let check = agent_cli_project_trusted(&plain, Ok(json!({})), &plain, &machine);
        assert!(
            check.passed
                && check
                    .message
                    .starts_with("not applicable: the project root is not a git repository")
        );
        let git = git_project("trust-noload");
        let check = agent_cli_project_trusted(&git, Err("boom".into()), &git, &machine);
        assert!(check.passed && check.message.contains("runner config not loadable here"));
        let none = agent_cli_project_trusted(&git, Ok(json!({})), &git, &machine);
        assert_eq!(
            none.message,
            "not applicable: no codex or agy executor is configured"
        );
    }

    #[test]
    fn a_codex_home_that_does_not_trust_the_project_fails_with_the_lines_to_add_and_is_never_written(
    ) {
        let machine = Path1 {
            present: vec!["codex"],
        };
        let root = git_project("trust-codex");
        let dir = temp("trust-codex-home");
        let config = dir.join("config.toml");
        let runner = codex_runner(&config);

        let absent = agent_cli_project_trusted(&root, Ok(runner.clone()), &dir, &machine);
        assert_eq!(level(&absent), "fail");
        assert!(absent.message.contains("has no entry for"));
        assert!(absent
            .message
            .contains("trust_level = \"trusted\" (fgOS never edits it)"));
        assert!(!config.exists(), "the check wrote the store");

        let body = format!(
            "[projects.\"{}\"]\ntrust_level = \"untrusted\"\n",
            absolute(&root).display()
        );
        fs::write(&config, &body).unwrap();
        let untrusted = agent_cli_project_trusted(&root, Ok(runner.clone()), &dir, &machine);
        assert!(untrusted
            .message
            .contains("has an entry that is not trusted"));
        assert_eq!(
            fs::read_to_string(&config).unwrap(),
            body,
            "the check wrote the store"
        );

        let trusted_body = format!(
            "[projects.\"{}\"]\ntrust_level = \"trusted\"\n# secret = 1\n",
            absolute(&root).display()
        );
        fs::write(&config, &trusted_body).unwrap();
        let ok = agent_cli_project_trusted(&root, Ok(runner), &dir, &machine);
        assert_eq!(level(&ok), "ok");
        assert!(!ok.message.contains("secret"));
        assert_eq!(fs::read_to_string(&config).unwrap(), trusted_body);
    }

    #[test]
    fn an_agy_sub_home_must_list_the_project_and_a_cli_that_is_not_installed_skips() {
        let root = git_project("trust-agy");
        let home = temp("trust-agy-home");
        let sub = home.join("agy-homes/one");
        fs::create_dir_all(&sub).unwrap();
        let runner = json!({"executors": {"agy": {"invocations": [
            {"id": "agy-main", "command": "agy", "env": {"HOME": sub.to_string_lossy()}}
        ]}}});
        let installed = Path1 {
            present: vec!["agy"],
        };
        let missing = agent_cli_project_trusted(&root, Ok(runner.clone()), &home, &installed);
        assert_eq!(level(&missing), "fail");
        assert!(missing.message.contains("does not list"));
        let settings = default_agy_settings_path(&sub);
        fs::create_dir_all(settings.parent().unwrap()).unwrap();
        fs::write(
            &settings,
            format!(
                r#"{{"trustedWorkspaces":["{}"]}}"#,
                absolute(&root).display()
            ),
        )
        .unwrap();
        assert_eq!(
            level(&agent_cli_project_trusted(
                &root,
                Ok(runner.clone()),
                &home,
                &installed
            )),
            "ok"
        );

        let none = Path1 { present: vec![] };
        let skip = agent_cli_project_trusted(&root, Ok(runner), &home, &none);
        assert_eq!(level(&skip), "skip");
        assert!(skip
            .message
            .starts_with("skipped: agy not installed on this machine"));
    }
}
