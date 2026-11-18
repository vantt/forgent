//! The head request socket: the one way a confined head session asks the host for a verb.
//!
//! A head's sandbox masks herdr and the user runtime directory, so it cannot start another session itself. Its own
//! run supervisor listens on one socket (`envelope.session.requestSocketPath`), the sandbox gets it read-only, and
//! each request is checked and performed outside. This module is only transport and enforcement: it decides
//! nothing about who holds a role (Identity does) or what a verb means (the Node payload behind
//! `fgos internal head-request` does), and it learns what the role may ask for and write from the envelope, never
//! from a table. One verb it performs itself: `session write`, the only way a head changes a granted file, because the
//! sandbox keeps every granted file read-only. Contract: `packages/run-supervisor/contracts/head-request.v1.json`.

use std::collections::BTreeMap;
use std::io::{self, Read};
use std::os::unix::net::{UnixListener, UnixStream};
#[cfg(target_os = "linux")]
use std::os::unix::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use fgos_identity::cli_dirs::{claude_config_dir, read_claude_session};
use fgos_identity::directory::{CliSessionIds, Ids, MailboxIds};
use fgos_identity::proc_tree::os_process_tree;
use fgos_identity::resolve::{HeadRef, WriterKey, ENV_ORDER};
use fgos_identity::session::cli_of;
use fgos_process::facts::judge_here;
use fgos_process::spawn::{run_bounded_command, Outcome as BoundedOutcome};
use serde_json::{json, Value};

use fgos_durable_file::{open_dir_beneath, BeneathError, BeneathRefusal, Dir};

use crate::attempt_step::exec_payload;
use crate::go_channel::{peer_pid, peer_uid, write_frame, MAX_FRAME_BYTES};
use crate::route::{refuse, Flags};

/// The Node payload entry the route child runs.
pub(crate) const ENTRY: &str = "src/session-host/head-request.mjs";
/// How long one request may run before its child is killed (the head's own launch waits up to 45 s).
pub const VERB_TIMEOUT: Duration = Duration::from_millis(60_000);
/// Largest request frame: a `session write` carries the whole new content of a granted file in one. Only a `session write`
/// may exceed the GO channel's limit ([`MAX_FRAME_BYTES`]), and only one such large request is read or run at a time;
/// replies stay within the GO limit.
pub const MAX_REQUEST_BYTES: usize = 4 * 1024 * 1024;
/// Most JSON values (objects, arrays, strings, numbers, ...) one request frame may hold, counted while it is parsed:
/// a frame of many tiny elements is refused before it is built. A `session rotate` with its full stop facts holds about 60.
pub const MAX_REQUEST_VALUES: usize = 256;
/// Deepest nesting of one request frame (frame, args, stop facts, portfolio, path is 5).
const MAX_REQUEST_DEPTH: usize = 8;
/// How long a connection has to deliver its one frame.
const READ_DEADLINE: Duration = Duration::from_secs(5);
/// Connections handled at once, the one running request included; a further one is dropped unanswered.
const MAX_CONNECTIONS: usize = 8;
/// Most of the route child's stdout that is kept; the contract says one JSON line.
const STDOUT_LIMIT: u64 = 65_536;
const MAX_ID_LEN: usize = 64;
/// The one verb of a rotation successor, which does not hold the role yet: the supervisor checks only that the
/// attempt's own session is registered, and after the verb reports done it moves the role to that session.
pub const ANSWERED_VERB: &str = "session answered";
/// The verb that gives a role back to a live head when a failed rotation left nobody holding it: the same
/// registered check, and after the route reports done the role is registered again without `take`, so Identity
/// refuses (`role-held`) when another live session holds it.
pub const RESTORE_VERB: &str = "session restore role";
/// The verb that binds the agent session a head runs as to this attempt, answered by the supervisor itself (no route
/// child): Identity registers that session on the attempt's gate and moves the attempt's roles to it
/// (`bind_agent_session`), so the head resolves as its CLI session. The role step is "registered", as for
/// [`ANSWERED_VERB`]: a successor binds before it holds the role.
pub const BIND_VERB: &str = "session bind session";
/// The verb that replaces a granted file of the head's role, answered by the supervisor itself (no route child): the
/// path must be named exactly by `envelope.session.writes` and be a regular file reached without a symlink, and the
/// new content is installed atomically through the durable-file door ([`write_granted`]).
pub const WRITE_VERB: &str = "session write";

/// Verbs of a session that does not (yet) hold its role: the role check is "registered", and after the route reports
/// done the supervisor registers the role for the attempt's session. The flag is Identity's `take`.
fn role_move(verb: &str) -> Option<bool> {
    match verb {
        ANSWERED_VERB => Some(true),
        RESTORE_VERB => Some(false),
        _ => None,
    }
}

/// Whether the connection's owner may use the socket: the supervisor's own uid, nothing else.
pub(crate) fn uid_allowed(peer: Option<libc::uid_t>, own: libc::uid_t) -> bool {
    peer == Some(own)
}

/// Why Identity could not answer: its refusal code (what a client is told) and its text (what the log gets).
#[derive(Debug, PartialEq, Eq)]
pub struct HoldError {
    pub code: String,
    pub detail: String,
}

