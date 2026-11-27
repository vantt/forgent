//! The head request socket: the one way a confined head session asks the host for a verb.
//!
//! A head's sandbox masks herdr and the user runtime directory, so it cannot start another session itself. Its own
//! run supervisor listens on one socket (`envelope.session.requestSocketPath`), the sandbox gets it read-only, and
//! each request is checked and performed outside. This module is only transport and enforcement: it decides
//! nothing about who holds a role (Identity does) or what a policy verb means (the Node payload behind
//! `fgos internal head-request` does). What a persona may ask for is the permission table of the session-host crate
//! (`fgos_session_host::permissions`), read with the persona of the digest-protected envelope; what it may write comes
//! from the envelope. An `fgos` argv ([`FGOS_VERB`]) is screened and decided by that table: `allow` runs the host
//! `fgos` from here, `ask` files an owner question, `deny` refuses. Verbs it performs itself: `session write`, the
//! only way a head changes a granted file, because the sandbox keeps every granted file read-only, `session bind
//! session` and `can-i`. Contract: `packages/run-supervisor/contracts/head-request.v1.json`.

use std::collections::BTreeMap;
use std::ffi::OsString;
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
/// path must be named by `envelope.session.writes` (exactly, or as a plain file directly beneath the directory of a
/// `<dir>/*` entry, which may create it) and be a regular file reached without a symlink, and the new content is installed atomically through the durable-file door ([`install_granted`]), then published through [`WritePublisher`].
pub const WRITE_VERB: &str = "session write";

/// The frame verb that carries an `fgos` argv: `args` is `{argv: [string]}`. The argv is decided by the permission
/// table of `fgos_session_host::permissions` for the caller's persona and, when allowed, run by the host with no shell
/// and no Node hop (`fgos_session_host::forwarder`).
pub const FGOS_VERB: &str = "fgos";
/// The frame verb that asks what the table says about an argv without running it: `args` is `{argv: [string]}`, the
/// answer `{decision, reason}`. Answered by the supervisor itself, from the same function that decides a real call.
pub const CAN_I_VERB: &str = "can-i";
/// The policy verb that runs the project's release recipe (`fgos_session_host::release`), answered by the supervisor
/// itself: it answers at once with a ticket and runs the steps detached; `request result` reads the outcome.
pub const RELEASE_VERB: &str = "release run";

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
type PendingRotation = Box<dyn Fn() -> Result<Option<String>, HoldError> + Send + Sync>;
type TakesRole = Box<dyn Fn(bool) -> Result<(), HoldError> + Send + Sync>;
type BindsSession = Box<dyn Fn(&Value, Option<u32>) -> Result<Value, HoldError> + Send + Sync>;
type ChecksPeer = Box<dyn Fn(Option<u32>) -> Result<(), HoldError> + Send + Sync>;
/// Longest refusal detail a log line carries.
const DETAIL_LOG_CHARS: usize = 300;

type LogLine = Box<dyn Fn(&str) + Send + Sync>;
/// Per-request host selection; an error runs the start host and is logged once.
pub type RequestHostBin = Box<dyn Fn() -> Result<PathBuf, String> + Send + Sync>;

/// Follow activation only if the start host belongs to the release active at launch. Dev hosts stay pinned.
pub fn request_host_bin(project_root: &Path, start_host: &str) -> RequestHostBin {
    let start = PathBuf::from(start_host);
    let active_root = fgos_host_runtime::activation::activated_host_bin(project_root)
        .and_then(|bin| bin.parent()?.parent().map(Path::to_path_buf))
        .and_then(|root| std::fs::canonicalize(root).ok());
    let follows = active_root
        .is_some_and(|root| std::fs::canonicalize(&start).is_ok_and(|host| host.starts_with(root)));
    let project_root = project_root.to_path_buf();
    Box::new(move || {
        if !follows {
            return Ok(start.clone());
        }
        fgos_host_runtime::activation::activated_host_bin(&project_root).ok_or_else(|| {
            "activation unreadable, not ready, or names no executable host inside its release"
                .into()
        })
    })
}
type CatchesUp = Box<dyn Fn(&Path) -> Result<(), CatchUpRefusal> + Send + Sync>;
type PathOid = Box<dyn Fn(&Path, &str) -> Result<String, PublishRefusal> + Send + Sync>;
type PathClean = Box<dyn Fn(&Path, &str) -> Result<bool, PublishRefusal> + Send + Sync>;
type PublishesWrite = Box<dyn Fn(&Path, &str) -> Result<String, PublishRefusal> + Send + Sync>;

pub use crate::route::{CatchUpRefusal, PublishRefusal, WritePublisher};

/// What serving the socket needs, all of it from the envelope except the two ports.
pub struct Config {
    pub run_dir: PathBuf,
    pub host_bin: String,
    /// None preserves the start host (including callers that do not opt into release pickup).
    pub request_host_bin: Option<RequestHostBin>,
    pub cwd: PathBuf,
    /// The step environment: the route child starts with exactly this.
    pub env: BTreeMap<String, String>,
    /// The caller's persona (`envelope.session.persona`, else the persona its role spells): the key the permission
    /// table is read with. The sandbox cannot change it; the envelope is digest-protected.
    pub persona: String,
    /// `envelope.session.role` (`head:<persona>-<name>`): named in the refusal of a verb its grant lacks.
    pub role: String,
    /// Project-relative paths `envelope.session.writes` grants; [`WRITE_VERB`] writes only a regular file one names
    /// exactly, or one directly beneath the directory of a `<dir>/*` entry, beneath `cwd`.
    pub writes: Vec<String>,
    pub verb_timeout: Duration,
    /// Does Identity give this session the envelope's role right now. An error is refused like a "no", and the
    /// client is told only its code.
    pub holds_role: HoldsRole,
    /// Asked only after `holds_role` said no: is this attempt a rotation successor whose role is still held by the
    /// live earlier generation of the same head (same persona and name, a lower generation), the rotation that moves
    /// it not done yet. `Some(detail)` names that predecessor; the request is then refused `role-pending-rotation`,
    /// retryable, instead of `role-not-held`. `None` and errors leave `role-not-held`.
    pub pending_rotation: PendingRotation,
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
    /// [`WRITE_VERB`], first: fast-forward the main checkout of `cwd` to its remote tip. A branch ahead of its remote is
    /// refused `write-branch-ahead`, any other refusal `write-catch-up-refused`; nothing is written.
    pub catch_up: CatchesUp,
    /// [`WRITE_VERB`], before the write: does `path` (granted, beneath `cwd`) have no uncommitted change in the main
    /// checkout. An error is refused `write-path-unreadable`.
    pub path_clean: PathClean,
    /// [`WRITE_VERB`]: the git blob id of the content `path` has in the main checkout now. Read before the catch-up
    /// (when the request names no `base`) and after it; an error is refused `write-path-unreadable`.
    pub path_oid: PathOid,
    /// [`WRITE_VERB`], after the write: publishes `path` and returns the commit. A refusal comes back in the reply by
    /// its own name, the file stays written, nothing is forced.
    pub publish_write: PublishesWrite,
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

