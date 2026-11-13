//! The supervisor's `terminal` launch mode: the gate runs in a herdr pane that
//! terminal-control opened for this attempt's slot key, the agent is the pane's
//! interactive program, and what happens to it is read off the screen.
//!
//! The order is fixed by the contracts: the socket exists before the pane is
//! launched into; `GO` goes out only after terminal-control's `launched` marker
//! is on disk, the gate's identity is on the lock (`declare_domain`) and the
//! attempt is bound; `BRIEF_DELIVERED` goes out only after the agent protocol
//! reports `delivered`. The connection to the gate stays open until the
//! attempt ends: the gate reads an early close as a dead supervisor.
//!
//! The supervisor never closes a pane in this file. Releasing the slot is the
//! `release-slot` step, which runs for every attempt and decides from the
//! receipt.

use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::Write;
use std::os::fd::{AsRawFd, RawFd};
use std::os::unix::fs::{MetadataExt, OpenOptionsExt, PermissionsExt};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_agent_protocol::port::{AgentIo, Inspection, IoError, SendInput};
use fgos_agent_protocol::terminal::{
    adapter_for, ExitCommand, FsOutbox, Readiness, Terminal, TerminalOutcome, UnreadableResult,
    REASON_AGENT_NOT_STARTED, REASON_COMPLETED_NO_EXIT, REASON_FOREGROUND_NOT_AGENT,
    REASON_NEEDS_SETUP, REASON_RESULT_UNREADABLE,
};
use fgos_agent_protocol::BlockedReason;
use fgos_process::facts::{self, ProcTuple};
use fgos_process::{domain_is_empty, domain_kill_all, Domain, DomainState, ProcId};
use fgos_terminal_control::core::{Core, Want};
use fgos_terminal_control::port::{
    ExpectedProcess, LaunchOutcome, LaunchSpec, PaneState, ProcessIdentity,
    Refusal as TerminalRefusal, SendOutcome,
};
use serde_json::{json, Value};

use super::{
    os, request_stop, GateLink, Refusal, TerminalEnd, Watch, GATE_STOP_SLACK, HELLO_LIMIT, TICK,
};
use crate::go_channel::{peer_uid, read_frame, write_frame};
use crate::route::EXIT_ENVELOPE_INVALID;
use crate::terminal_slot::Backend;

/// `sun_path` holds 108 bytes including the terminating NUL.
const MAX_SOCKET_PATH: usize = 107;
/// How long the agent protocol waits for the prompt (the Node controller's ready timeout).
const READY_MS: u64 = 30_000;
/// How long after the AGENT frame the gate may take to report the agent when it did not just leave.
const AGENT_WAIT: Duration = Duration::from_secs(30);
/// How long the agent has to leave after the exit command before the supervisor stops it.
const EXIT_WAIT: Duration = Duration::from_secs(20);
/// How long past the grace a refused domain kill is retried before the attempt is published as it stands.
const DOMAIN_END_WAIT: Duration = Duration::from_secs(10);
/// Gap between two looks at the pane while the agent works.
const WORK_POLL_MS: u64 = 700;
const CARRIER_EVERY: Duration = Duration::from_secs(1);
const SCREEN_SAMPLE_EVERY: Duration = Duration::from_secs(1);

/// Whether looking at the screen can change what ends the attempt. New words push the idle deadline later, so
/// it matters only while that deadline can still come before the soft one; with no idle deadline there is
/// nothing to push.
fn sampling_can_matter(idle_left: Option<Duration>, soft_left: Option<Duration>) -> bool {
    match (idle_left, soft_left) {
        (None, _) => false,
        (Some(_), None) => true,
        (Some(idle), Some(soft)) => idle < soft,
    }
}

/// What the envelope says about a terminal attempt.
struct Plan {
    key: String,
    socket_path: PathBuf,
    host_bin: String,
    bwrap_prefix: Option<Vec<String>>,
    domain_kind: String,
    exit: Option<String>,
    brief: String,
    adapter: Terminal,
}

impl Plan {
    fn from(envelope: &Value) -> Result<Plan, Refusal> {
        let invalid = |why: String| Refusal {
            exit: EXIT_ENVELOPE_INVALID,
            code: "envelope-invalid",
            why,
        };
        let text = |v: &Value, what: &str| {
            v.as_str()
                .map(String::from)
                .ok_or_else(|| invalid(format!("envelope field {what} missing")))
        };
        let cli = envelope["agentProtocol"]["cli"]
            .as_str()
            .unwrap_or_default();
        let adapter = adapter_for(cli).ok_or(Refusal {
            exit: EXIT_ENVELOPE_INVALID,
            code: "agent-protocol-unsupported",
            why: format!("{cli} has no terminal adapter"),
        })?;
        let brief_path = text(&envelope["launch"]["briefPath"], "launch.briefPath")?;
        let brief = fs::read_to_string(&brief_path)
            .map_err(|e| invalid(format!("brief {brief_path}: {e}")))?;
        let bwrap_prefix = envelope["containment"]["bwrapPrefix"]
            .as_array()
            .map(|items| {
                let mut prefix: Vec<String> = items
                    .iter()
                    .filter_map(Value::as_str)
                    .map(String::from)
                    .collect();
                if prefix.last().is_some_and(|last| last == "--") {
                    prefix.pop();
                }
                prefix
            });
        Ok(Plan {
            key: text(&envelope["slot"]["key"], "slot.key")?,
            socket_path: PathBuf::from(text(
                &envelope["terminal"]["socketPath"],
                "terminal.socketPath",
            )?),
            host_bin: text(&envelope["hostBin"], "hostBin")?,
            bwrap_prefix: bwrap_prefix.filter(|p| !p.is_empty()),
            domain_kind: text(
                &envelope["containment"]["preferred"],
                "containment.preferred",
            )?,
            exit: envelope["terminal"]["exitCommand"]
                .as_str()
                .map(String::from),
            brief: brief.trim_end().to_string(),
            adapter,
        })
    }
}

