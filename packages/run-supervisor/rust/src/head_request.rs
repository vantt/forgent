//! The head request socket: the one way a confined head session asks the host for a verb.
//!
//! A head's sandbox masks herdr and the user runtime directory, so it cannot start another session itself. Its own
//! run supervisor listens on one socket (`envelope.session.requestSocketPath`), the sandbox gets it read-only, and
//! each request is checked and performed outside. This module is only transport and enforcement: it decides
//! nothing about who holds a role (Identity does) or what a verb means (the Node payload behind
//! `fgos internal head-request` does), and it learns what the role may ask for from the envelope, never from a
//! table. Contract: `packages/run-supervisor/contracts/head-request.v1.json`.

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

use fgos_identity::resolve::{HeadRef, WriterKey, ENV_ORDER};
use fgos_process::facts::judge_here;
use fgos_process::spawn::{run_bounded_command, Outcome as BoundedOutcome};
use serde_json::{json, Value};

use crate::attempt_step::exec_payload;
use crate::go_channel::{peer_uid, read_frame, write_frame, FrameError};
use crate::route::{refuse, Flags};

/// The Node payload entry the route child runs.
pub(crate) const ENTRY: &str = "src/session-host/head-request.mjs";
/// How long one request may run before its child is killed (the head's own launch waits up to 45 s).
pub const VERB_TIMEOUT: Duration = Duration::from_millis(60_000);
/// How long a connection has to deliver its one frame.
const READ_DEADLINE: Duration = Duration::from_secs(5);
/// Connections handled at once, the one running request included; a further one is dropped unanswered.
const MAX_CONNECTIONS: usize = 8;
/// Most of the route child's stdout that is kept; the contract says one JSON line.
const STDOUT_LIMIT: u64 = 65_536;
const MAX_ID_LEN: usize = 64;
/// The one verb of a rotation successor, which does not hold the role yet: the supervisor checks only that the
/// attempt's own session is registered, and after the verb reports done it moves the role to that session.
pub const ANSWERED_VERB: &str = "head answered";
/// The verb that gives a role back to a live head when a failed rotation left nobody holding it: the same
/// registered check, and after the route reports done the role is registered again without `take`, so Identity
/// refuses (`role-held`) when another live session holds it.
pub const RESTORE_VERB: &str = "head restore role";

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
    /// One line per request, for `supervisor.log`.
    pub log: LogLine,
}

