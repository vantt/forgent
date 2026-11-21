//! `fgos internal execution <op> --protocol 1`: the long or effectful Execution operations a Node caller above the
//! Execution tier reaches through `src/native/execution-door.mjs`, one operation per process.
//!
//! The request is the first line of stdin, one JSON object. The answer is one framed line on stdout, behind
//! [`PREFIX`]: `{ v, protocol, op, result }`, or `{ v, protocol, op, error: { code, message } }` for anything that is
//! not an answer of the operation. Every other stdout line is either an admission peer frame (`run-unit` and
//! `custody` ask the caller's case admission port over this process's stdout and stdin, P13) or stray output, which
//! the caller never reads as an answer. The protocol is checked before the op.
//!
//! Ops (contract `packages/execution/contracts/execution-routes/execution-routes.v1.json`):
//!
//! * `run-unit`: `{ request, admission }`, `request` the `run-unit-request` document; `admission` says whether the
//!   caller serves a case admission port (it always serves the two events). The result is the `run-unit-result`
//!   document, an error result included: a run that refused is an answer, not a fault of the route.
//! * `launch-session`: what `launchSessionAttempt` is given (`{ binding, runnerConfig, key, role, grant, opening,
//!   ceilingMs, env?, projectRoot, beside?, display?, opts? }`): start a head session as a supervised terminal attempt
//!   and return once its supervisor bound it. Result `{ placement: { host, key }, runDir, attemptId }`; a launch
//!   refusal is an answer, `{ refused: { code, message, ...extra } }`.
//! * `custody`: `{ fgosDir, worktree, admit?, verify: { command, timeoutMs? } }`: the verify command run as the
//!   successor holder of the worktree's custody, admitted first through the peer when `admit` names a proposal
//!   (`runUnderCustody` around `port.admit` and `runVerify`, `src/workflow/case-gate.mjs:84`). A refused admission
//!   runs nothing. Result `{ admission?, verified?, warnings? }`.
//! * `verify`: `{ command, cwd, timeoutMs? }`: the verify command without custody (`runVerify`). Result `verified`.
//! * `sweep-attempts`: `{ assignmentsRoot }`: adopt every open attempt there, then remove the orphan attempt
//!   sockets (`sweepAttempts`). Result `{ adopt, adoptError }`.
//! * `cancel`: `{ runDir, signal }`: publish the attempt's cancel request (`requestCancel`). Result
//!   `{ requested }`.
//!
//! A `run-unit` process is the unit run's controller for its caller, which keeps stdin open until it read the
//! answer. Once the request arrived, end of stdin means the caller is gone: the process ends at once, as the
//! controller inside a dead Node caller did. Nothing is settled; the supervisor and its agent go on, and the next
//! caller resumes the unit run or the Workflow's dead-reservation sweep decides it.

use std::ffi::OsString;
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use fgos_execution::admission::{Admission, CaseAdmission, Recheck};
use fgos_execution_engine::unit_run::peer::{
    PeerAdmission, PeerChannel, DEFAULT_DEADLINE, OP_ADMIT,
};
use fgos_execution_engine::unit_run::run_unit_contract::{ok_result, RunUnitError};
use fgos_execution_engine::unit_run::verify::{Verdict, Verified};
use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue};
use fgos_run_supervisor::controller::launch::AttemptHost;
use serde_json::{json, Value};

use super::unit_run_host::host::HostUnitRun;
use super::unit_run_host::{machine, verify};

/// The protocol this route speaks.
pub const PROTOCOL: u64 = 1;
/// The prefix of the answer line; any other line on stdout is a peer frame or stray output.
pub const PREFIX: &str = "\u{1e}FGOS-EXECUTION ";
pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
/// The request on stdin is not valid JSON or does not match the contract.
pub const EXIT_INVALID_REQUEST: i32 = 65;

