//! `fgos hook questions --event <user-prompt-submit|stop>`: the receipt hook, served natively before the composition
//! root (the route table's `native_subcommands` of `hook`).
//!
//! It tells a session that the owner answered its question. It writes nothing: it reads only the per-machine view
//! `.fgos/cache/questions.json` (never the stream) and, on a stop, the session's transcript. A question belongs to
//! this session when the asker is this session or holds one of the `head:` roles of this session, which covers a
//! rotated successor. The hook prints nothing when the caller, the view or the event does not resolve, and ends with
//! status 0 on every path.
//!
//! - `user-prompt-submit`: one context line per answered question that has no ack.
//! - `stop`: when `stop_hook_active` is false, one `{"decision":"block","reason":…}` object listing only the
//!   questions whose notice is not yet in the transcript; otherwise nothing, so a reply is not followed by a forced
//!   turn after the notice has been given once.
use fgos_questions::caller::{CallerSource, IdentityCaller};
use fgos_questions::usecase::VIEW_FILE;
use serde_json::{json, Value};
use std::ffi::OsString;
use std::io::Read;
use std::path::{Path, PathBuf};

const MAX_STDIN: u64 = 4 * 1024 * 1024;
const MAX_TRANSCRIPT: u64 = 64 * 1024 * 1024;

/// Runs one hook call and ends the process with status 0.
pub fn main(args: &[OsString]) -> ! {
    let _ = std::panic::catch_unwind(|| run(args));
    std::process::exit(0)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Event {
    UserPromptSubmit,
    Stop,
}

/// `--event <user-prompt-submit|stop>`, once, nothing else.
fn parse(args: &[OsString]) -> Option<Event> {
    match args {
        [flag, value] if flag == "--event" => match value.to_str()? {
            "user-prompt-submit" => Some(Event::UserPromptSubmit),
            "stop" => Some(Event::Stop),
            _ => None,
        },
        _ => None,
    }
}

/// One answered question the session has not acked: its id, and the line that tells the session about it.
#[derive(Debug, Clone, PartialEq, Eq)]
struct Notice {
    id: String,
    line: String,
}

fn text<'a>(value: &'a Value, path: &[&str]) -> Option<&'a str> {
    path.iter()
        .try_fold(value, |at, key| at.get(key))
        .and_then(Value::as_str)
}

/// The option, else the text, of the answer that counts.
fn answer_text(question: &Value) -> Option<&str> {
    let answer = question.get("answer")?;
    ["option", "text"]
        .iter()
        .find_map(|key| text(answer, &[key]).filter(|t| !t.is_empty()))
}

/// Whether the asker is this session or holds one of its `head:` roles.
fn is_ours(question: &Value, session_id: &str, head_roles: &[String]) -> bool {
    let Some(asker) = question.get("asked").and_then(|a| a.get("asker")) else {
        return false;
    };
    if text(asker, &["sessionId"]) == Some(session_id) {
        return true;
    }
    asker
        .get("roles")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .any(|role| role.starts_with("head:") && head_roles.iter().any(|mine| mine == role))
}

/// The answered, unacked questions of this session in the view, in the order the view lists them.
fn notices(view: &Value, session_id: &str, head_roles: &[String]) -> Vec<Notice> {
    view.get("questions")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter(|q| text(q, &["state"]) == Some("answered") && is_ours(q, session_id, head_roles))
        .filter_map(|q| {
            let id = text(q, &["asked", "id"])?;
            let reference = text(q, &["asked", "ref", "value"])?;
            let handle = text(q, &["asked", "asker", "handle"])?;
            let answer = answer_text(q)?;
            Some(Notice {
                id: id.to_string(),
                line: format!(
                    "owner answered {id} ({reference}, asked by {handle}): {answer}; write it back to {reference}, then: fgos questions ack {id}"
                ),
            })
        })
        .collect()
}

/// The ack command a notice carries; the transcript holds it once the notice was shown.
fn ack_marker(id: &str) -> String {
    format!("fgos questions ack {id}")
}

/// The stop's output: a block listing the notices not yet in the transcript, or nothing.
fn stop_output(notices: &[Notice], transcript: &str, stop_hook_active: bool) -> Option<String> {
    if stop_hook_active {
        return None;
    }
    let lines: Vec<&str> = notices
        .iter()
        .filter(|n| !transcript.contains(&ack_marker(&n.id)))
        .map(|n| n.line.as_str())
        .collect();
    (!lines.is_empty())
        .then(|| json!({ "decision": "block", "reason": lines.join("\n") }).to_string())
}

fn read_bounded(path: &Path, limit: u64) -> Option<String> {
    let mut out = String::new();
    std::fs::File::open(path)
        .ok()?
        .take(limit)
        .read_to_string(&mut out)
        .ok()?;
    Some(out)
}

/// `<project>/.fgos/cache/<view>`: Claude Code's project directory when it names a directory, else the cwd.
fn view_path(claude_project_dir: Option<&std::ffi::OsStr>, cwd: &Path) -> PathBuf {
    let start = claude_project_dir
        .filter(|d| !d.is_empty())
        .map(Path::new)
        .filter(|d| d.is_dir())
        .unwrap_or(cwd);
    start.join(".fgos").join("cache").join(VIEW_FILE)
}