/// An envelope that cannot serve a request socket. `code` is the one the contract names (`envelope-invalid`).
#[derive(Debug, PartialEq, Eq)]
pub struct EnvelopeError {
    pub code: &'static str,
    pub why: String,
}

fn invalid(why: impl Into<String>) -> EnvelopeError {
    EnvelopeError {
        code: "envelope-invalid",
        why: why.into(),
    }
}

type HoldsRole = Box<dyn Fn() -> Result<bool, HoldError> + Send + Sync>;
type TakesRole = Box<dyn Fn(bool) -> Result<(), HoldError> + Send + Sync>;
type BindsSession = Box<dyn Fn(&Value, Option<u32>) -> Result<Value, HoldError> + Send + Sync>;
type ChecksPeer = Box<dyn Fn(Option<u32>) -> Result<(), HoldError> + Send + Sync>;
type LogLine = Box<dyn Fn(&str) + Send + Sync>;

/// What serving the socket needs, all of it from the envelope except the two ports.
pub struct Config {
    pub run_dir: PathBuf,
    pub host_bin: String,
    pub cwd: PathBuf,
    /// The step environment: the route child starts with exactly this.
    pub env: BTreeMap<String, String>,
    /// Verbs `envelope.session.verbs` allows.
    pub verbs: Vec<String>,
    /// Project-relative paths `envelope.session.writes` grants; [`WRITE_VERB`] writes only a regular file one names
    /// exactly, beneath `cwd`.
    pub writes: Vec<String>,
    pub verb_timeout: Duration,
    /// Does Identity give this session the envelope's role right now. An error is refused like a "no", and the
    /// client is told only its code.
    pub holds_role: HoldsRole,
    /// Is this attempt's own session registered and live in Identity (the check of [`ANSWERED_VERB`], which runs
    /// before the session holds the role). Errors are handled as for `holds_role`.
    pub registered: HoldsRole,
    /// Registers the envelope's role for this attempt's session after [`ANSWERED_VERB`] (`take`: true) or
    /// [`RESTORE_VERB`] (false) reported done.
    pub take_role: TakesRole,
    /// [`BIND_VERB`]: binds the agent session the request's args name (`{source, value}`, a writer key) for the
    /// connecting process (its pid as the kernel names it, `None` when unknown); the reply's data on success.
    pub bind_session: BindsSession,
    /// [`WRITE_VERB`]: does the connecting process (its pid as the kernel names it, `None` when unknown) run under the
    /// attempt's gate, so the request comes from the agent the supervisor launched and not from another process of the
    /// same user. An error is refused `caller-not-under-gate` with its code as the detail.
    pub caller_under_gate: ChecksPeer,
    /// One line per request, for `supervisor.log`.
    pub log: LogLine,
}

/// The listener's side of the protocol. `poll` takes pending connections without blocking; each runs on a thread of
/// its own, so the supervisor's tick never waits on a request.
pub struct HeadRequests {
    cfg: Arc<Config>,
    busy: Arc<AtomicBool>,
    /// A request over the GO frame limit is being read or run.
    large: Arc<AtomicBool>,
    connections: Arc<AtomicUsize>,
    gate: Arc<Mutex<Option<HeadRef>>>,
}

impl HeadRequests {
    pub fn new(cfg: Config) -> HeadRequests {
        Self::with_gate(cfg, Arc::new(Mutex::new(None)))
    }

    fn with_gate(cfg: Config, gate: Arc<Mutex<Option<HeadRef>>>) -> HeadRequests {
        HeadRequests {
            cfg: Arc::new(cfg),
            busy: Arc::new(AtomicBool::new(false)),
            large: Arc::new(AtomicBool::new(false)),
            connections: Arc::new(AtomicUsize::new(0)),
            gate,
        }
    }

    /// The gate process, once the attempt has one: the head Identity records the session's liveness against.
    /// `take_role` of an envelope-built server answers `gate-unknown` until this is called.
    pub fn set_gate(&self, head: HeadRef) {
        *self.gate.lock().unwrap_or_else(|e| e.into_inner()) = Some(head);
    }