/// The operations this route serves, in the contract's order.
pub const OPS: [&str; 6] = [
    "run-unit",
    "launch-session",
    "custody",
    "verify",
    "sweep-attempts",
    "cancel",
];

/// Run the route with the args after `execution`; returns the exit code.
pub fn main(args: &[String]) -> i32 {
    let stdin = BufReader::new(std::io::stdin());
    let input: Box<dyn BufRead + Send> = if args.first().map(String::as_str) == Some("run-unit") {
        Box::new(CallerLine::new(stdin, Box::new(caller_gone)))
    } else {
        Box::new(stdin)
    };
    let (code, line) = run(args, input, Box::new(std::io::stdout()));
    let mut out = std::io::stdout().lock();
    let _ = out.write_all(frame(&line).as_bytes());
    let _ = out.flush();
    code
}

/// The exit of a `run-unit` controller whose caller went away: no answer can reach anyone, nothing is settled.
/// It ends the process at once, without the exit handlers (a dead controller runs none either), so a caller that
/// resumes the unit run right after finds no controller left. It writes nothing: no one reads this process any
/// more, and another thread may hold the stderr lock.
fn caller_gone() {
    #[cfg(unix)]
    // SAFETY: `_exit` ends the process; nothing after it runs.
    unsafe {
        libc::_exit(1)
    };
    #[cfg(not(unix))]
    std::process::exit(1);
}

/// The caller's stdin of a `run-unit` process: after the first line (the request) has arrived, end of input calls
/// `gone`, because the caller only closes stdin once it has the answer or is dead.
struct CallerLine<R> {
    inner: R,
    seen_line: bool,
    gone: Box<dyn FnMut() + Send>,
}

impl<R: BufRead> CallerLine<R> {
    fn new(inner: R, gone: Box<dyn FnMut() + Send>) -> Self {
        Self {
            inner,
            seen_line: false,
            gone,
        }
    }
}

impl<R: BufRead> Read for CallerLine<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let available = self.fill_buf()?;
        let n = available.len().min(buf.len());
        buf[..n].copy_from_slice(&available[..n]);
        self.consume(n);
        Ok(n)
    }
}

impl<R: BufRead> BufRead for CallerLine<R> {
    fn fill_buf(&mut self) -> std::io::Result<&[u8]> {
        let empty = self.inner.fill_buf()?.is_empty();
        if empty && self.seen_line {
            (self.gone)();
        }
        let buf = self.inner.fill_buf()?;
        if buf.contains(&b'\n') {
            self.seen_line = true;
        }
        Ok(buf)
    }

    fn consume(&mut self, amount: usize) {
        self.inner.consume(amount);
    }
}

/// The framed answer line.
pub fn frame(line: &Value) -> String {
    format!("{PREFIX}{line}\n")
}

