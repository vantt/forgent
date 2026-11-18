//! `fgos hook session-rotation --event <stop|session-start>`: the rotation hook of a head session, served natively
//! before the composition root (the route table's `native_subcommands` of `hook`).
//!
//! The hook only measures, decides and asks. Identity moves roles and the rotation executor rotates; the hook
//! reaches them through the head request socket of its own supervisor (`head answered` for a successor's first
//! answer, `head rotate` for a full context). It does nothing unless `FGOS_HEAD_ROLE` is set (the role is never
//! parsed: the persona and name come from `FGOS_HEAD_PERSONA` and `FGOS_HEAD_NAME`, declared by the head start
//! door), never blocks, prints nothing to the conversation except the session start's one `additionalContext`
//! object, and ends with status 0 on every path. A failure leaves one line on stderr, which Claude Code does not
//! show the model. Files read: `packages/session-host/contracts/rotation-files.v1.json`.
use super::mailbox_config::effective_config;
use super::mailbox_identity::state_root;
use super::mailbox_root::mailbox_fgos_dir;
use fgos_run_supervisor::head_client::{request_head, ClientError, REPLY_TIMEOUT};
use fgos_session_host::rotation::decide::{decide, AtRest, RotationConfig};
use fgos_session_host::rotation::handoff::{
    awaits_answer, lineage_dir, read_latest, rotation_id_of, session_start_context,
};
use fgos_session_host::rotation::measure::{measure, Sources, FRESH_WAIT};
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

/// The head the call runs in, from the environment the head start door declared.
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

/// A stop: a successor whose generation the pending rotation waits for answers it; any other stop measures,
/// decides and, on soft or hard, asks for the rotation. A stop that answered does not also measure.
fn stop(head: &Head, fgos_dir: &Path, payload: &Value, ports: &Ports) -> Result<(), String> {
    let lineage = lineage_dir(fgos_dir, &head.persona, &head.name).map_err(|e| e.to_string())?;
    if let Some(gen) = head.gen {
        if awaits_answer(&lineage, gen).map_err(|e| e.to_string())? {
            return answer(head, &lineage, payload, ports);
        }
    }
    let config = (ports.config)()?;
    let thresholds = config
        .thresholds_for(&head.persona)
        .map_err(|e| e.to_string())?;
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
    let decision = decide(measured.map(|m| m.fraction), thresholds, rest);
    let Some(reason) = decision.rotate.reason() else {
        return Ok(());
    };
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
    let args =
        json!({ "persona": head.persona, "name": head.name, "reason": reason, "stopFacts": facts });
    (ports.ask)("head rotate", &args)
        .map(|_| ())
        .map_err(|e| format!("head rotate: {e}"))
}

/// The successor's first answer: its session id, the rotation id read from its own handoff, and its first message.
fn answer(head: &Head, lineage: &Path, payload: &Value, ports: &Ports) -> Result<(), String> {
    // No message yet: this stop was not an answer; the next one is.
    let Some(message) = payload_str(payload, "last_assistant_message") else {
        return Ok(());
    };
    let latest = read_latest(lineage)
        .map_err(|e| e.to_string())?
        .ok_or("the successor has no handoff to read the rotation id from")?;
    let rotation_id = rotation_id_of(&latest.text).ok_or("the handoff carries no rotation id")?;
    let session_id = (ports.session_id)().ok_or("this session has no Identity id")?;
    let args = json!({ "persona": head.persona, "name": head.name, "sessionId": session_id, "rotationId": rotation_id, "message": bounded(message) });
    (ports.ask)("head answered", &args)
        .map(|_| ())
        .map_err(|e| format!("head answered: {e}"))
}

/// A session start: the latest handoff of the lineage as the one `additionalContext` object, or nothing.
fn session_start(head: &Head, fgos_dir: &Path) -> Result<Option<String>, String> {
    let lineage = lineage_dir(fgos_dir, &head.persona, &head.name).map_err(|e| e.to_string())?;
    let Some(latest) = read_latest(&lineage).map_err(|e| e.to_string())? else {
        return Ok(None);
    };
    let context = session_start_context(&latest, fgos_dir.parent());
    Ok(Some(json!({ "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": context } }).to_string()))
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
    let project_dir = std::env::var_os("CLAUDE_PROJECT_DIR");
    let fgos_dir = match mailbox_fgos_dir(project_dir.as_deref(), &cwd) {
        Ok(dir) => dir,
        Err(e) => return fail(e.code().to_string()),
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
                })?;
                let id = format!("hook-{}-{}", std::process::id(), now_ms());
                request_head(socket, verb, args, &id, REPLY_TIMEOUT)
            };
            let session_id = || {
                let root = state_root()?;
                fgos_identity::current_session(&root, std::process::id(), Some(&fgos_dir))
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
    fn a_stop_at_or_above_soft_asks_for_a_rotation_with_the_stop_facts_and_below_soft_asks_nothing()
    {
        let (fgos_dir, lineage) = fgos("rot");
        let payload = |tokens| json!({ "session_id": "s-1", "transcript_path": transcript(&lineage, tokens), "last_assistant_message": "done" });
        let (calls, result) = run_stop(&head(Some(1)), &fgos_dir, payload(300), Ok(json!({})));
        assert!(result.is_ok() && calls.is_empty());
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
                "head rotate".to_string(),
                json!({
                    "persona": "secretary", "name": "miu", "reason": "soft",
                    "stopFacts": { "portfolio": ["plans/a.md"], "sessionId": "s-1", "lastAssistantMessage": "done" }
                })
            )]
        );
        let (calls, _) = run_stop(&head(Some(1)), &fgos_dir, payload(800), Ok(json!({})));
        assert_eq!(calls[0].1["reason"], "hard");
    }

    #[test]
    fn a_running_background_task_holds_the_rotation_and_a_refused_request_is_the_error_not_a_panic()
    {
        let (fgos_dir, lineage) = fgos("busy");
        let busy = json!({ "transcript_path": transcript(&lineage, 900), "background_tasks": [{ "id": "b" }] });
        assert!(run_stop(&head(None), &fgos_dir, busy, Ok(json!({})))
            .0
            .is_empty());
        let full = json!({ "transcript_path": transcript(&lineage, 900) });
        let (_, result) = run_stop(
            &head(None),
            &fgos_dir,
            full,
            Err(ClientError {
                code: "verb-not-granted".into(),
                detail: None,
            }),
        );
        assert_eq!(result.unwrap_err(), "head rotate: verb-not-granted");
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
                "head answered".to_string(),
                json!({
                    "persona": "secretary", "name": "miu", "sessionId": "m1/claude-x", "rotationId": "0123456789abcdef", "message": "ready"
                })
            )]
        );
        // Another generation is not the successor the rotation waits for: it measures like any head.
        assert_eq!(
            run_stop(&head(Some(1)), &fgos_dir, payload, Ok(json!({}))).0[0].0,
            "head rotate"
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
    fn text_sent_to_a_verb_is_cut_at_the_stated_unit_bound() {
        assert_eq!(bounded(&"a".repeat(9000)).len(), MAX_TEXT);
        assert_eq!(bounded(&"😀".repeat(9000)).encode_utf16().count(), MAX_TEXT);
    }
}
