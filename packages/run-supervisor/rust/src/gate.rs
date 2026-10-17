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
use crate::publish::{iso_utc_now, publish_once};

#[cfg(unix)]
mod unix;
#[cfg(windows)]
mod windows;

/// The supervisor closed the GO channel, or signalled, before `GO`.
pub const EXIT_NO_GO: i32 = 64;
/// The envelope, its digest, the side file or `GO` did not match.
pub const EXIT_ENVELOPE_INVALID: i32 = 65;
/// Any other failure of the gate itself.
pub const EXIT_INTERNAL: i32 = 70;
pub(crate) const EXIT_USAGE: i32 = 2;
const EXIT_VERSION_MISMATCH: i32 = 3;

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
}

/// Why argv was refused; the number is the exit code.
#[derive(Debug, PartialEq, Eq)]
pub enum ArgsError {
    Usage(String),
    VersionMismatch,
}

/// Parse the arguments after `internal gate`:
/// `--protocol 1 --envelope <path> (--go-fd N | --go-socket <path>) [--lock-fds 3,4] [--job-name <name>]`.
pub fn parse_args(args: &[String]) -> Result<GateArgs, ArgsError> {
    let (mut protocol, mut envelope, mut go_fd, mut go_socket, mut lock_fds, mut job_name) = (None, None, None, None, Vec::new(), None);
    let mut iter = args.iter();
    while let Some(flag) = iter.next() {
        let mut value = || iter.next().cloned().ok_or_else(|| ArgsError::Usage(format!("{flag} needs a value")));
        match flag.as_str() {
            "--protocol" => protocol = Some(value()?),
            "--envelope" => envelope = Some(PathBuf::from(value()?)),
            "--go-fd" => go_fd = Some(parse_fd(&value()?)?),
            "--go-socket" => go_socket = Some(PathBuf::from(value()?)),
            "--job-name" => job_name = Some(value()?),
            "--lock-fds" => {
                lock_fds = value()?.split(',').filter(|s| !s.is_empty()).map(parse_fd).collect::<Result<_, _>>()?;
            }
            other => return Err(ArgsError::Usage(format!("unknown flag {other}"))),
        }
    }
    if protocol.as_deref() != Some("1") {
        return Err(ArgsError::VersionMismatch);
    }
    let envelope = envelope.ok_or_else(|| ArgsError::Usage("--envelope is required".into()))?;
    let go = match (go_fd, go_socket) {
        (Some(fd), None) => GoEnd::Fd(fd),
        (None, Some(path)) => GoEnd::Socket(path),
        _ => return Err(ArgsError::Usage("exactly one of --go-fd and --go-socket is required".into())),
    };
    Ok(GateArgs { envelope, go, lock_fds, job_name })
}

fn parse_fd(text: &str) -> Result<u32, ArgsError> {
    text.parse::<u32>().ok().filter(|fd| *fd >= 3).ok_or_else(|| ArgsError::Usage(format!("{text} is not a descriptor slot of 3 or more")))
}

/// Machine output of a failed gate: one JSON object on stdout.
pub(crate) fn report(code: &str, why: &str) {
    use std::io::Write;
    // A closed stdout or stderr must not turn the named exit code into a panic.
    let _ = writeln!(std::io::stdout(), "{}", json!({"v": 1, "protocol": 1, "result": "error", "code": code}));
    let _ = writeln!(std::io::stderr(), "fgos internal gate: {code}: {why}");
}

/// Run the gate; the return value is the process exit code.
pub fn run(args: &[String]) -> i32 {
    let args = match parse_args(args) {
        Ok(args) => args,
        Err(ArgsError::Usage(why)) => {
            eprintln!("fgos internal gate: usage: {why}");
            return EXIT_USAGE;
        }
        Err(ArgsError::VersionMismatch) => {
            report("host-version-mismatch", "--protocol 1 is required");
            return EXIT_VERSION_MISMATCH;
        }
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
}

/// Why the agent is being stopped.
pub(crate) struct Stop {
    pub(crate) stopped_by: &'static str,
    pub(crate) cause: String,
}

pub(crate) fn load_config(path: &Path) -> Result<Config, String> {
    let text = fs::read_to_string(path).map_err(|e| format!("envelope unreadable: {e}"))?;
    let value: Value = serde_json::from_str(&text).map_err(|e| format!("envelope is not JSON: {e}"))?;
    if value["v"] != 3 {
        return Err("envelope version is not 3".into());
    }
    let claimed = value["digest"].as_str().ok_or("envelope has no digest")?;
    let actual = envelope::digest(&value).map_err(|e| format!("envelope has no canonical form: {e:?}"))?;
    if claimed != actual {
        return Err("envelope digest mismatch".into());
    }
    let text_of = |v: &Value, what: &str| v.as_str().map(String::from).ok_or_else(|| format!("envelope field {what} missing"));
    let launch = &value["launch"];
    let string_map = |v: &Value| -> BTreeMap<String, String> {
        v.as_object().map(|m| m.iter().filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string()))).collect()).unwrap_or_default()
    };
    let stdin_policy = text_of(&launch["stdinPolicy"], "launch.stdinPolicy")?;
    let brief = match (stdin_policy.as_str(), launch["briefPath"].as_str()) {
        ("brief-file", Some(path)) => Some(path.into()),
        ("brief-file", None) => return Err("stdinPolicy brief-file needs briefPath".into()),
        ("null", _) => None,
        (other, _) => return Err(format!("unknown stdinPolicy {other}")),
    };
    let ceiling = match (value["deadlines"]["hardCeiling"]["bootId"].as_str(), value["deadlines"]["hardCeiling"]["boottimeNs"].as_u64()) {
        (Some(boot), Some(ns)) => Some((boot.to_string(), ns)),
        _ => None,
    };
    Ok(Config {
        attempt_id: text_of(&value["attemptId"], "attemptId")?,
        digest: claimed.to_string(),
        run_dir: text_of(&value["runDir"], "runDir")?.into(),
        cwd: text_of(&value["cwd"], "cwd")?.into(),
        command: text_of(&launch["command"], "launch.command")?,
        args: launch["args"].as_array().map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect()).unwrap_or_default(),
        env: string_map(&launch["env"]),
        brief,
        stdout: text_of(&launch["capture"]["stdout"], "launch.capture.stdout")?.into(),
        stderr: text_of(&launch["capture"]["stderr"], "launch.capture.stderr")?.into(),
        side_file: text_of(&value["sideFile"], "sideFile")?.into(),
        preferred: text_of(&value["containment"]["preferred"], "containment.preferred")?,
        ceiling,
        boot_id: facts::boot_id(),
        grace: Duration::from_millis(value["deadlines"]["gateKillGraceMs"].as_u64().ok_or("envelope field deadlines.gateKillGraceMs missing")?),
    })
}

