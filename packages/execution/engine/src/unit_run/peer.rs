//! The admission peer: the one S6a adapter of [`CaseAdmission`].
//!
//! One Rust type over a framed `(reader, writer)` pair. Every message is one line of JSON behind a prefix; a line
//! without the prefix is stray output and is never read as a message (the doctor bridge's framing). The pair is the
//! process's own stdin and stdout (`PeerChannel::over_stdio`, the `run-unit` internal op) or a spawned peer's stdout
//! and stdin (`PeerChannel::over_child`, standalone `fgos run`): same adapter, pipes only, never an inherited fd
//! above 2.
//!
//! A request is `{ protocol, id, op, payload }`; its response is `{ protocol, id, result }` or
//! `{ protocol, id, error: { code, message } }`. The protocol number rides on every frame, and a frame of another
//! number refuses the call with [`PeerError::HostVersionMismatch`]. Each request has a deadline. The reader runs on
//! its own thread, so a peer that writes while this side writes never deadlocks, and a peer that dies or goes
//! silent fails the call (the run fails closed) instead of waiting.
//!
//! Contract and vectors: `packages/execution/contracts/admission-peer/admission-peer.v1.json`.

use std::io::{BufRead, Write};
use std::process::Child;
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use fgos_execution::admission::{Admission, CaseAdmission, Recheck, Refusal};
use serde_json::{json, Value};

/// The protocol number every frame carries.
pub const PROTOCOL: u64 = 1;
/// The prefix of a message line; anything else on the channel is stray output.
pub const PREFIX: &str = "\u{1e}FGOS-ADMISSION-PEER ";
/// How long one request waits for its answer.
pub const DEFAULT_DEADLINE: Duration = Duration::from_secs(60);
/// The refusal code of a peer speaking another protocol number.
pub const HOST_VERSION_MISMATCH: &str = "host-version-mismatch";

pub const OP_RESOLVE_BINDING: &str = "resolveBinding";
pub const OP_ADMIT: &str = "admit";
pub const OP_RECHECK_EFFECT: &str = "recheckEffect";
pub const OP_SETTLE: &str = "settle";
pub const OP_ACTIVITY_UNIT_OF: &str = "activityUnitOf";
pub const OP_CONFINED_WRITE_REFUSAL: &str = "confinedWriteRefusal";
/// The op that carries an acknowledged event.
pub const OP_EVENT: &str = "event";
pub const EVENT_UNIT_RUN_CREATED: &str = "unitRunCreated";
pub const EVENT_CASE_ADMITTED: &str = "caseAdmitted";

/// Why the peer could not answer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PeerError {
    /// The channel could not be written.
    Io(String),
    /// The peer did not answer within the deadline.
    Deadline { op: String },
    /// The peer closed the channel (it died, or ended its output).
    Closed { op: String },
    /// A frame carried another protocol number.
    HostVersionMismatch { got: Option<u64> },
    /// The peer answered with an error of its own.
    Remote { code: String, message: String },
    /// A frame or an answer was not what the contract says.
    Malformed(String),
}

impl PeerError {
    /// The stable code a run reports.
    pub fn code(&self) -> &str {
        match self {
            Self::Io(_) => "peer-io",
            Self::Deadline { .. } => "peer-deadline",
            Self::Closed { .. } => "peer-closed",
            Self::HostVersionMismatch { .. } => HOST_VERSION_MISMATCH,
            Self::Remote { code, .. } => code,
            Self::Malformed(_) => "peer-malformed",
        }
    }
}

impl std::fmt::Display for PeerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(e) => write!(f, "admission peer write failed: {e}"),
            Self::Deadline { op } => write!(f, "admission peer did not answer {op} in time"),
            Self::Closed { op } => write!(f, "admission peer closed the channel during {op}"),
            Self::HostVersionMismatch { got } => write!(
                f,
                "{HOST_VERSION_MISMATCH}: the peer speaks protocol {}, this side {PROTOCOL}",
                got.map_or("none".to_string(), |g| g.to_string())
            ),
            Self::Remote { code, message } => {
                write!(f, "admission peer refused the call ({code}): {message}")
            }
            Self::Malformed(m) => write!(f, "admission peer sent a malformed answer: {m}"),
        }
    }
}

impl std::error::Error for PeerError {}

/// The frame of one message line, without its newline.
pub fn frame_line(message: &Value) -> String {
    format!("{PREFIX}{message}\n")
}

