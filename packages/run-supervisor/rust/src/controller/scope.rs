//! Transient systemd user scope failure domain for run supervisors.
//!
//! On Linux, every run supervisor starts detached in its own transient systemd user scope
//! (`fgos-run-<attemptId>`) with `OOMPolicy=stop` and an optional `MemoryMax`. Where no user
//! manager is reachable (or on non-Linux systems), the attempt inherits its starter's cgroup and
//! records `failureDomain: {kind: "inherited", reason}`.
//!
//! [`end_dead_attempt`] is the one authority that ends a live domain whose supervisor is dead, and it
//! is bounded three ways: it runs only for an explicit stop, only when the binding's supervisor is
//! provably dead by pid and start identity, and only against the one unit the binding names (which
//! must be this attempt's own `fgos-run-<attemptId>`). The only processes it signals are the binding's
//! own scope unit and the binding's own gate record, the gate by pid and start identity (a head's gate
//! and agent live in the herdr pane's cgroup, not in the scope). Adopt's own rule, that a live domain
//! is never ended, stays as it is (section 8 of the run-supervisor spec).

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

/// The failure domain of a supervised attempt.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum FailureDomain {
    /// `systemd_run_dir` is the directory holding the `systemd-run` the probe found and `runtime_dir` the user
    /// runtime directory the probe connected through; neither is part of the recorded binding shape `{kind, unit}`.
    #[serde(rename = "systemd-scope")]
    SystemdScope {
        unit: String,
        #[serde(skip)]
        systemd_run_dir: PathBuf,
        #[serde(skip)]
        runtime_dir: PathBuf,
    },
    #[serde(rename = "inherited")]
    Inherited { reason: String },
}

impl FailureDomain {
    pub fn unit(&self) -> Option<&str> {
        match self {
            FailureDomain::SystemdScope { unit, .. } => Some(unit),
            FailureDomain::Inherited { .. } => None,
        }
    }

    pub fn reason(&self) -> Option<&str> {
        match self {
            FailureDomain::Inherited { reason } => Some(reason),
            FailureDomain::SystemdScope { .. } => None,
        }
    }
}

/// Sanitize an attempt id to valid systemd unit name characters (ASCII alphanumeric, '-', '_').
pub fn sanitize_unit_name(attempt_id: &str) -> String {
    let sanitized: String = attempt_id
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect();
    if sanitized.is_empty() {
        "attempt".to_string()
    } else {
        sanitized
    }
}

/// The unit name for an attempt's transient scope: `fgos-run-<attemptId>`.
pub fn scope_unit_name(attempt_id: &str) -> String {
    format!("fgos-run-{}", sanitize_unit_name(attempt_id))
}

/// Decide the failure domain given explicit probe results: the runtime directory a user manager answered
/// through, and the absolute `systemd-run` path.
pub fn decide_failure_domain_with(
    attempt_id: &str,
    is_linux: bool,
    user_manager_runtime_dir: Option<PathBuf>,
    systemd_run: Option<PathBuf>,
) -> FailureDomain {
    if !is_linux {
        return FailureDomain::Inherited {
            reason: "not-linux".to_string(),
        };
    }
    let Some(runtime_dir) = user_manager_runtime_dir else {
        return FailureDomain::Inherited {
            reason: "no-user-manager".to_string(),
        };
    };
    let Some(systemd_run) = systemd_run else {
        return FailureDomain::Inherited {
            reason: "no-systemd-run".to_string(),
        };
    };
    let systemd_run_dir = systemd_run.parent().map(PathBuf::from).unwrap_or_default();
    FailureDomain::SystemdScope {
        unit: scope_unit_name(attempt_id),
        systemd_run_dir,
        runtime_dir,
    }
}

/// Resolves user runtime directory through controller/runtime_dir.rs, falling back to /run/user/<uid>.
pub fn resolve_runtime_dir() -> Option<PathBuf> {
    crate::controller::runtime_dir::user_runtime_dir(&crate::controller::runtime_dir::process_env)
        .or_else(|| {
            #[cfg(unix)]
            {
                let uid = crate::controller::runtime_dir::current_uid();
                let fallback = PathBuf::from(format!("/run/user/{uid}"));
                if fallback.is_dir() {
                    Some(fallback)
                } else {
                    None
                }
            }
            #[cfg(not(unix))]
            {
                None
            }
        })
}

