//! `fgos hook session-rotation --event <stop|session-start>`: the rotation hook of a head session, served natively
//! before the composition root (the route table's `native_subcommands` of `hook`).
//!
//! The hook only measures, decides and asks. Identity moves roles and the rotation executor rotates; the hook
//! reaches them through the head request socket of its own supervisor (`session answered` for a successor's first
//! answer, `session rotate` for a full context). It does nothing unless `FGOS_HEAD_ROLE` is set (the role is never
//! parsed: the persona and name come from `FGOS_HEAD_PERSONA` and `FGOS_HEAD_NAME`, declared by the session start
//! door), never blocks, prints nothing to the conversation except the session start's one `additionalContext`
//! object, and ends with status 0 on every path. A failure leaves one line on stderr, which Claude Code does not
//! show the model. Files read: `packages/session-host/contracts/rotation-files.v1.json`.
use super::mailbox_config::effective_config;
use super::mailbox_identity::state_root;
use fgos_distribution::shim::project_shim_path;
use fgos_run_supervisor::head_client::{
    request_head_waiting, ClientError, RotationWait, REPLY_TIMEOUT,
};
use fgos_session_host::rotation::decide::{decide, AtRest, RotationConfig};
use fgos_session_host::rotation::handoff::{
    awaits_answer, lineage_dir, read_latest, rotation_id_of, session_start_context, CONTEXT_LIMIT,
};
use fgos_session_host::rotation::measure::{measure, Source, Sources, FRESH_WAIT};
use serde_json::{json, Value};
use std::ffi::OsString;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const MAX_STDIN: u64 = 4 * 1024 * 1024;
const MAX_TEXT: usize = 8000;
const MAX_PORTFOLIO: usize = 50;
const MAX_PATH_CHARS: usize = 300;
const SIDECAR_FILE: &str = "context-sidecar.jsonl";
/// The reason of a stop that measured below soft: the host records it and rotates nothing.
const NO_ROTATION_REASON: &str = "none";

/// Runs one hook call and ends the process with status 0.
pub fn main(args: &[OsString]) -> ! {
    let _ = std::panic::catch_unwind(|| run(args));
    std::process::exit(0)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Event {
    Stop,
    SessionStart,
}

/// `--event <stop|session-start>`, once, nothing else.
fn parse(args: &[OsString]) -> Option<Event> {
    match args {
        [flag, value] if flag == "--event" => match value.to_str()? {
            "stop" => Some(Event::Stop),
            "session-start" => Some(Event::SessionStart),
            _ => None,
        },
        _ => None,
    }
}

/// The head the call runs in, from the environment the session start door declared.
#[derive(Debug, Clone, PartialEq, Eq)]
struct Head {
    persona: String,
    name: String,
    gen: Option<u64>,
    socket: Option<PathBuf>,
}

fn head_from_env(get: &dyn Fn(&str) -> Option<String>) -> Option<Head> {
    let set = |key: &str| get(key).filter(|v| !v.is_empty());
    set("FGOS_HEAD_ROLE")?;
    Some(Head {
        persona: set("FGOS_HEAD_PERSONA")?,
        name: set("FGOS_HEAD_NAME")?,
        gen: set("FGOS_HEAD_GEN").and_then(|g| g.parse().ok()),
        socket: set("FGOS_HEAD_REQUEST_SOCKET").map(PathBuf::from),
    })
}

/// What a stop needs from outside the files: the verb door, the session's Identity id, the config.
struct Ports<'a> {
    ask: &'a dyn Fn(&str, &Value) -> Result<Value, ClientError>,
    session_id: &'a dyn Fn() -> Option<String>,
    config: &'a dyn Fn() -> Result<RotationConfig, String>,
    now_ms: u64,
    wait: Duration,
}

/// `text` cut to at most `MAX_TEXT` UTF-16 units, the bound the verbs state.
fn bounded(text: &str) -> String {
    let mut units = 0;
    text.chars()
        .take_while(|c| {
            units += c.len_utf16();
            units <= MAX_TEXT
        })
        .collect()
}