/// The attempt's listening socket; the path is removed when this goes.
struct AttemptSocket {
    listener: Option<UnixListener>,
    path: PathBuf,
}

impl AttemptSocket {
    /// Bind inside a directory only this user can use, mode 0600.
    fn bind(path: &Path) -> Result<AttemptSocket, String> {
        if path.as_os_str().len() > MAX_SOCKET_PATH {
            return Err(format!(
                "socket path {} is longer than {MAX_SOCKET_PATH} bytes",
                path.display()
            ));
        }
        let dir = path.parent().ok_or("socket path has no directory")?;
        let meta =
            fs::metadata(dir).map_err(|e| format!("socket directory {}: {e}", dir.display()))?;
        // SAFETY: getuid has no failure mode.
        if meta.uid() != unsafe { libc::getuid() } || meta.mode() & 0o077 != 0 {
            return Err(format!(
                "socket directory {} must be owned by this user with mode 0700",
                dir.display()
            ));
        }
        let _ = fs::remove_file(path);
        let listener =
            UnixListener::bind(path).map_err(|e| format!("bind {}: {e}", path.display()))?;
        fs::set_permissions(path, fs::Permissions::from_mode(0o600))
            .map_err(|e| format!("chmod {}: {e}", path.display()))?;
        listener.set_nonblocking(true).map_err(|e| e.to_string())?;
        Ok(AttemptSocket {
            listener: Some(listener),
            path: path.to_path_buf(),
        })
    }

    /// The gate's connection: same uid, first frame HELLO for this attempt. Anything else is dropped
    /// and the wait goes on, so a stranger cannot take the gate's place or end the wait.
    fn accept_gate(&self, attempt_id: &str, limit: Duration) -> Option<UnixStream> {
        let listener = self.listener.as_ref()?;
        // SAFETY: getuid has no failure mode.
        let me = unsafe { libc::getuid() };
        let start = Instant::now();
        while start.elapsed() < limit {
            match listener.accept() {
                Ok((stream, _)) => {
                    let _ = stream.set_nonblocking(false);
                    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
                    let mut reader = &stream;
                    let hello = peer_uid(&stream) == Some(me)
                        && read_frame(&mut reader)
                            .is_ok_and(|f| f["type"] == "HELLO" && f["attemptId"] == attempt_id);
                    if hello {
                        let _ = stream.set_read_timeout(None);
                        return Some(stream);
                    }
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(TICK),
                Err(_) => return None,
            }
        }
        None
    }

    /// No second connection is taken once the gate is in, or when it never came.
    fn close(&mut self) {
        self.listener = None;
        let _ = fs::remove_file(&self.path);
    }
}

impl Drop for AttemptSocket {
    fn drop(&mut self) {
        self.close();
    }
}

/// One frame with descriptors riding on it (`SCM_RIGHTS`).
fn send_frame_with_fds(stream: &UnixStream, frame: &Value, fds: &[RawFd]) -> std::io::Result<()> {
    let body = serde_json::to_vec(frame).map_err(std::io::Error::other)?;
    let mut wire = (body.len() as u32).to_be_bytes().to_vec();
    wire.extend_from_slice(&body);
    let mut iov = libc::iovec {
        iov_base: wire.as_mut_ptr().cast(),
        iov_len: wire.len(),
    };
    let mut control = [0u64; 8];
    // SAFETY: an all-zero msghdr is valid; the fields used are set below.
    let mut msg: libc::msghdr = unsafe { std::mem::zeroed() };
    msg.msg_iov = &mut iov;
    msg.msg_iovlen = 1;
    if !fds.is_empty() {
        let payload = std::mem::size_of_val(fds);
        msg.msg_control = control.as_mut_ptr().cast();
        // SAFETY: CMSG_SPACE is a pure size computation.
        msg.msg_controllen = unsafe { libc::CMSG_SPACE(payload as u32) } as _;
        // SAFETY: the control buffer is large enough for one header and `fds`.
        unsafe {
            let cmsg = libc::CMSG_FIRSTHDR(&msg);
            (*cmsg).cmsg_level = libc::SOL_SOCKET;
            (*cmsg).cmsg_type = libc::SCM_RIGHTS;
            (*cmsg).cmsg_len = libc::CMSG_LEN(payload as u32) as _;
            std::ptr::copy_nonoverlapping(fds.as_ptr(), libc::CMSG_DATA(cmsg).cast(), fds.len());
        }
    }
    // SAFETY: sendmsg over the prepared message.
    let sent = unsafe { libc::sendmsg(stream.as_raw_fd(), &msg, libc::MSG_NOSIGNAL) };
    if sent < 0 {
        return Err(std::io::Error::last_os_error());
    }
    if sent as usize != wire.len() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::WriteZero,
            "GO was sent in pieces",
        ));
    }
    Ok(())
}

