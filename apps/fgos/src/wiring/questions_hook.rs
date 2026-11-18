//! `fgos hook questions [--cli <claude|codex>] --event <user-prompt-submit|stop>`: the receipt hook, served natively before the composition
//! root (the route table's `native_subcommands` of `hook`).
//!
//! It tells a session that the owner answered its question. It writes nothing: it reads only the per-machine view
//! `.fgos/cache/questions.json` (never the stream) and, on a stop, the session's transcript. A question belongs to
//! this session when the asker is this session or holds one of the `head:` roles of this session, which covers a
//! rotated successor. The hook prints nothing when the caller, the view or the event does not resolve, and ends with
//! status 0 on every path.
//!
//! - `user-prompt-submit` (Claude Code): one context line per answered question that has no ack.
//! - `stop` (Claude Code and Codex): when `stop_hook_active` is false, one `{"decision":"block","reason":…}` object
//!   listing only the questions whose notice is not yet in the transcript; otherwise nothing, so a reply is not
//!   followed by a forced turn after the notice has been given once. The payload and the output shape come from the
//!   mailbox's adapter of the CLI. A Codex hook process carries no session variable, so the caller is the thread
//!   the payload names (`CODEX_THREAD_ID`), the key a Codex tool process holds.
use fgos_mailbox::hook::{Adapter, HookEvent};
use fgos_questions::caller::{Caller, CallerSource, IdentityCaller, PayloadKeyCaller};
use fgos_questions::usecase::VIEW_FILE;
use serde_json::Value;
use std::ffi::OsString;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

const MAX_STDIN: u64 = 4 * 1024 * 1024;
const MAX_VIEW: u64 = 4 * 1024 * 1024;
/// The newest part of a transcript that is searched: a notice shown in this turn is at its end.
const TRANSCRIPT_TAIL: u64 = 8 * 1024 * 1024;

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

