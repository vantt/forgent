//! The last assistant message of a head session, read from its transcript, for the handoff of a rotation that no
//! Stop hook carried (a manual one). The transcript is located in the session folder the head's launch kept or
//! declared (Claude Code's `projects` folder of the head's private home): the newest `<session-id>.jsonl` one level
//! under it, so a subagent's transcript (deeper) is never taken. It is read backwards from its end, at most
//! [`TAIL_CAP`] bytes, as `measure` reads it.
//!
//! A Codex head's session folder holds `YYYY/MM/DD/rollout-*.jsonl` instead. No fixture in this repository proves
//! the record shape of a Codex assistant message or of its turn end (the Codex fixtures under
//! `test/fixtures/mailbox-behaviour/` hold user messages and tool calls only), so a Codex transcript is named and
//! refused (`CodexNotRead`) rather than guessed at.

use super::measure::{main_assistant, scan_back, TAIL_CAP};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

/// What a transcript says about the session's last assistant message.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LastMessage {
    pub transcript: PathBuf,
    /// The text blocks of the last assistant message that has any, joined by a blank line; `None` when there is none.
    pub text: Option<String>,
    /// The session's last entry (user or assistant, sidechains aside) is an assistant entry that ended its turn
    /// (`stop_reason` `end_turn`): no later text is coming. A user entry after it (a prompt, a tool result) means
    /// the session is in a turn.
    pub turn_ended: bool,
}

/// Why no message could be read.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum LastMessageError {
    #[error("{0} is not a readable directory")]
    NoSessionFolder(String),
    #[error("no session transcript under {0}")]
    NoTranscript(String),
    #[error("{0} is a Codex session transcript, which is not read: no fixture proves the record shape of a Codex assistant message")]
    CodexNotRead(String),
}

/// `<36-character session id>.jsonl`, the name Claude Code gives a session transcript.
fn transcript_name(name: &str) -> bool {
    name.strip_suffix(".jsonl").is_some_and(|id| {
        id.len() == 36
            && id.char_indices().all(|(i, c)| match i {
                8 | 13 | 18 | 23 => c == '-',
                _ => c.is_ascii_hexdigit(),
            })
    })
}

fn real_dirs(dir: &Path) -> Vec<PathBuf> {
    std::fs::read_dir(dir)
        .map(|it| {
            it.filter_map(Result::ok)
                .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
                .map(|e| e.path())
                .collect()
        })
        .unwrap_or_default()
}

/// The newest regular file directly in one of `dirs` whose name `named` accepts.
fn newest_in(dirs: Vec<PathBuf>, named: impl Fn(&str) -> bool) -> Option<PathBuf> {
    let mut newest: Option<(SystemTime, PathBuf)> = None;
    for dir in dirs {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.filter_map(Result::ok) {
            let Ok(meta) = entry.metadata() else { continue };
            if !entry.file_type().is_ok_and(|t| t.is_file())
                || !entry.file_name().to_str().is_some_and(&named)
            {
                continue;
            }
            let modified = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
            if newest.as_ref().is_none_or(|(at, _)| modified >= *at) {
                newest = Some((modified, entry.path()));
            }
        }
    }
    newest.map(|(_, path)| path)
}

/// The newest Codex rollout transcript of a session folder (`YYYY/MM/DD/rollout-*.jsonl`), if there is one.
fn codex_rollout(sessions_dir: &Path) -> Option<PathBuf> {
    let days: Vec<PathBuf> = real_dirs(sessions_dir)
        .into_iter()
        .flat_map(|year| real_dirs(&year))
        .flat_map(|month| real_dirs(&month))
        .collect();
    newest_in(days, |name| {
        name.starts_with("rollout-") && name.ends_with(".jsonl")
    })
}

/// The newest session transcript one level under `projects_dir` (regular files only, never a link).
pub fn session_transcript(projects_dir: &Path) -> Result<PathBuf, LastMessageError> {
    if !std::fs::symlink_metadata(projects_dir).is_ok_and(|m| m.file_type().is_dir()) {
        return Err(LastMessageError::NoSessionFolder(
            projects_dir.display().to_string(),
        ));
    }
    if let Some(found) = newest_in(real_dirs(projects_dir), transcript_name) {
        return Ok(found);
    }
    Err(match codex_rollout(projects_dir) {
        Some(rollout) => LastMessageError::CodexNotRead(rollout.display().to_string()),
        None => LastMessageError::NoTranscript(projects_dir.display().to_string()),
    })
}