fn shell_quote(text: &str) -> String {
    format!("'{}'", text.replace('\'', "'\\''"))
}

/// The launcher the pane runs: `exec bwrap … -- <host> internal gate …`, or the gate itself where
/// there is no sandbox. Written next to the envelope, mode 0700.
fn launch_spec(plan: &Plan, run_dir: &Path) -> Result<LaunchSpec, String> {
    let gate_args: Vec<String> = ["internal", "gate", "--protocol", "1", "--envelope"]
        .iter()
        .map(|s| s.to_string())
        .chain([
            run_dir.join("envelope.json").to_string_lossy().into_owned(),
            "--go-socket".into(),
            plan.socket_path.to_string_lossy().into_owned(),
        ])
        .collect();
    let (program, args) = match &plan.bwrap_prefix {
        Some(prefix) => {
            let args = prefix[1..]
                .iter()
                .cloned()
                .chain(["--".to_string(), plan.host_bin.clone()])
                .chain(gate_args)
                .collect();
            (prefix[0].clone(), args)
        }
        None => (plan.host_bin.clone(), gate_args),
    };
    let script = run_dir.join("launcher.sh");
    let line = std::iter::once(program.as_str())
        .chain(args.iter().map(String::as_str))
        .map(shell_quote)
        .collect::<Vec<_>>()
        .join(" ");
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o700)
        .open(&script)
        .map_err(|e| format!("{}: {e}", script.display()))?;
    file.write_all(format!("#!/bin/sh\nexec {line}\n").as_bytes())
        .map_err(|e| e.to_string())?;
    drop(file);
    Ok(LaunchSpec {
        command: script.to_string_lossy().into_owned(),
        args: Vec::new(),
        cwd: run_dir.to_string_lossy().into_owned(),
        env: Default::default(),
        expect: Some(ExpectedProcess {
            argv0: program.clone(),
            command: program,
            args,
        }),
    })
}

/// The gate as the host sees it. Across a PID namespace the connecting process is the gate itself
/// (the kernel translates the peer pid for a reader in an ancestor namespace); it must belong to the
/// process terminal-control saw in the pane. Without that answer, the namespace's init among the
/// pane root's children is the gate.
fn gate_tuple(
    stream: &UnixStream,
    root: &ProcessIdentity,
    sandboxed: bool,
) -> Result<ProcTuple, String> {
    #[cfg(target_os = "linux")]
    {
        let from_peer = crate::go_channel::peer_cred(stream)
            .map(|c| c.pid as u32)
            .filter(|pid| *pid != 0 && within(*pid, root.pid));
        if let Some(tuple) = from_peer
            .or_else(|| namespace_init_under(root.pid, sandboxed))
            .and_then(|pid| facts::identity_of(ProcId(pid)))
        {
            return Ok(tuple);
        }
        Err(format!(
            "the gate is not among the descendants of pane root {}",
            root.pid
        ))
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (stream, sandboxed);
        facts::identity_of(ProcId(root.pid))
            .ok_or_else(|| format!("pane root {} is gone", root.pid))
    }
}

/// `pid` is `ancestor` or one of its descendants.
#[cfg(target_os = "linux")]
fn within(pid: u32, ancestor: u32) -> bool {
    let mut at = pid;
    for _ in 0..16 {
        if at == ancestor {
            return true;
        }
        match facts::relation_of(ProcId(at)) {
            Some(relation) if relation.parent > 1 => at = relation.parent,
            _ => return false,
        }
    }
    false
}

/// The child of `root` that is pid 1 in a namespace of its own, or `root` when it has none and no sandbox was asked for.
#[cfg(target_os = "linux")]
fn namespace_init_under(root: u32, sandboxed: bool) -> Option<u32> {
    if facts::ns_pids_of(ProcId(root))?.len() == 1 {
        let init = facts::relations()
            .unwrap_or_default()
            .into_iter()
            .filter(|relation| relation.parent == root)
            .map(|relation| relation.pid.0)
            .find(|child| {
                facts::ns_pids_of(ProcId(*child))
                    .is_some_and(|ns| ns.len() > 1 && ns.last() == Some(&1))
            });
        // Behind a sandbox the pane root is only bwrap's monitor: with no namespace init found, nothing here is the gate.
        return init.or(if sandboxed { None } else { Some(root) });
    }
    Some(root)
}

