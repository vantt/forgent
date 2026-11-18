//! `fgos internal head-questions --run-dir <attemptDir>`: the one door through which a confined head writes to the
//! owner-question store. The head's request socket carries `questions ask|ack|cancel|answer` to the Node payload
//! (`runHeadRequest`), which calls this route and returns its one line unchanged.
//!
//! The request is one JSON document on stdin: `{ v: 1, verb, args }`. The route reads the attempt's envelope from the
//! run directory (written by the supervisor, read-only inside the sandbox) and takes the asker from it: the role
//! comes from `envelope.session.role`, the project from `envelope.cwd`, and the session, handle, roles and machine
//! from Identity as the holder of that role. The arguments never name a caller, so an `asker`, `role` or `by` key in
//! them has no effect. The answer is one line on stdout, `{ result: "done", data }` or `{ result: "error", code,
//! message }`, with exit status 0 or 70.
//!
//! `answer` is the secretary's alone: the route refuses it for any other head with `answer-not-owner`, whatever the
//! grant said, and records it with source `secretary`.

use std::io::Read;
use std::path::{Path, PathBuf};

use fgos_identity::directory::{self, NoTerminal};
use fgos_identity::machine_info;
use fgos_questions::caller::{Caller, CallerSource};
use fgos_questions::store::LogOpener;
use fgos_questions::Refusal;
use serde_json::{json, Value};

use super::questions::{
    self, Environment, HostLogOpener, QuestionsRequest, Verb, WRITE_SUBCOMMANDS,
};

pub const EXIT_DONE: i32 = 0;
pub const EXIT_ERROR: i32 = 70;
pub const EXIT_USAGE: i32 = 2;

const ENVELOPE_FILE: &str = "envelope.json";
const MAX_STDIN: u64 = 4 * 1024 * 1024;
const SECRETARY_PREFIX: &str = "head:secretary-";

/// The head's identity as its supervisor's envelope states it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HeadEnvelope {
    pub role: String,
    pub persona: Option<String>,
    pub cwd: PathBuf,
}

fn error(code: &str, message: impl Into<String>) -> (i32, Value) {
    (
        EXIT_ERROR,
        json!({ "result": "error", "code": code, "message": message.into() }),
    )
}

/// The envelope of an attempt directory; `envelope-invalid` when it is not a head's session attempt.
pub fn read_envelope(run_dir: &Path) -> Result<HeadEnvelope, Refusal> {
    let invalid = |detail: &str| Refusal::new("envelope-invalid", detail);
    let text = std::fs::read_to_string(run_dir.join(ENVELOPE_FILE))
        .map_err(|e| invalid(&format!("the envelope cannot be read: {e}")))?;
    let envelope: Value = serde_json::from_str(&text)
        .map_err(|e| invalid(&format!("the envelope is not JSON: {e}")))?;
    let role = envelope["session"]["role"]
        .as_str()
        .filter(|r| !r.is_empty());
    let cwd = envelope["cwd"].as_str().filter(|c| !c.is_empty());
    match (envelope["v"].as_u64(), role, cwd) {
        (Some(3), Some(role), Some(cwd)) => Ok(HeadEnvelope {
            role: role.to_owned(),
            persona: envelope["session"]["persona"]
                .as_str()
                .filter(|p| !p.is_empty())
                .map(str::to_owned),
            cwd: PathBuf::from(cwd),
        }),
        _ => Err(invalid("the envelope is not a session attempt")),
    }
}

/// The caller of a head's socket request: the session Identity shows holding the envelope's role. The supervisor has
/// already checked that this attempt's own session holds it, so the holder is the head that asked.
pub struct EnvelopeCaller {
    pub state_root: PathBuf,
    pub envelope: HeadEnvelope,
}

impl CallerSource for EnvelopeCaller {
    fn caller(&self) -> Result<Caller, Refusal> {
        let unresolved = |detail: String| Refusal::new("asker-unresolved", detail);
        let listed = directory::resolve(
            &self.state_root,
            &self.envelope.role,
            &fgos_process::facts::judge_here,
            None,
            &NoTerminal,
        )
        .map_err(|r| unresolved(format!("{}: {}", r.reason, r.detail)))?;
        if !listed.roles.contains(&self.envelope.role) {
            return Err(unresolved(format!(
                "no session holds {} in Identity",
                self.envelope.role
            )));
        }
        let machine = machine_info(&self.state_root)
            .map_err(|r| unresolved(format!("{}: {}", r.reason, r.detail)))?;
        Ok(Caller {
            session_id: listed.id,
            handle: listed.handle,
            roles: listed.roles,
            persona: self.envelope.persona.clone(),
            pane: None,
            machine: machine.id,
            // A head is an agent, and its answer is the secretary's through its socket (source `secretary`).
            is_agent: true,
        })
    }
}

fn text_arg(args: &Value, key: &str) -> Option<String> {
    args.get(key).and_then(Value::as_str).map(str::to_owned)
}

fn required_id(args: &Value) -> Result<String, Refusal> {
    text_arg(args, "id")
        .filter(|id| !id.is_empty())
        .ok_or_else(|| Refusal::new("bad-args", "id is required and must be a string"))
}

