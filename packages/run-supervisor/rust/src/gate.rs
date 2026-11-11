//! Route `fgos internal gate`: the launch gate of one attempt.
//!
//! The gate is the process root of the agent inside the attempt's process
//! domain. On Linux with `bwrap-pidns` it is pid 1 of a fresh PID namespace:
//! it owns the agent's IO (capture files, stdin), reaps every orphan the
//! namespace adopts, enforces the hard ceiling on its own clock, and ends the
//! domain when the agent is gone. Contracts:
//! `packages/run-supervisor/contracts/{internal-route.run-supervisor,gate-go,gate-exit,stop-requested}.v1.json`.
//!
//! The gate never compares pids (they mean nothing across PID namespaces) and
//! never dies with its parent in `direct` mode: after `GO` the supervisor can
//! disappear and the attempt still ends by itself.
//!
//! In `terminal` mode the gate runs in a pane, connects to the supervisor's
//! AF_UNIX socket (`--go-socket`), receives the attempt lock (and the cwd
//! lease) with `GO` over `SCM_RIGHTS`, makes the agent's process group the
//! tty's foreground group, and ends the domain itself when the supervisor is
//! gone: at once before `BRIEF_DELIVERED`, after a finished result plus
//! `orphanSettleMs` once the brief was delivered.

//!
//! One gate, one contract, a platform part per OS: `gate/unix.rs` (pid 1 of a
//! namespace, or a subreaper without one; macOS best effort) and
//! `gate/windows.rs` (a member of the attempt's named job). Everything that is
//! not a system call lives here: argv, envelope, the GO checks, the hard
//! ceiling arithmetic, the stop cause and the `gate-exit.json` record.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde_json::{json, Value};

use fgos_process::facts;

use crate::envelope;
use crate::publish::publish_once;
use crate::route::{self, ArgsError, Flags};
use fgos_identity::text::iso_utc_now;

#[cfg(unix)]
mod unix;
#[cfg(windows)]
mod windows;

/// The supervisor closed the GO channel, or signalled, before `GO`.
pub const EXIT_NO_GO: i32 = 64;

/// Where the GO channel is.
#[derive(Debug, PartialEq, Eq)]
pub enum GoEnd {
    /// An inherited descriptor (Unix).
    Fd(u32),
    /// A path to connect to: a named pipe on Windows.
    Socket(PathBuf),
}

/// Parsed argv of `fgos internal gate`.
#[derive(Debug, PartialEq, Eq)]
pub struct GateArgs {
    pub envelope: PathBuf,
    pub go: GoEnd,
    /// Lock descriptions inherited from the supervisor, closed on exec first.
    pub lock_fds: Vec<u32>,
    /// The attempt's named job (Windows): the gate opens it to be a second holder.
    pub job_name: Option<String>,
    /// `external` mode: the arguments the external host gave `fgos exec`, which replace `launch.args`.
    pub agent_argv: Option<Vec<String>>,
}

impl GateArgs {
    /// Parse the arguments after `internal gate`:
    /// `--protocol 1 --envelope <path> (--go-fd N | --go-socket <path>) [--lock-fds 3,4] [--job-name <name>] [--agent-argv <json array>]`.
    pub fn parse(args: &[String]) -> Result<GateArgs, ArgsError> {
        let flags = Flags::parse(
            args,
            &[
                "envelope",
                "go-fd",
                "go-socket",
                "lock-fds",
                "job-name",
                "agent-argv",
            ],
            0,
        )?;
        let envelope = PathBuf::from(flags.require("envelope")?);
        let go = match (flags.get("go-fd"), flags.get("go-socket")) {
            (Some(fd), None) => GoEnd::Fd(parse_fd(fd)?),
            (None, Some(path)) => GoEnd::Socket(path.into()),
            _ => {
                return Err(ArgsError::Usage(
                    "exactly one of --go-fd and --go-socket is required".into(),
                ))
            }
        };
        let lock_fds = match flags.get("lock-fds") {
            Some(list) => list
                .split(',')
                .filter(|s| !s.is_empty())
                .map(parse_fd)
                .collect::<Result<_, _>>()?,
            None => Vec::new(),
        };
        let agent_argv = match flags.get("agent-argv") {
            Some(text) => Some(serde_json::from_str::<Vec<String>>(text).map_err(|e| {
                ArgsError::Usage(format!("--agent-argv is not a JSON array of strings: {e}"))
            })?),
            None => None,
        };
        Ok(GateArgs {
            envelope,
            go,
            lock_fds,
            job_name: flags.get("job-name").map(String::from),
            agent_argv,
        })
    }
}