fn text_of(entry: &Value) -> Option<String> {
    let blocks = entry.pointer("/message/content")?.as_array()?;
    let texts: Vec<&str> = blocks
        .iter()
        .filter(|b| b.get("type").and_then(Value::as_str) == Some("text"))
        .filter_map(|b| b.get("text").and_then(Value::as_str))
        .filter(|t| !t.trim().is_empty())
        .collect();
    (!texts.is_empty()).then(|| texts.join("\n\n"))
}

/// A user or assistant entry of the session itself (not a subagent's sidechain): what a turn is made of.
fn turn_entry(entry: &Value) -> bool {
    main_assistant(entry)
        || (entry.get("type").and_then(Value::as_str) == Some("user")
            && entry.get("isSidechain").and_then(Value::as_bool) != Some(true))
}

/// The last assistant message of one transcript, read backwards from its end. A message streamed as several
/// entries (one per content block) keeps every text block of its `message.id`.
pub fn last_message_of(transcript: &Path) -> LastMessage {
    let mut turn_ended: Option<bool> = None;
    // The message being collected: its id and its text blocks, newest first.
    let mut collecting: Option<(Option<String>, Vec<String>)> = None;
    scan_back(transcript, TAIL_CAP, |entry| {
        if !turn_entry(entry) {
            return false;
        }
        if turn_ended.is_none() {
            turn_ended = Some(
                main_assistant(entry)
                    && entry
                        .pointer("/message/stop_reason")
                        .and_then(Value::as_str)
                        == Some("end_turn"),
            );
        }
        let id = entry
            .pointer("/message/id")
            .and_then(Value::as_str)
            .map(str::to_string);
        match &mut collecting {
            None => {
                if main_assistant(entry) {
                    if let Some(text) = text_of(entry) {
                        collecting = Some((id, vec![text]));
                    }
                }
                false
            }
            Some((current, texts)) => {
                if !main_assistant(entry) || id.is_none() || *current != id {
                    return true;
                }
                if let Some(text) = text_of(entry) {
                    texts.push(text);
                }
                false
            }
        }
    });
    LastMessage {
        transcript: transcript.to_path_buf(),
        text: collecting.map(|(_, texts)| texts.into_iter().rev().collect::<Vec<_>>().join("\n\n")),
        turn_ended: turn_ended.unwrap_or(false),
    }
}