    /// The socket path and the server an envelope asks for. `None`: no session, or a role with no verbs (no socket
    /// at all). Identity is asked, under `state_root`, through the attempt's writer id, the one `register_session`
    /// registered. An envelope that names verbs without a socket path, a path without verbs, or no step to take the
    /// environment from is `envelope-invalid`.
    pub fn from_envelope(
        envelope: &Value,
        run_dir: &Path,
        state_root: &Path,
    ) -> Result<Option<(PathBuf, HeadRequests)>, EnvelopeError> {
        let session = &envelope["session"];
        let has_verbs = session["verbs"].as_array().is_some_and(|v| !v.is_empty());
        let Some(path) = session["requestSocketPath"].as_str() else {
            return if has_verbs {
                Err(invalid(
                    "session.verbs is not empty but session.requestSocketPath is missing",
                ))
            } else {
                Ok(None)
            };
        };
        let text = |v: &Value, what: &str| {
            v.as_str()
                .filter(|s| !s.is_empty())
                .map(String::from)
                .ok_or_else(|| invalid(format!("envelope field {what} missing")))
        };
        let verbs: Vec<String> = session["verbs"]
            .as_array()
            .map(|v| {
                v.iter()
                    .filter_map(Value::as_str)
                    .map(String::from)
                    .collect()
            })
            .unwrap_or_default();
        if verbs.is_empty() {
            return Err(invalid(
                "session.requestSocketPath is set but session.verbs is empty",
            ));
        }
        let writes: Vec<String> = match &session["writes"] {
            Value::Null => Vec::new(),
            Value::Array(list) => list
                .iter()
                .map(|v| v.as_str().map(String::from))
                .collect::<Option<_>>()
                .ok_or_else(|| invalid("session.writes holds an entry that is not a string"))?,
            _ => return Err(invalid("session.writes is not an array")),
        };
        let role = text(&session["role"], "session.role")?;
        let writer_id = text(&envelope["identity"]["writerId"], "identity.writerId")?;
        let state_root = state_root.to_path_buf();
        let gate: Arc<Mutex<Option<HeadRef>>> = Arc::new(Mutex::new(None));
        let cwd = PathBuf::from(text(&envelope["cwd"], "cwd")?);
        let step_env = envelope["steps"]
            .as_array()
            .into_iter()
            .flatten()
            .find(|step| step["builtin"] != true)
            .and_then(|step| step["env"].as_object())
            .map(|m| {
                m.iter()
                    .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                    .collect()
            })
            .ok_or_else(|| {
                invalid("the envelope has no process step to take the verb environment from")
            })?;
        let cfg = Config {
            run_dir: run_dir.to_path_buf(),
            host_bin: text(&envelope["hostBin"], "hostBin")?,
            cwd: cwd.clone(),
            env: step_env,
            verbs,
            writes,
            verb_timeout: VERB_TIMEOUT,
            holds_role: Box::new({
                let (state_root, role, writer_id, gate) = (
                    state_root.clone(),
                    role.clone(),
                    writer_id.clone(),
                    gate.clone(),
                );
                move || identity_holds(&state_root, &role, &writer_id, known(&gate).as_ref())
            }),
            registered: Box::new({
                let (state_root, writer_id, gate) =
                    (state_root.clone(), writer_id.clone(), gate.clone());
                move || identity_registered(&state_root, &writer_id, known(&gate).as_ref())
            }),
            bind_session: Box::new({
                let (state_root, writer_id, gate, cwd) = (
                    state_root.clone(),
                    writer_id.clone(),
                    gate.clone(),
                    cwd.clone(),
                );
                move |args, peer| {
                    let head = known(&gate).ok_or_else(gate_unknown)?;
                    identity_bind(&state_root, &cwd, &writer_id, &head, args, peer)
                }
            }),
            caller_under_gate: Box::new({
                let gate = gate.clone();
                move |peer| {
                    let head = known(&gate).ok_or_else(gate_unknown)?;
                    let peer = peer.ok_or_else(peer_unknown)?;
                    fgos_identity::directory::caller_under_head(&head, peer).map_err(hold_error)
                }
            }),
            take_role: Box::new({
                let gate = gate.clone();
                move |take| {
                    let head = known(&gate).ok_or_else(gate_unknown)?;
                    identity_take(&state_root, &cwd, &role, &writer_id, &head, take)
                }
            }),
            log: Box::new(|line| eprintln!("fgos internal supervise: {line}")),
        };
        Ok(Some((
            PathBuf::from(path),
            HeadRequests::with_gate(cfg, gate),
        )))
    }

    /// Hand every connection waiting on `listener` (nonblocking) to a thread. A connection past the limit is closed.
    pub fn poll(&self, listener: &UnixListener) {
        while let Ok((stream, _)) = listener.accept() {
            if self.connections.fetch_add(1, Ordering::SeqCst) >= MAX_CONNECTIONS {
                self.connections.fetch_sub(1, Ordering::SeqCst);
                continue;
            }
            let (cfg, busy, large, connections) = (
                self.cfg.clone(),
                self.busy.clone(),
                self.large.clone(),
                self.connections.clone(),
            );
            std::thread::spawn(move || {
                serve(&cfg, &busy, &large, stream);
                connections.fetch_sub(1, Ordering::SeqCst);
            });
        }
    }
}

/// The gate once the attempt has one.
fn known(gate: &Mutex<Option<HeadRef>>) -> Option<HeadRef> {
    gate.lock().unwrap_or_else(|e| e.into_inner()).clone()
}

fn gate_unknown() -> HoldError {
    HoldError {
        code: "gate-unknown".into(),
        detail: "the attempt's gate is not known yet".into(),
    }
}

fn peer_unknown() -> HoldError {
    HoldError {
        code: "peer-unknown".into(),
        detail: "the kernel did not name the connecting process".into(),
    }
}

fn attempt_key(writer_id: &str) -> WriterKey<'_> {
    WriterKey {
        source: ENV_ORDER[0],
        value: writer_id,
    }
}