/// The route without a process around it: the request is the first line `input` carries; the rest of `input` and
/// `output` become the channel to the caller's admission port when the op asks it. Returns the exit code and the
/// answer line, which the caller frames.
pub fn run(
    args: &[String],
    mut input: Box<dyn BufRead + Send>,
    output: Box<dyn Write + Send>,
) -> (i32, Value) {
    let parsed = match parse_args(&args.iter().map(OsString::from).collect::<Vec<_>>()) {
        Ok(parsed) => parsed,
        Err(err) => return error("", "usage", &err.to_string(), EXIT_USAGE),
    };
    let op = parsed.positional.first().map(String::as_str).unwrap_or("");
    if let Some(extra) = parsed.positional.get(1) {
        return error(
            op,
            "usage",
            &format!("unknown argument {extra}"),
            EXIT_USAGE,
        );
    }
    if let Some((name, _)) = parsed.flags.iter().find(|(name, _)| name != "protocol") {
        return error(
            op,
            "usage",
            &format!("unknown argument --{name}"),
            EXIT_USAGE,
        );
    }
    let protocol = match parsed.flag("protocol") {
        None => None,
        Some(FlagValue::One(FlagScalar::Str(value))) => Some(value.as_str()),
        Some(_) => return error(op, "usage", "--protocol needs a value", EXIT_USAGE),
    };
    if protocol != Some(PROTOCOL.to_string().as_str()) {
        return error(
            op,
            "host-version-mismatch",
            &format!("needs --protocol {PROTOCOL}"),
            EXIT_VERSION_MISMATCH,
        );
    }
    if !OPS.contains(&op) {
        return error(
            op,
            "usage",
            &format!("unknown op \"{op}\"; one of {}", OPS.join(", ")),
            EXIT_USAGE,
        );
    }
    let mut first = String::new();
    // A missing or unreadable stdin is an empty request, refused below.
    let _ = input.read_line(&mut first);
    let request: Value = match serde_json::from_str(first.trim()) {
        Ok(Value::Object(map)) => Value::Object(map),
        Ok(_) => return invalid(op, "the request is not a JSON object"),
        Err(err) => return invalid(op, &format!("the request is not JSON: {err}")),
    };
    let peer = move || PeerChannel::with_deadline(input, output, DEFAULT_DEADLINE);
    let answered = match op {
        "run-unit" => run_unit(&request, peer),
        "launch-session" => launch_session(&request),
        "custody" => custody(&request, peer),
        "verify" => verify_op(&request),
        "sweep-attempts" => sweep_attempts(&request),
        _ => cancel(&request),
    };
    match answered {
        Ok(result) => (0, answer(op, json!({ "result": result }))),
        Err(message) => invalid(op, &message),
    }
}

fn answer(op: &str, body: Value) -> Value {
    let mut line = json!({ "v": PROTOCOL, "protocol": PROTOCOL, "op": op });
    if let (Some(line), Value::Object(body)) = (line.as_object_mut(), body) {
        line.extend(body);
    }
    line
}

fn error(op: &str, code: &str, message: &str, exit: i32) -> (i32, Value) {
    (
        exit,
        answer(op, json!({ "error": { "code": code, "message": message } })),
    )
}

fn invalid(op: &str, message: &str) -> (i32, Value) {
    error(op, "invalid-request", message, EXIT_INVALID_REQUEST)
}

fn text<'a>(request: &'a Value, key: &str) -> Result<&'a str, String> {
    request
        .get(key)
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| format!("{key} must be a non-empty string"))
}

fn timeout_ms(request: &Value) -> Result<Option<u64>, String> {
    match request.get("timeoutMs") {
        None | Some(Value::Null) => Ok(None),
        Some(value) => value
            .as_u64()
            .map(Some)
            .ok_or_else(|| "timeoutMs must be a whole number of milliseconds".to_string()),
    }
}

/// One port shared by a unit run's host and the other askers of the same port (the run's two events, the
/// request `fgos run` builds before the run exists).
pub struct SharedPort<P>(pub Arc<P>);

impl<P: CaseAdmission> CaseAdmission for SharedPort<P> {
    type Error = P::Error;
    fn resolve_binding(&self, ask: &Value) -> Result<Value, P::Error> {
        self.0.resolve_binding(ask)
    }
    fn admit(&self, proposal: &Value) -> Result<Admission, P::Error> {
        self.0.admit(proposal)
    }
    fn recheck_effect(
        &self,
        reservation_id: &str,
        case_id: &str,
        paths: &[String],
    ) -> Result<Recheck, P::Error> {
        self.0.recheck_effect(reservation_id, case_id, paths)
    }
    fn settle(&self, reservation_id: &str, settle: &Value) -> Result<(), P::Error> {
        self.0.settle(reservation_id, settle)
    }
    fn activity_unit_of(
        &self,
        main_root: &str,
        case_id: &str,
        activity: &str,
    ) -> Result<Option<Value>, P::Error> {
        self.0.activity_unit_of(main_root, case_id, activity)
    }
    fn confined_write_refusal(
        &self,
        main_root: &str,
        case_id: Option<&str>,
    ) -> Result<Option<String>, P::Error> {
        self.0.confined_write_refusal(main_root, case_id)
    }
}