/// The message a line carries; `None` for a line without the prefix (stray output) or without valid JSON.
pub fn parse_line(line: &str) -> Option<Value> {
    serde_json::from_str(line.trim_end_matches(['\r', '\n']).strip_prefix(PREFIX)?).ok()
}

/// A framed channel to the peer. Requests are one at a time.
pub struct PeerChannel {
    inner: Mutex<Inner>,
    deadline: Duration,
}

struct Inner {
    writer: Box<dyn Write + Send>,
    inbox: Receiver<Value>,
    next_id: u64,
}

impl PeerChannel {
    /// A channel over `reader` and `writer` with the default deadline per request.
    pub fn new<R, W>(reader: R, writer: W) -> Self
    where
        R: BufRead + Send + 'static,
        W: Write + Send + 'static,
    {
        Self::with_deadline(reader, writer, DEFAULT_DEADLINE)
    }

    pub fn with_deadline<R, W>(mut reader: R, writer: W, deadline: Duration) -> Self
    where
        R: BufRead + Send + 'static,
        W: Write + Send + 'static,
    {
        let (send, inbox) = mpsc::channel();
        thread::spawn(move || {
            let mut line = String::new();
            loop {
                line.clear();
                match reader.read_line(&mut line) {
                    Ok(0) | Err(_) => return,
                    Ok(_) => {
                        if let Some(message) = parse_line(&line) {
                            if send.send(message).is_err() {
                                return;
                            }
                        }
                    }
                }
            }
        });
        Self {
            inner: Mutex::new(Inner {
                writer: Box::new(writer),
                inbox,
                next_id: 1,
            }),
            deadline,
        }
    }

    /// The process's own stdin and stdout.
    pub fn over_stdio(deadline: Duration) -> Self {
        Self::with_deadline(
            std::io::BufReader::new(std::io::stdin()),
            std::io::stdout(),
            deadline,
        )
    }

    /// A spawned peer's stdout and stdin; `None` when either pipe was not captured.
    pub fn over_child(child: &mut Child, deadline: Duration) -> Option<Self> {
        let out = child.stdout.take()?;
        let input = child.stdin.take()?;
        Some(Self::with_deadline(
            std::io::BufReader::new(out),
            input,
            deadline,
        ))
    }

    /// One request and its answer's `result`.
    pub fn request(&self, op: &str, payload: Value) -> Result<Value, PeerError> {
        let mut inner = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        let id = inner.next_id;
        inner.next_id += 1;
        let frame =
            frame_line(&json!({ "protocol": PROTOCOL, "id": id, "op": op, "payload": payload }));
        inner
            .writer
            .write_all(frame.as_bytes())
            .and_then(|()| inner.writer.flush())
            .map_err(|e| PeerError::Io(e.to_string()))?;
        let until = Instant::now() + self.deadline;
        loop {
            let left = until.saturating_duration_since(Instant::now());
            let message = match inner.inbox.recv_timeout(left) {
                Ok(m) => m,
                Err(RecvTimeoutError::Timeout) => {
                    return Err(PeerError::Deadline { op: op.into() })
                }
                Err(RecvTimeoutError::Disconnected) => {
                    return Err(PeerError::Closed { op: op.into() })
                }
            };
            let protocol = message.get("protocol").and_then(Value::as_u64);
            if protocol != Some(PROTOCOL) {
                return Err(PeerError::HostVersionMismatch { got: protocol });
            }
            // The late answer of an earlier request that hit its deadline is not this request's.
            if message.get("id").and_then(Value::as_u64) != Some(id) {
                continue;
            }
            if let Some(error) = message.get("error") {
                let text = |k: &str| {
                    error
                        .get(k)
                        .and_then(Value::as_str)
                        .unwrap_or("")
                        .to_string()
                };
                return Err(PeerError::Remote {
                    code: text("code"),
                    message: text("message"),
                });
            }
            return message.get("result").cloned().ok_or_else(|| {
                PeerError::Malformed(format!("{op}: the answer has neither result nor error"))
            });
        }
    }

    /// An event the parent records; returns once the peer acknowledged it.
    pub fn event(&self, name: &str, data: Value) -> Result<(), PeerError> {
        let ack = self.request(OP_EVENT, json!({ "event": name, "data": data }))?;
        if ack.get("acknowledged") == Some(&Value::Bool(true)) {
            Ok(())
        } else {
            Err(PeerError::Malformed(format!(
                "event {name} was not acknowledged"
            )))
        }
    }

    /// The Unit run exists: its id (the parent marks the activity `started`).
    pub fn unit_run_created(&self, unit_run_id: &str) -> Result<(), PeerError> {
        self.event(EVENT_UNIT_RUN_CREATED, json!({ "unitRunId": unit_run_id }))
    }