/// Probe for a reachable user manager by connecting to the Unix domain socket `<runtime dir>/systemd/private`,
/// else `<runtime dir>/bus`; returns the runtime directory it connected through. Any error -> None.
#[cfg(unix)]
pub fn probe_user_manager() -> Option<PathBuf> {
    let runtime_dir = resolve_runtime_dir()?;
    use std::os::unix::net::UnixStream;
    let reachable = UnixStream::connect(runtime_dir.join("systemd/private")).is_ok()
        || UnixStream::connect(runtime_dir.join("bus")).is_ok();
    reachable.then_some(runtime_dir)
}

#[cfg(not(unix))]
pub fn probe_user_manager() -> Option<PathBuf> {
    None
}

/// How long the gate of a scope is given to end after `systemctl stop`, before the scope is killed.
const SCOPE_STOP_WAIT_MS: u64 = 15_000;
/// How long a killed scope is given to end before the domain is reported not ended.
const SCOPE_KILL_WAIT_MS: u64 = 5_000;
/// How often the gate is judged dead again while a scope is being stopped.
const SCOPE_POLL_MS: u64 = 200;
/// One `systemctl` call to the user manager, bounded.
const SYSTEMCTL_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(10);

/// What [`end_dead_attempt_with`] asks the machine to do, so the decision order is provable without systemd
/// and without a dead process to look for.
pub trait EndDeadPorts {
    /// Whether the process record in `record` is provably dead here: pid and start identity, never pid alone.
    fn dead(&self, record: &Value) -> bool;
    /// Stop the one unit through its manager: `SIGTERM` (`kill` false), then `SIGKILL` (`kill` true).
    fn stop_unit(&mut self, unit: &str, kill: bool) -> Result<(), String>;
    /// Signal exactly the binding's gate record, `SIGTERM` (`kill` false) or `SIGKILL` (`kill` true), only if that
    /// exact process (pid and start identity) still runs. A gate that is gone, or is no longer that process, is
    /// nothing of ours to reach and answers `Ok`.
    fn signal_gate(&mut self, gate: &Value, kill: bool) -> Result<(), String>;
    /// Wait `ms` milliseconds before looking again.
    fn sleep(&mut self, ms: u64);
    /// Adopt the attempt directory, answering the adopt verdict line for it.
    fn adopt(&mut self, run_dir: &Path) -> Value;
}

/// The machine's own ports: the process door's dead verdict, the user manager's `systemctl`, and adopt.
pub struct SystemEndDead {
    systemctl: Option<PathBuf>,
    env: Vec<(String, String)>,
}

impl Default for SystemEndDead {
    fn default() -> Self {
        Self::new()
    }
}

impl SystemEndDead {
    /// The real machine, with the environment a per-user service manager needs to find its bus.
    pub fn new() -> Self {
        let path = std::env::var("PATH").unwrap_or_default();
        let systemctl = fgos_process::spawn::resolve_program("systemctl", &path, "", false);
        let mut env = vec![(
            "PATH".to_string(),
            if path.is_empty() {
                "/usr/local/bin:/usr/bin:/bin".to_string()
            } else {
                path
            },
        )];
        for key in ["HOME", "USER", "LOGNAME", "DBUS_SESSION_BUS_ADDRESS"] {
            if let Ok(value) = std::env::var(key) {
                if !value.is_empty() {
                    env.push((key.to_string(), value));
                }
            }
        }
        // The runtime directory the manager answers through, found the one way this crate finds it.
        if let Some(dir) = resolve_runtime_dir() {
            env.push((
                "XDG_RUNTIME_DIR".to_string(),
                dir.to_string_lossy().into_owned(),
            ));
        }
        Self { systemctl, env }
    }
}

impl EndDeadPorts for SystemEndDead {
    fn dead(&self, record: &Value) -> bool {
        fgos_process::facts::judge_here(&fgos_process::facts::Record::from_json(record))
            == fgos_process::facts::Verdict::Dead
    }

