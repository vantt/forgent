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

use std::path::PathBuf;

/// The supervisor closed the GO channel, or signalled, before `GO`.
pub const EXIT_NO_GO: i32 = 64;
/// The envelope, its digest, the side file or `GO` did not match.
pub const EXIT_ENVELOPE_INVALID: i32 = 65;
/// Any other failure of the gate itself.
pub const EXIT_INTERNAL: i32 = 70;
const EXIT_USAGE: i32 = 2;
const EXIT_VERSION_MISMATCH: i32 = 3;

/// Parsed argv of `fgos internal gate`.
#[derive(Debug, PartialEq, Eq)]
pub struct GateArgs {
    pub envelope: PathBuf,
    /// The inherited GO channel end.
    pub go_fd: u32,
    /// Lock descriptions inherited from the supervisor, closed on exec first.
    pub lock_fds: Vec<u32>,
}

/// Why argv was refused; the number is the exit code.
#[derive(Debug, PartialEq, Eq)]
pub enum ArgsError {
    Usage(String),
    VersionMismatch,
}

/// Parse the arguments after `internal gate`:
/// `--protocol 1 --envelope <path> --go-fd N [--lock-fds 3,4]`.
pub fn parse_args(args: &[String]) -> Result<GateArgs, ArgsError> {
    let (mut protocol, mut envelope, mut go_fd, mut lock_fds) = (None, None, None, Vec::new());
    let mut iter = args.iter();
    while let Some(flag) = iter.next() {
        let mut value = || iter.next().cloned().ok_or_else(|| ArgsError::Usage(format!("{flag} needs a value")));
        match flag.as_str() {
            "--protocol" => protocol = Some(value()?),
            "--envelope" => envelope = Some(PathBuf::from(value()?)),
            "--go-fd" => go_fd = Some(parse_fd(&value()?)?),
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
    let go_fd = go_fd.ok_or_else(|| ArgsError::Usage("--go-fd is required".into()))?;
    Ok(GateArgs { envelope, go_fd, lock_fds })
}

fn parse_fd(text: &str) -> Result<u32, ArgsError> {
    text.parse::<u32>().ok().filter(|fd| *fd >= 3).ok_or_else(|| ArgsError::Usage(format!("{text} is not a descriptor slot of 3 or more")))
}

/// Machine output of a failed gate: one JSON object on stdout.
fn report(code: &str, why: &str) {
    use std::io::Write;
    // A closed stdout or stderr must not turn the named exit code into a panic.
    let _ = writeln!(std::io::stdout(), "{}", serde_json::json!({"v": 1, "protocol": 1, "result": "error", "code": code}));
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
    #[cfg(not(unix))]
    {
        let _ = args;
        report("unsupported-platform", "the gate has no Windows implementation yet; attempts there wait for the lock driver");
        EXIT_INTERNAL
    }
}

#[cfg(unix)]
mod unix {
    use std::collections::BTreeMap;
    use std::fs::{self, File, OpenOptions};
    use std::io::{self, Read};
    use std::os::fd::{AsRawFd, FromRawFd};
    use std::os::unix::fs::OpenOptionsExt;
    use std::os::unix::net::UnixStream;
    use std::os::unix::process::{CommandExt, ExitStatusExt};
    use std::path::Path;
    use std::process::{Command, ExitStatus, Stdio};
    use std::sync::atomic::{AtomicI32, Ordering};
    use std::time::{Duration, Instant};

    use fgos_process::control::spawn_with_fds;
    use fgos_process::facts;
    use fgos_process::ProcId;
    use serde_json::{json, Value};

    use super::{report, GateArgs, EXIT_ENVELOPE_INVALID, EXIT_INTERNAL, EXIT_NO_GO};
    use crate::envelope;
    use crate::go_channel::{read_frame, write_frame};
    use crate::publish::{iso_utc_now, publish_once};

    /// The write end of the self-pipe the signal handler feeds.
    static SIGNAL_PIPE: AtomicI32 = AtomicI32::new(-1);

    /// What the gate reads from the envelope.
    struct Config {
        attempt_id: String,
        digest: String,
        run_dir: std::path::PathBuf,
        cwd: std::path::PathBuf,
        command: String,
        args: Vec<String>,
        env: BTreeMap<String, String>,
        brief: Option<std::path::PathBuf>,
        stdout: std::path::PathBuf,
        stderr: std::path::PathBuf,
        side_file: std::path::PathBuf,
        preferred: String,
        /// `(bootId, CLOCK_BOOTTIME ns)` of the hard ceiling.
        ceiling: Option<(String, u64)>,
        grace: Duration,
        /// The current boot, read once.
        boot_id: Option<String>,
    }

    /// Why the agent is being stopped.
    struct Stop {
        stopped_by: &'static str,
        cause: String,
    }

    pub fn run(args: &GateArgs) -> i32 {
        // Before any other syscall: nothing the gate spawns may inherit a lock.
        for fd in args.lock_fds.iter().chain(std::iter::once(&args.go_fd)) {
            if let Err(err) = set_cloexec(*fd as libc::c_int) {
                report("fd-invalid", &format!("descriptor {fd}: {err}"));
                return EXIT_INTERNAL;
            }
        }
        let pipe = match install_signal_pipe() {
            Ok(fd) => fd,
            Err(err) => {
                report("signal-setup-failed", &err.to_string());
                return EXIT_INTERNAL;
            }
        };
        let config = match load_config(&args.envelope) {
            Ok(config) => config,
            Err(why) => {
                report("envelope-invalid", &why);
                return EXIT_ENVELOPE_INVALID;
            }
        };
        // SAFETY: getpid has no preconditions.
        let is_init = unsafe { libc::getpid() } == 1;
        if config.preferred == "linux-gate" && !is_init {
            report("not-pid-1", "the envelope names linux-gate but this process is not pid 1 of its namespace");
            return EXIT_INTERNAL;
        }
        // `kill(-1)` is armed only for the driver whose domain is the namespace.
        let pid1 = is_init && config.preferred == "linux-gate";
        #[cfg(target_os = "linux")]
        if !pid1 {
            // Without a namespace the gate adopts orphans itself so the sweep
            // at the end can find every descendant.
            // SAFETY: prctl with PR_SET_CHILD_SUBREAPER takes one integer.
            unsafe { libc::prctl(libc::PR_SET_CHILD_SUBREAPER, 1 as libc::c_ulong, 0, 0, 0) };
        }

        // SAFETY: the descriptor was handed to this process and nothing else owns it.
        let mut go = unsafe { UnixStream::from_raw_fd(args.go_fd as libc::c_int) };
        if write_frame(&mut go, &json!({"type": "HELLO", "attemptId": config.attempt_id})).is_err() {
            return EXIT_NO_GO;
        }
        let go_frame = match wait_for_go(&mut go, pipe) {
            Some(frame) => frame,
            None => return EXIT_NO_GO,
        };
        if go_frame["type"] != "GO" || go_frame["attemptId"] != config.attempt_id.as_str() || go_frame["envelopeDigest"] != config.digest.as_str() {
            report("go-mismatch", "GO does not name this attempt's envelope");
            return EXIT_ENVELOPE_INVALID;
        }
        let secrets = match read_side_env(&config) {
            Ok(env) => env,
            Err(why) => {
                report("envelope-invalid", &why);
                return EXIT_ENVELOPE_INVALID;
            }
        };
        match supervise_agent(&config, &go_frame, secrets, &mut go, pipe, pid1) {
            Ok(()) => 0,
            Err(why) => {
                report("gate-failed", &why);
                EXIT_INTERNAL
            }
        }
    }

    fn set_cloexec(fd: libc::c_int) -> io::Result<()> {
        // SAFETY: fcntl only reads and sets flags on a descriptor number.
        let flags = unsafe { libc::fcntl(fd, libc::F_GETFD) };
        if flags < 0 {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: as above.
        if unsafe { libc::fcntl(fd, libc::F_SETFD, flags | libc::FD_CLOEXEC) } < 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(())
    }

    extern "C" fn on_signal(sig: libc::c_int) {
        let fd = SIGNAL_PIPE.load(Ordering::Relaxed);
        let byte = sig as u8;
        // SAFETY: write is async-signal-safe; errno is saved and restored.
        unsafe {
            let saved = *errno_location();
            libc::write(fd, (&byte as *const u8).cast(), 1);
            *errno_location() = saved;
        }
    }

    #[cfg(target_os = "linux")]
    unsafe fn errno_location() -> *mut libc::c_int {
        libc::__errno_location()
    }
    #[cfg(not(target_os = "linux"))]
    unsafe fn errno_location() -> *mut libc::c_int {
        libc::__error()
    }

    /// Handlers for SIGTERM, SIGINT and SIGCHLD that feed a self-pipe. A pid 1
    /// only receives a signal from outside its namespace when it has a handler.
    /// Returns the read end of the pipe.
    fn install_signal_pipe() -> io::Result<libc::c_int> {
        let mut fds = [0 as libc::c_int; 2];
        // SAFETY: pipe fills two descriptors on success.
        if unsafe { libc::pipe(fds.as_mut_ptr()) } != 0 {
            return Err(io::Error::last_os_error());
        }
        for fd in fds {
            set_cloexec(fd)?;
            // SAFETY: fcntl on a descriptor just created.
            unsafe { libc::fcntl(fd, libc::F_SETFL, libc::fcntl(fd, libc::F_GETFL) | libc::O_NONBLOCK) };
        }
        SIGNAL_PIPE.store(fds[1], Ordering::Relaxed);
        for sig in [libc::SIGTERM, libc::SIGINT, libc::SIGCHLD] {
            // SAFETY: sigaction with a zeroed struct plus a handler that only calls write.
            unsafe {
                let mut action: libc::sigaction = std::mem::zeroed();
                action.sa_sigaction = on_signal as *const () as usize;
                action.sa_flags = libc::SA_RESTART | libc::SA_NOCLDSTOP;
                libc::sigemptyset(&mut action.sa_mask);
                if libc::sigaction(sig, &action, std::ptr::null_mut()) != 0 {
                    return Err(io::Error::last_os_error());
                }
            }
        }
        Ok(fds[0])
    }

    /// The signals queued on the pipe, drained.
    fn drain_signals(pipe: libc::c_int) -> Vec<libc::c_int> {
        let mut seen = Vec::new();
        let mut buf = [0u8; 64];
        loop {
            // SAFETY: read into a local buffer of the length passed.
            let n = unsafe { libc::read(pipe, buf.as_mut_ptr().cast(), buf.len()) };
            if n <= 0 {
                return seen;
            }
            seen.extend(buf[..n as usize].iter().map(|b| *b as libc::c_int));
        }
    }

    fn poll_fds(fds: &mut [libc::pollfd], timeout: Option<Duration>) {
        let ms = timeout.map_or(-1, |t| t.as_millis().min(i32::MAX as u128) as libc::c_int);
        // SAFETY: poll over a valid slice of pollfd.
        unsafe { libc::poll(fds.as_mut_ptr(), fds.len() as libc::nfds_t, ms) };
    }

    /// Wait for the GO frame. `None`: EOF, a protocol error, or a stop signal.
    /// The frame is accumulated without blocking, so a signal is seen even
    /// while the supervisor has sent only part of it.
    fn wait_for_go(go: &mut UnixStream, pipe: libc::c_int) -> Option<Value> {
        go.set_nonblocking(true).ok()?;
        let mut buf: Vec<u8> = Vec::new();
        loop {
            let mut fds = [
                libc::pollfd { fd: go.as_raw_fd(), events: libc::POLLIN, revents: 0 },
                libc::pollfd { fd: pipe, events: libc::POLLIN, revents: 0 },
            ];
            poll_fds(&mut fds, None);
            if fds[1].revents != 0 && drain_signals(pipe).iter().any(|s| *s == libc::SIGTERM || *s == libc::SIGINT) {
                return None;
            }
            if fds[0].revents == 0 {
                continue;
            }
            let mut chunk = [0u8; 4096];
            match go.read(&mut chunk) {
                Ok(0) => return None,
                Ok(n) => buf.extend_from_slice(&chunk[..n]),
                Err(err) if matches!(err.kind(), io::ErrorKind::WouldBlock | io::ErrorKind::Interrupted) => continue,
                Err(_) => return None,
            }
            if buf.len() >= 4 {
                let len = u32::from_be_bytes([buf[0], buf[1], buf[2], buf[3]]) as usize;
                if len > crate::go_channel::MAX_FRAME_BYTES {
                    return None;
                }
                if buf.len() >= 4 + len {
                    let frame = read_frame(&mut buf.as_slice()).ok();
                    // Back to blocking writes for the AGENT frame.
                    go.set_nonblocking(false).ok()?;
                    return frame;
                }
            }
        }
    }

    fn load_config(path: &Path) -> Result<Config, String> {
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

    fn read_side_env(config: &Config) -> Result<BTreeMap<String, String>, String> {
        let text = fs::read_to_string(&config.side_file).map_err(|e| format!("side file unreadable: {e}"))?;
        let value: Value = serde_json::from_str(&text).map_err(|e| format!("side file is not JSON: {e}"))?;
        if value["attemptId"] != config.attempt_id.as_str() {
            return Err("side file belongs to another attempt".into());
        }
        Ok(value["env"].as_object().map(|m| m.iter().filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string()))).collect()).unwrap_or_default())
    }

    fn boottime_ns() -> u64 {
        let mut ts = libc::timespec { tv_sec: 0, tv_nsec: 0 };
        #[cfg(target_os = "linux")]
        let clock = libc::CLOCK_BOOTTIME;
        #[cfg(not(target_os = "linux"))]
        let clock = libc::CLOCK_MONOTONIC;
        // SAFETY: clock_gettime writes one timespec.
        unsafe { libc::clock_gettime(clock, &mut ts) };
        ts.tv_sec as u64 * 1_000_000_000 + ts.tv_nsec as u64
    }

    /// Time left to the ceiling, `Some(ZERO)` when it passed or the boot differs.
    fn ceiling_left(config: &Config) -> Option<Duration> {
        let (boot_id, at) = config.ceiling.as_ref()?;
        if config.boot_id.as_ref().is_some_and(|current| current != boot_id) {
            return Some(Duration::ZERO);
        }
        Some(Duration::from_nanos(at.saturating_sub(boottime_ns())))
    }

    /// `cause` from `stop-requested.json`, which the supervisor writes before
    /// it signals; without a valid file the signal itself is the cause.
    fn read_stop(config: &Config) -> Stop {
        let named = fs::read_to_string(config.run_dir.join("stop-requested.json"))
            .ok()
            .and_then(|text| serde_json::from_str::<Value>(&text).ok())
            .filter(|v| v["attemptId"] == config.attempt_id.as_str())
            .and_then(|v| v["cause"].as_str().map(String::from));
        match named.as_deref() {
            Some("soft-deadline") => Stop { stopped_by: "soft-deadline", cause: "soft-deadline".into() },
            Some("idle") => Stop { stopped_by: "idle", cause: "idle".into() },
            Some("cancel") => Stop { stopped_by: "cancel", cause: "cancel".into() },
            _ => Stop { stopped_by: "cancel", cause: "signal".into() },
        }
    }

    fn supervise_agent(config: &Config, go_frame: &Value, secrets: BTreeMap<String, String>, go: &mut UnixStream, pipe: libc::c_int, pid1: bool) -> Result<(), String> {
        let mut stop: Option<Stop> = None;
        let mut status: Option<ExitStatus> = None;
        let mut agent_pid: Option<libc::pid_t> = None;
        let mut agent_tuple: Option<facts::ProcTuple> = None;

        if ceiling_left(config) == Some(Duration::ZERO) {
            // A ceiling already behind us: the agent never starts.
            stop = Some(Stop { stopped_by: "hard-ceiling", cause: "hard-ceiling".into() });
        } else {
            let child = spawn_agent(config, go_frame, secrets)?;
            let pid = child.id() as libc::pid_t;
            agent_pid = Some(pid);
            agent_tuple = facts::identity_of(ProcId(child.id()));
            // The Child handle is not used again: the gate reaps with waitpid(-1).
            std::mem::forget(child);
            let tuple = agent_tuple.as_ref().map_or(Value::Null, |t| t.to_record().to_json());
            let _ = write_frame(go, &json!({"type": "AGENT", "tuple": tuple}));
        }

        let mut grace_ends: Option<Instant> = None;
        let mut escalated = false;
        while agent_pid.is_some() && status.is_none() {
            let now = Instant::now();
            let timeout = [
                grace_ends.filter(|_| !escalated).map(|at| at.saturating_duration_since(now)),
                ceiling_left(config).filter(|_| stop.is_none()),
            ]
            .into_iter()
            .flatten()
            .min();
            let mut fds = [libc::pollfd { fd: pipe, events: libc::POLLIN, revents: 0 }];
            poll_fds(&mut fds, timeout);
            for sig in drain_signals(pipe) {
                if (sig == libc::SIGTERM || sig == libc::SIGINT) && stop.is_none() {
                    stop = Some(read_stop(config));
                    grace_ends = Some(Instant::now() + config.grace);
                    signal_agent_group(agent_pid, libc::SIGTERM);
                }
            }
            if stop.is_none() && ceiling_left(config) == Some(Duration::ZERO) {
                stop = Some(Stop { stopped_by: "hard-ceiling", cause: "hard-ceiling".into() });
                grace_ends = Some(Instant::now() + config.grace);
                signal_agent_group(agent_pid, libc::SIGTERM);
            }
            if !escalated && grace_ends.is_some_and(|at| Instant::now() >= at) {
                escalated = true;
                kill_everything(agent_pid, agent_tuple.as_ref(), pid1);
            }
            status = reap_all(agent_pid);
        }

        end_domain(agent_pid, agent_tuple.as_ref(), pid1);

        let (exit_code, signal) = match status {
            Some(s) if s.code().is_some() => (s.code().map(Value::from).unwrap_or(Value::Null), Value::Null),
            Some(s) => (Value::Null, s.signal().map_or(Value::Null, |n| Value::from(signal_name(n)))),
            None => (Value::Null, Value::Null),
        };
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
        publish_once(&config.run_dir, "gate-exit.json", &bytes).map_err(|e| format!("gate-exit.json not published: {e}"))?;
        Ok(())
    }

    fn spawn_agent(config: &Config, go_frame: &Value, secrets: BTreeMap<String, String>) -> Result<std::process::Child, String> {
        let append = |path: &Path| OpenOptions::new().create(true).append(true).mode(0o600).custom_flags(libc::O_CLOEXEC).open(path).map_err(|e| format!("capture {}: {e}", path.display()));
        let stdout = append(&config.stdout)?;
        let stderr = append(&config.stderr)?;
        let stdin: Stdio = match &config.brief {
            Some(path) => File::open(path).map_err(|e| format!("brief {}: {e}", path.display()))?.into(),
            None => Stdio::null(),
        };
        let mut cmd = Command::new(&config.command);
        cmd.args(&config.args).env_clear().envs(&config.env).envs(&secrets).current_dir(&config.cwd);
        match go_frame.get("gateHostTuple").filter(|t| !t.is_null()) {
            Some(anchor) => cmd.env("FGOS_PIDNS_ANCHOR", anchor.to_string()),
            None => cmd.env_remove("FGOS_PIDNS_ANCHOR"),
        };
        cmd.stdin(stdin).stdout(stdout).stderr(stderr);
        // SAFETY: setsid is async-signal-safe; the agent leads its own session and group.
        unsafe {
            cmd.pre_exec(|| {
                if libc::setsid() < 0 {
                    return Err(io::Error::last_os_error());
                }
                Ok(())
            });
        }
        // The agent receives no lock description: the map is empty.
        spawn_with_fds(cmd, &[]).map_err(|e| format!("agent {} did not start: {e}", config.command))
    }

    fn signal_agent_group(agent: Option<libc::pid_t>, sig: libc::c_int) {
        if let Some(pid) = agent {
            // SAFETY: killpg on the group of the agent this gate started.
            unsafe { libc::killpg(pid, sig) };
        }
    }

    /// End every process of the domain except the gate. pid 1: `kill(-1)`. No
    /// namespace: the agent group, then every descendant the gate adopted.
    fn kill_everything(agent: Option<libc::pid_t>, tuple: Option<&facts::ProcTuple>, pid1: bool) {
        if pid1 {
            // SAFETY: as pid 1 of its namespace, kill(-1) reaches only the namespace.
            unsafe { libc::kill(-1, libc::SIGKILL) };
            return;
        }
        signal_agent_group(agent, libc::SIGKILL);
        #[cfg(target_os = "linux")]
        {
            let _ = tuple;
            for pid in descendants_of_self() {
                // SAFETY: SIGKILL to a process found in this gate's own tree.
                unsafe { libc::kill(pid, libc::SIGKILL) };
            }
        }
        #[cfg(not(target_os = "linux"))]
        if let Some(tuple) = tuple {
            let _ = fgos_process::domain_kill_all(&fgos_process::Domain::MacosTree(tuple.clone()));
        }
    }

    /// Every live process whose parent chain reaches this gate.
    #[cfg(target_os = "linux")]
    fn descendants_of_self() -> Vec<libc::pid_t> {
        let me = std::process::id();
        let mut parent_of: Vec<(u32, u32)> = Vec::new();
        for entry in fs::read_dir("/proc").into_iter().flatten().flatten() {
            let Some(pid) = entry.file_name().to_str().and_then(|n| n.parse::<u32>().ok()) else { continue };
            let Ok(stat) = fs::read_to_string(format!("/proc/{pid}/stat")) else { continue };
            let Some(rest) = stat.rfind(')').map(|i| &stat[i + 1..]) else { continue };
            let mut fields = rest.split_whitespace();
            let (Some(state), Some(ppid)) = (fields.next(), fields.next().and_then(|p| p.parse::<u32>().ok())) else { continue };
            if state != "Z" {
                parent_of.push((pid, ppid));
            }
        }
        let mut found: Vec<u32> = Vec::new();
        let mut frontier = vec![me];
        while let Some(parent) = frontier.pop() {
            for (pid, _) in parent_of.iter().filter(|(_, ppid)| *ppid == parent) {
                if !found.contains(pid) {
                    found.push(*pid);
                    frontier.push(*pid);
                }
            }
        }
        found.into_iter().map(|p| p as libc::pid_t).collect()
    }

    /// Reap every child that has ended. Returns the agent's status when it was among them.
    fn reap_all(agent: Option<libc::pid_t>) -> Option<ExitStatus> {
        let mut agent_status = None;
        loop {
            let mut raw: libc::c_int = 0;
            // SAFETY: waitpid with a valid out pointer.
            let pid = unsafe { libc::waitpid(-1, &mut raw, libc::WNOHANG) };
            if pid <= 0 {
                return agent_status;
            }
            if Some(pid) == agent {
                agent_status = Some(ExitStatus::from_raw(raw));
            }
        }
    }

    /// End every process of the domain and reap until `ECHILD`. The kill is
    /// repeated: in a namespace after every reaped child (a process that was
    /// forking when the first kill landed cannot outlive it); without one,
    /// until a scan of the gate's tree finds nothing, because an orphan
    /// adopted by the gate after the first scan is still a member.
    fn end_domain(agent: Option<libc::pid_t>, tuple: Option<&facts::ProcTuple>, pid1: bool) {
        kill_everything(agent, tuple, pid1);
        if pid1 {
            loop {
                let mut raw: libc::c_int = 0;
                // SAFETY: waitpid with a valid out pointer.
                let pid = unsafe { libc::waitpid(-1, &mut raw, 0) };
                if pid > 0 {
                    // SAFETY: as in kill_everything.
                    unsafe { libc::kill(-1, libc::SIGKILL) };
                    continue;
                }
                if io::Error::last_os_error().raw_os_error() != Some(libc::EINTR) {
                    return;
                }
            }
        }
        loop {
            reap_all(None);
            // SAFETY: waitpid with a valid out pointer; WNOHANG never blocks.
            let none_left = unsafe { libc::waitpid(-1, std::ptr::null_mut(), libc::WNOHANG) } < 0 && io::Error::last_os_error().raw_os_error() == Some(libc::ECHILD);
            #[cfg(target_os = "linux")]
            let tree_empty = descendants_of_self().is_empty();
            #[cfg(not(target_os = "linux"))]
            let tree_empty = true;
            if none_left && tree_empty {
                return;
            }
            kill_everything(agent, tuple, pid1);
            std::thread::sleep(Duration::from_millis(5));
        }
    }

    fn signal_name(sig: i32) -> String {
        match sig {
            libc::SIGHUP => "SIGHUP".into(),
            libc::SIGINT => "SIGINT".into(),
            libc::SIGQUIT => "SIGQUIT".into(),
            libc::SIGABRT => "SIGABRT".into(),
            libc::SIGKILL => "SIGKILL".into(),
            libc::SIGSEGV => "SIGSEGV".into(),
            libc::SIGPIPE => "SIGPIPE".into(),
            libc::SIGALRM => "SIGALRM".into(),
            libc::SIGTERM => "SIGTERM".into(),
            other => format!("SIG{other}"),
        }
    }
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
        assert_eq!(ok, GateArgs { envelope: "/e.json".into(), go_fd: 5, lock_fds: vec![3, 4] });
        assert_eq!(parse_args(&argv(&["--envelope", "/e", "--go-fd", "5"])), Err(ArgsError::VersionMismatch));
        assert_eq!(parse_args(&argv(&["--protocol", "2", "--envelope", "/e", "--go-fd", "5"])), Err(ArgsError::VersionMismatch));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--go-fd", "5"])), Err(ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e", "--go-fd", "2"])), Err(ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e", "--go-fd", "5", "--wat"])), Err(ArgsError::Usage(_))));
    }
}