/// Who held the pane's terminal when a send found the agent out of the foreground, for a person
/// reading `supervisor.log`; nothing is decided from it. The terminal's foreground group as the gate's
/// session leader (the pane's shell) reads it, then the state, group and session of each process from
/// that leader down to the gate and of every descendant of the gate.
fn foreground_facts(gate: u32) -> String {
    const MOST: usize = 64;
    let Some(table) = facts::relations() else {
        return "the process table could not be read".into();
    };
    let of = |pid: u32| table.iter().find(|r| r.pid.0 == pid);
    let Some(mut at) = of(gate) else {
        return format!("the gate (pid {gate}) is gone");
    };
    let leader = at.session;
    let mut chain = vec![gate];
    while at.pid.0 != leader && chain.len() < MOST {
        let Some(parent) = of(at.parent) else { break };
        chain.push(parent.pid.0);
        at = parent;
    }
    chain.reverse();
    let mut below = vec![gate];
    let mut next = 0;
    while next < below.len() && below.len() < MOST {
        let pid = below[next];
        below.extend(table.iter().filter(|r| r.parent == pid).map(|r| r.pid.0));
        next += 1;
    }
    let shown: Vec<String> = chain
        .iter()
        .chain(below.iter().skip(1))
        .filter_map(|pid| of(*pid))
        .map(|r| {
            let role = match r.pid.0 {
                pid if pid == gate => " gate",
                pid if pid == leader => " shell",
                _ => "",
            };
            let name = facts::command_name_of(r.pid).unwrap_or_else(|| "?".into());
            format!(
                "{}{role} ({name}) {} pgid {} sid {}",
                r.pid.0, r.state, r.group, r.session
            )
        })
        .collect();
    let foreground_group = of(leader).map(|r| r.tty_foreground_group);
    let terminal = foreground_group.map_or_else(
        || "unknown (the session leader is gone)".to_string(),
        |group| group.to_string(),
    );
    // Every member of the foreground group as the OS lists it, inside the gate's tree or not; a
    // zombie is marked, since it holds the group's id while running nothing.
    let members: Vec<String> = foreground_group
        .filter(|group| *group > 0)
        .map(|group| {
            table
                .iter()
                .filter(|r| i64::from(r.group) == group)
                .take(MOST)
                .map(|r| {
                    let name = facts::command_name_of(r.pid).unwrap_or_else(|| "?".into());
                    let zombie = if r.state == 'Z' { " zombie" } else { "" };
                    format!("{} ({name}) {}{zombie}", r.pid.0, r.state)
                })
                .collect()
        })
        .unwrap_or_default();
    format!(
        "pane shell (session {leader}) terminal foreground group {terminal}; {}; members of that group by the OS: [{}]",
        shown.join(", "),
        members.join(", ")
    )
}

/// The process a `{host, bootId, pidNs, pid, startTime}` record names.
fn tuple_of(record: &Value) -> Option<ProcTuple> {
    Some(ProcTuple {
        host: record["host"].as_str()?.to_string(),
        boot_id: record["bootId"].as_str().map(String::from),
        pid_ns: record["pidNs"].as_str()?.to_string(),
        pid: ProcId(record["pid"].as_u64()? as u32),
        start_time: record["startTime"].as_str()?.to_string(),
    })
}

fn domain_of(kind: &str, gate: ProcTuple) -> Result<Domain, String> {
    match kind {
        "linux-gate" => Ok(Domain::LinuxGate(gate)),
        "linux-pgroup" => Ok(Domain::LinuxPgroup(gate)),
        "macos-tree" => Ok(Domain::MacosTree(gate)),
        other => Err(format!(
            "containment {other} has no terminal gate domain on this platform"
        )),
    }
}

/// Everything the watch loop changes while the attempt runs.
struct Sup<'a> {
    watch: &'a Watch,
    go: os::Go,
    domain: Domain,
    gate: ProcTuple,
    last_active: Instant,
    last_carrier: Instant,
    last_sample: Instant,
    last_screen: Option<u64>,
    stopped: Option<Instant>,
    /// The gate's channel and the agent it reported, which a domain that does not contain it (a process group) needs.
    link: GateLink,
    gate_gone: bool,
    end: TerminalEnd,
    adapter: Terminal,
}