/// `[--cli <claude|codex>] --event <user-prompt-submit|stop>`, each once, nothing else. Claude Code is the default
/// CLI; Codex has no prompt event.
fn parse(args: &[OsString]) -> Option<(Adapter, Event)> {
    let mut cli = None;
    let mut event = None;
    let mut rest = args.iter().map(|a| a.to_str());
    while let Some(flag) = rest.next() {
        let value = rest.next().flatten();
        match flag? {
            "--cli" if cli.is_none() => {
                cli = Some(match value? {
                    "claude" => Adapter::Claude,
                    "codex" => Adapter::Codex,
                    _ => return None,
                })
            }
            "--event" if event.is_none() => {
                event = Some(match value? {
                    "user-prompt-submit" => Event::UserPromptSubmit,
                    "stop" => Event::Stop,
                    _ => return None,
                })
            }
            _ => return None,
        }
    }
    let (cli, event) = (cli.unwrap_or(Adapter::Claude), event?);
    (cli == Adapter::Claude || event == Event::Stop).then_some((cli, event))
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

/// Whether the view holds any answered question: with none, no caller has to be resolved.
fn has_answered(view: &Value) -> bool {
    view.get("questions")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .any(|q| text(q, &["state"]) == Some("answered"))
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

/// The stop's block reason: the notices not yet in the transcript, or nothing.
fn stop_reason(notices: &[Notice], transcript: &[u8], first_stop: bool) -> Option<String> {
    if !first_stop {
        return None;
    }
    let lines: Vec<&str> = notices
        .iter()
        .filter(|n| !contains(transcript, ack_marker(&n.id).as_bytes()))
        .map(|n| n.line.as_str())
        .collect();
    (!lines.is_empty()).then(|| lines.join("\n"))
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    haystack.windows(needle.len()).any(|w| w == needle)
}

/// The first `limit` bytes of the file.
fn read_head(path: &Path, limit: u64) -> Option<Vec<u8>> {
    let mut out = Vec::new();
    std::fs::File::open(path)
        .ok()?
        .take(limit)
        .read_to_end(&mut out)
        .ok()?;
    Some(out)
}

/// The last `limit` bytes of the file (all of it when smaller).
fn read_tail(path: &Path, limit: u64) -> Option<Vec<u8>> {
    let mut file = std::fs::File::open(path).ok()?;
    let len = file.metadata().ok()?.len();
    file.seek(SeekFrom::Start(len.saturating_sub(limit))).ok()?;
    let mut out = Vec::new();
    file.read_to_end(&mut out).ok()?;
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

/// The caller of this hook call: for Codex the thread its payload names, else this process as Identity knows it.
fn caller_of(adapter: Adapter, session: Option<String>) -> Option<Caller> {
    let state_root = fgos_holder_lock::state_root().0;
    let pid = std::process::id();
    match adapter {
        Adapter::Codex => PayloadKeyCaller {
            state_root,
            pid,
            source: fgos_identity::resolve::CODEX_THREAD_VAR,
            value: session?,
        }
        .caller(),
        _ => IdentityCaller {
            state_root,
            pid,
            pane: None,
        }
        .caller(),
    }
    .ok()
}

fn run(args: &[OsString]) {
    let Some((adapter, event)) = parse(args) else {
        return;
    };
    let Ok(cwd) = std::env::current_dir() else {
        return;
    };
    let Some(view) = read_head(
        &view_path(std::env::var_os("CLAUDE_PROJECT_DIR").as_deref(), &cwd),
        MAX_VIEW,
    )
    .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())
    .filter(has_answered) else {
        return;
    };
    // A stop's payload: the CLI adapter's facts (first stop, the session it names) and the transcript's path.
    let mut stop = None;
    if event == Event::Stop {
        let mut input = Vec::new();
        let _ = std::io::stdin().take(MAX_STDIN).read_to_end(&mut input);
        let Ok(payload) = adapter.parse(HookEvent::Stop, &input) else {
            return;
        };
        let transcript = serde_json::from_slice::<Value>(&input)
            .ok()
            .and_then(|doc| text(&doc, &["transcript_path"]).map(PathBuf::from));
        stop = Some((payload, transcript));
    }
    let session = stop
        .as_ref()
        .and_then(|(payload, _)| payload.session.clone());
    let Some(caller) = caller_of(adapter, session) else {
        return;
    };
    let head_roles: Vec<String> = caller.head_roles().cloned().collect();
    let found = notices(&view, &caller.session_id, &head_roles);
    if found.is_empty() {
        return;
    }
    match stop {
        None => {
            for notice in &found {
                println!("{}", notice.line);
            }
        }
        Some((payload, transcript)) => {
            let shown = transcript
                .and_then(|path| read_tail(&path, TRANSCRIPT_TAIL))
                .unwrap_or_default();
            let first_stop = payload.first_stop.unwrap_or(true);
            let reason = stop_reason(&found, &shown, first_stop);
            if let Some(shape) = adapter.shape(HookEvent::Stop) {
                if let Some(reason) = reason {
                    println!("{}", shape.render(&reason));
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

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
        let reason = stop_reason(&found, b"", true).unwrap();
        assert!(reason.contains("q-1") && reason.contains("q-2"));
        // Both CLIs render the reason as the block object their adapter was recorded accepting.
        for cli in [Adapter::Claude, Adapter::Codex] {
            let block = cli.shape(HookEvent::Stop).unwrap().render(&reason);
            let block: Value = serde_json::from_str(&block).unwrap();
            assert_eq!(block["decision"], "block");
            assert_eq!(block["reason"], reason.as_str());
        }
        assert_eq!(stop_reason(&found, b"", false), None);
        let shown = b"context: fgos questions ack q-1 and fgos questions ack q-2";
        assert_eq!(stop_reason(&found, shown, true), None);
        let only_second = stop_reason(&found, b"fgos questions ack q-1", true).unwrap();
        assert!(only_second.contains("q-2") && !only_second.contains("q-1"));
    }

    #[test]
    fn a_transcript_is_searched_from_its_end_and_only_a_view_with_an_answer_needs_a_caller() {
        let dir =
            std::env::temp_dir().join(format!("fgos-questions-hook-unit-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("transcript.jsonl");
        let mut bytes = vec![b'x'; 100];
        bytes.extend_from_slice("\u{e9} fgos questions ack q-1".as_bytes());
        std::fs::write(&path, &bytes).unwrap();
        // Not valid UTF-8 at the cut, still searchable; only the last bytes are read.
        let tail = read_tail(&path, 40).unwrap();
        assert_eq!(tail.len(), 40);
        assert!(contains(&tail, b"fgos questions ack q-1"));
        assert_eq!(read_tail(&path, u64::MAX).unwrap(), bytes);
        let _ = std::fs::remove_dir_all(&dir);
        assert!(!has_answered(
            &json!({ "questions": [question("q-1", "open", "s", &[])] })
        ));
        assert!(has_answered(
            &json!({ "questions": [question("q-1", "answered", "s", &[])] })
        ));
    }

    #[test]
    fn the_flags_accept_claude_by_default_codex_only_on_a_stop_and_nothing_else() {
        let a = |parts: &[&str]| parts.iter().map(OsString::from).collect::<Vec<_>>();
        assert_eq!(
            parse(&a(&["--event", "stop"])),
            Some((Adapter::Claude, Event::Stop))
        );
        assert_eq!(
            parse(&a(&["--event", "user-prompt-submit"])),
            Some((Adapter::Claude, Event::UserPromptSubmit))
        );
        assert_eq!(
            parse(&a(&["--cli", "codex", "--event", "stop"])),
            Some((Adapter::Codex, Event::Stop))
        );
        assert_eq!(
            parse(&a(&["--cli", "codex", "--event", "user-prompt-submit"])),
            None
        );
        assert_eq!(parse(&a(&["--cli", "pi", "--event", "stop"])), None);
        assert_eq!(parse(&a(&["--event", "session-start"])), None);
        assert_eq!(parse(&a(&["stop"])), None);
    }
}