/// The last assistant message of the session whose folder is `projects_dir`.
pub fn last_message(projects_dir: &Path) -> Result<LastMessage, LastMessageError> {
    session_transcript(projects_dir).map(|t| last_message_of(&t))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const ID_A: &str = "e6540401-251d-4181-8930-661e69a42e3b";
    const ID_B: &str = "0b6b2e1c-0000-4000-8000-000000000001";

    fn dir(tag: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("rot-last-{}-{tag}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }
    fn write(file: &Path, lines: &[Value]) {
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(
            file,
            lines.iter().map(|l| format!("{l}\n")).collect::<String>(),
        )
        .unwrap();
    }
    fn assistant(id: &str, blocks: Value, stop: Option<&str>) -> Value {
        json!({ "type": "assistant", "message": { "id": id, "content": blocks, "stop_reason": stop } })
    }

    #[test]
    fn the_last_text_message_is_returned_whole_and_a_tool_call_after_it_means_the_turn_goes_on() {
        let d = dir("a");
        let t = d.join("p").join(format!("{ID_A}.jsonl"));
        write(
            &t,
            &[
                assistant(
                    "m1",
                    json!([{ "type": "text", "text": "old" }]),
                    Some("end_turn"),
                ),
                json!({ "type": "user", "message": { "content": "go" } }),
                assistant(
                    "m2",
                    json!([{ "type": "text", "text": "Open questions:" }]),
                    None,
                ),
                assistant(
                    "m2",
                    json!([{ "type": "text", "text": "1. Which db?" }]),
                    None,
                ),
                json!({ "type": "assistant", "isSidechain": true, "message": { "id": "s", "content": [{ "type": "text", "text": "subagent" }] } }),
                assistant(
                    "m3",
                    json!([{ "type": "tool_use", "name": "Bash" }]),
                    Some("tool_use"),
                ),
            ],
        );
        let got = last_message(&d).unwrap();
        assert_eq!(
            (got.text.as_deref(), got.turn_ended, got.transcript),
            (Some("Open questions:\n\n1. Which db?"), false, t.clone())
        );
        write(
            &t,
            &[assistant(
                "m4",
                json!([{ "type": "text", "text": "Done; questions above." }]),
                Some("end_turn"),
            )],
        );
        let got = last_message(&d).unwrap();
        assert_eq!(
            (got.text.as_deref(), got.turn_ended),
            (Some("Done; questions above."), true)
        );
    }

    #[test]
    fn the_newest_transcript_one_level_down_is_read_and_a_deeper_or_foreign_file_is_not() {
        let d = dir("b");
        let older = d.join("slug").join(format!("{ID_B}.jsonl"));
        write(
            &older,
            &[assistant(
                "x",
                json!([{ "type": "text", "text": "older" }]),
                None,
            )],
        );
        std::thread::sleep(std::time::Duration::from_millis(20));
        let newer = d.join("slug").join(format!("{ID_A}.jsonl"));
        write(
            &newer,
            &[assistant(
                "y",
                json!([{ "type": "text", "text": "newer" }]),
                None,
            )],
        );
        std::thread::sleep(std::time::Duration::from_millis(20));
        write(
            &d.join("slug")
                .join(ID_A)
                .join("subagents")
                .join(format!("{ID_B}.jsonl")),
            &[assistant(
                "z",
                json!([{ "type": "text", "text": "deeper" }]),
                None,
            )],
        );
        write(&d.join("slug").join("notes.jsonl"), &[]);
        assert_eq!(session_transcript(&d).unwrap(), newer);
        assert_eq!(last_message(&d).unwrap().text.as_deref(), Some("newer"));
    }

    #[test]
    fn a_missing_folder_or_one_without_a_transcript_is_named_and_never_panics() {
        let d = dir("c");
        assert!(matches!(
            last_message(&d.join("absent")),
            Err(LastMessageError::NoSessionFolder(_))
        ));
        std::fs::create_dir_all(d.join("slug")).unwrap();
        assert!(matches!(
            last_message(&d),
            Err(LastMessageError::NoTranscript(_))
        ));
        let empty = d.join("slug").join(format!("{ID_A}.jsonl"));
        write(&empty, &[json!({ "type": "user" })]);
        let got = last_message(&d).unwrap();
        assert_eq!((got.text, got.turn_ended), (None, false));
    }

    #[test]
    fn a_prompt_after_an_ended_turn_means_a_turn_is_running_and_the_previous_message_is_the_last() {
        let d = dir("p1");
        let t = d.join("p").join(format!("{ID_A}.jsonl"));
        write(
            &t,
            &[
                assistant(
                    "m1",
                    json!([{ "type": "text", "text": "Earlier answer." }]),
                    Some("end_turn"),
                ),
                json!({ "type": "user", "message": { "role": "user", "content": "/handoff" } }),
            ],
        );
        let got = last_message(&d).unwrap();
        assert_eq!(
            (got.text.as_deref(), got.turn_ended),
            (Some("Earlier answer."), false)
        );
    }

    #[test]
    fn only_the_last_eight_mebibytes_are_read_and_the_last_message_is_found_past_a_large_history() {
        let d = dir("big");
        let t = d.join("p").join(format!("{ID_A}.jsonl"));
        let pad = "x".repeat(1000);
        let mut lines = vec![assistant(
            "old",
            json!([{ "type": "text", "text": "ancient" }]),
            Some("end_turn"),
        )];
        lines.extend((0..9 * 1024).map(|i| json!({ "type": "attachment", "i": i, "pad": pad })));
        write(&t, &lines);
        assert!(std::fs::metadata(&t).unwrap().len() > TAIL_CAP);
        let got = last_message(&d).unwrap();
        assert_eq!(
            (got.text, got.turn_ended),
            (None, false),
            "a message older than the cap is never read"
        );
        lines.push(assistant(
            "new",
            json!([{ "type": "text", "text": "recent" }]),
            Some("end_turn"),
        ));
        write(&t, &lines);
        let got = last_message(&d).unwrap();
        assert_eq!(
            (got.text.as_deref(), got.turn_ended),
            (Some("recent"), true)
        );
    }

    #[test]
    fn a_codex_session_folder_is_named_and_refused_because_its_assistant_record_is_unproven() {
        let d = dir("codex");
        let day = d.join("2026").join("10").join("22");
        std::fs::create_dir_all(&day).unwrap();
        let rollout = day.join(format!("rollout-2026-10-22T10-02-35-{ID_B}.jsonl"));
        std::fs::write(
            &rollout,
            include_str!("../../../../../test/fixtures/mailbox-behaviour/codex-st.jsonl"),
        )
        .unwrap();
        assert_eq!(
            last_message(&d),
            Err(LastMessageError::CodexNotRead(
                rollout.display().to_string()
            ))
        );
    }
}