    fn stop_unit(&mut self, unit: &str, kill: bool) -> Result<(), String> {
        let Some(systemctl) = self.systemctl.as_ref() else {
            return Err("systemctl is not on PATH, so no scope can be stopped".to_string());
        };
        let mut args: Vec<String> = vec!["--user".to_string()];
        if kill {
            args.push("kill".to_string());
            args.push("--signal=SIGKILL".to_string());
        } else {
            args.push("--no-block".to_string());
            args.push("stop".to_string());
        }
        args.push(unit.to_string());
        match fgos_process::spawn::run_bounded(
            systemctl,
            &args,
            &self.env,
            None,
            None,
            SYSTEMCTL_TIMEOUT,
        ) {
            // A unit that is not loaded is already stopped, and a refused call says nothing about the domain:
            // what is left of it is the gate poll's answer either way.
            Ok(fgos_process::spawn::Outcome::Exited(_)) => Ok(()),
            Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => {
                Err(format!("systemctl {unit} timed out"))
            }
            Err(error) => Err(format!("systemctl {unit}: {error}")),
        }
    }

    fn signal_gate(&mut self, gate: &Value, kill: bool) -> Result<(), String> {
        let signal = if kill {
            fgos_process::control::Signal::Kill
        } else {
            fgos_process::control::Signal::Term
        };
        match fgos_process::control::signal_record(
            &fgos_process::facts::Record::from_json(gate),
            signal,
        ) {
            // Sent: reached. NotFound, IdentityMismatch: nothing of ours is left under that pid, or it is not
            // the recorded process any more, so nothing was sent and nothing is owed.
            fgos_process::control::SignalOutcome::Sent
            | fgos_process::control::SignalOutcome::NotFound
            | fgos_process::control::SignalOutcome::IdentityMismatch => Ok(()),
            fgos_process::control::SignalOutcome::IdentityUnknown => {
                Err("the gate's identity could not be checked, so it was not signalled".to_string())
            }
            fgos_process::control::SignalOutcome::Denied => {
                Err("the gate refused the signal (permission denied)".to_string())
            }
            fgos_process::control::SignalOutcome::Unsupported => {
                Err("this platform cannot send that signal to the gate".to_string())
            }
            fgos_process::control::SignalOutcome::Failed(code) => {
                Err(format!("signalling the gate failed with error {code}"))
            }
        }
    }

    fn sleep(&mut self, ms: u64) {
        std::thread::sleep(std::time::Duration::from_millis(ms));
    }

    fn adopt(&mut self, run_dir: &Path) -> Value {
        let args = crate::adopt::AdoptArgs {
            target: crate::adopt::Target::RunDir(run_dir.to_path_buf()),
            probe_only: false,
            kill_wait_ms: fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
        };
        crate::adopt::adopt_one(run_dir, &args).line(run_dir)
    }
}

/// A refusal of [`end_dead_attempt`], instead of an `ended` answer.
fn refused(code: &str, message: impl Into<String>) -> Value {
    json!({ "refused": { "code": code, "message": message.into() } })
}

/// Judge the gate dead again every [`SCOPE_POLL_MS`], for at most `budget_ms`.
fn wait_until_dead(record: &Value, budget_ms: u64, ports: &mut dyn EndDeadPorts) -> bool {
    let mut waited = 0;
    loop {
        if ports.dead(record) {
            return true;
        }
        if waited >= budget_ms {
            return false;
        }
        let step = SCOPE_POLL_MS.min(budget_ms - waited);
        ports.sleep(step);
        waited += step;
    }
}