    /// Install the host read before polling begins.
    pub fn with_request_host(mut self, port: RequestHostBin) -> Self {
        Arc::get_mut(&mut self.cfg)
            .expect("not yet shared")
            .request_host_bin = Some(port);
        self
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
        publisher: &WritePublisher,
    ) -> Result<Option<(PathBuf, HeadRequests)>, EnvelopeError> {
        let session = &envelope["session"];
        let Some(path) = session["requestSocketPath"].as_str() else {
            return Ok(None);
        };
        let text = |v: &Value, what: &str| {
            v.as_str()
                .filter(|s| !s.is_empty())
                .map(String::from)
                .ok_or_else(|| invalid(format!("envelope field {what} missing")))
        };
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
        let persona = session["persona"]
            .as_str()
            .map(String::from)
            .or_else(|| fgos_session_host::permissions::persona_of_role(&role).map(String::from))
            .filter(|persona| fgos_session_host::permissions::knows(persona))
            .ok_or_else(|| {
                invalid("session.persona names no persona of the head permission table")
            })?;
        let writer_id = text(&envelope["identity"]["writerId"], "identity.writerId")?;
        let state_root = state_root.to_path_buf();
        let gate: Arc<Mutex<Option<HeadRef>>> = Arc::new(Mutex::new(None));
        let own_head = match (
            session["persona"].as_str(),
            session["name"].as_str(),
            session["gen"].as_u64(),
        ) {
            (Some(persona), Some(name), Some(gen)) => Some(fgos_identity::directory::HeadIds {
                persona: persona.to_string(),
                name: name.to_string(),
                gen,
            }),
            _ => None,
        };
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
            request_host_bin: None,
            cwd: cwd.clone(),
            env: step_env,
            persona,
            role: role.clone(),
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
            pending_rotation: Box::new({
                let (state_root, role, own) = (state_root.clone(), role.clone(), own_head.clone());
                move || identity_pending_rotation(&state_root, &role, own.as_ref())
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
            catch_up: Box::new({
                let (catch_up, writer_id) = (publisher.catch_up.clone(), writer_id.clone());
                move |root| catch_up(root, &writer_id)
            }),
            path_clean: Box::new({
                let path_clean = publisher.path_clean.clone();
                move |root, path| path_clean(root, path)
            }),
            path_oid: Box::new({
                let path_oid = publisher.path_oid.clone();
                move |root, path| path_oid(root, path)
            }),
            publish_write: Box::new({
                let (publish, role, writer_id) =
                    (publisher.publish.clone(), role.clone(), writer_id.clone());
                move |root, path| publish(root, path, &role, &writer_id)
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
        // Two live holders still after Identity's own recheck: the refusal says so, so it does not read as
        // "you do not hold it". The answer stays closed.
        Err(r) if r.reason == "ambiguous" => Err(HoldError {
            code: "identity-ambiguous".into(),
            detail: r.detail,
        }),
        Err(r) => Err(hold_error(r)),
    }
}

/// Identity's answer to "is this head a rotation successor still waiting for its role": the role's live holder is the
/// earlier generation of `own` (same persona and name, a lower generation), the one case a successor registers
/// without the role (the supervisor's start step). Names that predecessor; `None` for any other holder or none.
pub fn identity_pending_rotation(
    state_root: &Path,
    role: &str,
    own: Option<&fgos_identity::directory::HeadIds>,
) -> Result<Option<String>, HoldError> {
    let Some(own) = own else {
        return Ok(None);
    };
    match fgos_identity::directory::resolve(
        state_root,
        role,
        &judge_here,
        None,
        &fgos_identity::directory::NoTerminal,
    ) {
        Ok(holder) => Ok(holder
            .ids
            .and_then(|ids| ids.head)
            .filter(|held| {
                held.persona == own.persona && held.name == own.name && held.gen < own.gen
            })
            .map(|held| {
                format!(
                    "{}-{} generation {} still holds the role",
                    held.persona, held.name, held.gen
                )
            })),
        Err(r) if r.reason == "not-found" => Ok(None),
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

/// Why [`granted_write`] or [`install_granted`] wrote nothing, or did not finish: a refusal code of the contract and an optional detail.
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

/// A git object id as the two object formats print it: 40 (SHA-1) or 64 (SHA-256) lowercase hex digits.
fn is_blob_oid(text: &str) -> bool {
    matches!(text.len(), 40 | 64) && text.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
}

/// [`WRITE_VERB`], the checks: `args` is `{path, content}` and optionally `base`, all strings and `base` a blob id (`bad-args`), the path
/// is plain and relative (`path-invalid`) and named exactly by an entry of `writes` (`path-not-granted`). Returns the
/// path, the content and the base (the git blob id of the content the writer read) when given.
pub fn granted_write<'a>(
    writes: &[String],
    args: &'a Value,
) -> Result<(&'a str, &'a str, Option<&'a str>), WriteRefusal> {
    let bad = || {
        write_refused(
            "bad-args",
            "args must be {path, content} and optionally base, all strings".to_string(),
        )
    };
    let object = args.as_object().ok_or_else(bad)?;
    let base = match object.get("base") {
        None => None,
        Some(value) => {
            let oid = value.as_str().ok_or_else(bad)?;
            if !is_blob_oid(oid) {
                return Err(write_refused(
                    "bad-args",
                    "base must be a git blob id: 40 or 64 lowercase hex digits".to_string(),
                ));
            }
            Some(oid)
        }
    };
    if object.len() != 2 + usize::from(base.is_some()) {
        return Err(bad());
    }
    let text = |name: &str| args[name].as_str();
    let (Some(rel), Some(content)) = (text("path"), text("content")) else {
        return Err(bad());
    };
    if !plain_relative(rel) {
        return Err(write_refused("path-invalid", None));
    }
    if !writes.iter().any(|granted| names_grant(granted, rel)) {
        return Err(write_refused("path-not-granted", None));
    }
    Ok((rel, content, base))
}

/// Whether the grant entry `granted` names `rel`: exactly, or, for an entry ending in `/*` over a plain directory, as a
/// plain file directly beneath that directory (one level: the rest of `rel` is a single named component).
fn names_grant(granted: &str, rel: &str) -> bool {
    if granted == rel {
        return true;
    }
    granted
        .strip_suffix("/*")
        .filter(|dir| plain_relative(dir))
        .and_then(|dir| rel.strip_prefix(dir))
        .and_then(|rest| rest.strip_prefix('/'))
        .is_some_and(|name| !name.contains('/'))
}

/// Whether a write of `rel` may create the file: it is named by a `/*` grant and by no exact entry, so an exact grant
/// keeps replacing an existing file only.
fn may_create(writes: &[String], rel: &str) -> bool {
    !writes.iter().any(|granted| granted == rel)
}

/// [`WRITE_VERB`], the write: replace the granted file `rel` beneath `root` with `content`. It must be an existing
/// regular file reached from `root` without a symlink at it or any directory on the way (`path-symlink`,
/// `not-a-file`). Its directory is opened once and the content is installed through that descriptor by the
/// durable-file door (`Dir::replace`: temp file, the old file's exact mode, fsync, rename over the name, directory
/// fsync), so nothing is resolved by path after the check; a failure there is `write-failed`. Returns the bytes
/// written. With `create`, a file that does not exist yet is created the same way with a fresh mode
/// ([`NEW_FILE_MODE`]); its directory must exist and be reached without a symlink.
pub fn install_granted(
    root: &Path,
    rel: &str,
    content: &str,
    create: bool,
) -> Result<usize, WriteRefusal> {
    let (dir, name, mode) = open_granted(root, rel, create)?;
    dir.replace(&name, content.as_bytes(), mode)
        .map_err(|e| write_refused("write-failed", format!("{} at {}", e.source, e.step)))?;
    Ok(content.len())
}

/// The mode of a file a `/*` grant creates: owner read-write, everyone else read, like a file a person writes.
const NEW_FILE_MODE: u32 = 0o644;

/// The granted file's directory (opened once, no-follow at every component), its name and its mode: the checks of
/// [`install_granted`] without writing, so the request can refuse a symlink or a non-file with the contract's code
/// before anything reads the file's content. With `create`, a missing file is not refused: it gets [`NEW_FILE_MODE`].
fn open_granted(
    root: &Path,
    rel: &str,
    create: bool,
) -> Result<(Dir, std::ffi::OsString, u32), WriteRefusal> {
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
    let dir = if parent.as_os_str().is_empty() {
        Dir::open(root)
    } else {
        open_dir_beneath(root, parent)
    }
    .map_err(beneath)?
    .ok_or_else(missing)?;
    let mode = match dir.file_mode(name).map_err(beneath)? {
        Some(mode) => mode,
        None if create => NEW_FILE_MODE,
        None => return Err(missing()),
    };
    Ok((dir, name.to_owned(), mode))
}

/// [`WRITE_VERB`] in full, in contract order: the argument and grant checks, the catch-up of the main checkout to its
/// remote tip (`write-branch-ahead`, `write-busy`, `write-catch-up-refused`), the path has no uncommitted change
/// (`write-path-dirty`), the base check (`write-base-stale`), the atomic write, then the publish; every refusal before the write leaves nothing written. A
/// publish refusal is a reply that names it beside the bytes written, not a refusal of the request.
fn write_and_publish(cfg: &Config, args: &Value) -> Outcome {
    let refuse_with = |why: WriteRefusal| Outcome::Refused {
        code: why.code,
        detail: why.detail,
    };
    let (rel, content, base) = match granted_write(&cfg.writes, args) {
        Ok(granted) => granted,
        Err(why) => return refuse_with(why),
    };
    let unreadable = |why: PublishRefusal| Outcome::Refused {
        code: "write-path-unreadable",
        detail: Some(format!("{}: {}", why.code, why.detail)),
    };
    let create = may_create(&cfg.writes, rel);
    // A file a `/*` grant may create is checked again after the catch-up: one that appears meanwhile was not the
    // writer's to replace blind.
    let file_exists = || match open_granted(&cfg.cwd, rel, create) {
        Ok((dir, name, _)) => Ok(dir.file_mode(&name).ok().flatten().is_some()),
        Err(why) => Err(why),
    };
    let existed = match file_exists() {
        Ok(existed) => existed,
        Err(why) => return refuse_with(why),
    };
    // The content the writer read: its own `base`, else what the file held when the request arrived, which the
    // catch-up below may move.
    let read_oid = || (cfg.path_oid)(&cfg.cwd, rel);
    let expected = match (existed, base) {
        (false, Some(_)) => {
            return Outcome::Refused {
                code: "write-base-stale",
                detail: Some(format!(
                    "{rel} does not exist, so a write cannot be based on an earlier content; write it without a base"
                )),
            }
        }
        (false, None) => None,
        (true, Some(base)) => Some(base.to_owned()),
        (true, None) => match read_oid() {
            Ok(oid) => Some(oid),
            Err(why) => return unreadable(why),
        },
    };
    match (cfg.catch_up)(&cfg.cwd) {
        Ok(()) => {}
        Err(CatchUpRefusal::BranchAhead(detail)) => {
            return Outcome::Refused {
                code: "write-branch-ahead",
                detail: Some(detail),
            }
        }
        // A catch-up that stayed Busy to the end of its retries: retryable, never a refusal of the catch-up itself.
        Err(CatchUpRefusal::Busy { code, detail }) => {
            return Outcome::Refused {
                code: "write-busy",
                detail: Some(format!("{code}: {detail}")),
            }
        }
        Err(CatchUpRefusal::Refused(why)) => {
            return Outcome::Refused {
                code: "write-catch-up-refused",
                detail: Some(format!("{}: {}", why.code, why.detail)),
            }
        }
    }
    match (cfg.path_clean)(&cfg.cwd, rel) {
        Ok(true) => {}
        Ok(false) => return refused("write-path-dirty"),
        Err(why) => {
            return Outcome::Refused {
                code: "write-path-unreadable",
                detail: Some(format!("{}: {}", why.code, why.detail)),
            }
        }
    }
    match expected {
        Some(expected) => match read_oid() {
            Ok(current) if current == expected => {}
            Ok(current) => {
                return Outcome::Refused {
                    code: "write-base-stale",
                    detail: Some(format!(
                        "{rel} is now {current}, the write was based on {expected}; read it again and redo the edit"
                    )),
                }
            }
            Err(why) => return unreadable(why),
        },
        None => match file_exists() {
            Ok(false) => {}
            Ok(true) => {
                return Outcome::Refused {
                    code: "write-base-stale",
                    detail: Some(format!(
                        "{rel} appeared while the write waited; read it and redo the edit"
                    )),
                }
            }
            Err(why) => return refuse_with(why),
        },
    }
    let bytes = match install_granted(&cfg.cwd, rel, content, create) {
        Ok(bytes) => bytes,
        Err(why) => return refuse_with(why),
    };
    Outcome::Done(match (cfg.publish_write)(&cfg.cwd, rel) {
        Ok(commit) => json!({"path": rel, "bytes": bytes, "commit": commit}),
        Err(why) => {
            (cfg.log)(&format!(
                "head-request write {} not published {}",
                loggable(rel),
                loggable(&why.code)
            ));
            // A file this request created and the publisher refused before committing anything is taken back, so
            // the path is free for a retry (it would otherwise be refused `write-path-dirty`).
            if !existed && REFUSED_BEFORE_COMMIT.contains(&why.code.as_str()) {
                remove_created(&cfg.cwd, rel);
            }
            json!({"path": rel, "bytes": bytes, "publish": {"refusal": why.code, "detail": why.detail}})
        }
    })
}

/// The publish refusals raised before the publisher commits or lands anything: the content was judged invalid, nothing
/// of it is in Git.
const REFUSED_BEFORE_COMMIT: [&str; 2] = ["write-item-invalid", "write-index-failed"];

/// Removes the file `rel` this request created, reached through the same no-symlink check as the write; a failure
/// leaves it for the dirty-path refusal to report.
fn remove_created(root: &Path, rel: &str) {
    if open_granted(root, rel, false).is_ok() {
        let _ = std::fs::remove_file(root.join(rel));
    }
}

enum Outcome {
    Done(Value),
    /// The route child ended with its own refusal: `code` is its code (the reply's detail), `message` its text,
    /// bounded and on one line, which the client may show.
    RouteRefused {
        code: String,
        message: Option<String>,
    },
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

/// A refusal's detail for the log: one plain line of at most [`DETAIL_LOG_CHARS`] characters, so a person reading
/// `supervisor.log` sees why a request was refused without a forged line or an unbounded one.
fn loggable_detail(text: &str) -> String {
    let mut plain: String = text
        .chars()
        .take(DETAIL_LOG_CHARS)
        .map(|c| if c.is_control() { ' ' } else { c })
        .collect();
    if text.chars().count() > DETAIL_LOG_CHARS {
        plain.push_str("...");
    }
    plain
}

struct Busy<'a>(&'a AtomicBool);

impl Drop for Busy<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

fn serve(cfg: &Arc<Config>, busy: &AtomicBool, large: &AtomicBool, mut stream: UnixStream) {
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
    // A reply is one GO-sized frame. A `done` whose whole reply does not fit is answered as a refusal that names the
    // size, never dropped: the client would otherwise wait for a frame that was never written.
    let reply_of = |outcome: &Outcome| match outcome {
        Outcome::Done(data) => {
            json!({"type": "REPLY", "id": id, "result": "done", "data": data})
        }
        Outcome::RouteRefused { code, message } => {
            let mut reply = json!({"type": "REPLY", "id": id, "result": "refused", "code": "verb-failed", "detail": code});
            if let Some(message) = message {
                reply["message"] = json!(message);
            }
            reply
        }
        Outcome::Refused { code, detail } => {
            let mut reply = json!({"type": "REPLY", "id": id, "result": "refused", "code": code});
            if let Some(detail) = detail {
                reply["detail"] = json!(detail);
            }
            reply
        }
    };
    let mut reply = reply_of(&outcome);
    let size = serde_json::to_vec(&reply).map_or(usize::MAX, |bytes| bytes.len());
    let outcome = if size > MAX_FRAME_BYTES {
        let too_large = Outcome::Refused {
            code: "reply-too-large",
            detail: Some(format!(
                "the answer is {size} bytes, over the {MAX_FRAME_BYTES} a reply may carry"
            )),
        };
        reply = reply_of(&too_large);
        too_large
    } else {
        outcome
    };
    if let Err(error) = write_frame(&mut stream, &reply) {
        (cfg.log)(&format!("head-request reply not written: {error}"));
    }
    let (result, code, detail) = match &outcome {
        Outcome::Done(_) => ("done", "-", String::new()),
        Outcome::RouteRefused { code, .. } => (
            "refused",
            "verb-failed",
            format!(": {}", loggable_detail(code)),
        ),
        Outcome::Refused { code, detail } => (
            "refused",
            *code,
            detail
                .as_deref()
                .map_or(String::new(), |d| format!(": {}", loggable_detail(d))),
        ),
    };
    (cfg.log)(&format!(
        "head-request {} {} {result} {code}{detail}",
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
        let mut key = map.next_key::<String>()?;
        // With arbitrary_precision serde_json delivers a number through this private map,
        // not visit_f64. It is one scalar at this depth, not an object plus a child string.
        // Parse through Number to retain precision and validate the token; never accept a
        // second entry or an arbitrary nested value in the scalar representation.
        if key.as_deref() == Some("$serde_json::private::Number") {
            let token = map.next_value::<String>()?;
            let number = token
                .parse::<serde_json::Number>()
                .map_err(serde::de::Error::custom)?;
            if map.next_key::<String>()?.is_some() {
                return Err(serde::de::Error::custom(
                    "unexpected entry after a JSON number",
                ));
            }
            return Ok(Value::Number(number));
        }
        while let Some(name) = key {
            let value = map.next_value_seed(self.child())?;
            object.insert(name, value);
            key = map.next_key::<String>()?;
        }
        Ok(Value::Object(object))
    }
}

/// The checks in contract order, then the verb.
fn decide(cfg: &Arc<Config>, busy: &AtomicBool, request: &Request, peer: Option<u32>) -> Outcome {
    let moves = role_move(&request.verb);
    let binds = request.verb == BIND_VERB;
    let window = request.verb == FGOS_VERB || request.verb == CAN_I_VERB;
    let (check, not_so) = if moves.is_some() || binds {
        (&cfg.registered, "session-not-registered")
    } else {
        (&cfg.holds_role, "role-not-held")
    };
    match check() {
        Ok(true) => {}
        Ok(false) => {
            let mut pending_read = false;
            if not_so == "role-not-held" {
                if let Ok(Some(detail)) = (cfg.pending_rotation)() {
                    if reads_only(cfg, request) {
                        pending_read = true;
                    } else {
                        return Outcome::Refused {
                            code: "role-pending-rotation",
                            detail: Some(detail),
                        };
                    }
                }
            }
            if !pending_read {
                return refused(not_so);
            }
        }
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
    if !window {
        if let Some(why) = policy_refusal(cfg, &request.verb) {
            return Outcome::Refused {
                code: "verb-not-granted",
                detail: Some(why),
            };
        }
    }
    if request.verb == CAN_I_VERB {
        return can_i(cfg, &request.args);
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
        return write_and_publish(cfg, &request.args);
    }
    if request.verb == FGOS_VERB {
        return forward(cfg, request);
    }
    if request.verb == RELEASE_VERB {
        return release_run(cfg, request);
    }
    let outcome = route_request(cfg, request);
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

/// Why `verb` (a verb of a policy frame, not an `fgos` argv) is not this persona's to send, or `None` when the table
/// allows it as a policy verb (a `node` or `native` row).
fn policy_refusal(cfg: &Config, verb: &str) -> Option<String> {
    use fgos_session_host::permissions::{decide, Decision, Policy};
    let argv: Vec<String> = verb.split(' ').map(String::from).collect();
    match decide(&cfg.persona, &argv).and_then(|v| v.rule.map(|rule| (v.decision, rule))) {
        Some((Decision::Allow, rule)) if rule.prefix == argv && rule.policy != Policy::Forward => {
            None
        }
        Some((Decision::Allow, rule)) if rule.prefix == argv => Some(format!(
            "{verb} is sent as an fgos argv ({FGOS_VERB}), not as a verb of its own"
        )),
        _ => Some(format!(
            "{verb} is not in the grant of {} ({})",
            cfg.role, cfg.persona
        )),
    }
}

/// Whether the request only reads, so a rotation successor may make it before it holds the role: a forwarded argv
/// whose row is flagged `read`, or `can-i`, which changes nothing.
fn reads_only(cfg: &Config, request: &Request) -> bool {
    use fgos_session_host::forwarder::words_of;
    use fgos_session_host::permissions::{decide, Policy};
    match request.verb.as_str() {
        CAN_I_VERB => true,
        FGOS_VERB => words_of(&request.args["argv"])
            .ok()
            .and_then(|argv| decide(&cfg.persona, &argv))
            .and_then(|verdict| verdict.rule)
            .is_some_and(|rule| rule.read && rule.policy == Policy::Forward),
        _ => false,
    }
}

/// The `argv` of a window frame: `args` holds that key and no other.
fn argv_args(args: &Value) -> Option<&Value> {
    let object = args.as_object()?;
    (object.len() == 1).then(|| object.get("argv")).flatten()
}

fn bad_argv_args() -> Outcome {
    Outcome::Refused {
        code: "bad-args",
        detail: Some("args must be {argv: [string]} and nothing else".to_string()),
    }
}

/// [`CAN_I_VERB`]: the table's answer for an argv, `{decision, reason}`. Takes no busy slot and runs nothing.
fn can_i(cfg: &Config, args: &Value) -> Outcome {
    let Some(argv) = argv_args(args) else {
        return bad_argv_args();
    };
    let (decision, reason) = fgos_session_host::forwarder::can_i(&cfg.persona, argv, &cfg.cwd);
    Outcome::Done(json!({"decision": decision.as_str(), "reason": reason}))
}

/// [`FGOS_VERB`]: the argv is screened and decided by the permission table; `allow` runs the host `fgos` with it,
/// `ask` files one owner question carrying it (refused `asked`, the question id in the detail), anything else is
/// refused `argv-not-allowed` with the reason.
fn forward(cfg: &Config, request: &Request) -> Outcome {
    use fgos_session_host::forwarder::{plan, Planned};
    let Some(argv) = argv_args(&request.args) else {
        return bad_argv_args();
    };
    // A `config patch` runs on a private copy of the bytes the window checked, under the run directory; the name is
    // unique per request and the copy is removed once the host has answered.
    let stage = cfg.run_dir.join(format!(
        "config-patch-{}-{}.yaml",
        std::process::id(),
        request
            .id
            .chars()
            .filter(char::is_ascii_alphanumeric)
            .collect::<String>()
    ));
    let planned = plan(&cfg.persona, argv, &cfg.cwd, &stage);
    let outcome = match planned {
        Err(refused) => Outcome::Refused {
            code: refused.code(),
            detail: Some(refused.0),
        },
        Ok(Planned::Run(words)) => {
            let outcome = forward_exec(cfg, request, &words);
            // `plan` created the copy (create_new succeeded) exactly for the config patch frame it returns with
            // the stage path as its file; a path this request did not create is never removed.
            let staged_patch = words.first().map(String::as_str) == Some("config")
                && words.get(1).map(String::as_str) == Some("patch")
                && words.get(2).map(std::path::Path::new) == Some(stage.as_path());
            if staged_patch {
                let _ = std::fs::remove_file(&stage);
            }
            outcome
        }
        Ok(Planned::Ask(words)) => ask_owner(cfg, request, &words),
    };
    outcome
}

/// Runs the host `fgos` with `words` (no shell, the project root as cwd, the step environment), inside the verb
/// timeout and in its own process group, and reads its answer: its `data`, or its own refusal.
fn forward_exec(cfg: &Config, request: &Request, words: &[String]) -> Outcome {
    // Mail runs outside the cage, but belongs to the protected envelope's caller. Its runtime CLI id comes from
    // Identity's bound session, never request args or the confined process's environment.
    let mail_caller = if words.first().map(String::as_str) == Some("mailbox") {
        let root = cfg
            .env
            .get("FGOS_STATE_ROOT")
            .map(PathBuf::from)
            .unwrap_or_else(|| fgos_holder_lock::state_root::state_root().0);
        let holder = match fgos_identity::directory::resolve(
            &root,
            &cfg.role,
            &judge_here,
            None,
            &fgos_identity::directory::NoTerminal,
        ) {
            Ok(holder) => holder,
            Err(why) => {
                return Outcome::RouteRefused {
                    code: why.reason.to_string(),
                    message: Some(why.detail),
                }
            }
        };
        match holder
            .ids
            .and_then(|ids| ids.cli_session)
            .map(|cli| cli.id)
            .filter(|id| !id.is_empty())
        {
            Some(id) => Some(id),
            None => {
                return Outcome::RouteRefused {
                    code: "caller-unknown".into(),
                    message: Some(
                        "the envelope's head has no bound CLI session for its mailbox".into(),
                    ),
                }
            }
        }
    } else {
        None
    };
    let words: Vec<OsString> = words.iter().map(OsString::from).collect();
    let output = match run_verb(cfg, request, &words, None, mail_caller.as_deref()) {
        Ok(BoundedOutcome::Exited(output)) => output,
        Ok(BoundedOutcome::TimedOut { .. }) => return refused("verb-timeout"),
        Err(e) => {
            return Outcome::Refused {
                code: "verb-failed",
                detail: Some(format!("the host did not run: {e}")),
            }
        }
    };
    let text = |bytes: &[u8]| {
        String::from_utf8_lossy(&bytes[..bytes.len().min(4 * STDOUT_LIMIT as usize)]).into_owned()
    };
    match fgos_session_host::forwarder::read_answer(
        output.status.success(),
        &text(&output.stdout),
        &text(&output.stderr),
        output.status.code(),
    ) {
        Ok(data) => Outcome::Done(data),
        Err((code, message)) => {
            (cfg.log)(&format!(
                "head-request {} host {}: {}",
                request.id,
                loggable(&code),
                loggable_detail(&message)
            ));
            Outcome::RouteRefused {
                code,
                message: Some(loggable_detail(&message)),
            }
        }
    }
}

/// An `ask` decision: files one five-part owner question carrying the exact argv, through the host route that takes
/// the asker from this attempt's envelope (`fgos internal head-questions`), and refuses `asked` with its id. The
/// argv did not run.
fn ask_owner(cfg: &Config, request: &Request, words: &[String]) -> Outcome {
    let line = words.join(" ");
    let headline: String = format!("May {} run: fgos {line}", cfg.persona)
        .chars()
        .take(120)
        .map(|c| if c.is_control() { ' ' } else { c })
        .collect();
    let what: String = format!(
        "{} asked the host to run `fgos {line}`, and no row of the head permission table decides it for {}.",
        cfg.role, cfg.persona
    )
    .chars()
    .take(600)
    .collect();
    let input = json!({
        "stage": "window",
        "ref": format!("case:head-window-{}", request.id),
        "headline": headline,
        "blocks": format!("{} waits for this argv before it goes on", cfg.role),
        "parts": {
            "what": what,
            "cause": "The permission table (packages/session-host/contracts/head-permissions.v1.json) has no allow or deny row for this verb and persona, so the window asks instead of guessing.",
            "options": [
                {"label": "Do not run it", "does": "The argv is not run; the head goes on without it.", "gain": "Nothing outside the head's cage changes.", "harm": "The head's chore stays undone.", "cost": "None.", "recommended": true},
                {"label": "Run it by hand", "does": "The owner runs the same argv outside the cage.", "gain": "The chore is done once.", "harm": "The owner is the one who waits and acts.", "cost": "One command."}
            ],
            "recommendation": "Do not run it here; if the chore recurs, add a row to the permission table in a landed change.",
            "scope": {"allows": "Answering this one argv for this one request.", "forbids": "Any other argv, any persona's table, or a standing grant."}
        }
    });
    match file_question(cfg, request, input) {
        Ok(id) => Outcome::Refused {
            code: "asked",
            detail: Some(id),
        },
        Err(outcome) => outcome,
    }
}

/// Files one owner question through the host route that takes the asker from this attempt's envelope
/// (`fgos internal head-questions`): the question's id, or the refusal to answer with.
fn file_question(cfg: &Config, request: &Request, input: Value) -> Result<String, Outcome> {
    let words: Vec<OsString> = vec![
        "internal".into(),
        "head-questions".into(),
        "--run-dir".into(),
        cfg.run_dir.clone().into_os_string(),
    ];
    let body = json!({"v": 1, "verb": "questions ask", "args": {"input": input}}).to_string();
    let output = match run_verb(cfg, request, &words, Some(body.as_bytes()), None) {
        Ok(BoundedOutcome::Exited(output)) => output,
        Ok(BoundedOutcome::TimedOut { .. }) => return Err(refused("verb-timeout")),
        Err(e) => {
            return Err(Outcome::Refused {
                code: "verb-failed",
                detail: Some(format!("the question route did not run: {e}")),
            })
        }
    };
    let text = String::from_utf8_lossy(&output.stdout).into_owned();
    let line = text.lines().rev().find_map(|l| {
        serde_json::from_str::<Value>(l.trim())
            .ok()
            .filter(Value::is_object)
    });
    match line {
        Some(line) if line["result"] == "done" => Ok(line["data"]["id"]
            .as_str()
            .map(String::from)
            .unwrap_or_default()),
        Some(line) if line["code"].is_string() => Err(Outcome::RouteRefused {
            code: line["code"].as_str().unwrap_or_default().to_string(),
            message: line["message"].as_str().map(loggable_detail),
        }),
        _ => Err(Outcome::Refused {
            code: "verb-failed",
            detail: Some("the question route printed no answer".to_string()),
        }),
    }
}

/// The longest one release step (a check, the apply, the probe, the rollback) may run.
const RELEASE_STEP_TIMEOUT: Duration = Duration::from_secs(30 * 60);

/// `YYYY-MM-DDTHH:MM:SS.mmmZ` for now (UTC), the form the ticket files carry.
fn utc_now_iso() -> String {
    fgos_host_runtime::civil_time::format_system_time_utc(std::time::SystemTime::now())
}

/// The real ports of a release run: the host for config and lock reads, git for the trunk tip, a plain process for
/// each recipe argv, the owner question store for the question and the report.
struct HostRelease {
    cfg: Arc<Config>,
    request: Request,
    /// Where the recipe argvs write their output.
    log_file: PathBuf,
}

impl HostRelease {
    /// The release record the rule keeps: `{released: <trunk commit>, step: applying|probing}`, both optional.
    fn state(&self) -> Result<Value, String> {
        match std::fs::read_to_string(release_state_file(&self.cfg.cwd)) {
            Ok(text) => serde_json::from_str::<Value>(&text)
                .ok()
                .filter(Value::is_object)
                .ok_or_else(|| "the release record is not a JSON object".to_string()),
            Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(json!({})),
            Err(e) => Err(format!("the release record is not readable: {e}")),
        }
    }

    /// Whole or not at all: a synced temp file moved onto the name.
    fn write_state(&self, state: &Value) -> Result<(), String> {
        let file = release_state_file(&self.cfg.cwd);
        write_ticket(&file, state, false)
            .map_err(|e| format!("the release record was not written: {e}"))
    }

    /// The `data` of the one envelope a host verb prints with `--json` (pretty-printed over many lines).
    fn host_json(&self, words: &[&str]) -> Result<Value, String> {
        let words: Vec<OsString> = words.iter().map(OsString::from).collect();
        match run_verb(&self.cfg, &self.request, &words, None, None) {
            Ok(BoundedOutcome::Exited(output)) if output.status.success() => {
                fgos_session_host::release::envelope_data(&String::from_utf8_lossy(&output.stdout))
            }
            Ok(BoundedOutcome::Exited(output)) => Err(format!(
                "the host ended {}",
                output
                    .status
                    .code()
                    .map_or("by a signal".into(), |c| format!("with exit {c}"))
            )),
            Ok(BoundedOutcome::TimedOut { .. }) => Err("the host timed out".to_string()),
            Err(e) => Err(format!("the host did not run: {e}")),
        }
    }

    /// A recipe argv (a check, the apply, the probe, the rollback). It dies with the supervisor, so the release
    /// lock, the runner and every recipe child share one lifetime (`fgctl upgrade` publishes the activation by
    /// temp file and rename, so a killed upgrade leaves the old or the new release, never a half one). Its output
    /// goes to the run's log file, since a pipe whose reader is gone would end the child with SIGPIPE.
    ///
    /// With `dir` (a check's checkout) the argv runs there, with no inherited `FGOS_*` variable (a check that needs
    /// one sets it itself, so it never reads this machine's live state or reaches the supervisor) and with `TMPDIR`
    /// at `<dir>/.fgos/runtime/tmp`, an ignored disk directory made here, so no check fills the shared `/tmp`.
    /// Without it the argv runs from the project root with the inherited environment.
    fn recipe_command(
        &self,
        program: &str,
        args: &[String],
        dir: Option<&Path>,
    ) -> io::Result<(Command, std::fs::File)> {
        use std::os::fd::AsRawFd;
        let tmp = match dir {
            Some(dir) => {
                let tmp = dir.join(".fgos").join("runtime").join("tmp");
                std::fs::create_dir_all(&tmp)?;
                Some(tmp)
            }
            None => None,
        };
        let log = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .mode_0600()
            .open(&self.log_file)?;
        let fd = log.as_raw_fd();
        let mut cmd = Command::new(program);
        cmd.args(args).env_clear();
        if let Some(tmp) = &tmp {
            cmd.envs(
                self.cfg
                    .env
                    .iter()
                    .filter(|(key, _)| !key.starts_with("FGOS_")),
            )
            .env("TMPDIR", tmp);
        } else {
            cmd.envs(self.cfg.env.iter());
        }
        cmd.current_dir(dir.unwrap_or(&self.cfg.cwd));
        // SAFETY: prctl and dup2 are async-signal-safe; dup2 runs after the pipes are set up, so the log replaces
        // them, and the child dies with the supervisor that started it.
        unsafe {
            cmd.pre_exec(move || {
                #[cfg(target_os = "linux")]
                fgos_process::control::arm_parent_death_signal()?;
                if libc::dup2(fd, 1) < 0 || libc::dup2(fd, 2) < 0 {
                    return Err(io::Error::last_os_error());
                }
                Ok(())
            });
        }
        Ok((cmd, log))
    }

    fn question(
        &self,
        ref_tail: &str,
        headline: &str,
        blocks: &str,
        parts: Value,
    ) -> Result<String, String> {
        let input = json!({
            "stage": "window",
            "ref": format!("case:release-{ref_tail}"),
            "headline": loggable(headline).chars().take(120).collect::<String>(),
            "blocks": blocks,
            "parts": parts,
        });
        file_question(&self.cfg, &self.request, input).map_err(|outcome| match outcome {
            Outcome::RouteRefused { code, message } => {
                format!("{code}: {}", message.unwrap_or_default())
            }
            Outcome::Refused { code, detail } => format!("{code}: {}", detail.unwrap_or_default()),
            Outcome::Done(_) => String::new(),
        })
    }
}

impl fgos_session_host::release::ReleasePorts for HostRelease {
    fn recipe(&self) -> Result<Value, String> {
        self.host_json(&["config", "show", "--path", "release", "--json"])
            .map(|answer| fgos_session_host::release::release_subtree(&answer))
    }

    /// The trunk tip is the head commit of the project root.
    fn trunk_tip(&self) -> Result<String, String> {
        let (driver, repo) = fgos_git::GitDriver::open_at(&self.cfg.cwd)
            .map_err(|e| format!("git did not run: {e:?}"))?
            .ok_or_else(|| "the project root is not a git repository".to_string())?;
        match driver.resolve_commit_ref(&repo, "HEAD") {
            Ok(Some(oid)) => Ok(oid.as_str().to_string()),
            Ok(None) => Err("git HEAD did not answer".to_string()),
            Err(e) => Err(format!("git did not run: {e:?}")),
        }
    }

    fn released_commit(&self) -> Result<Option<String>, String> {
        Ok(self.state()?["released"].as_str().map(String::from))
    }

    fn record_released(&self, commit: &str) -> Result<(), String> {
        let mut state = self.state()?;
        state["released"] = json!(commit);
        self.write_state(&state)
    }

    fn step(&self) -> Result<Option<String>, String> {
        Ok(self.state()?["step"].as_str().map(String::from))
    }

    fn set_step(&self, step: Option<&str>) -> Result<(), String> {
        let mut state = self.state()?;
        match step {
            Some(step) => state["step"] = json!(step),
            None => {
                if state
                    .as_object_mut()
                    .and_then(|o| o.remove("step"))
                    .is_none()
                {
                    return Ok(());
                }
            }
        }
        self.write_state(&state)
    }

    fn land_in_progress(&self) -> Result<Option<String>, String> {
        self.host_json(&["lock-status", "--json"])
            .map(|report| fgos_session_host::release::merge_slot_hold(&report))
    }

    /// A detached checkout of `tip` at `<parent of the project root>/<project name>-worktrees/release-check-<id>`,
    /// made through the worktree door, then given the tip's committed `.fgos` bytes. A checkout made before a later
    /// step failed is removed again.
    fn make_check_checkout(&self, tip: &str) -> Result<PathBuf, String> {
        let name = self
            .cfg
            .cwd
            .file_name()
            .ok_or_else(|| "the project root has no directory name".to_string())?
            .to_string_lossy()
            .into_owned();
        let parent = self
            .cfg
            .cwd
            .parent()
            .ok_or_else(|| "the project root has no parent directory".to_string())?;
        let path = parent
            .join(format!("{name}-worktrees"))
            .join(format!("release-check-{}", self.request.id));
        let text = path.to_string_lossy().into_owned();
        self.host_json(&[
            "worktree", "create", &text, "--detach", "--base", tip, "--json",
        ])
        .map_err(|why| format!("fgos worktree create: {why}"))?;
        let materialized = (|| {
            let (driver, repo) = fgos_git::GitDriver::open_at(&path)
                .map_err(|e| format!("git did not run: {e:?}"))?
                .ok_or_else(|| "the check checkout is not a git repository".to_string())?;
            driver
                .materialize_committed_state(&repo, vec![], tip)
                .map_err(|e| format!("the committed .fgos was not written: {e:?}"))
        })();
        if let Err(why) = materialized {
            if let Err(removed) = self.remove_check_checkout(&path, tip) {
                self.log(&format!(
                    "the release check checkout at {} was not removed: {removed}",
                    path.display()
                ));
            }
            return Err(why);
        }
        Ok(path)
    }

    fn remove_check_checkout(&self, path: &Path, tip: &str) -> Result<(), String> {
        let text = path.to_string_lossy().into_owned();
        self.host_json(&[
            "worktree",
            "remove",
            &text,
            "--delivered-to",
            tip,
            "--discard-ignored",
            "--json",
        ])
        .map(|_| ())
        .map_err(|why| format!("fgos worktree remove: {why}"))
    }

    fn run(&self, argv: &[String], dir: Option<&Path>) -> Result<i32, String> {
        let Some((program, args)) = argv.split_first() else {
            return Err("an empty argv".to_string());
        };
        let (command, _log) = self
            .recipe_command(program, args, dir)
            .map_err(|e| format!("the run log is not writable: {e}"))?;
        match run_bounded_command(command, None, RELEASE_STEP_TIMEOUT, |_| ()) {
            Ok(BoundedOutcome::Exited(output)) => Ok(output.status.code().unwrap_or(-1)),
            Ok(BoundedOutcome::TimedOut { .. }) => Err("timed out".to_string()),
            Err(e) => Err(e.to_string()),
        }
    }

    fn ask_owner(&self, apply: &[String]) -> Result<String, String> {
        let line = apply.join(" ");
        self.question(
            &self.request.id,
            &format!("Apply the release: {line}"),
            "the release waits for this answer before it goes on",
            json!({
                "what": format!("Every check of the release passed. The recipe is not reversible, so `{line}` waits for the owner."),
                "cause": "release.reversible is false, so no head applies the release by itself.",
                "options": [
                    {"label": "Apply", "does": format!("The owner has `{line}` run; the release goes on."), "gain": "The checked trunk is the active release.", "harm": "No rollback is declared: the change cannot be undone by the recipe.", "cost": "The apply's own run time.", "recommended": true},
                    {"label": "Do not apply", "does": "Nothing is applied; the active release stays as it is.", "gain": "No irreversible change is made.", "harm": "The landed work stays unreleased.", "cost": "None; a later release run asks again."}
                ],
                "recommendation": "Apply: every check passed, and the owner alone decides because the recipe cannot undo it.",
                "scope": {"allows": "Applying this one release.", "forbids": "Any other release, or a standing grant."}
            }),
        )
    }

    fn log(&self, line: &str) {
        (self.cfg.log)(&format!(
            "head-request {} {}",
            self.request.id,
            loggable_detail(line)
        ));
    }

    fn report(&self, line: &str) {
        let tail = format!("{}-report", self.request.id);
        if let Err(why) = self.question(
            &tail,
            line,
            "nothing: the release run has ended, and this is a report",
            json!({
                "what": line.chars().take(600).collect::<String>(),
                "cause": "A release run ended and reports its outcome.",
                "options": [
                    {"label": "Noted", "does": "The owner reads the line.", "gain": "The owner knows where the release stands.", "harm": "None.", "cost": "A reading.", "recommended": true},
                    {"label": "Look into it", "does": "The owner inspects the release by hand.", "gain": "A finding the line did not give.", "harm": "None to the release, which has already ended.", "cost": "Some minutes."}
                ],
                "recommendation": "Noted, unless the line says something failed.",
                "scope": {"allows": "Reading this one release report.", "forbids": "Any other release, or a standing grant."}
            }),
        ) {
            (self.cfg.log)(&format!(
                "head-request {} release report: {}",
                self.request.id,
                loggable_detail(&why)
            ));
        }
    }
}

/// Writes the ticket whole or not at all through the durable-file door (`exclusive` installs without replacing,
/// so an existing ticket is `AlreadyExists` and left alone).
fn write_ticket(file: &Path, ticket: &Value, exclusive: bool) -> io::Result<()> {
    let invalid = |why: &str| io::Error::new(io::ErrorKind::InvalidInput, why.to_string());
    let dir = file
        .parent()
        .ok_or_else(|| invalid("ticket path has no parent"))?;
    let name = file
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| invalid("ticket name is not UTF-8"))?;
    let bytes = format!("{ticket}\n");
    let placed = if exclusive {
        fgos_durable_file::install_once_with_mode(dir, name, bytes.as_bytes(), 0o600)
    } else {
        fgos_durable_file::replace_durably_with_mode(dir, name, bytes.as_bytes(), 0o600)
    };
    match placed {
        Ok(fgos_durable_file::Installed::AlreadyExists) => {
            Err(io::Error::from(io::ErrorKind::AlreadyExists))
        }
        Ok(_) => Ok(()),
        Err(e) => Err(io::Error::new(e.source.kind(), e.to_string())),
    }
}

/// The release rule's own record under the project root: the trunk commit the last release put in place and the step
/// in progress.
fn release_state_file(root: &Path) -> PathBuf {
    root.join(".fgos/runtime/release/state.json")
}

/// One release at a time across both personas: an exclusive, non-blocking holder lock on
/// `.fgos/runtime/release/lock`, held by this supervisor for the whole detached run. The kernel drops it when the
/// supervisor dies, so there is no stale lock to reclaim and no file that can wedge it.
struct ReleaseLock {
    _handle: fgos_holder_lock::Handle,
}

impl ReleaseLock {
    fn take(root: &Path) -> io::Result<Option<ReleaseLock>> {
        use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
        let dir = root.join(".fgos/runtime/release");
        std::fs::create_dir_all(&dir)?;
        let resource = Resource::new("release-run", dir.join("lock"));
        match acquire(&resource, Mode::Ex, Wait::Try, DEFAULT_KILL_WAIT_MS) {
            Acquire::Acquired(handle) => Ok(Some(ReleaseLock { _handle: handle })),
            Acquire::Held { .. } | Acquire::Timeout { .. } => Ok(None),
            Acquire::Unavailable { detail, .. } => Err(io::Error::other(detail)),
        }
    }
}

trait Mode0600 {
    fn mode_0600(&mut self) -> &mut Self;
}

impl Mode0600 for std::fs::OpenOptions {
    fn mode_0600(&mut self) -> &mut Self {
        use std::os::unix::fs::OpenOptionsExt;
        self.mode(0o600)
    }
}

/// [`RELEASE_VERB`]: writes the ticket where `request result` reads it (`.fgos/runtime/head-tickets/<role>/<id>.json`,
/// the id the request's) and answers at once; a detached thread runs the release rule (`{rollback: true}` runs only
/// the recipe's rollback) and rewrites the ticket `done` or `failed` with the outcome as its result.
fn release_run(cfg: &Arc<Config>, request: &Request) -> Outcome {
    let args = request.args.as_object();
    let rollback = match args {
        Some(map) if map.is_empty() => false,
        Some(map) if map.len() == 1 && map.get("rollback").is_some_and(Value::is_boolean) => {
            map["rollback"] == true
        }
        _ => {
            return Outcome::Refused {
                code: "bad-args",
                detail: Some("args is {} or {rollback: boolean} and nothing else".to_string()),
            }
        }
    };
    let name = cfg.role.strip_prefix("head:").unwrap_or_default();
    if name.is_empty()
        || !name
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Outcome::Refused {
            code: "verb-failed",
            detail: Some("the role is not a head role".to_string()),
        };
    }
    // This process is the runner: its identity is on the ticket, so a supervisor that ends mid-run reads
    // `runner-gone`; the kernel frees the release lock with it.
    let Some(runner) = fgos_process::facts::self_identity().map(|t| t.to_record().to_json()) else {
        return Outcome::Refused {
            code: "verb-failed",
            detail: Some("the supervisor's own process identity is not readable".to_string()),
        };
    };
    let lock = match ReleaseLock::take(&cfg.cwd) {
        Ok(Some(lock)) => lock,
        Ok(None) => return refused("release-in-progress"),
        Err(e) => {
            return Outcome::Refused {
                code: "verb-failed",
                detail: Some(format!("the release lock is not writable: {e}")),
            }
        }
    };
    let dir = cfg.cwd.join(".fgos/runtime/head-tickets").join(name);
    if let Err(e) = std::fs::create_dir_all(&dir) {
        return Outcome::Refused {
            code: "verb-failed",
            detail: Some(format!("the ticket directory is not writable: {e}")),
        };
    }
    let file = dir.join(format!("{}.json", request.id));
    let mut ticket = json!({
        "id": request.id, "verb": RELEASE_VERB, "state": "running", "runner": runner,
        "startedAt": utc_now_iso(), "cwd": cfg.cwd,
    });
    if let Err(e) = write_ticket(&file, &ticket, true) {
        return if e.kind() == io::ErrorKind::AlreadyExists {
            refused("ticket-used")
        } else {
            Outcome::Refused {
                code: "verb-failed",
                detail: Some(format!("the ticket was not written: {e}")),
            }
        };
    }
    let ports = HostRelease {
        cfg: cfg.clone(),
        request: Request {
            id: request.id.clone(),
            verb: request.verb.clone(),
            args: json!({}),
        },
        log_file: dir.join(format!("{}.log", request.id)),
    };
    let log = cfg.clone();
    let id = request.id.clone();
    let spawned = std::thread::Builder::new()
        .name("release-run".to_string())
        .spawn(move || {
            use fgos_session_host::release::{run, run_rollback};
            // Held for the whole run, the secretary's rollback included.
            let _lock = lock;
            let outcome = if rollback {
                run_rollback(&ports)
            } else {
                run(&ports)
            };
            ticket["state"] = json!(if outcome.is_answer() {
                "done"
            } else {
                "failed"
            });
            ticket["endedAt"] = json!(utc_now_iso());
            ticket["result"] = outcome.to_value();
            if !outcome.is_answer() {
                ticket["code"] = json!(outcome.code());
                if let Some(detail) = outcome.to_value()["detail"].as_str() {
                    ticket["message"] = json!(loggable_detail(detail));
                }
            }
            if let Err(e) = write_ticket(&file, &ticket, false) {
                (log.log)(&format!("head-request {id} release ticket: {e}"));
            }
        });
    if let Err(e) = spawned {
        return Outcome::Refused {
            code: "verb-failed",
            detail: Some(format!("the release did not start: {e}")),
        };
    }
    Outcome::Done(json!({"ticket": request.id, "state": "running"}))
}

/// The one place the host is spawned: resolves the host the route children run (the active release's host when the
/// head follows activation, else its start host), runs it with `words` and the optional stdin `body` in the step
/// environment and the project root, through the process door's bounded run (its own group, killed with its
/// descendants at the timeout), armed to die with the supervisor on Linux.
fn run_verb(
    cfg: &Config,
    request: &Request,
    words: &[OsString],
    body: Option<&[u8]>,
    mail_caller: Option<&str>,
) -> io::Result<BoundedOutcome> {
    let host = match cfg.request_host_bin.as_ref().map(|read| read()) {
        Some(Ok(host)) => host,
        Some(Err(why)) => {
            (cfg.log)(&format!(
                "head-request {} release-fallback: {}",
                request.id,
                loggable_detail(&why)
            ));
            PathBuf::from(&cfg.host_bin)
        }
        None => PathBuf::from(&cfg.host_bin),
    };
    let mut cmd = Command::new(&host);
    cmd.args(words)
        .env_clear()
        .envs(cfg.env.iter())
        .current_dir(&cfg.cwd);
    if let Some(caller) = mail_caller {
        for name in ENV_ORDER {
            cmd.env_remove(name);
        }
        let launcher = fgos_identity::launcher_env(caller, None)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidInput, e))?;
        for name in launcher.unset {
            cmd.env_remove(name);
        }
        cmd.envs(launcher.set)
            .env_remove("FGOS_HEAD_REQUEST_SOCKET")
            .env_remove("FGOS_CONFINED")
            .env_remove("CLAUDE_PROJECT_DIR");
    }
    // SAFETY: prctl is async-signal-safe; the child dies with the supervisor that started it.
    #[cfg(target_os = "linux")]
    unsafe {
        cmd.pre_exec(fgos_process::control::arm_parent_death_signal);
    }
    run_bounded_command(cmd, body, cfg.verb_timeout, |_| ())
}

/// Sends the internal head-request frame (`<host> internal head-request --protocol 1 --run-dir <dir>`, the request on
/// stdin) and reads the route's answer.
fn route_request(cfg: &Config, request: &Request) -> Outcome {
    let failed = |detail: String| Outcome::Refused {
        code: "verb-failed",
        detail: Some(detail),
    };
    let words: Vec<OsString> = vec![
        "internal".into(),
        "head-request".into(),
        "--protocol".into(),
        "1".into(),
        "--run-dir".into(),
        cfg.run_dir.clone().into_os_string(),
    ];
    let body = json!({"id": request.id, "verb": request.verb, "args": request.args}).to_string();
    let output = match run_verb(cfg, request, &words, Some(body.as_bytes()), None) {
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
            // The client is told the code and the route's message, bounded to one plain line; the log keeps both.
            let message = line["message"].as_str().map(loggable_detail);
            if let Some(message) = &message {
                (cfg.log)(&format!(
                    "head-request {} route {}: {}",
                    request.id,
                    loggable(line["code"].as_str().unwrap_or_default()),
                    message
                ));
            }
            Outcome::RouteRefused {
                code: line["code"].as_str().unwrap_or_default().to_string(),
                message,
            }
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

/// `fgos internal head-request --protocol 1 --run-dir <attemptDir>`: the host half of one request: the envelope
/// checks `attempt-step` makes (one helper), then the hand-over to the Node payload that runs the verb.
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