/// The machine a unit run started by this process launches its attempts with: this host binary and the payload of
/// the release it belongs to.
pub fn attempt_host() -> Result<AttemptHost, String> {
    let host_bin =
        std::env::current_exe().map_err(|e| format!("the host binary cannot be named: {e}"))?;
    let payload_root = crate::active_payload_root()?;
    Ok(AttemptHost {
        host_bin: host_bin.to_string_lossy().into_owned(),
        payload_root: payload_root.to_string_lossy().into_owned(),
    })
}

/// The composed host of one unit run this process starts over `admission`: the session and the provider capacity
/// runtime directory `options` names, attempts launched with this host binary and its payload. Every caller that
/// runs a unit in this process (the `run-unit` op, `fgos run`) builds its host here.
pub fn unit_run_host<A: CaseAdmission>(
    options: &Value,
    admission: Option<A>,
) -> Result<HostUnitRun<A>, String> {
    let attempt_host = attempt_host()?;
    let session = options.get("session").cloned().unwrap_or_else(|| json!({}));
    let mut host = HostUnitRun::new(admission, session, attempt_host);
    host.runtime_dir = options
        .get("providerCapacityRuntimeDir")
        .and_then(Value::as_str)
        .map(PathBuf::from);
    Ok(host)
}

/// A unit run over `peer`, the caller's admission port when `admission` says it serves one; the two events always
/// reach the caller. Returns the `run-unit-result` document.
pub fn run_unit_over(options: &Value, peer: PeerChannel, admission: bool) -> Value {
    let shared = Arc::new(PeerAdmission::new(peer));
    let mut host = match unit_run_host(options, admission.then(|| SharedPort(Arc::clone(&shared))))
    {
        Ok(host) => host,
        Err(message) => return RunUnitError::other("error", message).to_json(),
    };
    let created = Arc::clone(&shared);
    host.on_unit_run_created = Some(Box::new(move |unit_run_id, _| {
        let _ = created.channel().unit_run_created(unit_run_id);
    }));
    let admitted = Arc::clone(&shared);
    host.on_case_admitted = Some(Box::new(move |case_id, reservation_id| {
        let _ = admitted.channel().case_admitted(case_id, reservation_id);
    }));
    match host.run_unit(options) {
        Ok(result) => ok_result(result),
        Err(error) => error.to_json(),
    }
}

fn run_unit(request: &Value, peer: impl FnOnce() -> PeerChannel) -> Result<Value, String> {
    let document = request
        .get("request")
        .ok_or("request must carry the run-unit-request document")?;
    let options = document
        .get("options")
        .and_then(Value::as_object)
        .ok_or("request.options must be an object")?;
    // Only the contract's options cross: an unknown one is refused by name.
    let checked = fgos_execution_engine::unit_run::run_unit_contract::request(options)?;
    let admission = request
        .get("admission")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    Ok(run_unit_over(&checked["options"], peer(), admission))
}

fn launch_session(request: &Value) -> Result<Value, String> {
    use super::unit_run_host::session_attempt::{self, SessionRequest};
    let request = SessionRequest::from_json(request)?;
    let launched = attempt_host()
        .map_err(|message| {
            fgos_execution_engine::transport_round::session_attempt::SessionLaunchError::new(
                "error", message,
            )
        })
        .and_then(|host| session_attempt::launch_session(&request, host, None));
    Ok(session_attempt::launched_json(launched))
}

/// Node's `runVerify` answer: `verdict` or `infrastructure`, and the facts of the run.
pub fn verified_json(verified: &Verified) -> Value {
    let mut out = json!({
        "status": verified.status,
        "how": verified.how,
        "tail": verified.tail,
        "durationMs": verified.duration_ms,
        "outputDigest": verified.output_digest,
    });
    match &verified.verdict {
        Verdict::Pass => out["verdict"] = json!("pass"),
        Verdict::Findings => out["verdict"] = json!("findings"),
        Verdict::Infrastructure(kind) => out["infrastructure"] = json!(kind),
    }
    out
}