/// The session this attempt is in Identity now: the agent session bound on its gate `head` when there is one, else
/// the attempt's own (Identity's `attempt_session`).
fn own_session(
    state_root: &Path,
    writer_id: &str,
    head: Option<&HeadRef>,
) -> Result<Option<String>, HoldError> {
    fgos_identity::directory::attempt_session(
        state_root,
        &attempt_key(writer_id),
        head,
        &judge_here,
    )
    .map(|found| found.map(|listed| listed.id))
    .map_err(hold_error)
}

/// Identity's answer to "does this attempt's session hold the role": the session this attempt is (its own, or the
/// agent session bound on its gate `head`) is the one `resolve` finds holding it. Nothing is cached; a role that
/// rotation moved away stops answering yes at once.
pub fn identity_holds(
    state_root: &Path,
    role: &str,
    writer_id: &str,
    head: Option<&HeadRef>,
) -> Result<bool, HoldError> {
    let Some(own) = own_session(state_root, writer_id, head)? else {
        return Ok(false);
    };
    match fgos_identity::directory::resolve(
        state_root,
        role,
        &judge_here,
        None,
        &fgos_identity::directory::NoTerminal,
    ) {
        Ok(holder) => Ok(holder.id == own),
        Err(r) if r.reason == "not-found" => Ok(false),
        Err(r) => Err(hold_error(r)),
    }
}

fn hold_error(r: fgos_identity::refusal::Refusal) -> HoldError {
    HoldError {
        code: r.reason.to_string(),
        detail: r.detail,
    }
}

/// Identity's answer to "is this attempt's session registered and live": its own entry, or the agent session bound
/// on its gate `head`. A session that never registered, or whose head is gone, is `Ok(false)`.
pub fn identity_registered(
    state_root: &Path,
    writer_id: &str,
    head: Option<&HeadRef>,
) -> Result<bool, HoldError> {
    own_session(state_root, writer_id, head).map(|own| own.is_some())
}

/// Registers `role` for the session this attempt is (the agent session bound on the gate `head` when there is one,
/// else the attempt's own); with `take` it moves from the live holder (Identity's own `take`, the supervisor only
/// transports the fact that the attempt is that session). The gate is the head Identity records liveness against.
pub fn identity_take(
    state_root: &Path,
    cwd: &Path,
    role: &str,
    writer_id: &str,
    head: &HeadRef,
    take: bool,
) -> Result<(), HoldError> {
    fgos_identity::directory::register_attempt_roles(
        state_root,
        Some(cwd),
        &attempt_key(writer_id),
        head,
        &[role.to_string()],
        take,
        None,
    )
    .map(|_| ())
    .map_err(hold_error)
}

/// [`BIND_VERB`]: Identity binds the agent session `args` names (`{"source": <CLI session variable>, "value": <id>}`,
/// plus an optional `"mailbox": {"fgosDir", "name"}`, the mailbox name the agent's hooks bound) to this attempt on
/// its gate `head`, for the connecting process `peer` (which must run under the gate). The bound entry also gets the
/// agent's CLI session as its CLI keeps it outside the sandbox ([`cli_session_of`]) and that mailbox name. Returns
/// the bound session's `{id, handle}`.
pub fn identity_bind(
    state_root: &Path,
    cwd: &Path,
    writer_id: &str,
    head: &HeadRef,
    args: &Value,
    peer: Option<u32>,
) -> Result<Value, HoldError> {
    let bad = || HoldError {
        code: "bad-args".into(),
        detail:
            "args must be {source, value} with an optional mailbox {fgosDir, name}, all strings"
                .into(),
    };
    let fields = args.as_object().ok_or_else(bad)?;
    if fields
        .keys()
        .any(|key| !matches!(key.as_str(), "source" | "value" | "mailbox"))
    {
        return Err(bad());
    }
    let text = |value: &Value| value.as_str().map(String::from);
    let (Some(source), Some(value)) = (args["source"].as_str(), args["value"].as_str()) else {
        return Err(bad());
    };
    let mailbox = match fields.get("mailbox") {
        None => None,
        Some(Value::Object(mailbox))
            if mailbox.len() == 2
                && mailbox.contains_key("fgosDir")
                && mailbox.contains_key("name") =>
        {
            match (text(&mailbox["fgosDir"]), text(&mailbox["name"])) {
                (Some(fgos_dir), Some(name)) => Some(MailboxIds { fgos_dir, name }),
                _ => return Err(bad()),
            }
        }
        Some(_) => return Err(bad()),
    };
    let peer = peer.ok_or_else(peer_unknown)?;
    let agent = WriterKey { source, value };
    let ids = Ids {
        cli_session: Some(cli_session_of(source, value, head, peer)),
        mailbox,
        ..Ids::default()
    };
    fgos_identity::directory::bind_agent_session(
        state_root,
        Some(cwd),
        &attempt_key(writer_id),
        &agent,
        head,
        peer,
        Some(&ids),
    )
    .map(|listed| json!({"id": listed.id, "handle": listed.handle}))
    .map_err(hold_error)
}