/// End the live domain of an attempt whose run supervisor is gone, then adopt it.
///
/// The invariant: ending a live domain without its supervisor is allowed only here, only for an explicit
/// stop, only when the binding's supervisor is provably dead (pid and start identity, never pid alone), and
/// only against the one unit the binding names, which must be this attempt's own `fgos-run-<attemptId>`.
/// The only processes signalled are that scope unit and the binding's own gate record, the gate by pid and
/// start identity (a head's gate and agent live in the herdr pane's cgroup, not in the scope, so the gate is
/// asked to end alongside it). Nothing else is signalled, and adopt's own rule (a live domain is never ended)
/// is not changed: adopt is called after the domain is proven empty.
///
/// Order: `closed.json` (adopt answers `closed` for one stat, nothing is stopped) → a readable binding →
/// supervisor dead → the domain is a systemd scope → the unit is this attempt's own → stop the unit and ask the
/// gate to end, waiting for the gate, kill the unit and the gate after [`SCOPE_STOP_WAIT_MS`] and wait
/// [`SCOPE_KILL_WAIT_MS`] more → adopt.
pub fn end_dead_attempt_with(run_dir: &Path, ports: &mut dyn EndDeadPorts) -> Value {
    if run_dir.join("closed.json").exists() {
        return json!({ "ended": true, "adopt": ports.adopt(run_dir) });
    }
    let binding = std::fs::read(run_dir.join("supervisor-binding.json"))
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())
        .filter(Value::is_object);
    let Some(binding) = binding else {
        return refused(
            "no-binding",
            format!(
                "{} carries no readable supervisor-binding.json, so no supervisor is proven dead",
                run_dir.display()
            ),
        );
    };
    if !ports.dead(&binding["supervisor"]) {
        return refused(
            "supervisor-alive",
            format!(
                "the supervisor of {} is not proven dead, so its domain is left to it",
                run_dir.display()
            ),
        );
    }
    let domain = &binding["failureDomain"];
    let kind = domain
        .get("kind")
        .and_then(Value::as_str)
        .unwrap_or("unrecorded");
    if kind != "systemd-scope" {
        let reason = domain
            .get("reason")
            .and_then(Value::as_str)
            .map(|reason| format!(" ({reason})"))
            .unwrap_or_default();
        return refused(
            "domain-not-scope",
            format!(
                "the domain of {} is {kind}{reason}, not a scope of its own, so nothing here may end it",
                run_dir.display()
            ),
        );
    }
    let attempt_id = binding
        .get("attemptId")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let unit = domain
        .get("unit")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let owned = scope_unit_name(attempt_id);
    if unit != owned {
        return refused(
            "scope-mismatch",
            format!(
                "the binding of {} names scope {unit:?}, not its own {owned:?}",
                run_dir.display()
            ),
        );
    }
    let Some(gate) = binding.get("gate").filter(|gate| gate.is_object()).cloned() else {
        return refused(
            "no-binding",
            format!(
                "the binding of {} carries no gate record, so the end of its domain cannot be proven",
                run_dir.display()
            ),
        );
    };
    // A stop that could not be issued still leaves the gate poll to decide what is left of the domain.
    let mut trouble: Option<String> = None;
    if let Err(message) = ports.stop_unit(unit, false) {
        trouble = Some(message);
    }
    if let Err(message) = ports.signal_gate(&gate, false) {
        trouble = Some(message);
    }
    if !wait_until_dead(&gate, SCOPE_STOP_WAIT_MS, ports) {
        if let Err(message) = ports.stop_unit(unit, true) {
            trouble = Some(message);
        }
        if let Err(message) = ports.signal_gate(&gate, true) {
            trouble = Some(message);
        }
        if !wait_until_dead(&gate, SCOPE_KILL_WAIT_MS, ports) {
            let mut message = format!(
                "the gate of {} is still alive in {unit} after SIGTERM and SIGKILL",
                run_dir.display()
            );
            if let Some(trouble) = trouble {
                message.push_str(&format!("; {trouble}"));
            }
            return refused("domain-not-ended", message);
        }
    }
    json!({ "ended": true, "unit": unit, "adopt": ports.adopt(run_dir) })
}

/// [`end_dead_attempt_with`] on the real machine.
pub fn end_dead_attempt(run_dir: &Path) -> Value {
    end_dead_attempt_with(run_dir, &mut SystemEndDead::new())
}

/// Check if `systemd-run` is on PATH and resolve its absolute path.
pub fn resolve_systemd_run_path() -> Option<PathBuf> {
    let path_var = std::env::var("PATH").ok()?;
    fgos_process::spawn::resolve_program("systemd-run", &path_var, "", false)
}