fn parse_fd(text: &str) -> Result<u32, ArgsError> {
    text.parse::<u32>()
        .ok()
        .filter(|fd| *fd >= 3)
        .ok_or_else(|| ArgsError::Usage(format!("{text} is not a descriptor slot of 3 or more")))
}

/// Run the gate; the return value is the process exit code.
pub fn run(args: &[String]) -> i32 {
    let args = match GateArgs::parse(args) {
        Ok(args) => args,
        Err(err) => return route::refuse("gate", err),
    };
    #[cfg(unix)]
    {
        unix::run(&args)
    }
    #[cfg(windows)]
    {
        windows::run(&args)
    }
}

/// The envelope's `mode`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum LaunchMode {
    /// The gate owns the agent's IO (capture files, stdin) and survives its supervisor.
    Direct,
    /// The agent is a pane's interactive program; the GO channel is a socket.
    Terminal,
    /// An external agent host started `fgos exec`: the agent keeps the host's stdio and the host speaks
    /// the CLI's protocol directly; the GO channel is a socket.
    External,
}

#[cfg(unix)]
impl LaunchMode {
    /// The modes whose gate dials the supervisor's socket and receives the locks with GO.
    pub(crate) fn dials_socket(self) -> bool {
        matches!(self, LaunchMode::Terminal | LaunchMode::External)
    }
}

/// What the gate reads from the envelope.
pub(crate) struct Config {
    pub(crate) attempt_id: String,
    pub(crate) digest: String,
    pub(crate) run_dir: std::path::PathBuf,
    pub(crate) cwd: std::path::PathBuf,
    pub(crate) command: String,
    pub(crate) args: Vec<String>,
    pub(crate) env: BTreeMap<String, String>,
    pub(crate) brief: Option<std::path::PathBuf>,
    pub(crate) stdout: std::path::PathBuf,
    pub(crate) stderr: std::path::PathBuf,
    pub(crate) side_file: std::path::PathBuf,
    pub(crate) preferred: String,
    /// `(bootId, CLOCK_BOOTTIME ns)` of the hard ceiling.
    pub(crate) ceiling: Option<(String, u64)>,
    pub(crate) grace: Duration,
    /// The current boot, read once.
    pub(crate) boot_id: Option<String>,
    /// How the agent is carried: by the gate alone, in a pane, or by an external host that owns its stdio.
    #[cfg(unix)]
    pub(crate) mode: LaunchMode,
    /// The envelope says the dispatch cwd is held by a lease, so a second lock description comes with GO.
    #[cfg(unix)]
    pub(crate) mutating: bool,
    #[cfg(unix)]
    pub(crate) outbox_dir: std::path::PathBuf,
    /// Extra wait after a result showed up while the supervisor is gone.
    #[cfg(unix)]
    pub(crate) orphan_settle: Duration,
}

/// Why the agent is being stopped.
pub(crate) struct Stop {
    pub(crate) stopped_by: &'static str,
    pub(crate) cause: String,
}