/// The CLI session of the agent the gate `head` runs, as the bind records it: its session variable and id, and for
/// a Claude Code variable what the CLI keeps in `<config dir>/sessions/<agent pid>.json` outside the sandbox (name, messaging
/// socket, process). The agent is the gate's direct child above `peer`; the file counts only when it names that pid,
/// the bound session id and the agent's start time, so a stale or foreign file adds nothing.
fn cli_session_of(source: &str, value: &str, head: &HeadRef, peer: u32) -> CliSessionIds {
    let bare = CliSessionIds {
        source: source.to_string(),
        id: value.to_string(),
        name: None,
        name_source: None,
        socket: None,
        pid: None,
        start_time: None,
    };
    // Only Claude Code keeps a session file; Identity names the CLI of the variable.
    if cli_of(source, value) != "claude" {
        return bare;
    }
    let Some(agent) = gate_child_above(head.pid, peer) else {
        return bare;
    };
    let Some(sessions) = claude_config_dir(
        std::env::var_os("HOME").as_deref(),
        std::env::var_os("CLAUDE_CONFIG_DIR").as_deref(),
    )
    .map(|dir| dir.join("sessions")) else {
        return bare;
    };
    let started =
        fgos_process::facts::identity_of(fgos_process::ProcId(agent)).map(|tuple| tuple.start_time);
    read_claude_session(&sessions, agent)
        .filter(|session| session.session_id.as_deref() == Some(value))
        .filter(|session| started.is_some() && session.proc_start == started)
        .and_then(|session| CliSessionIds::of_claude(source, &session))
        .unwrap_or(bare)
}

/// The process directly under `gate` that `pid` is or descends from, walking parents up the process table.
fn gate_child_above(gate: u32, mut pid: u32) -> Option<u32> {
    let tree = os_process_tree();
    for _ in 0..64 {
        let parent = tree.stat(pid)?.ppid;
        if parent == gate {
            return Some(pid);
        }
        if parent == 0 || parent == pid {
            return None;
        }
        pid = parent;
    }
    None
}

/// Why [`write_granted`] wrote nothing, or did not finish: a refusal code of the contract and an optional detail.
#[derive(Debug, PartialEq, Eq)]
pub struct WriteRefusal {
    pub code: &'static str,
    pub detail: Option<String>,
}

fn write_refused(code: &'static str, detail: impl Into<Option<String>>) -> WriteRefusal {
    WriteRefusal {
        code,
        detail: detail.into(),
    }
}

/// A plain downward project-relative path: not empty, not absolute, only named components (no `.`, `..`, root or
/// prefix), no backslash or NUL, no empty segment.
fn plain_relative(path: &str) -> bool {
    !path.is_empty()
        && !path.contains(['\\', '\0'])
        && path
            .split('/')
            .all(|part| !part.is_empty() && part != "." && part != "..")
        && Path::new(path)
            .components()
            .all(|c| matches!(c, std::path::Component::Normal(_)))
}

/// [`WRITE_VERB`]: replace the granted file `args.path` beneath `root` with `args.content` (args exactly
/// `{path, content}`, both strings). The path must be plain and relative (`path-invalid`), named exactly by an entry
/// of `writes` (`path-not-granted`), and an existing regular file reached from `root` without a symlink at it or any
/// directory on the way (`path-symlink`, `not-a-file`). Its directory is opened once and the content is installed
/// through that descriptor by the durable-file door (`Dir::replace`: temp file, the old file's exact mode, fsync,
/// rename over the name, directory fsync), so nothing is resolved by path after the check; a failure there is
/// `write-failed`. Returns `{path, bytes}`.
pub fn write_granted(root: &Path, writes: &[String], args: &Value) -> Result<Value, WriteRefusal> {
    let text = |name: &str| {
        args[name]
            .as_str()
            .filter(|_| args.as_object().is_some_and(|o| o.len() == 2))
    };
    let (Some(rel), Some(content)) = (text("path"), text("content")) else {
        return Err(write_refused(
            "bad-args",
            "args must be exactly {path, content}, both strings".to_string(),
        ));
    };
    if !plain_relative(rel) {
        return Err(write_refused("path-invalid", None));
    }
    if !writes.iter().any(|granted| granted == rel) {
        return Err(write_refused("path-not-granted", None));
    }
    let beneath = |error: BeneathError| match error {
        BeneathError::Refused(BeneathRefusal::Symlink) => write_refused("path-symlink", None),
        BeneathError::Refused(BeneathRefusal::Escape) => write_refused("path-invalid", None),
        BeneathError::Refused(_) => write_refused("not-a-file", None),
        BeneathError::Io(error) => write_refused("write-failed", error.to_string()),
    };
    let missing = || write_refused("not-a-file", "the granted file does not exist".to_string());
    let relative = Path::new(rel);
    let parent = relative.parent().unwrap_or(Path::new(""));
    let name = relative
        .file_name()
        .ok_or_else(|| write_refused("path-invalid", None))?;
    // The directory is opened once, no-follow at every component, and every later step works on that descriptor: a
    // directory swapped on the way after this point is never followed.
    let dir = if parent.as_os_str().is_empty() {
        Dir::open(root)
    } else {
        open_dir_beneath(root, parent)
    }
    .map_err(beneath)?
    .ok_or_else(missing)?;
    let mode = dir.file_mode(name).map_err(beneath)?.ok_or_else(missing)?;
    dir.replace(name, content.as_bytes(), mode)
        .map_err(|e| write_refused("write-failed", format!("{} at {}", e.source, e.step)))?;
    Ok(json!({"path": rel, "bytes": content.len()}))
}