impl Sup<'_> {
    /// The attempt is over or being ended: no more of the adapter's calls reach the pane.
    fn finished(&self) -> bool {
        self.gate_gone || self.stopped.is_some()
    }

    /// Ask the gate to stop through the normal path; the cause the contract names stays `cancel`.
    fn begin_stop(&mut self, cause: &str, reason: Option<&str>) {
        self.begin_provider_stop(cause, reason, None);
    }

    /// [`Self::begin_stop`] with the provider's own signal read from the screen that gave the reason.
    /// The first reason wins, and the signal belongs to it.
    fn begin_provider_stop(&mut self, cause: &str, reason: Option<&str>, signal: Option<Value>) {
        if self.stopped.is_some() {
            return;
        }
        if self.end.reason.is_none() {
            self.end.reason = reason.map(String::from);
            self.end.provider_signal = signal;
        }
        self.stopped = Some(Instant::now());
        request_stop(self.watch, &mut self.go, &self.gate, cause);
    }

    fn tick(&mut self, core: &Core, key: &str) {
        if !self.gate_gone && domain_is_empty(&self.domain) == DomainState::Empty {
            self.gate_gone = true;
        }
        self.link
            .read_frames(self.watch, &mut self.go, self.gate_gone);
        if self.gate_gone {
            return;
        }
        if self.last_carrier.elapsed() >= CARRIER_EVERY {
            self.carrier_check(core, key);
        }
        let idle_left = self
            .watch
            .idle
            .map(|idle| idle.saturating_sub(self.last_active.elapsed()));
        if !sampling_can_matter(idle_left, self.watch.soft_left()) {
            // Not sampling: the time until sampling starts is not blind time.
            self.last_sample = Instant::now();
        } else if self.last_sample.elapsed() >= SCREEN_SAMPLE_EVERY {
            let since_sample = self.last_sample.elapsed();
            self.last_sample = Instant::now();
            match core.read(key, None, Some("visible")) {
                Ok(screen) => self.note_screen(Some(screen)),
                // A screen nobody could read says nothing about the agent: that time is blind
                // time, never idle time. Only the deadlines still apply to it.
                Err(_) => self.last_active = (self.last_active + since_sample).min(Instant::now()),
            }
        }
        if self.stopped.is_none() {
            let cause = if self.watch.cancel_requested() {
                Some("cancel")
            } else if self.watch.soft_deadline_passed() {
                Some("soft-deadline")
            } else if self
                .watch
                .idle
                .is_some_and(|idle| self.last_active.elapsed() >= idle)
            {
                Some("idle")
            } else {
                None
            };
            if let Some(cause) = cause {
                let (reason, signal) = if matches!(cause, "soft-deadline" | "idle") {
                    self.provider_stop_reason(core, key).unzip()
                } else {
                    (None, None)
                };
                self.begin_provider_stop(cause, reason.as_deref(), signal.flatten());
            }
        } else if let Some(at) = self.stopped {
            let domain = &self.domain;
            self.link
                .escalate(self.watch, at, || domain_kill_all(domain));
        }
    }

    /// A deadline stop reads the screen once and names the provider when it ends on a dead login, a used-up
    /// quota or a provider's API error, so the caller moves to another account. The outcome stays `timeout`.
    /// A trust dialog or any other screen names nothing: the agent may simply have been working.
    fn provider_stop_reason(&self, core: &Core, key: &str) -> Option<(String, Option<Value>)> {
        let screen = core.read(key, None, Some("visible")).ok()?;
        match self.adapter.stop_reason(&screen)? {
            reason @ (BlockedReason::Login
            | BlockedReason::UsageLimit
            | BlockedReason::ProviderError) => Some((
                TerminalOutcome::Blocked(reason).receipt_reason()?,
                self.adapter.stop_signal(&screen).map(|s| s.to_json()),
            )),
            BlockedReason::TrustDialog => None,
        }
    }

    /// The carrier: a pane that is gone takes the agent's pty with it. Unknown is never read as lost.
    fn carrier_check(&mut self, core: &Core, key: &str) {
        self.last_carrier = Instant::now();
        if self.end.carrier_lost {
            return;
        }
        let seen = core.inspect_parts(
            key,
            Want {
                foreground: false,
                activity: false,
                detail: false,
            },
        );
        if seen.pane == PaneState::Gone {
            self.end.carrier_lost = true;
            // The gate has published nothing and is not asked to: only the end-of-grace sweep follows.
            self.stopped.get_or_insert_with(Instant::now);
        }
    }

    /// New words on the screen count as activity for the idle timer. Only letters are compared:
    /// a spinner, an elapsed clock or a token counter keeps redrawing while the agent is stuck.
    fn note_screen(&mut self, screen: Option<String>) {
        let Some(screen) = screen else { return };
        let mut hasher = DefaultHasher::new();
        screen
            .chars()
            .filter(|c| c.is_alphabetic())
            .for_each(|c| c.hash(&mut hasher));
        let digest = hasher.finish();
        if self
            .last_screen
            .replace(digest)
            .is_some_and(|before| before != digest)
        {
            self.last_active = Instant::now();
        }
    }
}

/// The agent protocol's port over terminal-control, by key. Time only passes through `pause`, which
/// keeps the supervisor's own watch (deadlines, cancel, carrier, the gate leaving) running.
struct TermIo<'a, 'b> {
    core: &'a Core<'a>,
    key: &'a str,
    sup: &'a mut Sup<'b>,
}

fn io_err(refusal: TerminalRefusal) -> IoError {
    IoError::Io(format!("{refusal:?}"))
}

impl AgentIo for TermIo<'_, '_> {
    fn send(&mut self, input: &SendInput) -> Result<(), IoError> {
        // A cancel, deadline or lost gate seen since the last tick must stop this send: a long
        // typed brief that lands after the seat was stopped ends up in the pane's shell.
        self.sup.tick(self.core, self.key);
        if self.sup.finished() {
            return Err(IoError::Io("the attempt is ending".into()));
        }
        match self
            .core
            .send(
                self.key,
                input.text.as_deref(),
                input.keys.as_deref(),
                input.submit,
            )
            .map_err(io_err)?
        {
            SendOutcome::Sent => Ok(()),
            // Nothing was typed. The agent is not the pane's foreground program, so it cannot take a
            // brief: the attempt ends with the reason on its receipt, a failed attempt for the settlement.
            SendOutcome::ForegroundNotAgent { reason } => {
                eprintln!("fgos internal supervise: nothing typed into the pane: {reason}");
                eprintln!(
                    "fgos internal supervise: pane foreground facts: {}",
                    foreground_facts(self.sup.gate.pid.0)
                );
                self.sup
                    .begin_stop("cancel", Some(REASON_FOREGROUND_NOT_AGENT));
                Err(IoError::Io(format!("nothing was typed: {reason}")))
            }
        }
    }