fn payload_str<'a>(payload: &'a Value, key: &str) -> Option<&'a str> {
    payload
        .get(key)
        .and_then(Value::as_str)
        .filter(|s| !s.trim().is_empty())
}

fn count(payload: &Value, key: &str) -> usize {
    payload
        .get(key)
        .and_then(Value::as_array)
        .map_or(0, Vec::len)
}

struct StopError {
    code: String,
    detail: String,
    message: String,
}

impl StopError {
    fn new(code: &str, detail: impl ToString) -> Self {
        let detail = detail.to_string();
        Self {
            code: code.into(),
            message: detail.clone(),
            detail,
        }
    }

    fn from_client(e: ClientError, verb: &str) -> Self {
        let message = format!("{verb}: {e}");
        let detail = e.detail.or(e.message).unwrap_or_else(|| e.code.clone());
        let mut error = Self::new(&e.code, detail);
        error.message = message;
        error
    }
}

fn record_incident(lineage: &Path, code: &str, detail: &str) {
    let file = lineage.join("incidents.jsonl");
    let at = fgos_host_runtime::civil_time::format_system_time_utc(SystemTime::now());
    let detail_bounded: String = detail.chars().take(300).collect();
    let line = json!({
        "at": at,
        "event": "stop-failed",
        "code": code,
        "detail": detail_bounded,
    });
    let _ = std::fs::create_dir_all(lineage);
    let _ = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file)
        .and_then(|mut f| {
            use std::io::Write;
            writeln!(f, "{line}")
        });
}

/// A stop: a successor whose generation the pending rotation waits for answers it; any other stop measures,
/// decides and, on soft or hard, asks for the rotation. A stop that answered does not also measure.
fn stop(head: &Head, fgos_dir: &Path, payload: &Value, ports: &Ports) -> Result<(), String> {
    let lineage = lineage_dir(fgos_dir, &head.persona, &head.name).map_err(|e| e.to_string())?;
    match stop_inner(head, &lineage, payload, ports) {
        Ok(()) => Ok(()),
        Err(err) => {
            record_incident(&lineage, &err.code, &err.detail);
            Err(err.message)
        }
    }
}

fn stop_inner(
    head: &Head,
    lineage: &Path,
    payload: &Value,
    ports: &Ports,
) -> Result<(), StopError> {
    if let Some(gen) = head.gen {
        if awaits_answer(lineage, gen).map_err(|e| StopError::new("awaits-answer-error", e))? {
            return answer(head, lineage, payload, ports);
        }
    }
    let config = (ports.config)().map_err(|e| StopError::new("config-error", e))?;
    let thresholds = config
        .thresholds_for(&head.persona)
        .map_err(|e| StopError::new("thresholds-error", e))?;
    let sidecar = lineage.join(SIDECAR_FILE);
    let transcript = payload_str(payload, "transcript_path").map(PathBuf::from);
    let session = payload_str(payload, "session_id");
    let measured = measure(
        &Sources {
            sidecar: Some(&sidecar),
            transcript: transcript.as_deref(),
            session_id: session,
            after_ms: ports.now_ms,
            window_size: config.window_size,
        },
        ports.wait,
    );
    let rest = AtRest {
        pending_question: false,
        background_tasks: count(payload, "background_tasks"),
        session_crons: count(payload, "session_crons"),
    };
    let decision = decide(measured.as_ref().map(|m| m.fraction), thresholds, rest);
    // Every stop asks, so the host sees and records each decision; below soft the host starts nothing.
    let reason = decision.rotate.reason().unwrap_or(NO_ROTATION_REASON);
    let measure = json!({
        "fraction": measured.as_ref().map(|m| m.fraction),
        "source": measured.as_ref().map(|m| match m.source { Source::Sidecar => "sidecar", Source::Transcript => "transcript" }),
        "stale": measured.as_ref().is_some_and(|m| m.stale),
        "decision": decision.reason,
    });
    if reason == NO_ROTATION_REASON {
        return (ports.ask)(
            "session rotate",
            &json!({ "persona": head.persona, "name": head.name, "reason": reason, "measure": measure }),
        )
        .map(|_| ())
        .map_err(|e| StopError::from_client(e, "session rotate"));
    }
    let portfolio: Vec<&String> = config
        .reload_of(&head.persona)
        .iter()
        .filter(|p| !p.is_empty() && p.chars().count() <= MAX_PATH_CHARS)
        .take(MAX_PORTFOLIO)
        .collect();
    let mut facts = json!({ "portfolio": portfolio });
    if let Some(id) = session {
        facts["sessionId"] = json!(bounded(id));
    }
    if let Some(message) = payload_str(payload, "last_assistant_message") {
        facts["lastAssistantMessage"] = json!(bounded(message));
    }
    let args = json!({ "persona": head.persona, "name": head.name, "reason": reason, "stopFacts": facts, "measure": measure });
    (ports.ask)("session rotate", &args)
        .map(|_| ())
        .map_err(|e| StopError::from_client(e, "session rotate"))
}