enum Outcome {
    Done(Value),
    Refused {
        code: &'static str,
        detail: Option<String>,
    },
}

fn refused(code: &'static str) -> Outcome {
    Outcome::Refused { code, detail: None }
}

/// A reader whose whole life is bounded, not each read: a client that drips bytes cannot hold a thread.
struct Deadline<'a> {
    stream: &'a UnixStream,
    until: Instant,
}

impl Read for Deadline<'_> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let left = self.until.saturating_duration_since(Instant::now());
        if left.is_zero() {
            return Err(io::ErrorKind::TimedOut.into());
        }
        self.stream.set_read_timeout(Some(left))?;
        (&*self.stream).read(buf)
    }
}

fn valid_id(id: &str) -> bool {
    (1..=MAX_ID_LEN).contains(&id.len())
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'.' | b'-'))
}

/// Client text that goes into a log line: short, plain, one line.
fn loggable(text: &str) -> String {
    let plain: String = text
        .chars()
        .take(32)
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == ' ' || c == '-' {
                c
            } else {
                '?'
            }
        })
        .collect();
    if plain.is_empty() {
        "-".into()
    } else {
        plain
    }
}

struct Busy<'a>(&'a AtomicBool);

impl Drop for Busy<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

fn serve(cfg: &Config, busy: &AtomicBool, large: &AtomicBool, mut stream: UnixStream) {
    let _ = stream.set_nonblocking(false);
    let _ = stream.set_write_timeout(Some(READ_DEADLINE));
    // SAFETY: getuid has no failure mode.
    let own = unsafe { libc::getuid() };
    let peer_pid = peer_pid(&stream);
    let (id, verb, outcome) = if !uid_allowed(peer_uid(&stream), own) {
        (None, None, refused("peer-uid"))
    } else {
        let mut reader = Deadline {
            stream: &stream,
            until: Instant::now() + READ_DEADLINE,
        };
        match read_request(&mut reader, large) {
            // The large slot, when this request holds it, is kept until the verb is done.
            Ok((request, _large)) => {
                let outcome = decide(cfg, busy, &request, peer_pid);
                (Some(request.id), Some(request.verb), outcome)
            }
            Err(Unread::Busy) => (None, None, refused("busy")),
            Err(Unread::Bad(id)) => (id, None, refused("bad-frame")),
        }
    };
    let reply = match &outcome {
        Outcome::Done(data) => {
            json!({"type": "REPLY", "id": id, "result": "done", "data": data})
        }
        Outcome::Refused { code, detail } => {
            let mut reply = json!({"type": "REPLY", "id": id, "result": "refused", "code": code});
            if let Some(detail) = detail {
                reply["detail"] = json!(detail);
            }
            reply
        }
    };
    let _ = write_frame(&mut stream, &reply);
    let (result, code) = match &outcome {
        Outcome::Done(_) => ("done", "-"),
        Outcome::Refused { code, .. } => ("refused", *code),
    };
    (cfg.log)(&format!(
        "head-request {} {} {result} {code}",
        id.as_deref().unwrap_or("-"),
        verb.as_deref().map_or("-".into(), loggable),
    ));
}

struct Request {
    id: String,
    verb: String,
    args: Value,
}

/// Why no request was read: another large request holds the slot (`busy`, answered before the body is read), or the
/// frame broke the contract (`bad-frame`, with the request's id when it carried a valid one).
enum Unread {
    Busy,
    Bad(Option<String>),
}

/// One REQUEST frame and, for a frame over [`MAX_FRAME_BYTES`], the large slot it holds. The length is checked before
/// the body is read; the body is parsed with at most [`MAX_REQUEST_VALUES`] values and [`MAX_REQUEST_DEPTH`] levels;
/// a large frame must be a [`WRITE_VERB`].
fn read_request<'a>(
    reader: &mut impl Read,
    large: &'a AtomicBool,
) -> Result<(Request, Option<Busy<'a>>), Unread> {
    let mut head = [0u8; 4];
    reader
        .read_exact(&mut head)
        .map_err(|_| Unread::Bad(None))?;
    let len = u32::from_be_bytes(head) as usize;
    if len > MAX_REQUEST_BYTES {
        return Err(Unread::Bad(None));
    }
    let slot = if len > MAX_FRAME_BYTES {
        large
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .map_err(|_| Unread::Busy)?;
        Some(Busy(large))
    } else {
        None
    };
    let mut body = vec![0u8; len];
    reader
        .read_exact(&mut body)
        .map_err(|_| Unread::Bad(None))?;
    let left = std::cell::Cell::new(MAX_REQUEST_VALUES);
    let mut de = serde_json::Deserializer::from_slice(&body);
    let frame = serde::de::DeserializeSeed::deserialize(
        Bounded {
            left: &left,
            depth: 0,
        },
        &mut de,
    )
    .and_then(|frame| de.end().map(|()| frame))
    .map_err(|_| Unread::Bad(None))?;
    drop(body);
    let Value::Object(mut frame) = frame else {
        return Err(Unread::Bad(None));
    };
    let id = frame
        .get("id")
        .and_then(Value::as_str)
        .filter(|id| valid_id(id))
        .map(String::from);
    let verb = frame.get("verb").and_then(Value::as_str).map(String::from);
    let typed = frame.get("type").and_then(Value::as_str) == Some("REQUEST");
    match (typed, id, verb, frame.remove("args")) {
        (true, Some(id), Some(verb), Some(args @ Value::Object(_)))
            if slot.is_none() || verb == WRITE_VERB =>
        {
            Ok((Request { id, verb, args }, slot))
        }
        (_, id, _, _) => Err(Unread::Bad(id)),
    }
}