    fn screen(&mut self) -> Result<String, IoError> {
        if self.sup.finished() {
            return Err(IoError::Io("the attempt is ending".into()));
        }
        let screen = self
            .core
            .read(self.key, None, Some("visible"))
            .map_err(io_err)?;
        self.sup.note_screen(Some(screen.clone()));
        Ok(screen)
    }

    fn inspect(&mut self) -> Result<Inspection, IoError> {
        if self.sup.finished() {
            return Err(IoError::Io("the attempt is ending".into()));
        }
        let seen = self.core.inspect_parts(
            self.key,
            Want {
                foreground: false,
                activity: true,
                detail: true,
            },
        );
        let activity = match (seen.pane, seen.activity) {
            (PaneState::Live, Some(activity)) => activity,
            _ => return Err(IoError::Io("the pane gave no activity".into())),
        };
        Ok(match activity.detail {
            Some(detail) => Inspection {
                state: detail
                    .state
                    .or_else(|| Some(activity.state).filter(|s| !s.is_empty())),
                visible_blocker: detail.visible_blocker,
                visible_idle: detail.visible_idle,
                visible_working: detail.visible_working,
                matched_rule: detail.matched_rule.is_some(),
                prompt_text: detail.prompt_text,
            },
            None => Inspection {
                state: Some(activity.state).filter(|s| !s.is_empty()),
                ..Default::default()
            },
        })
    }

    fn pause(&mut self, ms: u64) {
        let until = Instant::now() + Duration::from_millis(ms);
        loop {
            self.sup.tick(self.core, self.key);
            let left = until.saturating_duration_since(Instant::now());
            if left.is_zero() || self.sup.finished() {
                return;
            }
            std::thread::sleep(left.min(TICK));
        }
    }
}

pub(super) fn run(
    envelope: &Value,
    run_dir: &Path,
    mut locks: os::Locks,
    watch: &Watch,
) -> Result<i32, Refusal> {
    let plan = Plan::from(envelope)?;
    let mut socket = AttemptSocket::bind(&plan.socket_path).map_err(Refusal::internal)?;
    crate::terminal_slot::record_endpoint(run_dir);
    let backend = Backend::from_env(run_dir)
        .with_shell_ready_timeout_ms(crate::terminal_slot::shell_ready_timeout_ms(envelope));
    let core = backend.core();
    let spec = launch_spec(&plan, run_dir).map_err(Refusal::internal)?;

    // The `launched` marker is durable before `launch` returns; only then may a GO exist.
    let root = match core.launch(&plan.key, &spec) {
        Ok(LaunchOutcome::Launched(identity)) => identity,
        Ok(LaunchOutcome::NotStarted { reason }) => {
            return super::not_started(
                envelope,
                run_dir,
                watch,
                locks,
                "terminal-launch-not-started",
                &reason,
            )
        }
        Err(TerminalRefusal::Unsupported { capability, detail }) => {
            return super::not_started(
                envelope,
                run_dir,
                watch,
                locks,
                "terminal-mode-unsupported",
                &format!("{capability}: {detail}"),
            )
        }
        Err(TerminalRefusal::Unknown { reason }) => {
            return super::not_started(
                envelope,
                run_dir,
                watch,
                locks,
                "terminal-launch-unknown",
                &reason,
            )
        }
    };

    let Some(stream) = socket.accept_gate(&watch.attempt_id, HELLO_LIMIT) else {
        socket.close();
        return super::not_started(
            envelope,
            run_dir,
            watch,
            locks,
            "terminal-gate-silent",
            "the gate did not say HELLO in time",
        );
    };
    socket.close();

    let gate =
        gate_tuple(&stream, &root, plan.bwrap_prefix.is_some()).map_err(Refusal::internal)?;
    let domain = domain_of(&plan.domain_kind, gate.clone()).map_err(Refusal::internal)?;
    if let Err(why) = super::bind_record(
        envelope,
        run_dir,
        &locks,
        &domain,
        &gate,
        plan.domain_kind == "linux-gate",
    ) {
        let _ = domain_kill_all(&domain);
        return Err(Refusal::internal(why));
    }
    let go_frame = json!({"type": "GO", "attemptId": watch.attempt_id, "envelopeDigest": watch.digest, "gateHostTuple": gate.to_record().to_json()});
    if let Err(why) = send_frame_with_fds(&stream, &go_frame, &locks.raw_fds()) {
        // Without GO the gate runs nothing and leaves by itself; make sure.
        let _ = domain_kill_all(&domain);
        return super::not_started(
            envelope,
            run_dir,
            watch,
            locks,
            "terminal-go-not-sent",
            &format!("GO was not sent: {why}"),
        );
    }

    let now = Instant::now();
    let mut sup = Sup {
        watch,
        go: os::Go::from_stream(stream),
        domain,
        gate,
        last_active: now,
        last_carrier: now,
        last_sample: now,
        last_screen: None,
        stopped: None,
        link: GateLink::new(),
        gate_gone: false,
        end: TerminalEnd::default(),
        adapter: plan.adapter,
    };
    drive(&plan, &core, &mut sup);

    // The domain must be empty before the lease goes; a domain the kill cannot end within DOMAIN_END_WAIT
    // after the grace is published with what is known (the attempt is then not proven empty).
    let give_up_after = watch.grace + GATE_STOP_SLACK + DOMAIN_END_WAIT;
    while !sup.gate_gone && !sup.stopped.is_some_and(|at| at.elapsed() >= give_up_after) {
        sup.tick(&core, &plan.key);
        std::thread::sleep(TICK);
    }
    if domain_is_empty(&sup.domain) != DomainState::Empty {
        let _ = domain_kill_all(&sup.domain);
    }
    // A process group does not hold the agent (it leads a group of its own): end it by identity.
    if let (Domain::LinuxPgroup(_), Some(agent)) =
        (&sup.domain, sup.link.agent.as_ref().and_then(tuple_of))
    {
        let _ =
            fgos_process::control::signal_by_identity(&agent, fgos_process::control::Signal::Kill);
    }
    let end = sup.end.clone();
    drop(sup);
    locks.release_cwd();
    super::finish(envelope, run_dir, watch, locks, false, &end)
}