/// The listener's side of the protocol. `poll` takes pending connections without blocking; each runs on a thread of
/// its own, so the supervisor's tick never waits on a request.
pub struct HeadRequests {
    cfg: Arc<Config>,
    busy: Arc<AtomicBool>,
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
            verb_timeout: VERB_TIMEOUT,
            holds_role: Box::new({
                let (state_root, role, writer_id) =
                    (state_root.clone(), role.clone(), writer_id.clone());
                move || identity_holds(&state_root, &role, &writer_id)
            }),
            registered: Box::new({
                let (state_root, writer_id) = (state_root.clone(), writer_id.clone());
                move || identity_registered(&state_root, &writer_id)
            }),
            take_role: Box::new({
                let gate = gate.clone();
                move |take| {
                    let head = gate.lock().unwrap_or_else(|e| e.into_inner()).clone();
                    let head = head.ok_or_else(|| HoldError {
                        code: "gate-unknown".into(),
                        detail: "the attempt's gate is not known yet".into(),
                    })?;
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
            let (cfg, busy, connections) = (
                self.cfg.clone(),
                self.busy.clone(),
                self.connections.clone(),
            );
            std::thread::spawn(move || {
                serve(&cfg, &busy, stream);
                connections.fetch_sub(1, Ordering::SeqCst);
            });
        }
    }
}

/// Identity's answer to "does this attempt's session hold the role": the session the writer id names is the one
/// `resolve` finds holding it. Nothing is cached; a role that rotation moved away stops answering yes at once.
pub fn identity_holds(state_root: &Path, role: &str, writer_id: &str) -> Result<bool, HoldError> {
    let key = WriterKey {
        source: ENV_ORDER[0],
        value: writer_id,
    };
    let own = fgos_identity::current::session_for(state_root, &key, None).map_err(hold_error)?;
    match fgos_identity::directory::resolve(state_root, role, &judge_here, None) {
        Ok(holder) => Ok(holder.id == own.info.id),
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

/// Identity's answer to "is this attempt's session registered and live": the full id of the session the writer id
/// names is one `resolve` finds. A session that never registered, or whose head is gone, is `Ok(false)`.
pub fn identity_registered(state_root: &Path, writer_id: &str) -> Result<bool, HoldError> {
    let key = WriterKey {
        source: ENV_ORDER[0],
        value: writer_id,
    };
    let own = fgos_identity::current::session_for(state_root, &key, None).map_err(hold_error)?;
    match fgos_identity::directory::resolve(state_root, &own.info.id, &judge_here, None) {
        Ok(found) => Ok(found.id == own.info.id),
        Err(r) if r.reason == "not-found" => Ok(false),
        Err(r) => Err(hold_error(r)),
    }
}

/// Registers `role` for the session of `writer_id`; with `take` it moves from the live holder (Identity's own `take`, the supervisor only transports the fact that
/// the attempt is that session). The gate is the head Identity records liveness against.
pub fn identity_take(
    state_root: &Path,
    cwd: &Path,
    role: &str,
    writer_id: &str,
    head: &HeadRef,
    take: bool,
) -> Result<(), HoldError> {
    let key = WriterKey {
        source: ENV_ORDER[0],
        value: writer_id,
    };
    fgos_identity::directory::register_writer(
        state_root,
        Some(cwd),
        &key,
        head,
        &[role.to_string()],
        take,
    )
    .map(|_| ())
    .map_err(hold_error)
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

fn serve(cfg: &Config, busy: &AtomicBool, mut stream: UnixStream) {
    let _ = stream.set_nonblocking(false);
    let _ = stream.set_write_timeout(Some(READ_DEADLINE));
    // SAFETY: getuid has no failure mode.
    let own = unsafe { libc::getuid() };
    let (id, verb, outcome) = if !uid_allowed(peer_uid(&stream), own) {
        (None, None, refused("peer-uid"))
    } else {
        let mut reader = Deadline {
            stream: &stream,
            until: Instant::now() + READ_DEADLINE,
        };
        match read_request(&mut reader) {
            Ok(request) => {
                let outcome = decide(cfg, busy, &request);
                (Some(request.id), Some(request.verb), outcome)
            }
            Err(id) => (id, None, refused("bad-frame")),
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

/// One REQUEST frame; the error is the request's id when the frame carried a valid one.
fn read_request(reader: &mut impl Read) -> Result<Request, Option<String>> {
    let frame = match read_frame(reader) {
        Ok(frame) => frame,
        Err(FrameError::Closed | FrameError::Protocol) => return Err(None),
    };
    let id = frame["id"]
        .as_str()
        .filter(|id| valid_id(id))
        .map(String::from);
    match (
        frame["type"].as_str(),
        &id,
        frame["verb"].as_str(),
        frame["args"].is_object(),
    ) {
        (Some("REQUEST"), Some(id), Some(verb), true) => Ok(Request {
            id: id.clone(),
            verb: verb.to_string(),
            args: frame["args"].clone(),
        }),
        _ => Err(id),
    }
}

/// The checks in contract order, then the verb.
fn decide(cfg: &Config, busy: &AtomicBool, request: &Request) -> Outcome {
    let moves = role_move(&request.verb);
    let (check, not_so) = if moves.is_some() {
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
    if busy
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return refused("busy");
    }
    let _busy = Busy(busy);
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
    fn ids_and_logged_text_are_bounded() {
        assert!(valid_id("a1-b_2.c"));
        assert!(!valid_id("") && !valid_id("has space") && !valid_id(&"x".repeat(65)));
        assert_eq!(
            loggable("head start\nforged line"),
            "head start?forged line"
        );
        assert_eq!(loggable(&"v".repeat(100)).len(), 32);
    }
}