/// Parses one JSON value while counting every value it builds against `left` and refusing nesting deeper than
/// [`MAX_REQUEST_DEPTH`], so a frame of many tiny elements fails while it is read instead of after it was built.
struct Bounded<'a> {
    left: &'a std::cell::Cell<usize>,
    depth: usize,
}

impl Bounded<'_> {
    fn take<E: serde::de::Error>(&self) -> Result<(), E> {
        if self.depth >= MAX_REQUEST_DEPTH || self.left.get() == 0 {
            return Err(E::custom(
                "the request holds too many or too deeply nested values",
            ));
        }
        self.left.set(self.left.get() - 1);
        Ok(())
    }

    fn child(&self) -> Self {
        Bounded {
            left: self.left,
            depth: self.depth + 1,
        }
    }
}

impl<'de> serde::de::DeserializeSeed<'de> for Bounded<'_> {
    type Value = Value;
    fn deserialize<D: serde::Deserializer<'de>>(self, de: D) -> Result<Value, D::Error> {
        de.deserialize_any(self)
    }
}

impl<'de> serde::de::Visitor<'de> for Bounded<'_> {
    type Value = Value;
    fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        f.write_str("a JSON value")
    }
    fn visit_bool<E: serde::de::Error>(self, v: bool) -> Result<Value, E> {
        self.take().map(|()| Value::Bool(v))
    }
    fn visit_i64<E: serde::de::Error>(self, v: i64) -> Result<Value, E> {
        self.take().map(|()| json!(v))
    }
    fn visit_u64<E: serde::de::Error>(self, v: u64) -> Result<Value, E> {
        self.take().map(|()| json!(v))
    }
    fn visit_f64<E: serde::de::Error>(self, v: f64) -> Result<Value, E> {
        self.take().map(|()| json!(v))
    }
    fn visit_str<E: serde::de::Error>(self, v: &str) -> Result<Value, E> {
        self.take().map(|()| Value::String(v.to_string()))
    }
    fn visit_string<E: serde::de::Error>(self, v: String) -> Result<Value, E> {
        self.take().map(|()| Value::String(v))
    }
    fn visit_unit<E: serde::de::Error>(self) -> Result<Value, E> {
        self.take().map(|()| Value::Null)
    }
    fn visit_seq<A: serde::de::SeqAccess<'de>>(self, mut seq: A) -> Result<Value, A::Error> {
        self.take()?;
        let mut items = Vec::new();
        while let Some(item) = seq.next_element_seed(self.child())? {
            items.push(item);
        }
        Ok(Value::Array(items))
    }
    fn visit_map<A: serde::de::MapAccess<'de>>(self, mut map: A) -> Result<Value, A::Error> {
        self.take()?;
        let mut object = serde_json::Map::new();
        while let Some(key) = map.next_key::<String>()? {
            let value = map.next_value_seed(self.child())?;
            object.insert(key, value);
        }
        Ok(Value::Object(object))
    }
}

/// The checks in contract order, then the verb.
fn decide(cfg: &Config, busy: &AtomicBool, request: &Request, peer: Option<u32>) -> Outcome {
    let moves = role_move(&request.verb);
    let binds = request.verb == BIND_VERB;
    let (check, not_so) = if moves.is_some() || binds {
        (&cfg.registered, "session-not-registered")
    } else {
        (&cfg.holds_role, "role-not-held")
    };
    match check() {
        Ok(true) => {}
        Ok(false) => return refused(not_so),
        Err(why) => {
            (cfg.log)(&format!(
                "head-request {} identity {}: {}",
                request.id, why.code, why.detail
            ));
            return Outcome::Refused {
                code: not_so,
                detail: Some(why.code),
            };
        }
    }
    if !cfg.verbs.contains(&request.verb) {
        return refused("verb-not-granted");
    }
    if request.verb == WRITE_VERB {
        if let Err(why) = (cfg.caller_under_gate)(peer) {
            (cfg.log)(&format!(
                "head-request {} peer {}: {}",
                request.id, why.code, why.detail
            ));
            return Outcome::Refused {
                code: "caller-not-under-gate",
                detail: Some(why.code),
            };
        }
    }
    if busy
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return refused("busy");
    }
    let _busy = Busy(busy);
    if binds {
        return match (cfg.bind_session)(&request.args, peer) {
            Ok(data) => Outcome::Done(data),
            Err(why) => {
                (cfg.log)(&format!(
                    "head-request {} identity {}: {}",
                    request.id, why.code, why.detail
                ));
                Outcome::Refused {
                    code: "session-bind-failed",
                    detail: Some(why.code),
                }
            }
        };
    }
    if request.verb == WRITE_VERB {
        return match write_granted(&cfg.cwd, &cfg.writes, &request.args) {
            Ok(data) => Outcome::Done(data),
            Err(why) => Outcome::Refused {
                code: why.code,
                detail: why.detail,
            },
        };
    }
    let outcome = run_verb(cfg, request);
    if let (Some(take), Outcome::Done(_)) = (moves, &outcome) {
        if let Err(why) = (cfg.take_role)(take) {
            (cfg.log)(&format!(
                "head-request {} identity {}: {}",
                request.id, why.code, why.detail
            ));
            return Outcome::Refused {
                code: "role-take-failed",
                detail: Some(why.code),
            };
        }
    }
    outcome
}