/// The stop an unreadable result ends in: the contract's cause and the receipt reason it names.
const UNREADABLE_STOP: (&str, &str) = ("cancel", REASON_RESULT_UNREADABLE);

/// The file and idle observations must both persist; unknown activity breaks the evidence.
#[derive(Default)]
struct UnreadableWait {
    file: Option<(UnreadableResult, u64)>,
    idle_before: bool,
}

impl UnreadableWait {
    fn expired(&mut self, file: Option<UnreadableResult>, idle: bool, now_ms: u64) -> bool {
        let same = self.file.as_ref().map(|(file, _)| file) == file.as_ref();
        if !same {
            self.file = file.map(|file| (file, now_ms));
        }
        let expired = same
            && idle
            && self.idle_before
            && self
                .file
                .as_ref()
                .is_some_and(|(_, since)| now_ms.saturating_sub(*since) >= 30_000);
        self.idle_before = idle;
        expired
    }
}

/// The agent protocol, step by step, until the agent is done, something ends the run early or the
/// gate leaves on its own.
fn drive(plan: &Plan, core: &Core, sup: &mut Sup) {
    let mut io = TermIo {
        core,
        key: &plan.key,
        sup,
    };
    let adapter = plan.adapter;
    let mut outbox = FsOutbox::new(io.sup.watch.outbox.clone());

    let waited = Instant::now();
    while !io.sup.link.agent_bound() && !io.sup.finished() && waited.elapsed() < AGENT_WAIT {
        io.pause(TICK.as_millis() as u64);
    }
    if !io.sup.link.agent_bound() && !io.sup.finished() {
        io.sup.begin_stop("cancel", Some(REASON_AGENT_NOT_STARTED));
    }
    if io.sup.finished() {
        return;
    }

    let readiness = adapter.await_ready(&mut io, READY_MS);
    if io.sup.finished() {
        return;
    }
    if !readiness.takes_brief() {
        if readiness == Readiness::NeedsHuman {
            if let Some(line) = io
                .screen()
                .ok()
                .and_then(|screen| adapter.setup_line(&screen))
            {
                eprintln!("fgos internal supervise: the agent shows a setup screen only a person can finish: {line}");
                return end_early(&mut io, Some(REASON_NEEDS_SETUP.to_string()), None);
            }
        }
        return end_on_outcome(&mut io, &adapter, &readiness.outcome());
    }

    let delivery = adapter.deliver_brief(&mut io, &plan.brief, &mut outbox);
    if io.sup.finished() {
        return;
    }
    if delivery != TerminalOutcome::Delivered {
        return end_on_outcome(&mut io, &adapter, &delivery);
    }
    // Once, and the connection stays open: the gate reads an early close as a dead supervisor.
    if write_frame(&mut io.sup.go, &json!({"type": "BRIEF_DELIVERED"})).is_err() {
        io.sup.link.channel_open = false;
    }

    let started = Instant::now();
    let mut unreadable = UnreadableWait::default();
    loop {
        if io.sup.finished() {
            return;
        }
        if let Some(outcome) = adapter.detect_completed(&mut io, &mut outbox) {
            match outcome {
                TerminalOutcome::Completed { .. } => return ask_to_leave(plan, &adapter, &mut io),
                other => return end_on_outcome(&mut io, &adapter, &other),
            }
        }
        let file = outbox.newest_unreadable(&mut io);
        let idle = io.inspect().is_ok_and(|seen| {
            seen.state.as_deref() == Some("idle") && !seen.visible_working && !seen.visible_blocker
        });
        if unreadable.expired(file, idle, started.elapsed().as_millis() as u64) {
            io.sup.carrier_check(io.core, io.key);
            if !io.sup.finished() {
                let (cause, reason) = UNREADABLE_STOP;
                io.sup.begin_stop(cause, Some(reason));
            }
            return;
        }
        io.pause(WORK_POLL_MS);
    }
}