/// The successor's first answer: its session id, the rotation id read from its own handoff, and its first message.
fn answer(head: &Head, lineage: &Path, payload: &Value, ports: &Ports) -> Result<(), StopError> {
    // No message yet: this stop was not an answer; the next one is.
    let Some(message) = payload_str(payload, "last_assistant_message") else {
        return Ok(());
    };
    let latest = read_latest(lineage)
        .map_err(|e| StopError::new("handoff-read-error", e))?
        .ok_or_else(|| {
            StopError::new(
                "no-handoff",
                "the successor has no handoff to read the rotation id from",
            )
        })?;
    let rotation_id = rotation_id_of(&latest.text)
        .ok_or_else(|| StopError::new("no-rotation-id", "the handoff carries no rotation id"))?;
    let session_id = (ports.session_id)()
        .ok_or_else(|| StopError::new("no-session-id", "this session has no Identity id"))?;
    let args = json!({ "persona": head.persona, "name": head.name, "sessionId": session_id, "rotationId": rotation_id, "message": bounded(message) });
    (ports.ask)("session answered", &args)
        .map(|_| ())
        .map_err(|e| StopError::from_client(e, "session answered"))
}

/// A session start: the latest handoff of the lineage as the one `additionalContext` object, or nothing.
fn session_start(head: &Head, fgos_dir: &Path) -> Result<Option<String>, String> {
    let lineage = lineage_dir(fgos_dir, &head.persona, &head.name).map_err(|e| e.to_string())?;
    let Some(latest) = read_latest(&lineage).map_err(|e| e.to_string())? else {
        return Ok(None);
    };
    let mut context = session_start_context(&latest, fgos_dir.parent());
    let should_append = match head.gen {
        Some(gen) => awaits_answer(&lineage, gen).map_err(|e| e.to_string())?,
        None => false,
    };
    if should_append {
        let root = fgos_dir.parent().unwrap_or(Path::new(""));
        let bin = project_shim_path(root);
        let instruction = format!(
            "A rotation is waiting for this session's first answer; right after the start ritual's one line, in this same turn, answer by running printf '%s' '{{\"last_assistant_message\":\"<that line, with no quote characters>\"}}' | \"{}\" hook session-rotation --event stop ; use the installed path, not the fgos shell function; role-gated verbs wait until the role moves.",
            bin.display()
        );
        let sep = if context.is_empty() || context.ends_with("\n\n") {
            ""
        } else if context.ends_with('\n') {
            "\n"
        } else {
            "\n\n"
        };
        let addition = format!("{sep}{instruction}");
        if context.chars().count() + addition.chars().count() > CONTEXT_LIMIT {
            let room = CONTEXT_LIMIT.saturating_sub(addition.chars().count());
            let mut trimmed: String = context.chars().take(room).collect();
            trimmed.push_str(&addition);
            context = trimmed;
        } else {
            context.push_str(&addition);
        }
    }
    Ok(Some(
        json!({ "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": context } })
            .to_string(),
    ))
}