/// Run `<host> internal head-request --protocol 1 --run-dir <dir>` with the request on stdin and the step
/// environment, through the process door's bounded run (its own group, killed with its descendants at the
/// timeout), armed to die with the supervisor on Linux.
fn run_verb(cfg: &Config, request: &Request) -> Outcome {
    let failed = |detail: String| Outcome::Refused {
        code: "verb-failed",
        detail: Some(detail),
    };
    let mut cmd = Command::new(&cfg.host_bin);
    cmd.args(["internal", "head-request", "--protocol", "1", "--run-dir"])
        .arg(&cfg.run_dir)
        .env_clear()
        .envs(cfg.env.iter())
        .current_dir(&cfg.cwd);
    // SAFETY: prctl is async-signal-safe; the child dies with the supervisor that started it.
    #[cfg(target_os = "linux")]
    unsafe {
        cmd.pre_exec(fgos_process::control::arm_parent_death_signal);
    }
    let body = json!({"id": request.id, "verb": request.verb, "args": request.args}).to_string();
    let output = match run_bounded_command(cmd, Some(body.as_bytes()), cfg.verb_timeout, |_| ()) {
        Ok(BoundedOutcome::Exited(output)) => output,
        Ok(BoundedOutcome::TimedOut { .. }) => return refused("verb-timeout"),
        Err(e) => return failed(format!("the route did not run: {e}")),
    };
    let text =
        String::from_utf8_lossy(&output.stdout[..output.stdout.len().min(STDOUT_LIMIT as usize)])
            .into_owned();
    let reported = text.lines().rev().find_map(|line| {
        serde_json::from_str::<Value>(line.trim())
            .ok()
            .filter(Value::is_object)
    });
    match (output.status.success(), reported) {
        (true, Some(line)) if line["result"] == "done" => {
            Outcome::Done(line.get("data").cloned().unwrap_or_else(|| json!({})))
        }
        (_, Some(line)) if line["code"].is_string() => {
            failed(line["code"].as_str().unwrap_or_default().to_string())
        }
        _ => failed(format!(
            "the route ended {}",
            output
                .status
                .code()
                .map_or("by a signal".into(), |c| format!("with exit {c}"))
        )),
    }
}

/// `fgos internal head-request --protocol 1 --run-dir <attemptDir>`: the host half of one request, the same
/// hand-over as `attempt-step` (one helper), to the Node payload that runs the verb.
pub fn run(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["run-dir"], 0) {
        Ok(flags) => flags,
        Err(err) => return refuse("head-request", err),
    };
    let run_dir = match flags.require("run-dir") {
        Ok(dir) => PathBuf::from(dir),
        Err(err) => return refuse("head-request", err),
    };
    exec_payload("head-request", &run_dir, ENTRY, &[], |envelope| {
        if envelope["session"]["requestSocketPath"].is_string() {
            Ok(())
        } else {
            Err("the envelope has no request socket")
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_the_supervisors_own_uid_may_use_the_socket() {
        assert!(uid_allowed(Some(1000), 1000));
        assert!(!uid_allowed(Some(0), 1000));
        assert!(!uid_allowed(None, 1000));
    }

    #[test]
    fn only_a_plain_downward_path_may_name_a_granted_file() {
        for ok in ["docs/backlog.md", "top.md", "a/b/c"] {
            assert!(plain_relative(ok), "{ok}");
        }
        for bad in [
            "",
            "/etc/passwd",
            "../x",
            "docs/../x",
            "docs/./backlog.md",
            "./docs",
            "docs//backlog.md",
            "docs/",
            "a\\b",
            "a\0b",
        ] {
            assert!(!plain_relative(bad), "{bad:?}");
        }
    }

    #[test]
    fn ids_and_logged_text_are_bounded() {
        assert!(valid_id("a1-b_2.c"));
        assert!(!valid_id("") && !valid_id("has space") && !valid_id(&"x".repeat(65)));
        assert_eq!(
            loggable("session start\nforged line"),
            "session start?forged line"
        );
        assert_eq!(loggable(&"v".repeat(100)).len(), 32);
    }
}