/// An early end, named by its receipt reason (an adapter outcome's, or one the supervisor names). A pane that vanished
/// is the better explanation for an agent that stopped answering, so the carrier is looked at first.
fn end_early(io: &mut TermIo, reason: Option<String>, signal: Option<Value>) {
    io.sup.carrier_check(io.core, io.key);
    if io.sup.finished() {
        return;
    }
    io.sup
        .begin_provider_stop("cancel", reason.as_deref(), signal);
}

/// [`end_early`] for an adapter outcome. A provider stop (`Blocked`) also carries the provider's own signal, read once from
/// the screen; a screen that cannot be read gives no signal, never an error.
fn end_on_outcome(io: &mut TermIo, adapter: &Terminal, outcome: &TerminalOutcome) {
    let signal = match outcome {
        TerminalOutcome::Blocked(
            BlockedReason::Login | BlockedReason::UsageLimit | BlockedReason::ProviderError,
        ) => io
            .screen()
            .ok()
            .and_then(|screen| adapter.stop_signal(&screen))
            .map(|signal| signal.to_json()),
        _ => None,
    };
    end_early(io, outcome.receipt_reason(), signal);
}

/// The result is in: type the exit command, give the agent a short time to leave, then stop it.
fn ask_to_leave(plan: &Plan, adapter: &Terminal, io: &mut TermIo) {
    let _ = match &plan.exit {
        Some(text) => io.send(&SendInput {
            text: Some(text.clone()),
            keys: None,
            submit: true,
        }),
        None => match adapter.exit_command() {
            ExitCommand::Text(text) => io.send(&SendInput {
                text: Some(text.to_string()),
                keys: None,
                submit: true,
            }),
            ExitCommand::Keys(keys) => io.send(&SendInput {
                text: None,
                keys: Some(keys.iter().map(|k| k.to_string()).collect()),
                submit: false,
            }),
        },
    };
    let asked = Instant::now();
    while !io.sup.finished() && asked.elapsed() < EXIT_WAIT {
        io.pause(TICK.as_millis() as u64);
    }
    if !io.sup.finished() {
        io.sup.begin_stop("cancel", Some(REASON_COMPLETED_NO_EXIT));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Only a clock: every wait advances it.
    struct Clock(u64);

    impl AgentIo for Clock {
        fn send(&mut self, _: &SendInput) -> Result<(), IoError> {
            Err(IoError::Unsupported)
        }
        fn now_ms(&self) -> u64 {
            self.0
        }
        fn pause(&mut self, ms: u64) {
            self.0 += ms;
        }
    }

    #[test]
    fn unreadable_wait_requires_unchanged_bytes_and_consecutive_idle_polls() {
        let dir = std::env::temp_dir().join(format!("unreadable-wait-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("result-1.json");
        fs::write(&path, "bad").unwrap();
        let mut outbox = FsOutbox::new(&dir);
        let mut wait = UnreadableWait::default();
        let mut clock = Clock(0);
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), true, 0));
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), true, 29_999));
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), false, 30_000));
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), true, 30_700));
        assert!(wait.expired(outbox.newest_unreadable(&mut clock), true, 31_400));
        fs::write(&path, "new bad").unwrap();
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), true, 32_000));
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), true, 61_999));
        fs::write(&path, "").unwrap();
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), true, 70_000));
        fs::write(&path, "{}").unwrap();
        assert!(!wait.expired(outbox.newest_unreadable(&mut clock), true, 100_000));
        // The stop that follows an expired wait ends as a cancel and names this reason on the receipt.
        assert_eq!(UNREADABLE_STOP, ("cancel", "terminal:result-unreadable"));
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn the_screen_is_sampled_only_while_idle_can_come_before_the_soft_deadline() {
        let secs = |s| Some(Duration::from_secs(s));
        assert!(!sampling_can_matter(None, None));
        assert!(!sampling_can_matter(None, secs(5)));
        assert!(sampling_can_matter(secs(1200), None));
        assert!(sampling_can_matter(secs(10), secs(11)));
        assert!(!sampling_can_matter(secs(10), secs(10)));
        assert!(!sampling_can_matter(secs(1200), secs(900)));
    }

    #[test]
    fn a_path_longer_than_a_unix_socket_holds_is_refused_before_anything_is_bound() {
        let long = PathBuf::from(format!("/tmp/{}/go.sock", "x".repeat(120)));
        assert!(AttemptSocket::bind(&long)
            .err()
            .is_some_and(|why| why.contains("longer than")));
    }

    #[test]
    fn a_socket_directory_other_users_can_enter_is_refused() {
        let dir = std::env::temp_dir().join(format!("fgos-open-dir-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        fs::set_permissions(&dir, fs::Permissions::from_mode(0o755)).unwrap();
        assert!(AttemptSocket::bind(&dir.join("go.sock"))
            .err()
            .is_some_and(|why| why.contains("mode 0700")));
        fs::set_permissions(&dir, fs::Permissions::from_mode(0o700)).unwrap();
        let socket = AttemptSocket::bind(&dir.join("go.sock")).unwrap();
        assert_eq!(
            fs::metadata(dir.join("go.sock"))
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o600
        );
        drop(socket);
        assert!(
            !dir.join("go.sock").exists(),
            "the path goes with the socket"
        );
        let _ = fs::remove_dir_all(&dir);
    }
}