/// Decide the failure domain for one launch.
pub fn decide_failure_domain(attempt_id: &str) -> FailureDomain {
    #[cfg(target_os = "linux")]
    {
        decide_failure_domain_with(
            attempt_id,
            true,
            probe_user_manager(),
            resolve_systemd_run_path(),
        )
    }
    #[cfg(not(target_os = "linux"))]
    {
        decide_failure_domain_with(attempt_id, false, None, None)
    }
}

/// Validate `memoryMax` against systemd size syntax: digits with an optional uppercase K/M/G/T suffix, or "infinity".
/// Empty string means no cap (`None`).
/// An invalid value emits a warning on stderr and returns `None`.
pub fn validate_memory_max(raw: &str) -> Option<&str> {
    let s = raw.trim();
    if s.is_empty() {
        return None;
    }
    if s == "infinity" {
        return Some("infinity");
    }
    let digits = match s.chars().last() {
        Some(c @ ('K' | 'M' | 'G' | 'T')) => &s[..s.len() - c.len_utf8()],
        _ => s,
    };
    if !digits.is_empty() && digits.chars().all(|c| c.is_ascii_digit()) {
        Some(s)
    } else {
        eprintln!("warning: invalid runner.supervisorScope.memoryMax '{s}' (expected digits with an optional uppercase K, M, G or T suffix, or infinity), ignoring");
        None
    }
}