pub(crate) fn load_config(path: &Path) -> Result<Config, String> {
    let value = envelope::read_verified(path)?;
    let claimed = value["digest"].as_str().ok_or("envelope has no digest")?;
    let text_of = |v: &Value, what: &str| {
        v.as_str()
            .map(String::from)
            .ok_or_else(|| format!("envelope field {what} missing"))
    };
    let launch = &value["launch"];
    let string_map = |v: &Value| -> BTreeMap<String, String> {
        v.as_object()
            .map(|m| {
                m.iter()
                    .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                    .collect()
            })
            .unwrap_or_default()
    };
    let stdin_policy = text_of(&launch["stdinPolicy"], "launch.stdinPolicy")?;
    let brief = match (stdin_policy.as_str(), launch["briefPath"].as_str()) {
        ("brief-file", Some(path)) => Some(path.into()),
        ("brief-file", None) => return Err("stdinPolicy brief-file needs briefPath".into()),
        ("null", _) => None,
        (other, _) => return Err(format!("unknown stdinPolicy {other}")),
    };
    let ceiling = match (
        value["deadlines"]["hardCeiling"]["bootId"].as_str(),
        value["deadlines"]["hardCeiling"]["boottimeNs"].as_u64(),
    ) {
        (Some(boot), Some(ns)) => Some((boot.to_string(), ns)),
        _ => None,
    };
    let mode = match value["mode"].as_str() {
        Some("terminal") => LaunchMode::Terminal,
        Some("direct") => LaunchMode::Direct,
        Some("external") => LaunchMode::External,
        _ => return Err("envelope field mode missing".into()),
    };
    #[cfg(unix)]
    let orphan_settle = match mode {
        LaunchMode::Direct => Duration::ZERO,
        LaunchMode::Terminal | LaunchMode::External => {
            let section = if mode == LaunchMode::Terminal {
                "terminal"
            } else {
                "external"
            };
            match value[section]["orphanSettleMs"].as_u64() {
                Some(ms) => Duration::from_millis(ms),
                None => {
                    return Err(format!(
                        "a {section} envelope needs {section}.orphanSettleMs"
                    ))
                }
            }
        }
    };
    // Only the Unix gate has the socket modes; the mode is still validated everywhere.
    #[cfg(windows)]
    let _ = mode;
    Ok(Config {
        #[cfg(unix)]
        mode,
        #[cfg(unix)]
        mutating: value["mutation"] == "mutating",
        #[cfg(unix)]
        outbox_dir: text_of(&launch["outboxDir"], "launch.outboxDir")?.into(),
        #[cfg(unix)]
        orphan_settle,
        attempt_id: text_of(&value["attemptId"], "attemptId")?,
        digest: claimed.to_string(),
        run_dir: text_of(&value["runDir"], "runDir")?.into(),
        cwd: text_of(&value["cwd"], "cwd")?.into(),
        command: text_of(&launch["command"], "launch.command")?,
        args: launch["args"]
            .as_array()
            .map(|a| {
                a.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default(),
        env: string_map(&launch["env"]),
        brief,
        stdout: text_of(&launch["capture"]["stdout"], "launch.capture.stdout")?.into(),
        stderr: text_of(&launch["capture"]["stderr"], "launch.capture.stderr")?.into(),
        side_file: text_of(&value["sideFile"], "sideFile")?.into(),
        preferred: text_of(&value["containment"]["preferred"], "containment.preferred")?,
        ceiling,
        boot_id: facts::boot_id(),
        grace: Duration::from_millis(
            value["deadlines"]["gateKillGraceMs"]
                .as_u64()
                .ok_or("envelope field deadlines.gateKillGraceMs missing")?,
        ),
    })
}

pub(crate) fn read_side_env(config: &Config) -> Result<BTreeMap<String, String>, String> {
    let text =
        fs::read_to_string(&config.side_file).map_err(|e| format!("side file unreadable: {e}"))?;
    let value: Value =
        serde_json::from_str(&text).map_err(|e| format!("side file is not JSON: {e}"))?;
    if value["attemptId"] != config.attempt_id.as_str() {
        return Err("side file belongs to another attempt".into());
    }
    Ok(value["env"]
        .as_object()
        .map(|m| {
            m.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect()
        })
        .unwrap_or_default())
}

/// Nanoseconds on the clock the envelope's hard ceiling is written on:
/// `CLOCK_BOOTTIME` on Linux, the monotonic clock on macOS, milliseconds
/// since boot (sleep included) on Windows.
pub fn boottime_ns() -> u64 {
    #[cfg(unix)]
    {
        let mut ts = libc::timespec {
            tv_sec: 0,
            tv_nsec: 0,
        };
        #[cfg(target_os = "linux")]
        let clock = libc::CLOCK_BOOTTIME;
        #[cfg(not(target_os = "linux"))]
        let clock = libc::CLOCK_MONOTONIC;
        // SAFETY: clock_gettime writes one timespec.
        unsafe { libc::clock_gettime(clock, &mut ts) };
        ts.tv_sec as u64 * 1_000_000_000 + ts.tv_nsec as u64
    }
    #[cfg(windows)]
    {
        // SAFETY: GetTickCount64 has no preconditions.
        unsafe { windows_sys::Win32::System::SystemInformation::GetTickCount64() }
            .saturating_mul(1_000_000)
    }
}

/// Time left to the ceiling, `Some(ZERO)` when it passed or the boot differs.
pub(crate) fn ceiling_left(config: &Config) -> Option<Duration> {
    let (boot_id, at) = config.ceiling.as_ref()?;
    if config
        .boot_id
        .as_ref()
        .is_some_and(|current| current != boot_id)
    {
        return Some(Duration::ZERO);
    }
    Some(Duration::from_nanos(at.saturating_sub(boottime_ns())))
}

/// The `cause` a valid `stop-requested.json` names (the file the supervisor
/// writes before it stops the gate). `None`: no file, or one for another attempt.
pub(crate) fn stop_cause(config: &Config) -> Option<String> {
    fs::read_to_string(config.run_dir.join("stop-requested.json"))
        .ok()
        .and_then(|text| serde_json::from_str::<Value>(&text).ok())
        .filter(|v| v["attemptId"] == config.attempt_id.as_str())
        .and_then(|v| v["cause"].as_str().map(String::from))
}

/// Why the agent is being stopped: the named cause, else the signal itself.
#[cfg(unix)]
pub(crate) fn read_stop(config: &Config) -> Stop {
    stop_for(stop_cause(config))
}

/// [`read_stop`] for a cause already read.
pub(crate) fn stop_for(cause: Option<String>) -> Stop {
    match cause.as_deref() {
        Some("soft-deadline") => Stop {
            stopped_by: "soft-deadline",
            cause: "soft-deadline".into(),
        },
        Some("idle") => Stop {
            stopped_by: "idle",
            cause: "idle".into(),
        },
        Some("output-limit") => Stop {
            stopped_by: "output-limit",
            cause: "output-limit".into(),
        },
        Some("cancel") => Stop {
            stopped_by: "cancel",
            cause: "cancel".into(),
        },
        _ => Stop {
            stopped_by: "cancel",
            cause: "signal".into(),
        },
    }
}

/// Does the GO frame name this attempt's envelope. The pid is never compared.
pub(crate) fn go_matches(config: &Config, frame: &Value) -> bool {
    frame["type"] == "GO"
        && frame["attemptId"] == config.attempt_id.as_str()
        && frame["envelopeDigest"] == config.digest.as_str()
}

/// A line from the gate in the agent's own stderr capture, where whoever reads the run's output looks.
pub(crate) fn note_in_capture(config: &Config, text: &str) {
    use std::io::Write;
    eprintln!("fgos internal gate: {text}");
    if let Ok(mut file) = fs::OpenOptions::new().append(true).open(&config.stderr) {
        let _ = writeln!(file, "fgos internal gate: {text}");
    }
}

/// Why the agent did not start.
pub(crate) enum StartError {
    /// A capture file, the brief or the agent's job could not be set up.
    Setup(String),
    /// The OS refused to start the program.
    Spawn {
        program: String,
        source: std::io::Error,
    },
}

impl StartError {
    /// An agent that cannot start ends like a shell command that cannot start: 127 when the program
    /// itself is not there, 126 for anything else.
    pub(crate) fn exit_code(&self) -> i32 {
        match self {
            StartError::Spawn { source, .. } if source.kind() == std::io::ErrorKind::NotFound => {
                127
            }
            _ => 126,
        }
    }

    /// The reason, as it lands in the capture stderr.
    pub(crate) fn why(&self) -> String {
        match self {
            StartError::Setup(why) => why.clone(),
            StartError::Spawn { program, source } => {
                format!("agent {program} did not start: {source}")
            }
        }
    }
}

/// Publish `gate-exit.json` once. `exit_code` and `signal` are JSON values
/// (`null` when the platform has none); no `Stop` means the agent ended by itself.
pub(crate) fn publish_gate_exit(
    config: &Config,
    exit_code: Value,
    signal: Value,
    stop: Option<Stop>,
) -> Result<(), String> {
    let (stopped_by, cause) = stop.map_or(("agent", Value::Null), |s| {
        (s.stopped_by, Value::from(s.cause))
    });
    let exit = json!({
        "v": 1,
        "attemptId": config.attempt_id,
        "exitCode": exit_code,
        "signal": signal,
        "stoppedBy": stopped_by,
        "cause": cause,
        "exitedAt": iso_utc_now(),
    });
    let bytes = serde_json::to_vec(&exit).map_err(|e| e.to_string())?;
    let target = config.run_dir.join("gate-exit.json");
    // A sandbox whose root is read-only takes no new file in the attempt directory. The controller then
    // leaves an empty `gate-exit.json` bound into it and the gate fills it in place. No process of the
    // agent exists any more at this point, so nothing else can write it: the gate has the last word.
    if fs::symlink_metadata(&target).is_ok_and(|meta| meta.is_file()) {
        return write_in_place(&target, &bytes)
            .map_err(|e| format!("gate-exit.json not written: {e}"));
    }
    publish_once(&config.run_dir, "gate-exit.json", &bytes)
        .map_err(|e| format!("gate-exit.json not published: {e}"))?;
    Ok(())
}

/// Replace the content of an existing regular file, never through a symlink, and make it durable.
fn write_in_place(target: &Path, bytes: &[u8]) -> std::io::Result<()> {
    use std::io::Write;
    let mut options = fs::OpenOptions::new();
    options.write(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW);
    }
    let mut file = options.open(target)?;
    file.write_all(bytes)?;
    file.sync_all()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn argv_parses_and_refuses() {
        let ok = GateArgs::parse(&argv(&[
            "--protocol",
            "1",
            "--envelope",
            "/e.json",
            "--go-fd",
            "5",
            "--lock-fds",
            "3,4",
        ]))
        .unwrap();
        assert_eq!(
            ok,
            GateArgs {
                envelope: "/e.json".into(),
                go: GoEnd::Fd(5),
                lock_fds: vec![3, 4],
                job_name: None,
                agent_argv: None
            }
        );
        let pipe = GateArgs::parse(&argv(&[
            "--protocol",
            "1",
            "--envelope",
            "/e.json",
            "--go-socket",
            "p",
            "--job-name",
            "Local\\j",
        ]))
        .unwrap();
        assert_eq!(
            pipe,
            GateArgs {
                envelope: "/e.json".into(),
                go: GoEnd::Socket("p".into()),
                lock_fds: vec![],
                job_name: Some("Local\\j".into()),
                agent_argv: None
            }
        );
        assert_eq!(
            GateArgs::parse(&argv(&["--envelope", "/e", "--go-fd", "5"])),
            Err(ArgsError::VersionMismatch)
        );
        assert_eq!(
            GateArgs::parse(&argv(&[
                "--protocol",
                "2",
                "--envelope",
                "/e",
                "--go-fd",
                "5"
            ])),
            Err(ArgsError::VersionMismatch)
        );
        assert!(matches!(
            GateArgs::parse(&argv(&["--protocol", "1", "--go-fd", "5"])),
            Err(ArgsError::Usage(_))
        ));
        assert!(matches!(
            GateArgs::parse(&argv(&[
                "--protocol",
                "1",
                "--envelope",
                "/e",
                "--go-fd",
                "2"
            ])),
            Err(ArgsError::Usage(_))
        ));
        assert!(matches!(
            GateArgs::parse(&argv(&[
                "--protocol",
                "1",
                "--envelope",
                "/e",
                "--go-fd",
                "5",
                "--wat"
            ])),
            Err(ArgsError::Usage(_))
        ));
        assert!(matches!(
            GateArgs::parse(&argv(&["--protocol", "1", "--envelope", "/e"])),
            Err(ArgsError::Usage(_))
        ));
        assert!(matches!(
            GateArgs::parse(&argv(&[
                "--protocol",
                "1",
                "--envelope",
                "/e",
                "--go-fd",
                "5",
                "--go-socket",
                "p"
            ])),
            Err(ArgsError::Usage(_))
        ));
    }
}
