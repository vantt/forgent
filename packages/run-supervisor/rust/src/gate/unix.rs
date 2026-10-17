use std::collections::BTreeMap;
use std::fs::{File, OpenOptions};
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

use super::{ceiling_left, go_matches, load_config, publish_gate_exit, read_side_env, read_stop, report, Config, GateArgs, GoEnd, Stop, EXIT_ENVELOPE_INVALID, EXIT_INTERNAL, EXIT_NO_GO, EXIT_USAGE};
use crate::go_channel::{read_frame, write_frame};

/// Off Linux the sweep after the agent ended is bounded: a process the scan cannot end must not hold the gate forever.
#[cfg(not(target_os = "linux"))]
const NON_LINUX_EMPTY_WAIT: Duration = Duration::from_secs(10);

/// The write end of the self-pipe the signal handler feeds.
static SIGNAL_PIPE: AtomicI32 = AtomicI32::new(-1);

pub fn run(args: &GateArgs) -> i32 {
    let GoEnd::Fd(go_fd) = args.go else {
        eprintln!("fgos internal gate: usage: --go-socket is a Windows channel; pass --go-fd");
        return EXIT_USAGE;
    };
    // Before any other syscall: nothing the gate spawns may inherit a lock.
    for fd in args.lock_fds.iter().chain(std::iter::once(&go_fd)) {
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
    let mut go = unsafe { UnixStream::from_raw_fd(go_fd as libc::c_int) };
    if write_frame(&mut go, &json!({"type": "HELLO", "attemptId": config.attempt_id})).is_err() {
        return EXIT_NO_GO;
    }
    let go_frame = match wait_for_go(&mut go, pipe) {
        Some(frame) => frame,
        None => return EXIT_NO_GO,
    };
    if !go_matches(&config, &go_frame) {
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

fn supervise_agent(config: &Config, go_frame: &Value, secrets: BTreeMap<String, String>, go: &mut UnixStream, pipe: libc::c_int, pid1: bool) -> Result<(), String> {
    let mut stop: Option<Stop> = None;
    let mut status: Option<ExitStatus> = None;
    let mut agent_pid: Option<libc::pid_t> = None;
    let mut agent_tuple: Option<facts::ProcTuple> = None;

    if ceiling_left(config) == Some(Duration::ZERO) {
        // A ceiling already behind us: the agent never starts.
        stop = Some(Stop { stopped_by: "hard-ceiling", cause: "hard-ceiling".into() });
    } else {
        let child = match spawn_agent(config, go_frame, secrets) {
            Ok(child) => child,
            Err(why) => {
                // An agent that cannot start ends like a shell command that cannot start: 127 when the
                // program is not there, 126 when it cannot be run. The reason lands in the capture stderr.
                crate::gate::note_agent_not_started(config, &why);
                let code = if why.contains("No such file or directory") { 127 } else { 126 };
                end_domain(None, None, pid1);
                return publish_gate_exit(config, Value::from(code), Value::Null, None);
            }
        };
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
    publish_gate_exit(config, exit_code, signal, stop)?;
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
    // A sandbox hides some directories (a worktree under /tmp behind its private tmpfs): the agent then
    // starts at the root, as a process started by bwrap itself would.
    if config.cwd.is_dir() {
        cmd.current_dir(&config.cwd);
    } else {
        crate::gate::note_in_capture(config, &format!("working directory {} is not visible here, starting in /", config.cwd.display()));
        cmd.current_dir("/");
    }
    cmd.args(&config.args).env_clear().envs(&config.env).envs(&secrets);
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
    for entry in std::fs::read_dir("/proc").into_iter().flatten().flatten() {
        let Some(pid) = entry.file_name().to_str().and_then(|n| n.parse::<u32>().ok()) else { continue };
        let Ok(stat) = std::fs::read_to_string(format!("/proc/{pid}/stat")) else { continue };
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
    #[cfg(not(target_os = "linux"))]
    let started = Instant::now();
    loop {
        reap_all(None);
        // SAFETY: waitpid with a valid out pointer; WNOHANG never blocks.
        let none_left = unsafe { libc::waitpid(-1, std::ptr::null_mut(), libc::WNOHANG) } < 0 && io::Error::last_os_error().raw_os_error() == Some(libc::ECHILD);
        #[cfg(target_os = "linux")]
        let tree_empty = descendants_of_self().is_empty();
        // No subreaper off Linux: orphans go to launchd, so the domain judge
        // (agent group plus tree scan) is the only view of what is left.
        #[cfg(not(target_os = "linux"))]
        let tree_empty = tuple.is_none_or(|t| fgos_process::domain_is_empty(&fgos_process::Domain::MacosTree(t.clone())) == fgos_process::DomainState::Empty);
        #[cfg(not(target_os = "linux"))]
        if !tree_empty && started.elapsed() >= NON_LINUX_EMPTY_WAIT {
            eprintln!("fgos internal gate: processes still in the agent's tree after {NON_LINUX_EMPTY_WAIT:?}");
            return;
        }
        if none_left && tree_empty {
            return;
        }
        kill_everything(agent, tuple, pid1);
        #[cfg(not(target_os = "linux"))]
        if started.elapsed() >= NON_LINUX_EMPTY_WAIT {
            eprintln!("fgos internal gate: processes still in the agent's tree after {NON_LINUX_EMPTY_WAIT:?}");
            return;
        }
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