pub(crate) fn read_side_env(config: &Config) -> Result<BTreeMap<String, String>, String> {
    let text = fs::read_to_string(&config.side_file).map_err(|e| format!("side file unreadable: {e}"))?;
    let value: Value = serde_json::from_str(&text).map_err(|e| format!("side file is not JSON: {e}"))?;
    if value["attemptId"] != config.attempt_id.as_str() {
        return Err("side file belongs to another attempt".into());
    }
    Ok(value["env"].as_object().map(|m| m.iter().filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string()))).collect()).unwrap_or_default())
}

/// Nanoseconds on the clock the envelope's hard ceiling is written on:
/// `CLOCK_BOOTTIME` on Linux, the monotonic clock on macOS, milliseconds
/// since boot (sleep included) on Windows.
pub fn boottime_ns() -> u64 {
    #[cfg(unix)]
    {
        let mut ts = libc::timespec { tv_sec: 0, tv_nsec: 0 };
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
        unsafe { windows_sys::Win32::System::SystemInformation::GetTickCount64() }.saturating_mul(1_000_000)
    }
}

/// Time left to the ceiling, `Some(ZERO)` when it passed or the boot differs.
pub(crate) fn ceiling_left(config: &Config) -> Option<Duration> {
    let (boot_id, at) = config.ceiling.as_ref()?;
    if config.boot_id.as_ref().is_some_and(|current| current != boot_id) {
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
        Some("soft-deadline") => Stop { stopped_by: "soft-deadline", cause: "soft-deadline".into() },
        Some("idle") => Stop { stopped_by: "idle", cause: "idle".into() },
        Some("cancel") => Stop { stopped_by: "cancel", cause: "cancel".into() },
        _ => Stop { stopped_by: "cancel", cause: "signal".into() },
    }
}

/// Does the GO frame name this attempt's envelope. The pid is never compared.
pub(crate) fn go_matches(config: &Config, frame: &Value) -> bool {
    frame["type"] == "GO" && frame["attemptId"] == config.attempt_id.as_str() && frame["envelopeDigest"] == config.digest.as_str()
}

/// Publish `gate-exit.json` once. `exit_code` and `signal` are JSON values
/// (`null` when the platform has none); no `Stop` means the agent ended by itself.
pub(crate) fn publish_gate_exit(config: &Config, exit_code: Value, signal: Value, stop: Option<Stop>) -> Result<(), String> {
    let (stopped_by, cause) = stop.map_or(("agent", Value::Null), |s| (s.stopped_by, Value::from(s.cause)));
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
        return write_in_place(&target, &bytes).map_err(|e| format!("gate-exit.json not written: {e}"));
    }
    publish_once(&config.run_dir, "gate-exit.json", &bytes).map_err(|e| format!("gate-exit.json not published: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn argv_parses_and_refuses() {
        let ok = parse_args(&argv(&["--protocol", "1", "--envelope", "/e.json", "--go-fd", "5", "--lock-fds", "3,4"])).unwrap();
        assert_eq!(ok, GateArgs { envelope: "/e.json".into(), go: GoEnd::Fd(5), lock_fds: vec![3, 4], job_name: None });
        let pipe = parse_args(&argv(&["--protocol", "1", "--envelope", "/e.json", "--go-socket", "p", "--job-name", "Local\\j"])).unwrap();
        assert_eq!(pipe, GateArgs { envelope: "/e.json".into(), go: GoEnd::Socket("p".into()), lock_fds: vec![], job_name: Some("Local\\j".into()) });
        assert_eq!(parse_args(&argv(&["--envelope", "/e", "--go-fd", "5"])), Err(ArgsError::VersionMismatch));
        assert_eq!(parse_args(&argv(&["--protocol", "2", "--envelope", "/e", "--go-fd", "5"])), Err(ArgsError::VersionMismatch));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--go-fd", "5"])), Err(ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e", "--go-fd", "2"])), Err(ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e", "--go-fd", "5", "--wat"])), Err(ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e"])), Err(ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e", "--go-fd", "5", "--go-socket", "p"])), Err(ArgsError::Usage(_))));
    }
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