fn custody(request: &Value, peer: impl FnOnce() -> PeerChannel) -> Result<Value, String> {
    let fgos_dir = PathBuf::from(text(request, "fgosDir")?);
    let worktree = PathBuf::from(text(request, "worktree")?);
    let ask = request.get("verify").ok_or("verify must be an object")?;
    let command = text(ask, "command")?.to_string();
    let timeout = timeout_ms(ask)?;
    let proposal = request.get("admit").filter(|p| !p.is_null()).cloned();
    let channel = proposal.as_ref().map(|_| peer());
    let ran = fgos_execution_engine::unit_run::custody::run_under_custody(
        &worktree,
        &fgos_dir,
        |custody| {
            let mut out = json!({});
            if let (Some(proposal), Some(channel)) = (&proposal, &channel) {
                match channel.request(OP_ADMIT, proposal.clone()) {
                    Ok(answer) => {
                        let refused = answer.get("refused").is_some_and(|r| !r.is_null());
                        out["admission"] = answer;
                        if refused {
                            return out;
                        }
                    }
                    Err(err) => {
                        out["admissionError"] =
                            json!({ "code": err.code(), "message": err.to_string() });
                        return out;
                    }
                }
            }
            let verified = verify::verify(&command, &worktree, timeout, Some(custody));
            out["verified"] = verified_json(&verified);
            out
        },
    );
    Ok(ran.unwrap_or_else(|e| json!({ "custodyError": { "code": e.code, "message": e.message } })))
}

fn verify_op(request: &Value) -> Result<Value, String> {
    let command = text(request, "command")?;
    let cwd = text(request, "cwd")?;
    let verified = verify::verify(command, Path::new(cwd), timeout_ms(request)?, None);
    Ok(json!({ "verified": verified_json(&verified) }))
}

fn sweep_attempts(request: &Value) -> Result<Value, String> {
    let root = PathBuf::from(text(request, "assignmentsRoot")?);
    let swept = machine::sweep_attempts(&root);
    let adopt = swept.adopt.map(|verdicts| {
        verdicts
            .iter()
            .map(|(dir, verdict)| verdict.line(dir))
            .collect::<Vec<_>>()
    });
    Ok(json!({ "adopt": adopt, "adoptError": swept.adopt_error }))
}

fn cancel(request: &Value) -> Result<Value, String> {
    let run_dir = text(request, "runDir")?;
    let signal = text(request, "signal")?;
    let requested =
        fgos_run_supervisor::controller::cancel::request_cancel(Path::new(run_dir), signal);
    Ok(json!({ "requested": requested }))
}

#[cfg(test)]
mod caller_line_tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    #[test]
    fn end_of_input_after_the_request_line_means_the_caller_is_gone_and_before_it_does_not() {
        static GONE: AtomicUsize = AtomicUsize::new(0);
        let mut empty = CallerLine::new(
            &b""[..],
            Box::new(|| {
                GONE.fetch_add(1, Ordering::SeqCst);
            }),
        );
        let mut line = String::new();
        assert_eq!(empty.read_line(&mut line).unwrap(), 0);
        assert_eq!(
            GONE.load(Ordering::SeqCst),
            0,
            "no request yet: an empty stdin is the route's to refuse"
        );
        let mut caller = CallerLine::new(
            &b"{}\n"[..],
            Box::new(|| {
                GONE.fetch_add(1, Ordering::SeqCst);
            }),
        );
        assert_eq!(caller.read_line(&mut line).unwrap(), 3);
        assert_eq!(GONE.load(Ordering::SeqCst), 0);
        let _ = caller.read_line(&mut line);
        assert_eq!(
            GONE.load(Ordering::SeqCst),
            1,
            "the request arrived, then stdin ended"
        );
    }
}