/// `<project>/.fgos` of the directory the head was started in: Claude Code's project directory when it names a
/// directory (its hook cwd follows the model's `cd`), else the cwd. That is the `projectRoot` the session start door
/// recorded the lineage under, which is not always the main checkout (a head started in a linked worktree).
fn fgos_dir_of(claude_project_dir: Option<&std::ffi::OsStr>, cwd: &Path) -> Option<PathBuf> {
    let start = claude_project_dir
        .filter(|d| !d.is_empty())
        .map(Path::new)
        .filter(|d| d.is_dir())
        .unwrap_or(cwd);
    Some(start.join(".fgos")).filter(|dir| dir.is_dir())
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| u64::try_from(d.as_millis()).unwrap_or(u64::MAX))
}

fn run(args: &[OsString]) {
    let Some(event) = parse(args) else { return };
    let Some(head) = head_from_env(&|key| std::env::var(key).ok()) else {
        return;
    };
    let fail = |why: String| eprintln!("fgos hook session-rotation: {why}");
    let Ok(cwd) = std::env::current_dir() else {
        return;
    };
    let Some(fgos_dir) = fgos_dir_of(std::env::var_os("CLAUDE_PROJECT_DIR").as_deref(), &cwd)
    else {
        return fail("the project has no .fgos directory".into());
    };
    match event {
        Event::SessionStart => match session_start(&head, &fgos_dir) {
            Ok(Some(out)) => println!("{out}"),
            Ok(None) => {}
            Err(why) => fail(why),
        },
        Event::Stop => {
            let mut text = String::new();
            let _ = std::io::stdin().take(MAX_STDIN).read_to_string(&mut text);
            let payload: Value = serde_json::from_str(&text).unwrap_or(Value::Null);
            let ask = |verb: &str, args: &Value| {
                let socket = head.socket.as_deref().ok_or_else(|| ClientError {
                    code: "no-request-socket".into(),
                    detail: None,
                    message: None,
                })?;
                let id = format!("hook-{}-{}", std::process::id(), now_ms());
                // The stop hook answers at once: it never waits out a rotation hand-over.
                request_head_waiting(socket, verb, args, &id, REPLY_TIMEOUT, RotationWait::NONE)
            };
            let session_id = || {
                let root = state_root()?;
                fgos_identity::current_session(&root, std::process::id())
                    .ok()
                    .map(|s| s.info.id)
            };
            let config = || {
                let snapshot = effective_config(&fgos_dir).map_err(|e| e.detail())?;
                RotationConfig::from_section(
                    snapshot.get("sessionRotation").unwrap_or(&Value::Null),
                )
                .map_err(|e| e.to_string())
            };
            let ports = Ports {
                ask: &ask,
                session_id: &session_id,
                config: &config,
                now_ms: now_ms(),
                wait: FRESH_WAIT,
            };
            if let Err(why) = stop(&head, &fgos_dir, &payload, &ports) {
                fail(why);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    fn env(pairs: &[(&str, &str)]) -> impl Fn(&str) -> Option<String> {
        let map: Vec<(String, String)> = pairs
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect();
        move |key| map.iter().find(|(k, _)| k == key).map(|(_, v)| v.clone())
    }

    fn head(gen: Option<u64>) -> Head {
        Head {
            persona: "secretary".into(),
            name: "miu".into(),
            gen,
            socket: None,
        }
    }

    fn fgos(tag: &str) -> (PathBuf, PathBuf) {
        let root = std::env::temp_dir().join(format!("srh-{}-{tag}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let fgos_dir = root.join(".fgos");
        let lineage = lineage_dir(&fgos_dir, "secretary", "miu").unwrap();
        std::fs::create_dir_all(&lineage).unwrap();
        (fgos_dir, lineage)
    }

    fn transcript(dir: &Path, tokens: u64) -> PathBuf {
        let f = dir.join("t.jsonl");
        let line = json!({ "type": "assistant", "message": { "id": "m", "usage": { "input_tokens": tokens } } });
        std::fs::write(&f, format!("{line}\n")).unwrap();
        f
    }

    fn config() -> Result<RotationConfig, String> {
        RotationConfig::from_section(&json!({ "soft": 0.4, "hard": 0.7, "windowSize": 1000, "personas": { "secretary": { "reload": ["plans/a.md"] } } })).map_err(|e| e.to_string())
    }

    #[test]
    fn the_shipped_standard_rotates_the_secretary_and_supervisor_at_a_lower_soft_than_every_other_persona(
    ) {
        let (schemas, _) = fgos_config::schema::Schemas::bundled().unwrap();
        let standard = fgos_config::standard::Standard::bundled(&schemas).unwrap();
        let config =
            RotationConfig::from_section(standard.value().get("sessionRotation").unwrap()).unwrap();
        for persona in ["secretary", "supervisor"] {
            let t = config.thresholds_for(persona).unwrap();
            assert_eq!((t.soft, t.hard), (0.15, 0.7), "{persona}");
        }
        let t = config.thresholds_for("planner").unwrap();
        assert_eq!((t.soft, t.hard), (0.4, 0.7));
    }

    /// Runs one stop with a recording verb door; returns the calls and the result.
    fn run_stop(
        head: &Head,
        fgos_dir: &Path,
        payload: Value,
        reply: Result<Value, ClientError>,
    ) -> (Vec<(String, Value)>, Result<(), String>) {
        let calls = RefCell::new(Vec::new());
        let ask = |verb: &str, args: &Value| {
            calls.borrow_mut().push((verb.to_string(), args.clone()));
            reply.clone()
        };
        let session_id = || Some("m1/claude-x".to_string());
        let ports = Ports {
            ask: &ask,
            session_id: &session_id,
            config: &config,
            now_ms: 0,
            wait: Duration::ZERO,
        };
        let result = stop(head, fgos_dir, &payload, &ports);
        (calls.into_inner(), result)
    }

    #[test]
    fn the_hook_does_nothing_without_a_head_role_and_takes_persona_and_name_from_their_own_variables(
    ) {
        assert_eq!(
            head_from_env(&env(&[("FGOS_HEAD_PERSONA", "p"), ("FGOS_HEAD_NAME", "n")])),
            None
        );
        assert_eq!(
            head_from_env(&env(&[
                ("FGOS_HEAD_ROLE", "head:a-b-c"),
                ("FGOS_HEAD_PERSONA", "a-b"),
                ("FGOS_HEAD_NAME", "c"),
                ("FGOS_HEAD_GEN", "2"),
                ("FGOS_HEAD_REQUEST_SOCKET", "/s")
            ])),
            Some(Head {
                persona: "a-b".into(),
                name: "c".into(),
                gen: Some(2),
                socket: Some("/s".into())
            })
        );
        assert_eq!(head_from_env(&env(&[("FGOS_HEAD_ROLE", "head:a-b")])), None);
    }

    #[test]
    fn the_lineage_root_is_the_project_directory_the_head_started_in_not_the_main_checkout() {
        let (fgos_dir, _) = fgos("root");
        let project = fgos_dir.parent().unwrap();
        let elsewhere = std::env::temp_dir();
        assert_eq!(
            fgos_dir_of(Some(project.as_os_str()), &elsewhere),
            Some(fgos_dir.clone())
        );
        assert_eq!(fgos_dir_of(None, project), Some(fgos_dir.clone()));
        assert_eq!(
            fgos_dir_of(Some(std::ffi::OsStr::new("/no/such/dir")), project),
            Some(fgos_dir)
        );
        assert_eq!(fgos_dir_of(None, &elsewhere.join("srh-no-fgos")), None);
    }

    #[test]
    fn only_the_event_flag_with_a_known_value_is_accepted() {
        let a = |parts: &[&str]| parts.iter().map(OsString::from).collect::<Vec<_>>();
        assert_eq!(parse(&a(&["--event", "stop"])), Some(Event::Stop));
        assert_eq!(
            parse(&a(&["--event", "session-start"])),
            Some(Event::SessionStart)
        );
        assert_eq!(parse(&a(&["--event", "post-tool-use"])), None);
        assert_eq!(parse(&a(&["--event"])), None);
        assert_eq!(parse(&a(&["stop"])), None);
    }

    #[test]
    fn a_stop_at_or_above_soft_asks_for_a_rotation_with_the_stop_facts_and_below_soft_asks_for_a_record_only(
    ) {
        let (fgos_dir, lineage) = fgos("rot");
        let payload = |tokens| json!({ "session_id": "s-1", "transcript_path": transcript(&lineage, tokens), "last_assistant_message": "done" });
        let (calls, result) = run_stop(&head(Some(1)), &fgos_dir, payload(300), Ok(json!({})));
        assert!(result.is_ok());
        assert_eq!(
            calls,
            vec![(
                "session rotate".to_string(),
                json!({
                    "persona": "secretary", "name": "miu", "reason": "none",
                    "measure": { "fraction": 0.3, "source": "transcript", "stale": true, "decision": "below-soft" }
                })
            )]
        );
        let (calls, result) = run_stop(
            &head(Some(1)),
            &fgos_dir,
            payload(500),
            Ok(json!({ "started": true })),
        );
        assert!(result.is_ok());
        assert_eq!(
            calls,
            vec![(
                "session rotate".to_string(),
                json!({
                    "persona": "secretary", "name": "miu", "reason": "soft",
                    "stopFacts": { "portfolio": ["plans/a.md"], "sessionId": "s-1", "lastAssistantMessage": "done" },
                    "measure": { "fraction": 0.5, "source": "transcript", "stale": true, "decision": "at-or-above-soft" }
                })
            )]
        );
        let (calls, _) = run_stop(&head(Some(1)), &fgos_dir, payload(800), Ok(json!({})));
        assert_eq!(calls[0].1["reason"], "hard");
    }

    #[test]
    fn a_head_that_stays_above_soft_across_many_stops_asks_at_every_stop() {
        let (fgos_dir, lineage) = fgos("many");
        let payload = json!({ "session_id": "s-1", "transcript_path": transcript(&lineage, 500) });
        for stop_number in 0..25 {
            // The host's answer (a rotation already running, a refusal) never makes a later stop skip its question.
            let reply = if stop_number % 2 == 0 {
                Ok(json!({ "started": false, "reason": "rotation-in-progress" }))
            } else {
                Err(ClientError {
                    code: "spawn-failed".into(),
                    detail: None,
                    message: None,
                })
            };
            let (calls, _) = run_stop(&head(Some(1)), &fgos_dir, payload.clone(), reply);
            assert_eq!(calls.len(), 1, "stop {stop_number} asked once");
            assert_eq!(calls[0].1["reason"], "soft");
        }
    }

    #[test]
    fn a_running_background_task_holds_the_rotation_and_a_refused_request_is_the_error_not_a_panic()
    {
        let (fgos_dir, lineage) = fgos("busy");
        let busy = json!({ "transcript_path": transcript(&lineage, 900), "background_tasks": [{ "id": "b" }] });
        let (calls, _) = run_stop(&head(None), &fgos_dir, busy, Ok(json!({})));
        assert_eq!(calls[0].1["reason"], "none");
        assert_eq!(calls[0].1["measure"]["decision"], "background-work-running");
        let full = json!({ "transcript_path": transcript(&lineage, 900) });
        let (_, result) = run_stop(
            &head(None),
            &fgos_dir,
            full,
            Err(ClientError {
                code: "verb-not-granted".into(),
                detail: None,
                message: None,
            }),
        );
        assert_eq!(result.unwrap_err(), "session rotate: verb-not-granted");
    }

    #[test]
    fn a_successor_answers_with_the_rotation_id_of_its_handoff_and_its_own_session_and_does_not_measure(
    ) {
        let (fgos_dir, lineage) = fgos("answer");
        std::fs::write(
            lineage.join("rotation.json"),
            r#"{"id":"0123456789abcdef","gen":2}"#,
        )
        .unwrap();
        std::fs::write(
            lineage.join("261118-1000-abc12345.md"),
            "Rotation id: 0123456789abcdef\n",
        )
        .unwrap();
        std::fs::write(
            lineage.join("latest.json"),
            r#"{"file":"261118-1000-abc12345.md"}"#,
        )
        .unwrap();
        let payload = json!({ "transcript_path": transcript(&lineage, 900), "last_assistant_message": "ready" });
        let (calls, result) = run_stop(
            &head(Some(2)),
            &fgos_dir,
            payload.clone(),
            Ok(json!({ "accepted": true })),
        );
        assert!(result.is_ok());
        assert_eq!(
            calls,
            vec![(
                "session answered".to_string(),
                json!({
                    "persona": "secretary", "name": "miu", "sessionId": "m1/claude-x", "rotationId": "0123456789abcdef", "message": "ready"
                })
            )]
        );
        // Another generation is not the successor the rotation waits for: it measures like any head.
        assert_eq!(
            run_stop(&head(Some(1)), &fgos_dir, payload, Ok(json!({}))).0[0].0,
            "session rotate"
        );
        // No message yet: nothing is sent, and the next stop answers.
        assert!(
            run_stop(&head(Some(2)), &fgos_dir, json!({}), Ok(json!({})))
                .0
                .is_empty()
        );
    }

    #[test]
    fn a_successor_with_no_rotation_id_in_its_handoff_sends_nothing_and_says_why() {
        let (fgos_dir, lineage) = fgos("noid");
        std::fs::write(
            lineage.join("rotation.json"),
            r#"{"id":"0123456789abcdef","gen":2}"#,
        )
        .unwrap();
        let (calls, result) = run_stop(
            &head(Some(2)),
            &fgos_dir,
            json!({ "last_assistant_message": "ready" }),
            Ok(json!({})),
        );
        assert!(calls.is_empty());
        assert!(result.unwrap_err().contains("no handoff"));
    }

    #[test]
    fn the_session_start_prints_the_one_additional_context_object_of_the_latest_handoff_and_nothing_without_one(
    ) {
        let (fgos_dir, lineage) = fgos("start");
        assert_eq!(session_start(&head(None), &fgos_dir).unwrap(), None);
        std::fs::write(lineage.join("261118-1000-abc12345.md"), "handoff text\n").unwrap();
        std::fs::write(
            lineage.join("latest.json"),
            r#"{"file":"261118-1000-abc12345.md"}"#,
        )
        .unwrap();
        let out: Value =
            serde_json::from_str(&session_start(&head(None), &fgos_dir).unwrap().unwrap()).unwrap();
        assert_eq!(
            out,
            json!({ "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": "handoff text\n" } })
        );
    }

    #[test]
    fn session_start_appends_rotation_answer_instruction_when_awaiting_answer_and_leaves_context_unchanged_when_answered(
    ) {
        let (fgos_dir, lineage) = fgos("start-instruction");
        let project_root = fgos_dir.parent().unwrap();
        let expected_bin = project_shim_path(project_root);
        assert!(expected_bin.is_absolute());

        std::fs::write(lineage.join("261118-1000-abc12345.md"), "handoff text\n").unwrap();
        std::fs::write(
            lineage.join("latest.json"),
            r#"{"file":"261118-1000-abc12345.md"}"#,
        )
        .unwrap();
        std::fs::write(
            lineage.join("rotation.json"),
            r#"{"id":"0123456789abcdef","gen":2}"#,
        )
        .unwrap();

        let head = head(Some(2));
        let out: Value =
            serde_json::from_str(&session_start(&head, &fgos_dir).unwrap().unwrap()).unwrap();
        let context = out["hookSpecificOutput"]["additionalContext"]
            .as_str()
            .unwrap();

        let expected_instruction = format!(
            "A rotation is waiting for this session's first answer; right after the start ritual's one line, in this same turn, answer by running printf '%s' '{{\"last_assistant_message\":\"<that line, with no quote characters>\"}}' | \"{}\" hook session-rotation --event stop ; use the installed path, not the fgos shell function; role-gated verbs wait until the role moves.",
            expected_bin.display()
        );
        assert!(
            context.ends_with(&expected_instruction),
            "context should end with instruction carrying absolute installed path: {context}"
        );
        assert!(context.starts_with("handoff text\n"));

        // When answered.json exists for that generation, context is unchanged
        std::fs::write(lineage.join("answered.json"), r#"{"gen":2}"#).unwrap();
        let out_answered: Value =
            serde_json::from_str(&session_start(&head, &fgos_dir).unwrap().unwrap()).unwrap();
        let context_answered = out_answered["hookSpecificOutput"]["additionalContext"]
            .as_str()
            .unwrap();
        assert_eq!(context_answered, "handoff text\n");

        // When handoff is long, instruction survives and context remains within CONTEXT_LIMIT
        std::fs::remove_file(lineage.join("answered.json")).unwrap();
        let huge_handoff = format!("# Handoff\n\n{}\n", "x".repeat(CONTEXT_LIMIT + 500));
        std::fs::write(lineage.join("261118-1000-abc12345.md"), &huge_handoff).unwrap();
        let out_long: Value =
            serde_json::from_str(&session_start(&head, &fgos_dir).unwrap().unwrap()).unwrap();
        let context_long = out_long["hookSpecificOutput"]["additionalContext"]
            .as_str()
            .unwrap();
        assert!(
            context_long.ends_with(&expected_instruction),
            "instruction must survive when handoff is long"
        );
        assert!(context_long.chars().count() <= CONTEXT_LIMIT);
    }

    #[test]
    fn text_sent_to_a_verb_is_cut_at_the_stated_unit_bound() {
        assert_eq!(bounded(&"a".repeat(9000)).len(), MAX_TEXT);
        assert_eq!(bounded(&"😀".repeat(9000)).encode_utf16().count(), MAX_TEXT);
    }

    #[test]
    fn a_stop_hook_that_fails_before_the_node_route_runs_leaves_one_incident_line_in_the_lineage() {
        let (fgos_dir, lineage) = fgos("incident");
        let full = json!({ "transcript_path": transcript(&lineage, 900) });
        let (_, result) = run_stop(
            &head(None),
            &fgos_dir,
            full,
            Err(ClientError {
                code: "verb-not-granted".into(),
                detail: Some("supervisor refused verb".into()),
                message: None,
            }),
        );
        assert_eq!(
            result.unwrap_err(),
            "session rotate: verb-not-granted (supervisor refused verb)"
        );
        let incidents_file = lineage.join("incidents.jsonl");
        assert!(incidents_file.exists(), "incidents.jsonl must exist");
        let content = std::fs::read_to_string(&incidents_file).unwrap();
        let lines: Vec<&str> = content.trim().split('\n').collect();
        assert_eq!(lines.len(), 1, "exactly one incident line expected");
        let incident: Value = serde_json::from_str(lines[0]).unwrap();
        assert_eq!(incident["event"], "stop-failed");
        assert_eq!(incident["code"], "verb-not-granted");
        assert_eq!(incident["detail"], "supervisor refused verb");
        assert!(incident["at"]
            .as_str()
            .is_some_and(|s| s.contains('T') && s.ends_with('Z')));
        assert_eq!(incident.as_object().unwrap().len(), 4);

        // The same owning proof also exercises the character bound without splitting Unicode.
        let (fgos_dir, lineage) = fgos("incident-bounded");
        let (_, result) = run_stop(
            &head(None),
            &fgos_dir,
            json!({}),
            Err(ClientError {
                code: "busy".into(),
                detail: Some("😀".repeat(301)),
                message: None,
            }),
        );
        assert!(result.is_err());
        let content = std::fs::read_to_string(lineage.join("incidents.jsonl")).unwrap();
        let lines: Vec<_> = content.lines().collect();
        assert_eq!(lines.len(), 1);
        let incident: Value = serde_json::from_str(lines[0]).unwrap();
        assert_eq!(incident["event"], "stop-failed");
        assert_eq!(incident["code"], "busy");
        assert_eq!(incident["detail"], "😀".repeat(300));
    }
}