fn run(args: &[OsString]) {
    let Some(event) = parse(args) else { return };
    let Ok(cwd) = std::env::current_dir() else {
        return;
    };
    let Some(view) = read_bounded(
        &view_path(std::env::var_os("CLAUDE_PROJECT_DIR").as_deref(), &cwd),
        MAX_TRANSCRIPT,
    )
    .and_then(|bytes| serde_json::from_str::<Value>(&bytes).ok()) else {
        return;
    };
    let caller = IdentityCaller {
        state_root: fgos_holder_lock::state_root().0,
        pid: std::process::id(),
        pane: None,
    };
    let Ok(caller) = caller.caller() else { return };
    let head_roles: Vec<String> = caller.head_roles().cloned().collect();
    let found = notices(&view, &caller.session_id, &head_roles);
    if found.is_empty() {
        return;
    }
    match event {
        Event::UserPromptSubmit => {
            for notice in &found {
                println!("{}", notice.line);
            }
        }
        Event::Stop => {
            let mut input = String::new();
            let _ = std::io::stdin().take(MAX_STDIN).read_to_string(&mut input);
            let payload: Value = serde_json::from_str(&input).unwrap_or(Value::Null);
            let active = payload
                .get("stop_hook_active")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let transcript = text(&payload, &["transcript_path"])
                .and_then(|p| read_bounded(Path::new(p), MAX_TRANSCRIPT))
                .unwrap_or_default();
            if let Some(out) = stop_output(&found, &transcript, active) {
                println!("{out}");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn question(id: &str, state: &str, session: &str, roles: &[&str]) -> Value {
        json!({
            "state": state,
            "asked": { "id": id, "ref": { "value": "plans/x.md#q" }, "asker": { "sessionId": session, "handle": "miu", "roles": roles } },
            "answer": { "id": id, "option": "A", "by": "owner" }
        })
    }

    #[test]
    fn a_question_is_ours_when_the_session_or_one_of_its_head_roles_asked_and_only_while_answered()
    {
        let view = json!({ "v": 1, "questions": [
            question("q-1", "answered", "s-1", &[]),
            question("q-2", "answered", "s-old", &["head:secretary-miu"]),
            question("q-3", "answered", "s-2", &["head:planner-x"]),
            question("q-4", "open", "s-1", &[]),
            question("q-5", "acked", "s-1", &[]),
        ]});
        let ids = |s: &str, roles: &[&str]| {
            let roles: Vec<String> = roles.iter().map(|r| r.to_string()).collect();
            notices(&view, s, &roles)
                .into_iter()
                .map(|n| n.id)
                .collect::<Vec<_>>()
        };
        assert_eq!(ids("s-1", &[]), ["q-1"]);
        assert_eq!(ids("s-new", &["head:secretary-miu"]), ["q-2"]);
        assert!(ids("s-3", &[]).is_empty());
    }

    #[test]
    fn the_notice_line_names_the_answer_the_ref_the_asker_and_the_ack_door() {
        let view = json!({ "questions": [question("q-1", "answered", "s-1", &[])] });
        assert_eq!(
            notices(&view, "s-1", &[])[0].line,
            "owner answered q-1 (plans/x.md#q, asked by miu): A; write it back to plans/x.md#q, then: fgos questions ack q-1"
        );
    }

    #[test]
    fn a_stop_blocks_once_for_notices_not_yet_in_the_transcript_and_passes_when_active_or_shown() {
        let view = json!({ "questions": [
            question("q-1", "answered", "s-1", &[]),
            question("q-2", "answered", "s-1", &[]),
        ]});
        let found = notices(&view, "s-1", &[]);
        let block = stop_output(&found, "", false).unwrap();
        let block: Value = serde_json::from_str(&block).unwrap();
        assert_eq!(block["decision"], "block");
        assert!(block["reason"].as_str().unwrap().contains("q-1"));
        assert!(block["reason"].as_str().unwrap().contains("q-2"));
        assert_eq!(stop_output(&found, "", true), None);
        let shown = "context: fgos questions ack q-1 and fgos questions ack q-2";
        assert_eq!(stop_output(&found, shown, false), None);
        let only_second = stop_output(&found, "fgos questions ack q-1", false).unwrap();
        assert!(only_second.contains("q-2") && !only_second.contains("q-1"));
    }

    #[test]
    fn only_the_event_flag_with_a_known_value_is_accepted() {
        let a = |parts: &[&str]| parts.iter().map(OsString::from).collect::<Vec<_>>();
        assert_eq!(parse(&a(&["--event", "stop"])), Some(Event::Stop));
        assert_eq!(
            parse(&a(&["--event", "user-prompt-submit"])),
            Some(Event::UserPromptSubmit)
        );
        assert_eq!(parse(&a(&["--event", "session-start"])), None);
        assert_eq!(parse(&a(&["stop"])), None);
    }
}