    /// The case admitted the run (the parent records `recordScheduled`).
    pub fn case_admitted(&self, case_id: &str, reservation_id: &str) -> Result<(), PeerError> {
        self.event(
            EVENT_CASE_ADMITTED,
            json!({ "caseId": case_id, "reservationId": reservation_id }),
        )
    }
}

fn string_field(value: &Value, key: &str, op: &str) -> Result<String, PeerError> {
    value
        .get(key)
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| PeerError::Malformed(format!("{op}: \"{key}\" is missing")))
}

fn refusal_of(value: &Value, op: &str) -> Result<Refusal, PeerError> {
    Ok(Refusal {
        code: string_field(value, "code", op)?,
        condition: string_field(value, "condition", op)?,
        violations: value.get("violations").and_then(Value::as_array).cloned(),
        answer: Some(value.clone()),
    })
}

/// The case admission port as the peer carries it.
pub struct PeerAdmission {
    channel: PeerChannel,
}

impl PeerAdmission {
    pub fn new(channel: PeerChannel) -> Self {
        Self { channel }
    }

    /// The channel, for the two events.
    pub fn channel(&self) -> &PeerChannel {
        &self.channel
    }
}

impl CaseAdmission for PeerAdmission {
    type Error = PeerError;

    fn resolve_binding(&self, ask: &Value) -> Result<Value, PeerError> {
        // The answer is the port's as it gave it: a view without an `answer` is refused by the caller as
        // `binding-view-unavailable`, as Node's `requireFreeWorktree` refuses it.
        self.channel.request(OP_RESOLVE_BINDING, ask.clone())
    }

    fn admit(&self, proposal: &Value) -> Result<Admission, PeerError> {
        let answer = self.channel.request(OP_ADMIT, proposal.clone())?;
        if let Some(refused) = answer.get("refused") {
            return Ok(Admission::Refused(refusal_of(refused, OP_ADMIT)?));
        }
        if answer.get("admitted") != Some(&Value::Bool(true)) {
            return Err(PeerError::Malformed(
                "admit: neither admitted nor refused".into(),
            ));
        }
        Ok(Admission::Admitted {
            reservation_id: string_field(&answer, "reservationId", OP_ADMIT)?,
            case_id: string_field(&answer, "caseId", OP_ADMIT)?,
            seat_launch_ceiling: answer.get("seatLaunchCeiling").and_then(Value::as_u64),
        })
    }

    fn recheck_effect(
        &self,
        reservation_id: &str,
        case_id: &str,
        paths: &[String],
    ) -> Result<Recheck, PeerError> {
        let answer = self.channel.request(
            OP_RECHECK_EFFECT,
            json!({ "reservationId": reservation_id, "caseId": case_id, "paths": paths }),
        )?;
        // Any answer that does not refuse is consent, as Node reads it (`verdict?.refused`).
        match answer
            .get("refused")
            .filter(|r| crate::unit_run::start::truthy(r))
        {
            Some(refused) => {
                let r = refusal_of(refused, OP_RECHECK_EFFECT)?;
                Ok(Recheck::Refused {
                    code: r.code,
                    condition: r.condition,
                })
            }
            None => Ok(Recheck::Ok),
        }
    }

    fn settle(&self, reservation_id: &str, settle: &Value) -> Result<(), PeerError> {
        self.channel
            .request(
                OP_SETTLE,
                json!({ "reservationId": reservation_id, "settle": settle }),
            )
            .map(|_| ())
    }

    fn activity_unit_of(
        &self,
        main_root: &str,
        case_id: &str,
        activity: &str,
    ) -> Result<Option<Value>, PeerError> {
        let answer = self.channel.request(
            OP_ACTIVITY_UNIT_OF,
            json!({ "mainRoot": main_root, "caseId": case_id, "activity": activity }),
        )?;
        Ok(if answer.is_null() { None } else { Some(answer) })
    }

    fn confined_write_refusal(
        &self,
        main_root: &str,
        case_id: Option<&str>,
    ) -> Result<Option<String>, PeerError> {
        let answer = self.channel.request(
            OP_CONFINED_WRITE_REFUSAL,
            json!({ "mainRoot": main_root, "caseId": case_id }),
        )?;
        match answer {
            Value::Null => Ok(None),
            Value::String(reason) => Ok(Some(reason)),
            _ => Err(PeerError::Malformed(
                "confinedWriteRefusal: neither null nor a reason".into(),
            )),
        }
    }
}