/// The call a request names, with only the fields its verb defines; any other key is dropped.
fn verb_of(
    envelope: &HeadEnvelope,
    verb: &str,
    args: &Value,
) -> Result<(Verb, Option<Vec<u8>>), Refusal> {
    if !args.is_object() {
        return Err(Refusal::new("bad-args", "args must be an object"));
    }
    match verb {
        "questions ask" => {
            let input = args.get("input").filter(|i| i.is_object()).ok_or_else(|| {
                Refusal::new("bad-args", "input is required and must be an object")
            })?;
            let stdin = serde_json::to_vec(input)
                .map_err(|e| Refusal::new("bad-args", format!("input: {e}")))?;
            Ok((
                Verb::Ask {
                    reference: text_arg(args, "ref"),
                    input: None,
                    migrated: args
                        .get("migrated")
                        .and_then(Value::as_bool)
                        .unwrap_or(false),
                    supersedes: text_arg(args, "supersedes"),
                },
                Some(stdin),
            ))
        }
        "questions ack" => Ok((
            Verb::Ack {
                id: required_id(args)?,
            },
            None,
        )),
        "questions cancel" => Ok((
            Verb::Cancel {
                id: required_id(args)?,
                reason: text_arg(args, "reason"),
            },
            None,
        )),
        "questions answer" => {
            if !envelope.role.starts_with(SECRETARY_PREFIX) {
                return Err(Refusal::new(
                    "answer-not-owner",
                    "only the secretary head answers a question through its socket",
                ));
            }
            Ok((
                Verb::Answer {
                    id: required_id(args)?,
                    option: text_arg(args, "option"),
                    text: text_arg(args, "text"),
                    source: Some("secretary".to_owned()),
                },
                None,
            ))
        }
        other => Err(Refusal::new(
            "unknown-verb",
            format!("unknown verb {other:?}"),
        )),
    }
}

/// One request of the head `envelope` describes, with the caller source and the log opener a test may replace.
pub fn serve(
    envelope: &HeadEnvelope,
    request: &Value,
    caller: &dyn CallerSource,
    opener: &dyn Fn(&str) -> Box<dyn LogOpener>,
) -> (i32, Value) {
    let verb = request["verb"].as_str().unwrap_or("");
    let args = request.get("args").cloned().unwrap_or(Value::Null);
    let (verb, stdin) = match verb_of(envelope, verb, &args) {
        Ok(parsed) => parsed,
        Err(r) => return error(&r.code, r.detail),
    };
    debug_assert!(WRITE_SUBCOMMANDS.contains(&verb.sub()));
    let asker = match caller.caller() {
        Ok(asker) => asker,
        Err(r) => return error(&r.code, r.detail),
    };
    let log = match opener(&asker.session_id).open(&envelope.cwd) {
        Ok(Some(log)) => log,
        Ok(None) => {
            return error(
                "event-store-no-repository",
                "there is no repository to hold the question store",
            )
        }
        Err(r) => return error(&r.code, r.detail),
    };
    let call = QuestionsRequest {
        root: envelope.cwd.clone(),
        verb,
        json: true,
        stdin,
    };
    let no_work = |_: &Path| Err("not read through a head".to_owned());
    let env = Environment {
        work: &no_work,
        now_ms: questions::now_ms(),
    };
    match questions::answer(&call, log.as_ref(), caller, &env) {
        Ok(done) => (EXIT_DONE, json!({ "result": "done", "data": done.data })),
        Err(refusal) => error(&code_of(&refusal.message), refusal.message),
    }
}

/// The stable code a refusal message carries in its last `[code]`; `internal` when it holds none (an Event Store failure the contract does not list).
fn code_of(message: &str) -> String {
    message
        .rsplit_once('[')
        .and_then(|(_, tail)| tail.strip_suffix(']'))
        .filter(|code| {
            code.chars().next().is_some_and(|c| c.is_ascii_lowercase())
                && code
                    .chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
        })
        .unwrap_or("internal")
        .to_owned()
}

/// The route: `--run-dir <dir>`, the request on stdin; returns the exit status after printing the one line.
pub fn main(args: &[String]) -> i32 {
    let run_dir = match args {
        [flag, dir] if flag == "--run-dir" && !dir.is_empty() => PathBuf::from(dir),
        _ => {
            eprintln!("usage: fgos internal head-questions --run-dir <attemptDir>");
            return EXIT_USAGE;
        }
    };
    let mut text = String::new();
    let read = std::io::stdin()
        .take(MAX_STDIN + 1)
        .read_to_string(&mut text);
    let (code, line) = match (read, serde_json::from_str::<Value>(&text)) {
        (Ok(_), Ok(request)) if text.len() as u64 <= MAX_STDIN => match read_envelope(&run_dir) {
            Ok(envelope) => {
                let caller = EnvelopeCaller {
                    state_root: fgos_holder_lock::state_root().0,
                    envelope: envelope.clone(),
                };
                serve(&envelope, &request, &caller, &|writer| {
                    Box::new(HostLogOpener::new(writer))
                })
            }
            Err(r) => error(&r.code, r.detail),
        },
        _ => error(
            "bad-frame",
            "the request is not one JSON document within the size limit",
        ),
    };
    println!("{line}");
    code
}