/// Build the wrapped command: unit name `fgos-run-<attemptId>`,
/// `--scope --collect --user -p OOMPolicy=stop`, and `-p MemoryMax=<cap>` only when set.
/// Pure command builder: independent of systemd availability.
pub fn build_scope_command(
    systemd_run_bin: &str,
    unit: &str,
    memory_max: Option<&str>,
    command: &[String],
) -> Vec<String> {
    let mut out = vec![
        systemd_run_bin.to_string(),
        "--user".to_string(),
        "--scope".to_string(),
        "--collect".to_string(),
        format!("--unit={unit}"),
        "-p".to_string(),
        "OOMPolicy=stop".to_string(),
    ];
    if let Some(cap) = memory_max {
        if !cap.is_empty() {
            out.push("-p".to_string());
            out.push(format!("MemoryMax={cap}"));
        }
    }
    out.push("--".to_string());
    out.extend(command.iter().cloned());
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unit_name_sanitises_special_characters() {
        assert_eq!(sanitize_unit_name("att-1"), "att-1");
        assert_eq!(sanitize_unit_name("att_1"), "att_1");
        assert_eq!(sanitize_unit_name("att/1:test.scope"), "att_1_test_scope");
        assert_eq!(sanitize_unit_name(""), "attempt");
        assert_eq!(scope_unit_name("att-1"), "fgos-run-att-1");
    }

    #[test]
    fn failure_domain_decision_reflects_rules() {
        let dir = || Some(PathBuf::from("/run/user/1000"));
        let run = || Some(PathBuf::from("/usr/bin/systemd-run"));
        assert_eq!(
            decide_failure_domain_with("att-1", false, dir(), run()),
            FailureDomain::Inherited {
                reason: "not-linux".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, None, run()),
            FailureDomain::Inherited {
                reason: "no-user-manager".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, dir(), None),
            FailureDomain::Inherited {
                reason: "no-systemd-run".to_string()
            }
        );
        assert_eq!(
            decide_failure_domain_with("att-1", true, dir(), run()),
            FailureDomain::SystemdScope {
                unit: "fgos-run-att-1".to_string(),
                systemd_run_dir: PathBuf::from("/usr/bin"),
                runtime_dir: PathBuf::from("/run/user/1000"),
            }
        );
        let scoped =
            serde_json::to_value(decide_failure_domain_with("att-1", true, dir(), run())).unwrap();
        assert_eq!(
            scoped,
            serde_json::json!({ "kind": "systemd-scope", "unit": "fgos-run-att-1" })
        );
    }

    #[test]
    fn validate_memory_max_syntax() {
        assert_eq!(validate_memory_max(""), None);
        assert_eq!(validate_memory_max("   "), None);
        assert_eq!(validate_memory_max("8G"), Some("8G"));
        assert_eq!(validate_memory_max("8g"), None);
        assert_eq!(validate_memory_max("8m"), None);
        assert_eq!(validate_memory_max("Infinity"), None);
        assert_eq!(validate_memory_max("G"), None);
        assert_eq!(validate_memory_max("1024M"), Some("1024M"));
        assert_eq!(validate_memory_max("500"), Some("500"));
        assert_eq!(validate_memory_max("infinity"), Some("infinity"));
        assert_eq!(validate_memory_max("8X"), None);
        assert_eq!(validate_memory_max("-8G"), None);
        assert_eq!(validate_memory_max("8.5G"), None);
        assert_eq!(validate_memory_max("invalid"), None);
    }

    #[test]
    fn build_scope_command_shapes() {
        let base_cmd = vec![
            "/bin/fgos".to_string(),
            "internal".to_string(),
            "supervise".to_string(),
        ];
        let plain = build_scope_command("systemd-run", "fgos-run-att-1", None, &base_cmd);
        assert_eq!(
            plain,
            vec![
                "systemd-run",
                "--user",
                "--scope",
                "--collect",
                "--unit=fgos-run-att-1",
                "-p",
                "OOMPolicy=stop",
                "--",
                "/bin/fgos",
                "internal",
                "supervise"
            ]
        );

        let with_cap = build_scope_command("systemd-run", "fgos-run-att-1", Some("8G"), &base_cmd);
        assert_eq!(
            with_cap,
            vec![
                "systemd-run",
                "--user",
                "--scope",
                "--collect",
                "--unit=fgos-run-att-1",
                "-p",
                "OOMPolicy=stop",
                "-p",
                "MemoryMax=8G",
                "--",
                "/bin/fgos",
                "internal",
                "supervise"
            ]
        );

        let with_empty = build_scope_command("systemd-run", "fgos-run-att-1", Some(""), &base_cmd);
        assert_eq!(with_empty, plain);
    }

    /// A run dir under the temp directory holding one `supervisor-binding.json`.
    fn scratch_run_dir(name: &str, binding: Value) -> ScratchDir {
        let dir =
            std::env::temp_dir().join(format!("rs-scope-end-dead-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("supervisor-binding.json"),
            serde_json::to_vec(&binding).unwrap(),
        )
        .unwrap();
        ScratchDir(dir)
    }

    /// A scratch run dir that is removed when the test ends.
    struct ScratchDir(PathBuf);

    impl std::ops::Deref for ScratchDir {
        type Target = Path;
        fn deref(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for ScratchDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn binding(domain: Value) -> Value {
        json!({
            "v": 1,
            "attemptId": "att-1",
            "supervisor": { "role": "supervisor" },
            "gate": { "role": "gate" },
            "failureDomain": domain,
        })
    }

    /// A binding whose supervisor is gone and whose domain is this attempt's own scope.
    fn dead_scoped() -> Value {
        binding(json!({ "kind": "systemd-scope", "unit": "fgos-run-att-1" }))
    }

    /// The machine, answering as told: the supervisor's verdict, the moment the gate ends, and the stops, gate
    /// signals and sleeps that were asked for, in the order they were asked (`events`).
    struct FakePorts {
        supervisor_dead: bool,
        gate_alive_until_slept_ms: u64,
        stops: Vec<(String, bool)>,
        gate_signals: Vec<bool>,
        gate_signal_error: Option<String>,
        slept_ms: u64,
        adopted: usize,
        /// One entry per call the decision made, in order: "stop", "term", "kill-unit", "kill", "sleep", "adopt".
        events: Vec<String>,
    }

    impl FakePorts {
        fn new(supervisor_dead: bool, gate_alive_until_slept_ms: u64) -> Self {
            Self {
                supervisor_dead,
                gate_alive_until_slept_ms,
                stops: Vec::new(),
                gate_signals: Vec::new(),
                gate_signal_error: None,
                slept_ms: 0,
                adopted: 0,
                events: Vec::new(),
            }
        }
    }

    impl EndDeadPorts for FakePorts {
        fn dead(&self, record: &Value) -> bool {
            match record.get("role").and_then(Value::as_str) {
                Some("supervisor") => self.supervisor_dead,
                Some("gate") => self.slept_ms >= self.gate_alive_until_slept_ms,
                _ => panic!("judged a record the binding does not carry: {record}"),
            }
        }

        fn stop_unit(&mut self, unit: &str, kill: bool) -> Result<(), String> {
            self.events
                .push(if kill { "kill-unit" } else { "stop" }.to_string());
            self.stops.push((unit.to_string(), kill));
            Ok(())
        }

        fn signal_gate(&mut self, gate: &Value, kill: bool) -> Result<(), String> {
            assert_eq!(
                gate.get("role").and_then(Value::as_str),
                Some("gate"),
                "only the binding's own gate record is signalled: {gate}"
            );
            self.events
                .push(if kill { "kill" } else { "term" }.to_string());
            self.gate_signals.push(kill);
            match &self.gate_signal_error {
                Some(message) => Err(message.clone()),
                None => Ok(()),
            }
        }

        fn sleep(&mut self, ms: u64) {
            self.events.push("sleep".to_string());
            self.slept_ms += ms;
        }

        fn adopt(&mut self, _run_dir: &Path) -> Value {
            self.events.push("adopt".to_string());
            self.adopted += 1;
            json!({ "v": 1, "attemptDir": "…", "state": "closed" })
        }
    }

    #[test]
    fn a_live_supervisor_keeps_its_domain_and_nothing_is_stopped() {
        let dir = scratch_run_dir("alive", dead_scoped());
        let mut ports = FakePorts::new(false, 0);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["refused"]["code"], json!("supervisor-alive"));
        assert!(
            ports.stops.is_empty(),
            "a live supervisor's domain is its own"
        );
        assert!(
            ports.gate_signals.is_empty(),
            "a live supervisor's gate is its own"
        );
        assert_eq!(ports.adopted, 0);
    }

    #[test]
    fn an_inherited_domain_is_refused_by_name_and_nothing_is_stopped() {
        let dir = scratch_run_dir(
            "inherited",
            binding(json!({ "kind": "inherited", "reason": "no-user-manager" })),
        );
        let mut ports = FakePorts::new(true, 0);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["refused"]["code"], json!("domain-not-scope"));
        let message = answer["refused"]["message"].as_str().unwrap();
        assert!(message.contains("no-user-manager"), "{message}");
        assert!(
            ports.stops.is_empty(),
            "an inherited domain is never signalled"
        );
        assert!(
            ports.gate_signals.is_empty(),
            "an inherited domain's gate is never signalled"
        );
        assert_eq!(ports.adopted, 0);
    }

    #[test]
    fn a_scope_that_is_not_this_attempts_own_is_never_stopped() {
        let dir = scratch_run_dir(
            "mismatch",
            binding(json!({ "kind": "systemd-scope", "unit": "fgos-run-someone-else" })),
        );
        let mut ports = FakePorts::new(true, 0);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["refused"]["code"], json!("scope-mismatch"));
        assert!(
            ports.stops.is_empty(),
            "only the named attempt's own scope is stopped"
        );
        assert!(
            ports.gate_signals.is_empty(),
            "nothing is signalled when the scope is not this attempt's own"
        );
        assert_eq!(ports.adopted, 0);
    }

    #[test]
    fn a_binding_without_a_gate_record_is_refused_and_nothing_is_stopped() {
        let mut no_gate = dead_scoped();
        no_gate.as_object_mut().unwrap().remove("gate");
        let dir = scratch_run_dir("no-gate", no_gate);
        let mut ports = FakePorts::new(true, 0);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["refused"]["code"], json!("no-binding"));
        let message = answer["refused"]["message"].as_str().unwrap();
        assert!(message.contains("gate"), "{message}");
        assert!(
            ports.stops.is_empty(),
            "nothing is signalled without a gate to judge"
        );
        assert!(
            ports.gate_signals.is_empty(),
            "nothing is signalled without a gate record"
        );
        assert_eq!(ports.adopted, 0);
    }

    #[test]
    fn a_dead_supervisors_own_scope_is_stopped_then_adopted() {
        let dir = scratch_run_dir("ended", dead_scoped());
        // The gate ends a moment after SIGTERM, so it is never killed.
        let mut ports = FakePorts::new(true, 2 * SCOPE_POLL_MS);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["ended"], json!(true));
        assert_eq!(answer["unit"], json!("fgos-run-att-1"));
        assert_eq!(answer["adopt"]["state"], json!("closed"));
        assert_eq!(ports.stops, vec![("fgos-run-att-1".to_string(), false)]);
        assert_eq!(ports.gate_signals, vec![false]);
        assert_eq!(ports.slept_ms, 2 * SCOPE_POLL_MS);
        assert_eq!(ports.adopted, 1);
    }

    #[test]
    fn a_scope_that_outlives_sigterm_is_killed_before_adopt() {
        let dir = scratch_run_dir("killed", dead_scoped());
        // The gate outlives the whole stop grace and ends only inside the kill wait.
        let mut ports = FakePorts::new(true, SCOPE_STOP_WAIT_MS + SCOPE_POLL_MS);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["ended"], json!(true));
        assert_eq!(
            ports.stops,
            vec![
                ("fgos-run-att-1".to_string(), false),
                ("fgos-run-att-1".to_string(), true),
            ]
        );
        assert_eq!(ports.gate_signals, vec![false, true]);
        assert_eq!(ports.slept_ms, SCOPE_STOP_WAIT_MS + SCOPE_POLL_MS);
        assert_eq!(ports.adopted, 1);
        // Order, not just totals: the scope and its gate are asked to end before the first wait, killed only after
        // the stop grace ran out, and adopt comes last, once the gate is judged dead.
        let seen: Vec<&str> = ports.events.iter().map(String::as_str).collect();
        let kill_at = seen
            .iter()
            .position(|event| *event == "kill-unit")
            .expect("the scope is killed after the stop grace");
        let first_sleep = seen
            .iter()
            .position(|event| *event == "sleep")
            .expect("the gate is waited on");
        assert_eq!(
            &seen[..first_sleep],
            &["stop", "term"],
            "the scope stops and its gate is asked to end before the first wait"
        );
        assert_eq!(
            &seen[kill_at..kill_at + 2],
            &["kill-unit", "kill"],
            "after the stop wait the scope and its gate are killed together"
        );
        assert_eq!(seen.last().copied(), Some("adopt"), "adopt is last");
        assert_eq!(
            ports
                .events
                .iter()
                .filter(|event| event.as_str() == "adopt")
                .count(),
            1,
            "one adopt"
        );
    }

    #[test]
    fn a_gate_signal_that_fails_still_ends_the_attempt_when_the_gate_dies() {
        let dir = scratch_run_dir("gate-signal-failed", dead_scoped());
        // The gate ends a moment after SIGTERM, so the failing signal changes no verdict: the attempt is ended.
        let mut ports = FakePorts::new(true, 2 * SCOPE_POLL_MS);
        ports.gate_signal_error =
            Some("the gate refused the signal (permission denied)".to_string());
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["ended"], json!(true));
        assert_eq!(answer["adopt"]["state"], json!("closed"));
        assert_eq!(ports.gate_signals, vec![false]);
        assert_eq!(ports.adopted, 1);
    }

    #[test]
    fn a_gate_that_outlives_the_kill_leaves_the_domain_alone() {
        let dir = scratch_run_dir("survivor", dead_scoped());
        let mut ports = FakePorts::new(true, u64::MAX);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["refused"]["code"], json!("domain-not-ended"));
        assert_eq!(ports.gate_signals, vec![false, true]);
        assert_eq!(ports.slept_ms, SCOPE_STOP_WAIT_MS + SCOPE_KILL_WAIT_MS);
        assert_eq!(
            ports.adopted, 0,
            "an attempt is adopted only once its domain is empty"
        );
    }

    #[test]
    fn a_closed_attempt_is_adopted_without_stopping_anything() {
        let dir = scratch_run_dir("closed", dead_scoped());
        std::fs::write(dir.join("closed.json"), "{}").unwrap();
        let mut ports = FakePorts::new(true, 0);
        let answer = end_dead_attempt_with(&dir, &mut ports);
        assert_eq!(answer["ended"], json!(true));
        assert_eq!(answer["adopt"]["state"], json!("closed"));
        assert!(ports.stops.is_empty());
        assert!(ports.gate_signals.is_empty());
    }
}
